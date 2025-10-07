'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { NotificationData } from '@/components/notification-toast'
import type { UnreadNotification } from '@/components/notification-bell'

interface UseNotificationsProps {
  userId: string | undefined
  conversations: any[] // Les conversations viennent de useConversations
}

export function useNotifications({ userId, conversations }: UseNotificationsProps) {
  const [toastNotifications, setToastNotifications] = useState<NotificationData[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState<UnreadNotification[]>([])
  const supabase = createClient()

  // Mettre à jour les notifications non lues depuis les conversations
  useEffect(() => {
    if (!conversations) return

    const unread = conversations
      .filter((conv: any) => conv.unread_count > 0)
      .map((conv: any) => ({
        id: conv.id,
        conversationId: conv.id,
        senderName: conv.other_user?.display_name || conv.other_user?.username || conv.name || 'Unknown',
        senderAvatar: conv.other_user?.avatar_url,
        lastMessage: conv.last_message?.content || '',
        unreadCount: conv.unread_count,
        timestamp: new Date(conv.last_message?.created_at || conv.updated_at)
      }))

    setUnreadNotifications(unread)
  }, [conversations])

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (!userId) return

    // Écouter les nouveaux messages sur toutes les conversations de l'utilisateur
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMessage = payload.new as any

          // Vérifier si le message n'est pas envoyé par l'utilisateur actuel
          if (newMessage.sender_id === userId) return

          // Vérifier si l'utilisateur est participant de cette conversation
          const { data: conversation } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', newMessage.conversation_id)
            .single()

          if (!conversation) return

          // Vérifier si l'utilisateur est participant (participant1 ou participant2)
          const isParticipant = 
            conversation.participant1_id === userId || 
            conversation.participant2_id === userId

          if (!isParticipant) return

          // Récupérer les infos de l'expéditeur
          const { data: sender } = await supabase
            .from('users')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single()

          if (!sender) return

          // Créer une notification toast
          const toastNotif: NotificationData = {
            id: crypto.randomUUID(),
            senderId: sender.id,
            senderName: sender.display_name || sender.username,
            senderAvatar: sender.avatar_url,
            message: newMessage.content,
            conversationId: newMessage.conversation_id,
            timestamp: new Date(newMessage.created_at)
          }

          setToastNotifications(prev => [...prev, toastNotif])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Supprimer une notification toast
  const removeToastNotification = useCallback((id: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    try {
      // Marquer tous les messages non lus comme lus
      for (const notif of unreadNotifications) {
        await supabase.rpc('mark_messages_as_read', {
          conversation_id_param: notif.conversationId,
          user_id: userId
        })
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }, [userId, unreadNotifications, supabase])

  // Marquer une conversation comme lue
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return

    try {
      await supabase.rpc('mark_messages_as_read', {
        conversation_id_param: conversationId,
        user_id: userId
      })
    } catch (err) {
      console.error('Error marking conversation as read:', err)
    }
  }, [userId, supabase])

  return {
    toastNotifications,
    unreadNotifications,
    removeToastNotification,
    markAllAsRead,
    markConversationAsRead
  }
}

