-- Fix and debug the create_group_conversation function

-- Drop the existing function
DROP FUNCTION IF EXISTS public.create_group_conversation(TEXT, UUID[]);

-- Create a more robust version with better error handling
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
  
  -- Create the group conversation
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

-- Also create a simpler test function to debug
CREATE OR REPLACE FUNCTION public.test_create_group(
  name_param TEXT,
  participants UUID[]
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', auth.uid(),
    'name_param', name_param,
    'participants_count', COALESCE(array_length(participants, 1), 0),
    'participants', participants
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
