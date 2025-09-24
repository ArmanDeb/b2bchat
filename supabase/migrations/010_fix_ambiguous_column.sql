-- Fix ambiguous column reference in soft_delete_conversation function
-- The issue is that conversation_id is ambiguous in the SELECT query

CREATE OR REPLACE FUNCTION public.soft_delete_conversation(
  conversation_id UUID,
  user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  conv_record RECORD;
  should_permanently_delete BOOLEAN := FALSE;
BEGIN
  -- Get the conversation record
  SELECT * INTO conv_record 
  FROM public.conversations 
  WHERE id = conversation_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is a participant
  IF user_id != conv_record.participant1_id AND user_id != conv_record.participant2_id THEN
    RETURN FALSE;
  END IF;
  
  -- Mark as deleted by the appropriate participant
  IF user_id = conv_record.participant1_id THEN
    UPDATE public.conversations 
    SET deleted_by_participant1 = TRUE, updated_at = NOW()
    WHERE id = conversation_id;
  ELSE
    UPDATE public.conversations 
    SET deleted_by_participant2 = TRUE, updated_at = NOW()
    WHERE id = conversation_id;
  END IF;
  
  -- Check if both participants have deleted it
  SELECT (deleted_by_participant1 AND deleted_by_participant2) INTO should_permanently_delete
  FROM public.conversations 
  WHERE id = conversation_id;
  
  -- If both participants have deleted it, permanently delete the conversation and all messages
  IF should_permanently_delete THEN
    -- Delete all messages first (due to foreign key constraint)
    DELETE FROM public.messages WHERE conversation_id = conversation_id;
    -- Then delete the conversation
    DELETE FROM public.conversations WHERE id = conversation_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the restore function to be consistent
CREATE OR REPLACE FUNCTION public.restore_conversation(
  conversation_id UUID,
  user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  conv_record RECORD;
BEGIN
  -- Get the conversation record
  SELECT * INTO conv_record 
  FROM public.conversations 
  WHERE id = conversation_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is a participant
  IF user_id != conv_record.participant1_id AND user_id != conv_record.participant2_id THEN
    RETURN FALSE;
  END IF;
  
  -- Mark as not deleted by the appropriate participant
  IF user_id = conv_record.participant1_id THEN
    UPDATE public.conversations 
    SET deleted_by_participant1 = FALSE, updated_at = NOW()
    WHERE id = conversation_id;
  ELSE
    UPDATE public.conversations 
    SET deleted_by_participant2 = FALSE, updated_at = NOW()
    WHERE id = conversation_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
