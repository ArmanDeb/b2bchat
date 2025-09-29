-- Migration to support group conversations
-- This migration adds support for group conversations while maintaining compatibility with existing one-on-one chats

-- First, add fields to conversations table to support groups
ALTER TABLE public.conversations 
ADD COLUMN is_group BOOLEAN DEFAULT FALSE,
ADD COLUMN name TEXT,
ADD COLUMN created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create conversation_participants table for group memberships
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT FALSE,
  deleted_by_user BOOLEAN DEFAULT FALSE,
  
  -- Ensure unique combination of conversation and user
  CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, user_id)
);

-- Enable RLS on conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation_participants
CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_id
      AND cp2.user_id = auth.uid()
      AND cp2.left_at IS NULL
      AND cp2.deleted_by_user = FALSE
    )
  );

CREATE POLICY "Admins can add participants to group conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      JOIN public.conversations c ON c.id = cp.conversation_id
      WHERE cp.conversation_id = conversation_id
      AND cp.user_id = auth.uid()
      AND cp.is_admin = TRUE
      AND cp.left_at IS NULL
      AND cp.deleted_by_user = FALSE
      AND c.is_group = TRUE
    ) OR
    -- Allow creator to add initial participants
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
      AND c.is_group = TRUE
    )
  );

CREATE POLICY "Users can update their own participation" ON public.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_left_at ON public.conversation_participants(left_at);

-- Update RLS policies for conversations table to support groups
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- New policies for conversations that support both one-on-one and group chats
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    -- One-on-one chats (legacy)
    (NOT is_group AND (auth.uid() = participant1_id OR auth.uid() = participant2_id)) OR
    -- Group chats
    (is_group AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
      AND cp.deleted_by_user = FALSE
    ))
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    -- One-on-one chats (legacy)
    (NOT is_group AND (auth.uid() = participant1_id OR auth.uid() = participant2_id)) OR
    -- Group chats (only creator can create)
    (is_group AND auth.uid() = created_by)
  );

-- Update messages policies to support group chats
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (
        -- One-on-one chats
        (NOT c.is_group AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())) OR
        -- Group chats
        (c.is_group AND EXISTS (
          SELECT 1 FROM public.conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.user_id = auth.uid()
          AND cp.left_at IS NULL
          AND cp.deleted_by_user = FALSE
        ))
      )
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (
        -- One-on-one chats
        (NOT c.is_group AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())) OR
        -- Group chats
        (c.is_group AND EXISTS (
          SELECT 1 FROM public.conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.user_id = auth.uid()
          AND cp.left_at IS NULL
          AND cp.deleted_by_user = FALSE
        ))
      )
    )
  );

-- Create function to create group conversation with participants
CREATE OR REPLACE FUNCTION public.create_group_conversation(
  conversation_name TEXT,
  participant_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  participant_id UUID;
BEGIN
  -- Create the group conversation
  INSERT INTO public.conversations (is_group, name, created_by)
  VALUES (TRUE, conversation_name, auth.uid())
  RETURNING id INTO conversation_id;
  
  -- Add creator as admin participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
  VALUES (conversation_id, auth.uid(), TRUE);
  
  -- Add all other participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    IF participant_id != auth.uid() THEN
      INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
      VALUES (conversation_id, participant_id, FALSE);
    END IF;
  END LOOP;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add participant to group conversation
CREATE OR REPLACE FUNCTION public.add_participant_to_group(
  conversation_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_group_conv BOOLEAN;
  is_user_admin BOOLEAN;
BEGIN
  -- Check if conversation is a group
  SELECT is_group INTO is_group_conv
  FROM public.conversations
  WHERE id = conversation_id_param;
  
  IF NOT is_group_conv THEN
    RAISE EXCEPTION 'Not a group conversation';
  END IF;
  
  -- Check if current user is admin of the group
  SELECT COALESCE(is_admin, FALSE) INTO is_user_admin
  FROM public.conversation_participants
  WHERE conversation_id = conversation_id_param
  AND user_id = auth.uid()
  AND left_at IS NULL
  AND deleted_by_user = FALSE;
  
  IF NOT is_user_admin THEN
    RAISE EXCEPTION 'User is not an admin of this group';
  END IF;
  
  -- Add the participant (or restore if they left)
  INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
  VALUES (conversation_id_param, user_id_param, FALSE)
  ON CONFLICT (conversation_id, user_id) DO UPDATE SET
    left_at = NULL,
    deleted_by_user = FALSE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to leave group conversation
CREATE OR REPLACE FUNCTION public.leave_group_conversation(
  conversation_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.conversation_participants
  SET left_at = NOW(), deleted_by_user = TRUE
  WHERE conversation_id = conversation_id_param
  AND user_id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get conversation participants
CREATE OR REPLACE FUNCTION public.get_conversation_participants(
  conversation_id_param UUID
)
RETURNS TABLE (
  participant_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    cp.is_admin,
    cp.joined_at
  FROM public.conversation_participants cp
  JOIN public.users u ON u.id = cp.user_id
  WHERE cp.conversation_id = conversation_id_param
  AND cp.left_at IS NULL
  AND cp.deleted_by_user = FALSE
  ORDER BY cp.is_admin DESC, cp.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
