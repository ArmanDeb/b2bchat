'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'

export interface NotificationData {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  message: string
  conversationId: string
  timestamp: Date
}

interface NotificationToastProps {
  notification: NotificationData
  onClose: () => void
  onClick: () => void
}

export function NotificationToast({ notification, onClose, onClick }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 10)

    // Auto-close après 5 secondes
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleClick = () => {
    onClick()
    handleClose()
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]
        bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700
        transition-all duration-300 cursor-pointer
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      onClick={handleClick}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="w-10 h-10 flex-shrink-0">
          <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-semibold">
            {notification.senderName.charAt(0).toUpperCase()}
          </div>
        </Avatar>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {notification.senderName}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              Maintenant
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {notification.message}
          </p>
        </div>

        {/* Bouton fermer */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleClose()
          }}
          className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Barre de progression */}
      <div className="h-1 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full bg-blue-500 animate-shrink"
          style={{
            animation: 'shrink 5s linear forwards'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}

// Container pour gérer plusieurs notifications
interface NotificationToastContainerProps {
  notifications: NotificationData[]
  onRemove: (id: string) => void
  onNotificationClick: (conversationId: string) => void
}

export function NotificationToastContainer({
  notifications,
  onRemove,
  onNotificationClick
}: NotificationToastContainerProps) {
  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      <div className="p-4 space-y-2 pointer-events-auto">
        {notifications.map((notification, index) => (
          <div key={notification.id} style={{ marginTop: index * 8 }}>
            <NotificationToast
              notification={notification}
              onClose={() => onRemove(notification.id)}
              onClick={() => onNotificationClick(notification.conversationId)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

