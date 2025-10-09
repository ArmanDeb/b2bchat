-- Update created_by for one-on-one conversations
-- The created_by column already exists (added in migration 012 for group chats)
-- We now need to populate it for one-on-one conversations

-- For existing one-on-one conversations without messages, set created_by to participant1
-- For existing one-on-one conversations with messages, set created_by to participant1
UPDATE public.conversations
SET created_by = participant1_id
WHERE is_group = FALSE AND created_by IS NULL;

-- Update the get_or_create_conversation function to accept and store created_by
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  user1_id UUID,
  user2_id UUID,
  creator_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  final_creator_id UUID;
BEGIN
  -- Set the creator_id, defaulting to user1_id if not provided
  final_creator_id := COALESCE(creator_id, user1_id);
  
  -- Ensure user1_id is always smaller than user2_id for consistency
  IF user1_id > user2_id THEN
    SELECT user1_id, user2_id INTO user2_id, user1_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE participant1_id = user1_id AND participant2_id = user2_id;
  
  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant1_id, participant2_id, created_by)
    VALUES (user1_id, user2_id, final_creator_id)
    RETURNING id INTO conversation_id;
  ELSE
    -- Always update created_by to reflect who is initiating/reopening the conversation
    UPDATE public.conversations
    SET created_by = final_creator_id, updated_at = NOW()
    WHERE id = conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) TO authenticated;

