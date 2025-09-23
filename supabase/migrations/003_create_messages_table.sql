-- Create messages table for chat messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
  conversation_id_param UUID,
  user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.messages
  SET is_read = TRUE
  WHERE conversation_id = conversation_id_param
    AND sender_id != user_id
    AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread message count for a user
CREATE OR REPLACE FUNCTION public.get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE (c.participant1_id = user_id OR c.participant2_id = user_id)
    AND m.sender_id != user_id
    AND m.is_read = FALSE;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
