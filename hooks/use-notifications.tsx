'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { NotificationData } from '@/components/notification-toast'
import type { UnreadNotification } from '@/components/notification-bell'

interface UseNotificationsProps {
  userId: string | undefined
  conversations: any[] // Les conversations viennent de useConversations
  activeConversationId?: string | null // ID de la conversation actuellement ouverte
}

export function useNotifications({ userId, conversations, activeConversationId }: UseNotificationsProps) {
  const [toastNotifications, setToastNotifications] = useState<NotificationData[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState<UnreadNotification[]>([])
  const supabase = createClient()

  // Mettre à jour les notifications non lues depuis les conversations
  useEffect(() => {
    if (!conversations) return

    const unread = conversations
      .filter((conv: any) => conv.unread_count > 0)
      .map((conv: any) => {
        // Déterminer le nom à afficher selon le type de conversation
        let displayName = 'Unknown'
        let avatar = undefined
        
        if (conv.is_group) {
          // Pour un groupe, afficher le nom du groupe
          displayName = conv.name || 'Group Chat'
          // Pas d'avatar spécifique pour les groupes
        } else {
          // Pour une conversation one-on-one, afficher l'autre utilisateur
          displayName = conv.other_user?.display_name || conv.other_user?.username || 'Unknown'
          avatar = conv.other_user?.avatar_url
        }
        
        return {
          id: conv.id,
          conversationId: conv.id,
          senderName: displayName,
          senderAvatar: avatar,
          lastMessage: conv.last_message?.content || '',
          unreadCount: conv.unread_count,
          timestamp: new Date(conv.last_message?.created_at || conv.updated_at)
        }
      })

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
            .select('id, participant1_id, participant2_id, is_group, name')
            .eq('id', newMessage.conversation_id)
            .single()

          if (!conversation) return

          // Vérifier si l'utilisateur est participant
          let isParticipant = false
          
          if (!conversation.is_group) {
            // One-on-one conversation
            isParticipant = 
              conversation.participant1_id === userId || 
              conversation.participant2_id === userId
          } else {
            // Group conversation - check conversation_participants
            const { data: participantData } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', newMessage.conversation_id)
              .eq('user_id', userId)
              .eq('deleted_by_user', false)
              .is('left_at', null)
              .maybeSingle()
            
            isParticipant = !!participantData
          }

          if (!isParticipant) return

          // Ne pas afficher de notification si l'utilisateur est déjà dans cette conversation
          if (activeConversationId === newMessage.conversation_id) {
            console.log('[Notifications] User is in this conversation, skipping toast notification')
            return
          }

          // Récupérer les infos de l'expéditeur
          const { data: sender } = await supabase
            .from('users')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single()

          if (!sender) return

          // Construire le nom de l'expéditeur (inclure le nom du groupe si applicable)
          let senderDisplayName = sender.display_name || sender.username
          if (conversation.is_group && conversation.name) {
            senderDisplayName = `${sender.display_name || sender.username} (${conversation.name})`
          }

          // Créer une notification toast
          const toastNotif: NotificationData = {
            id: crypto.randomUUID(),
            senderId: sender.id,
            senderName: senderDisplayName,
            senderAvatar: sender.avatar_url,
            message: newMessage.content,
            conversationId: newMessage.conversation_id,
            timestamp: new Date(newMessage.created_at)
          }

          console.log('[Notifications] Creating toast notification:', toastNotif)
          setToastNotifications(prev => [...prev, toastNotif])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, activeConversationId])

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

