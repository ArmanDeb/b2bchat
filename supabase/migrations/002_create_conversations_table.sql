-- Create conversations table for one-on-one chats
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  participant2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure participant1_id is always smaller than participant2_id for consistency
  CONSTRAINT check_participant_order CHECK (participant1_id < participant2_id),
  -- Ensure no duplicate conversations between the same two users
  CONSTRAINT unique_conversation UNIQUE (participant1_id, participant2_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

-- Create indexes for performance
CREATE INDEX idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON public.conversations(participant2_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at);

-- Create function to get or create conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Ensure user1_id is always smaller than user2_id
  IF user1_id > user2_id THEN
    SELECT user1_id, user2_id INTO user2_id, user1_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE participant1_id = user1_id AND participant2_id = user2_id;
  
  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant1_id, participant2_id)
    VALUES (user1_id, user2_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
