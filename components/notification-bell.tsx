'use client'

import { Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/avatar'

export interface UnreadNotification {
  id: string
  conversationId: string
  senderName: string
  senderAvatar?: string
  lastMessage: string
  unreadCount: number
  timestamp: Date
}

interface NotificationBellProps {
  notifications: UnreadNotification[]
  onNotificationClick: (conversationId: string) => void
  onMarkAllAsRead: () => void
}

export function NotificationBell({
  notifications,
  onNotificationClick,
  onMarkAllAsRead
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)

  const totalUnread = notifications.reduce((acc, notif) => acc + notif.unreadCount, 0)

  // Animation quand nouvelle notification
  useEffect(() => {
    if (totalUnread > 0) {
      setHasNewNotification(true)
      const timer = setTimeout(() => setHasNewNotification(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [totalUnread])

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes}min`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days}j`
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell 
            className={`w-5 h-5 ${hasNewNotification ? 'animate-bounce' : ''}`}
          />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-[32rem] overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {totalUnread > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkAllAsRead()
              }}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune notification
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800"
                onClick={() => {
                  onNotificationClick(notification.conversationId)
                  setIsOpen(false)
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  {/* Avatar */}
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-semibold">
                      {notification.senderName.charAt(0).toUpperCase()}
                    </div>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {notification.senderName}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-1">
                      {notification.lastMessage}
                    </p>
                    {notification.unreadCount > 0 && (
                      <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                        {notification.unreadCount} nouveau{notification.unreadCount > 1 ? 'x' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

