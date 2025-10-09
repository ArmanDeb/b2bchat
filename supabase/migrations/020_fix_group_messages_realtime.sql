-- Fix group messages RLS policies to properly check conversation_participants
-- This ensures real-time updates work correctly for group conversations

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

-- Create proper policies that check conversation_participants for groups
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (
        -- One-on-one chats
        (NOT c.is_group AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())) OR
        -- Group chats - check if user is an active participant
        (c.is_group AND EXISTS (
          SELECT 1 FROM public.conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.user_id = auth.uid()
          AND cp.deleted_by_user = FALSE
          AND cp.left_at IS NULL
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
        -- Group chats - check if user is an active participant
        (c.is_group AND EXISTS (
          SELECT 1 FROM public.conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.user_id = auth.uid()
          AND cp.deleted_by_user = FALSE
          AND cp.left_at IS NULL
        ))
      )
    )
  );

-- Update the conversations policy to also check participants properly
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (
    -- One-on-one chats
    (NOT is_group AND (auth.uid() = participant1_id OR auth.uid() = participant2_id)) OR
    -- Group chats - check if user is an active participant
    (is_group AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
      AND cp.user_id = auth.uid()
      AND cp.deleted_by_user = FALSE
      AND cp.left_at IS NULL
    ))
  );

