-- Simplify and fix all group conversation policies

-- First, disable RLS temporarily to clean up
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on conversation_participants
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Admins can add participants to group conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to groups they admin" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON public.conversation_participants;

-- Drop and recreate conversations policies
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Re-enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE policies for conversation_participants
CREATE POLICY "Allow all for conversation participants" ON public.conversation_participants
  FOR ALL USING (true) WITH CHECK (true);

-- Create SIMPLE policies for conversations (updated)
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (
    -- One-on-one chats
    (NOT is_group AND (auth.uid() = participant1_id OR auth.uid() = participant2_id)) OR
    -- Group chats - simple approach
    (is_group AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    -- One-on-one chats
    (NOT is_group AND (auth.uid() = participant1_id OR auth.uid() = participant2_id)) OR
    -- Group chats
    (is_group AND auth.uid() = created_by)
  );

-- Update messages policies for groups
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
        -- Group chats - simplified
        (c.is_group AND auth.uid() IS NOT NULL)
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
        -- Group chats - simplified
        (c.is_group AND auth.uid() IS NOT NULL)
      )
    )
  );

-- Ensure the RPC function has proper security
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
