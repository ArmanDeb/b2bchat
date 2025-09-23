# Database Setup for Real-time Chat

## Step 1: Run Database Migrations

You need to run these SQL migrations in your Supabase dashboard. Go to your Supabase project → SQL Editor and run each migration in order:

### 1. Create Users Table
Copy and paste the contents of `supabase/migrations/001_create_users_table.sql` into the SQL Editor and run it.

### 2. Create Conversations Table  
Copy and paste the contents of `supabase/migrations/002_create_conversations_table.sql` into the SQL Editor and run it.

### 3. Create Messages Table
Copy and paste the contents of `supabase/migrations/003_create_messages_table.sql` into the SQL Editor and run it.

### 4. Create Realtime Triggers
Copy and paste the contents of `supabase/migrations/004_create_realtime_triggers.sql` into the SQL Editor and run it.

## Step 2: Enable Realtime

1. Go to your Supabase dashboard
2. Navigate to Database → Replication
3. Enable realtime for these tables:
   - `users`
   - `conversations` 
   - `messages`

## Step 3: Test the Setup

1. Visit `/test-chat` in your application
2. Use the "Debug Users" panel to:
   - Click "Load Users" to see if users are loading
   - Click "Create Test User" to add a test user
   - Check for any error messages

## Troubleshooting

### If you see "No users found":
- Make sure you've run all 4 database migrations
- Check that the `users` table exists in your Supabase dashboard
- Try creating a test user using the debug panel

### If you see database errors:
- Check your Supabase project URL and API key in `.env.local`
- Make sure your Supabase project is active
- Verify the migrations ran successfully

### If the + button still doesn't show users:
- Check the browser console for errors
- Make sure you're logged in
- Try refreshing the page after running the migrations
