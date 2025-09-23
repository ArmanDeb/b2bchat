# Real-time One-on-One Chat Setup Guide

This guide will help you set up the real-time one-on-one messaging functionality in your Supabase project.

## Database Setup

### Step 1: Run Database Migrations

You need to run the following SQL migrations in your Supabase project. Go to your Supabase dashboard → SQL Editor and run each migration in order:

#### 1. Create Users Table
```sql
-- Copy and paste the contents of supabase/migrations/001_create_users_table.sql
```

#### 2. Create Conversations Table
```sql
-- Copy and paste the contents of supabase/migrations/002_create_conversations_table.sql
```

#### 3. Create Messages Table
```sql
-- Copy and paste the contents of supabase/migrations/003_create_messages_table.sql
```

#### 4. Create Realtime Triggers
```sql
-- Copy and paste the contents of supabase/migrations/004_create_realtime_triggers.sql
```

### Step 2: Enable Realtime

In your Supabase dashboard:
1. Go to Database → Replication
2. Enable realtime for the following tables:
   - `messages`
   - `conversations`
   - `users`

### Step 3: Set Up Row Level Security (RLS)

The migrations already include RLS policies, but you can verify they're working by:

1. Going to Authentication → Policies
2. Ensure the following policies exist:
   - Users can view all users
   - Users can update their own profile
   - Users can view conversations they participate in
   - Users can view messages in their conversations
   - Users can insert messages in their conversations

## Features

### ✅ Implemented Features

1. **One-on-One Messaging**: Users can start private conversations with other users
2. **Real-time Updates**: Messages appear instantly for both users
3. **User Management**: Automatic user creation when someone signs up
4. **Online Status**: Shows when users are online/offline
5. **Message History**: All messages are stored and retrieved from the database
6. **Unread Counts**: Shows unread message counts in conversation list
7. **User Search**: Search for users to start new conversations
8. **Responsive Design**: Works on desktop and mobile

### How It Works

1. **User Registration**: When a user signs up, they're automatically added to the `users` table
2. **Starting Conversations**: Users can search for other users and start conversations
3. **Real-time Messaging**: Messages are sent via Supabase realtime subscriptions
4. **Message Persistence**: All messages are stored in the database
5. **Online Status**: User online status is tracked and updated in real-time

## Usage

### For Users

1. **Sign up/Login**: Create an account or log in
2. **Start a Chat**: Click the "+" button to see all available users
3. **Send Messages**: Type and send messages in real-time
4. **View Conversations**: See all your conversations in the sidebar
5. **Online Status**: See when other users are online

### For Developers

The main components are:

- `OneOnOneChatInterface`: Main chat interface with user list and conversations
- `OneOnOneChat`: Individual chat component for messaging
- `useOneOnOneChat`: Hook for managing chat state and real-time updates
- `useConversations`: Hook for managing user lists and conversations
- `useUser`: Hook for user authentication state

## Testing

To test the real-time functionality:

1. Open the app in two different browser windows/tabs
2. Sign in with different accounts
3. Start a conversation between the accounts
4. Send messages from one account - they should appear instantly in the other

## Troubleshooting

### Common Issues

1. **Messages not appearing**: Check that realtime is enabled for the `messages` table
2. **Users not showing**: Ensure the user creation trigger is working
3. **Permission errors**: Verify RLS policies are correctly set up
4. **Connection issues**: Check your Supabase URL and API keys

### Debug Steps

1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Check Supabase logs for database errors
4. Ensure all migrations ran successfully

## Security

The implementation includes:

- Row Level Security (RLS) for all tables
- User authentication required for all operations
- Users can only see their own conversations
- Messages are only visible to conversation participants
- Online status is only visible to authenticated users

## Performance

- Messages are paginated for large conversations
- Real-time subscriptions are optimized
- Database indexes for fast queries
- Automatic cleanup of old subscriptions
