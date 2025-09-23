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
        const formattedConversations: Conversation[] = await Promise.all(
          data.map(async (conv) => {
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
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: otherUserId
      })

      if (error) throw error
      return data
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
    loadUsers
  }
}
