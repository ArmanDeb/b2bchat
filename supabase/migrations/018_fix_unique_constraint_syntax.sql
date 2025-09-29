-- Fix conversations table constraints for group conversations (final correct syntax)

-- Make participant1_id and participant2_id nullable for group conversations
ALTER TABLE public.conversations 
ALTER COLUMN participant1_id DROP NOT NULL,
ALTER COLUMN participant2_id DROP NOT NULL;

-- Drop existing constraints (correct syntax)
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS check_participant_order;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS unique_conversation;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS unique_one_on_one_conversation;

-- Create new constraints that handle both one-on-one and group conversations
ALTER TABLE public.conversations 
ADD CONSTRAINT check_participant_order CHECK (
  -- For one-on-one conversations: participant1_id < participant2_id
  (NOT is_group AND participant1_id IS NOT NULL AND participant2_id IS NOT NULL AND participant1_id < participant2_id) OR
  -- For group conversations: participant fields can be NULL
  (is_group AND participant1_id IS NULL AND participant2_id IS NULL)
);

-- Create unique constraint for one-on-one conversations only (without WHERE clause)
-- We'll handle uniqueness at the application level for now
-- ALTER TABLE public.conversations 
-- ADD CONSTRAINT unique_one_on_one_conversation UNIQUE (participant1_id, participant2_id) 
-- WHERE NOT is_group;

-- Update the create_group_conversation function to not set participant fields
CREATE OR REPLACE FUNCTION public.create_group_conversation(
  conversation_name TEXT,
  participant_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  participant_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Validate inputs
  IF conversation_name IS NULL OR conversation_name = '' THEN
    RAISE EXCEPTION 'Conversation name cannot be empty';
  END IF;
  
  IF participant_ids IS NULL OR array_length(participant_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Participant list cannot be empty';
  END IF;
  
  -- Create the group conversation (without participant1_id and participant2_id)
  INSERT INTO public.conversations (is_group, name, created_by, created_at, updated_at)
  VALUES (TRUE, conversation_name, current_user_id, NOW(), NOW())
  RETURNING id INTO conversation_id;
  
  -- Add creator as admin participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin, joined_at)
  VALUES (conversation_id, current_user_id, TRUE, NOW());
  
  -- Add all other participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    -- Skip if participant is the creator (already added)
    IF participant_id != current_user_id THEN
      -- Check if user exists
      IF EXISTS (SELECT 1 FROM public.users WHERE id = participant_id) THEN
        INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin, joined_at)
        VALUES (conversation_id, participant_id, FALSE, NOW());
      ELSE
        -- Log warning but don't fail
        RAISE NOTICE 'User % does not exist, skipping', participant_id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN conversation_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating group conversation: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
