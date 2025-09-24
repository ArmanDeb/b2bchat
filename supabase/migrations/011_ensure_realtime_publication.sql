-- Ensure realtime publication is properly configured
-- This migration ensures that the realtime publication includes all necessary tables

-- Remove tables from publication first (if they exist)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.messages;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.conversations;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.users;

-- Add tables to publication with proper configuration
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages WITH (replica_identity = full);
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations WITH (replica_identity = full);
ALTER PUBLICATION supabase_realtime ADD TABLE public.users WITH (replica_identity = full);

-- Verify the publication configuration
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'conversations', 'users');

-- Check if tables are in the publication
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('messages', 'conversations', 'users');
