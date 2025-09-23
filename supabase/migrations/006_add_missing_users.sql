-- Add missing users to the users table
-- This will add any auth.users that don't have corresponding entries in public.users

INSERT INTO public.users (id, username, display_name, is_online, last_seen)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)) as username,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)) as display_name,
  false as is_online,
  NOW() as last_seen
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
