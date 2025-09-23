-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Create function to update conversation updated_at when message is inserted
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation timestamp when message is added
CREATE TRIGGER update_conversation_on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_updated_at();

-- Create function to update user last_seen when they send a message
CREATE OR REPLACE FUNCTION public.update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_seen = NOW(), is_online = TRUE
  WHERE id = NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user last_seen when they send a message
CREATE TRIGGER update_user_last_seen_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_user_last_seen();

-- Create function to handle user online status
CREATE OR REPLACE FUNCTION public.set_user_online(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET is_online = TRUE, last_seen = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle user offline status
CREATE OR REPLACE FUNCTION public.set_user_offline(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET is_online = FALSE
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
