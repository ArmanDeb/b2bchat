'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useState } from 'react'
import { useUser } from './use-user'

export interface ChatMessage {
  id: string
  content: string
  sender_id: string
  conversation_id: string
  message_type: 'text' | 'image' | 'file'
  is_read: boolean
  created_at: string
  sender: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export interface Conversation {
  id: string
  participant1_id: string
  participant2_id: string
  created_at: string
  updated_at: string
  other_user: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
    is_online: boolean
    last_seen: string
  }
  last_message?: ChatMessage
  unread_count: number
}

interface UseOneOnOneChatProps {
  conversationId?: string
  otherUserId?: string
}

export function useOneOnOneChat({ conversationId, otherUserId }: UseOneOnOneChatProps) {
  const supabase = createClient()
  const { user } = useUser()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get or create conversation
  const getOrCreateConversation = useCallback(async () => {
    if (!user || !otherUserId) return null

    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: otherUserId
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error getting/creating conversation:', err)
      setError('Failed to create conversation')
      return null
    }
  }, [user, otherUserId, supabase])

  // Load conversation details
  const loadConversation = useCallback(async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:users!conversations_participant1_id_fkey(*),
          participant2:users!conversations_participant2_id_fkey(*)
        `)
        .eq('id', convId)
        .single()

      if (error) throw error

      if (data) {
        const otherUser = data.participant1.id === user?.id ? data.participant2 : data.participant1
        setConversation({
          id: data.id,
          participant1_id: data.participant1_id,
          participant2_id: data.participant2_id,
          created_at: data.created_at,
          updated_at: data.updated_at,
          other_user: {
            id: otherUser.id,
            username: otherUser.username,
            display_name: otherUser.display_name,
            avatar_url: otherUser.avatar_url,
            is_online: otherUser.is_online,
            last_seen: otherUser.last_seen
          },
          unread_count: 0
        })
      }
    } catch (err) {
      console.error('Error loading conversation:', err)
      setError('Failed to load conversation')
    }
  }, [user, supabase])

  // Load messages
  const loadMessages = useCallback(async (convId: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(*)
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data) {
        console.log('Loaded messages:', data)
        const formattedMessages: ChatMessage[] = data.map(msg => {
          console.log('Processing message:', msg, 'Sender:', msg.sender)
          return {
            id: msg.id,
            content: msg.content,
            sender_id: msg.sender_id,
            conversation_id: msg.conversation_id,
            message_type: msg.message_type,
            is_read: msg.is_read,
            created_at: msg.created_at,
            sender: {
              id: msg.sender.id,
              username: msg.sender.username,
              display_name: msg.sender.display_name,
              avatar_url: msg.sender.avatar_url
            }
          }
        })
        console.log('Formatted messages:', formattedMessages)
        setMessages(formattedMessages)
      }
    } catch (err) {
      console.error('Error loading messages:', err)
      setError('Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!conversation || !user || !content.trim()) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text'
        })
        .select()
        .single()

      if (error) throw error

      // Fetch the sender details from the users table
      const { data: senderData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (senderData) {
        // Add the new message to local state immediately
        const newMessage: ChatMessage = {
          id: data.id,
          content: data.content,
          sender_id: data.sender_id,
          conversation_id: data.conversation_id,
          message_type: data.message_type,
          is_read: data.is_read,
          created_at: data.created_at,
          sender: {
            id: senderData.id,
            username: senderData.username,
            display_name: senderData.display_name,
            avatar_url: senderData.avatar_url
          }
        }

        setMessages(prev => [...prev, newMessage])
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    }
  }, [conversation, user, supabase])

  // Mark messages as read
  const markAsRead = useCallback(async (convId: string) => {
    if (!user) return

    try {
      await supabase.rpc('mark_messages_as_read', {
        conversation_id_param: convId,
        user_id: user.id
      })
    } catch (err) {
      console.error('Error marking messages as read:', err)
    }
  }, [user, supabase])

  // Set up real-time subscription
  useEffect(() => {
    if (!conversation) return

    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload) => {
          const newMessage = payload.new as any
          
          // Fetch the sender details
          const { data: senderData } = await supabase
            .from('users')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single()

          if (senderData) {
            const formattedMessage: ChatMessage = {
              id: newMessage.id,
              content: newMessage.content,
              sender_id: newMessage.sender_id,
              conversation_id: newMessage.conversation_id,
              message_type: newMessage.message_type,
              is_read: newMessage.is_read,
              created_at: newMessage.created_at,
              sender: {
                id: senderData.id,
                username: senderData.username,
                display_name: senderData.display_name,
                avatar_url: senderData.avatar_url
              }
            }

            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(msg => msg.id === formattedMessage.id)) {
                return prev
              }
              return [...prev, formattedMessage]
            })

            // Mark as read if it's not from the current user
            if (newMessage.sender_id !== user?.id) {
              markAsRead(conversation.id)
            }
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation, user, supabase, markAsRead])

  // Initialize conversation and load data
  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return

      let convId = conversationId

      // If no conversation ID provided, try to get/create one with otherUserId
      if (!convId && otherUserId) {
        convId = await getOrCreateConversation()
      }

      if (convId) {
        await loadConversation(convId)
        await loadMessages(convId)
        await markAsRead(convId)
      }
    }

    initializeChat()
  }, [user, conversationId, otherUserId, getOrCreateConversation, loadConversation, loadMessages, markAsRead])

  return {
    messages,
    conversation,
    isConnected,
    isLoading,
    error,
    sendMessage,
    markAsRead
  }
}
