-- Fix infinite recursion in conversation_participants policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Admins can add participants to group conversations" ON public.conversation_participants;

-- Create corrected policies that don't create recursion
CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
  FOR SELECT USING (
    -- For group conversations: check if user is a participant via conversations table
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND c.is_group = TRUE
      AND c.id IN (
        SELECT cp.conversation_id FROM public.conversation_participants cp
        WHERE cp.user_id = auth.uid()
        AND cp.left_at IS NULL
        AND cp.deleted_by_user = FALSE
      )
    ) OR
    -- For the user's own participation record
    (user_id = auth.uid())
  );

-- Fix the admin policy to avoid recursion
CREATE POLICY "Users can add participants to groups they admin" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    -- Check if the inserting user is an admin of this conversation
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp_admin
      WHERE cp_admin.conversation_id = conversation_id
      AND cp_admin.user_id = auth.uid()
      AND cp_admin.is_admin = TRUE
      AND cp_admin.left_at IS NULL
      AND cp_admin.deleted_by_user = FALSE
    ) OR
    -- Allow conversation creator to add initial participants
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
      AND c.is_group = TRUE
    )
  );

-- Update conversations policies to be more efficient
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    -- One-on-one chats (legacy)
    (NOT is_group AND (auth.uid() = participant1_id OR auth.uid() = participant2_id)) OR
    -- Group chats - check if user is in participants table
    (is_group AND id IN (
      SELECT conversation_id FROM public.conversation_participants
      WHERE user_id = auth.uid()
      AND left_at IS NULL
      AND deleted_by_user = FALSE
    ))
  );
