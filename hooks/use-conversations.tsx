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
  other_user: User
  last_message?: {
    id: string
    content: string
    sender_id: string
    created_at: string
  }
  unread_count: number
}

export function useConversations() {
  const supabase = createClient()
  const { user } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Load user's conversations
  const loadConversations = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:users!conversations_participant1_id_fkey(*),
          participant2:users!conversations_participant2_id_fkey(*)
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (data) {
        // Filter out conversations deleted by the current user
        const filteredData = data.filter(conv => {
          if (conv.participant1_id === user.id) {
            return !conv.deleted_by_participant1
          } else {
            return !conv.deleted_by_participant2
          }
        })

        const formattedConversations: Conversation[] = await Promise.all(
          filteredData.map(async (conv) => {
            const otherUser = conv.participant1.id === user.id ? conv.participant2 : conv.participant1
            
            // Get unread count for this conversation
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', user.id)
              .eq('is_read', false)

            // Get last message
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select('id, content, sender_id, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            return {
              id: conv.id,
              participant1_id: conv.participant1_id,
              participant2_id: conv.participant2_id,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              other_user: {
                id: otherUser.id,
                username: otherUser.username,
                display_name: otherUser.display_name,
                avatar_url: otherUser.avatar_url,
                is_online: otherUser.is_online,
                last_seen: otherUser.last_seen
              },
              last_message: lastMessageData || undefined,
              unread_count: unreadCount || 0
            }
          })
        )

        setConversations(formattedConversations)
      }
    } catch (err) {
      console.error('Error loading conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  // Start a new conversation with a user
  const startConversation = useCallback(async (otherUserId: string) => {
    if (!user) return null

    try {
      // First, check if there's an existing conversation (including soft-deleted ones)
      const { data: existingConv, error: fetchError } = await supabase
        .from('conversations')
        .select('id, participant1_id, participant2_id, deleted_by_participant1, deleted_by_participant2')
        .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
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
          await loadConversations()
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
        return data
      }
    } catch (err) {
      console.error('Error starting conversation:', err)
      setError('Failed to start conversation')
      return null
    }
  }, [user, supabase])

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

  // Soft delete a conversation (only for the current user)
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return false

    try {
      console.log('Starting soft deletion of conversation:', conversationId)
      console.log('User ID:', user.id)
      
      // First, get the conversation to check permissions and current state
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

      console.log('Conversation data:', convData)

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
      console.log('Full conversation data:', JSON.stringify(convData, null, 2))

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

      // Update local state to remove the conversation from the list
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      return true

    } catch (err) {
      console.error('Error soft deleting conversation:', err)
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
      await loadConversations()
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
          table: 'conversations',
          filter: `participant1_id=eq.${user.id},participant2_id=eq.${user.id}`
        },
        () => {
          loadConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, loadConversations])

  return {
    conversations,
    users,
    isLoading,
    error,
    startConversation,
    loadConversations,
    loadUsers,
    deleteConversation,
    restoreConversation
  }
}
