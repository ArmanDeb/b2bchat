'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useState } from 'react'
import { useUser } from './use-user'

export interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  is_online: boolean
  last_seen: string
}

export interface Conversation {
  id: string
  participant1_id: string
  participant2_id: string
  created_at: string
  updated_at: string
  is_group: boolean
  name?: string
  created_by?: string
  other_user?: User // Only for one-on-one chats
  participants?: User[] // Only for group chats  
  last_message?: {
    id: string
    content: string
    sender_id: string
    created_at: string
    sender_name: string
  }
  unread_count: number
}

export function useConversations() {
  const supabase = createClient()
  const { user } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  // Load all users
  const loadUsers = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', user.id) // Exclude current user
        .order('username')

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  // Load user's conversations (with loading indicator)
  const loadConversations = useCallback(async (showLoading = true) => {
    if (!user) return

    try {
      if (showLoading) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      // Get conversations where user is a participant
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:users!conversations_participant1_id_fkey(*),
          participant2:users!conversations_participant2_id_fkey(*)
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id},is_group.eq.true`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (data) {
        const formattedConversations: Conversation[] = []
        
        for (const conv of data) {
          // Handle group conversations
          if (conv.is_group) {
            // Check if user is a participant in this group
            const { data: participantData, error: participantError } = await supabase
              .from('conversation_participants')
              .select('*')
              .eq('conversation_id', conv.id)
              .eq('user_id', user.id)
              .eq('deleted_by_user', false)
              .is('left_at', null)
              .maybeSingle()

            if (participantError || !participantData) {
              continue // User is not a participant or has left/deleted
            }

            // Get all participants for group
            const { data: allParticipants } = await supabase
              .rpc('get_conversation_participants', { conversation_id_param: conv.id })

            // Check if there are any messages in this conversation
            const { count: messageCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)

            // Only show group conversation if it has messages OR if the current user is the creator
            const shouldShowConversation = (messageCount && messageCount > 0) || conv.created_by === user.id
            
            if (!shouldShowConversation) {
              continue // Skip this conversation
            }

            // Get unread count for this conversation
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', user.id)
              .eq('is_read', false)

            // Get last message with sender info
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select(`
                id, content, sender_id, created_at,
                sender:users!messages_sender_id_fkey(username, display_name)
              `)
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            formattedConversations.push({
              id: conv.id,
              participant1_id: conv.participant1_id,
              participant2_id: conv.participant2_id,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              is_group: true,
              name: conv.name,
              created_by: conv.created_by,
              participants: allParticipants?.map((p: any) => ({
                id: p.participant_id,
                username: p.username,
                display_name: p.display_name,
                avatar_url: p.avatar_url,
                is_online: false, // We'll update this separately if needed
                last_seen: new Date().toISOString()
              })) || [],
              last_message: lastMessageData ? {
                id: lastMessageData.id,
                content: lastMessageData.content,
                sender_id: lastMessageData.sender_id,
                created_at: lastMessageData.created_at,
                sender_name: (lastMessageData.sender as any)?.display_name || (lastMessageData.sender as any)?.username || 'Unknown'
              } : undefined,
              unread_count: unreadCount || 0
            })
          } else {
            // Handle one-on-one conversations (existing logic)
            // Filter out conversations deleted by the current user
            if (conv.participant1_id === user.id && conv.deleted_by_participant1) {
              continue
            }
            if (conv.participant2_id === user.id && conv.deleted_by_participant2) {
              continue
            }

            const otherUser = conv.participant1.id === user.id ? conv.participant2 : conv.participant1
            
            // Check if there are any messages in this conversation
            const { count: messageCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)

            // Only show conversation if it has messages OR if the current user is participant1 (creator)
            const shouldShowConversation = (messageCount && messageCount > 0) || conv.participant1_id === user.id
            
            if (!shouldShowConversation) {
              continue // Skip this conversation
            }
            
            // Get unread count for this conversation
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', user.id)
              .eq('is_read', false)

            // Get last message with sender info
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select(`
                id, content, sender_id, created_at,
                sender:users!messages_sender_id_fkey(username, display_name)
              `)
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            formattedConversations.push({
              id: conv.id,
              participant1_id: conv.participant1_id,
              participant2_id: conv.participant2_id,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              is_group: false,
              other_user: {
                id: otherUser.id,
                username: otherUser.username,
                display_name: otherUser.display_name,
                avatar_url: otherUser.avatar_url,
                is_online: otherUser.is_online,
                last_seen: otherUser.last_seen
              },
              last_message: lastMessageData ? {
                id: lastMessageData.id,
                content: lastMessageData.content,
                sender_id: lastMessageData.sender_id,
                created_at: lastMessageData.created_at,
                sender_name: (lastMessageData.sender as any)?.display_name || (lastMessageData.sender as any)?.username || 'Unknown'
              } : undefined,
              unread_count: unreadCount || 0
            })
          }
        }

        setConversations(formattedConversations)
        setLastUpdate(Date.now())
      }
    } catch (err) {
      console.error('Error loading conversations:', err)
      setError('Failed to load conversations')
    } finally {
      if (showLoading) {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }, [user, supabase])

  // Start a new conversation with a user
  const startConversation = useCallback(async (otherUserId: string) => {
    if (!user) return null

    try {
      // First, check if there's an existing conversation (including soft-deleted ones)
      const { data: existingConv, error: fetchError } = await supabase
        .from('conversations')
        .select('id, participant1_id, participant2_id, deleted_by_participant1, deleted_by_participant2, is_group')
        .eq('is_group', false) // Only look for one-on-one conversations
        .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching existing conversation:', fetchError)
        throw fetchError
      }

      if (existingConv) {
        console.log('Found existing conversation:', existingConv)
        
        // Check if the conversation was soft-deleted by the current user
        const isParticipant1 = user.id === existingConv.participant1_id
        const deletedByCurrentUser = isParticipant1 ? existingConv.deleted_by_participant1 : existingConv.deleted_by_participant2
        
        if (deletedByCurrentUser) {
          console.log('Restoring soft-deleted conversation')
          // Restore the conversation for the current user
          const updateData = isParticipant1 
            ? { deleted_by_participant1: false, updated_at: new Date().toISOString() }
            : { deleted_by_participant2: false, updated_at: new Date().toISOString() }

          const { error: restoreError } = await supabase
            .from('conversations')
            .update(updateData)
            .eq('id', existingConv.id)

          if (restoreError) {
            console.error('Error restoring conversation:', restoreError)
            throw restoreError
          }

          console.log('Conversation restored successfully')
          // Reload conversations to update the sidebar
          await loadConversations(false) // Silent update
          return existingConv.id
        } else {
          console.log('Using existing conversation')
          return existingConv.id
        }
      } else {
        console.log('No existing conversation found, creating new one')
        // No existing conversation, create a new one
        const { data, error } = await supabase.rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: otherUserId
        })

        if (error) throw error
        // Reload conversations to update the sidebar with the new conversation
        await loadConversations(false) // Silent update
        return data
      }
    } catch (err) {
      console.error('Error starting conversation:', err)
      setError('Failed to start conversation')
      return null
    }
  }, [user, supabase, loadConversations])

  // Create a group conversation
  const createGroupConversation = useCallback(async (participantIds: string[], groupName: string) => {
    if (!user) return null

    try {
      console.log('Creating group conversation with participants:', participantIds, 'name:', groupName)
      console.log('Current user ID:', user.id)
      
      // For single participant, use existing one-on-one logic
      if (participantIds.length === 1) {
        return await startConversation(participantIds[0])
      }

      // Prepare parameters
      const finalGroupName = groupName || `Group with ${participantIds.length + 1} members`
      const params = {
        conversation_name: finalGroupName,
        participant_ids: participantIds
      }
      
      console.log('Calling RPC with params:', params)

      // Test the function first
      const { data: testData, error: testError } = await supabase.rpc('test_create_group', {
        name_param: finalGroupName,
        participants: participantIds
      })
      
      console.log('Test function result:', testData, testError)

      // Create group conversation
      const { data: conversationId, error } = await supabase.rpc('create_group_conversation', params)

      console.log('RPC response:', { data: conversationId, error })

      if (error) {
        console.error('Detailed error creating group conversation:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('Group conversation created:', conversationId)
      // Reload conversations to update the sidebar
      await loadConversations(false) // Silent update
      return conversationId
    } catch (err) {
      console.error('Error creating group conversation:', err)
      console.error('Full error object:', JSON.stringify(err, null, 2))
      setError('Failed to create group conversation')
      return null
    }
  }, [user, supabase, loadConversations, startConversation])

  // Update user online status
  const setUserOnline = useCallback(async () => {
    if (!user) return

    try {
      await supabase.rpc('set_user_online', { user_id: user.id })
    } catch (err) {
      console.error('Error setting user online:', err)
    }
  }, [user, supabase])

  // Update user offline status
  const setUserOffline = useCallback(async () => {
    if (!user) return

    try {
      await supabase.rpc('set_user_offline', { user_id: user.id })
    } catch (err) {
      console.error('Error setting user offline:', err)
    }
  }, [user, supabase])

  // Delete a conversation (soft delete for one-on-one, leave group for groups)
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return false

    try {
      console.log('Starting deletion of conversation:', conversationId)
      console.log('User ID:', user.id)
      
      // First, get the conversation to check type and permissions
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, participant1_id, participant2_id, deleted_by_participant1, deleted_by_participant2, is_group, created_by')
        .eq('id', conversationId)
        .single()

      if (convError) {
        console.error('Error fetching conversation:', convError)
        throw convError
      }

      if (!convData) {
        console.error('Conversation not found')
        throw new Error('Conversation not found')
      }

      console.log('Conversation data:', convData)

      if (convData.is_group) {
        // Handle group conversation deletion (leave group)
        console.log('Leaving group conversation')
        
        const { error: leaveError } = await supabase.rpc('leave_group_conversation', {
          conversation_id_param: conversationId
        })

        if (leaveError) {
          console.error('Error leaving group conversation:', leaveError)
          throw leaveError
        }

        console.log('Successfully left group conversation')
      } else {
        // Handle one-on-one conversation deletion (existing logic)
        
        // Check if user is a participant
        if (user.id !== convData.participant1_id && user.id !== convData.participant2_id) {
          console.error('User is not a participant in this conversation')
          throw new Error('User is not a participant in this conversation')
        }

        // Determine which participant the user is
        const isParticipant1 = user.id === convData.participant1_id
        const otherParticipantDeleted = isParticipant1 ? convData.deleted_by_participant2 : convData.deleted_by_participant1

        console.log('Current deletion status:', {
          deleted_by_participant1: convData.deleted_by_participant1,
          deleted_by_participant2: convData.deleted_by_participant2,
          isParticipant1,
          otherParticipantDeleted
        })

        // Update the conversation to mark as deleted by this user
        const updateData = isParticipant1 
          ? { deleted_by_participant1: true, updated_at: new Date().toISOString() }
          : { deleted_by_participant2: true, updated_at: new Date().toISOString() }

        console.log('Updating conversation with data:', updateData)

        const { data: updateResult, error: updateError } = await supabase
          .from('conversations')
          .update(updateData)
          .eq('id', conversationId)
          .select()

        if (updateError) {
          console.error('Error updating conversation:', updateError)
          throw updateError
        }

        console.log('Update result:', updateResult)
        console.log('Conversation marked as deleted by user')

        // Now check the updated state to see if both participants have deleted it
        const { data: updatedConv, error: updatedConvError } = await supabase
          .from('conversations')
          .select('deleted_by_participant1, deleted_by_participant2')
          .eq('id', conversationId)
          .single()

        if (updatedConvError) {
          console.error('Error fetching updated conversation state:', updatedConvError)
          throw updatedConvError
        }

        console.log('Updated deletion status:', JSON.stringify(updatedConv, null, 2))

        // Check if both participants have now deleted it
        if (updatedConv.deleted_by_participant1 && updatedConv.deleted_by_participant2) {
          console.log('Both participants have deleted the conversation, permanently deleting...')
          
          // Delete all messages first
          const { error: messagesError } = await supabase
            .from('messages')
            .delete()
            .eq('conversation_id', conversationId)

          if (messagesError) {
            console.error('Error deleting messages:', messagesError)
            throw messagesError
          }

          // Delete the conversation
          const { error: conversationError } = await supabase
            .from('conversations')
            .delete()
            .eq('id', conversationId)

          if (conversationError) {
            console.error('Error deleting conversation:', conversationError)
            throw conversationError
          }

          console.log('Conversation permanently deleted from database')
        } else {
          console.log('Conversation soft deleted (other participant has not deleted it yet)')
        }
      }

      // Update local state to remove the conversation from the list
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      return true

    } catch (err) {
      console.error('Error deleting conversation:', err)
      console.error('Full error object:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to delete conversation: ${errorMessage}`)
      return false
    }
  }, [user, supabase])

  // Restore a conversation (undo soft delete)
  const restoreConversation = useCallback(async (conversationId: string) => {
    if (!user) return false

    try {
      console.log('Starting restoration of conversation:', conversationId)
      
      // First, get the conversation to check permissions
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, participant1_id, participant2_id, deleted_by_participant1, deleted_by_participant2')
        .eq('id', conversationId)
        .single()

      if (convError) {
        console.error('Error fetching conversation:', convError)
        throw convError
      }

      if (!convData) {
        console.error('Conversation not found')
        throw new Error('Conversation not found')
      }

      // Check if user is a participant
      if (user.id !== convData.participant1_id && user.id !== convData.participant2_id) {
        console.error('User is not a participant in this conversation')
        throw new Error('User is not a participant in this conversation')
      }

      // Determine which participant the user is and restore
      const isParticipant1 = user.id === convData.participant1_id
      const updateData = isParticipant1 
        ? { deleted_by_participant1: false, updated_at: new Date().toISOString() }
        : { deleted_by_participant2: false, updated_at: new Date().toISOString() }

      const { error: updateError } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId)

      if (updateError) {
        console.error('Error restoring conversation:', updateError)
        throw updateError
      }
      
      console.log('Conversation restored successfully')
      // Reload conversations to update the list
      await loadConversations(false) // Silent update
      return true
    } catch (err) {
      console.error('Error restoring conversation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to restore conversation: ${errorMessage}`)
      return false
    }
  }, [user, supabase, loadConversations])

  // Initialize data
  useEffect(() => {
    if (user) {
      loadUsers()
      loadConversations()
      setUserOnline()
    }

    // Set user offline when component unmounts
    return () => {
      if (user) {
        setUserOffline()
      }
    }
  }, [user, loadUsers, loadConversations, setUserOnline, setUserOffline])

  // Fallback polling to ensure conversations are updated (every 30 seconds)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      loadConversations(false) // Silent update
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user, loadConversations])

  // Set up real-time subscription for conversations
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          const newConversation = payload.new as any
          // Only show conversation to the creator, not the receiver until a message is sent
          if (newConversation && newConversation.participant1_id === user.id) {
            console.log('New conversation created by user:', user.id, newConversation)
            loadConversations(false) // Silent update
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          const updatedConversation = payload.new as any
          // Check if the user is a participant in this conversation
          if (updatedConversation && (updatedConversation.participant1_id === user.id || updatedConversation.participant2_id === user.id)) {
            console.log('Conversation updated for user:', user.id, updatedConversation)
            loadConversations(false) // Silent update
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as any
          console.log('New message detected:', newMessage)
          // Check if this message is in a conversation the user participates in
          if (newMessage && newMessage.conversation_id) {
            // First, check if the user is a participant in this conversation
            supabase
              .from('conversations')
              .select('participant1_id, participant2_id, deleted_by_participant1, deleted_by_participant2')
              .eq('id', newMessage.conversation_id)
              .single()
              .then(async ({ data: convData }) => {
                if (convData && (convData.participant1_id === user.id || convData.participant2_id === user.id)) {
                  console.log('Message is in user\'s conversation, checking if restoration needed...')
                  
                  // Try to auto-restore the conversation if it was soft-deleted
                  const wasRestored = await autoRestoreConversation(newMessage.conversation_id)
                  
                  if (wasRestored) {
                    console.log('Conversation was auto-restored due to new message')
                  }
                  
                  // Reload conversations to show the restored conversation
                  loadConversations(false) // Silent update
                }
              })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, loadConversations])

  // Force refresh conversations
  const forceRefresh = useCallback(() => {
    console.log('Force refreshing conversations...')
    loadConversations(true) // Show loading for manual refresh
  }, [loadConversations])

  // Auto-restore conversation when message is received in soft-deleted conversation
  const autoRestoreConversation = useCallback(async (conversationId: string) => {
    if (!user) return false

    try {
      // Get conversation details
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('participant1_id, participant2_id, deleted_by_participant1, deleted_by_participant2')
        .eq('id', conversationId)
        .single()

      if (convError || !convData) return false

      // Check if user is a participant
      if (user.id !== convData.participant1_id && user.id !== convData.participant2_id) return false

      // Check if conversation was soft-deleted by current user
      const isParticipant1 = user.id === convData.participant1_id
      const deletedByCurrentUser = isParticipant1 ? convData.deleted_by_participant1 : convData.deleted_by_participant2

      if (deletedByCurrentUser) {
        console.log('Auto-restoring conversation due to new message:', conversationId)
        
        // Restore the conversation
        const updateData = isParticipant1 
          ? { deleted_by_participant1: false, updated_at: new Date().toISOString() }
          : { deleted_by_participant2: false, updated_at: new Date().toISOString() }

        const { error: updateError } = await supabase
          .from('conversations')
          .update(updateData)
          .eq('id', conversationId)

        if (updateError) {
          console.error('Error auto-restoring conversation:', updateError)
          return false
        }

        console.log('Conversation auto-restored successfully')
        return true
      }

      return false
    } catch (err) {
      console.error('Error in auto-restore conversation:', err)
      return false
    }
  }, [user, supabase])

  return {
    conversations,
    users,
    isLoading,
    isRefreshing,
    error,
    startConversation,
    createGroupConversation,
    loadConversations,
    loadUsers,
    deleteConversation,
    restoreConversation,
    autoRestoreConversation,
    forceRefresh,
    lastUpdate
  }
}
