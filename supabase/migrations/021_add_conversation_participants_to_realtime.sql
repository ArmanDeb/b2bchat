-- Add conversation_participants to realtime publication
-- This ensures users are notified immediately when they're added to a group

-- First, set replica identity to full on the table
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;

-- Then add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- Verify the publication configuration
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'conversation_participants';
