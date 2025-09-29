'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useState } from 'react'
import { useUser } from './use-user'
import type { Conversation } from './use-conversations'

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

// Import Conversation type from use-conversations to avoid duplication

interface UseOneOnOneChatProps {
  conversationId?: string
  otherUserId?: string
  onMessageSent?: () => void // Callback to notify parent when message is sent
}

export function useOneOnOneChat({ conversationId, otherUserId, onMessageSent }: UseOneOnOneChatProps) {
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
      // First, get basic conversation info
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single()

      if (convError) throw convError

      let data = convData

      // If it's a one-on-one conversation, get participant details
      if (!convData.is_group) {
        const { data: participantData, error: participantError } = await supabase
          .from('conversations')
          .select(`
            *,
            participant1:users!conversations_participant1_id_fkey(*),
            participant2:users!conversations_participant2_id_fkey(*)
          `)
          .eq('id', convId)
          .single()

        if (participantError) throw participantError
        data = participantData
      }

      if (data) {
        // Handle group conversations
        if (data.is_group) {
          // For group conversations, we don't need participant1/participant2 logic
          setConversation({
            id: data.id,
            participant1_id: data.participant1_id,
            participant2_id: data.participant2_id,
            created_at: data.created_at,
            updated_at: data.updated_at,
            is_group: true,
            name: data.name,
            created_by: data.created_by,
            other_user: undefined,
            participants: [], // Will be loaded separately if needed
            unread_count: 0
          })
        } else {
          // Handle one-on-one conversations
          const otherUser = data.participant1?.id === user?.id ? data.participant2 : data.participant1
          setConversation({
            id: data.id,
            participant1_id: data.participant1_id,
            participant2_id: data.participant2_id,
            created_at: data.created_at,
            updated_at: data.updated_at,
            is_group: false,
            name: undefined,
            created_by: undefined,
            other_user: {
              id: otherUser.id,
              username: otherUser.username,
              display_name: otherUser.display_name,
              avatar_url: otherUser.avatar_url,
              is_online: otherUser.is_online,
              last_seen: otherUser.last_seen
            },
            participants: undefined,
            unread_count: 0
          })
        }
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
        const formattedMessages: ChatMessage[] = data.map(msg => ({
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
        }))
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
          id: user.id,
          username: user.user_metadata?.username || user.email || 'Unknown',
          display_name: user.user_metadata?.display_name,
          avatar_url: user.user_metadata?.avatar_url
        }
      }

      setMessages(prev => [...prev, newMessage])
      
      // Notify parent component to update sidebar
      if (onMessageSent) {
        onMessageSent()
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    }
  }, [conversation, user, supabase, onMessageSent])

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
