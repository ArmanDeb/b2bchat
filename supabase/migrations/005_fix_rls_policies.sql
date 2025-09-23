-- Fix RLS policies to allow proper user operations

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Create more permissive policies for testing
CREATE POLICY "Enable read access for all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Also fix conversations policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Enable read access for all users" ON public.conversations
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

CREATE POLICY "Enable read access for all users" ON public.messages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on sender_id" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);
