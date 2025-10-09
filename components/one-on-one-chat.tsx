'use client'

import { useOneOnOneChat } from '@/hooks/use-one-on-one-chat'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, ArrowLeft, MoreVertical, Trash2, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { Conversation, User } from '@/hooks/use-conversations'

interface OneOnOneChatProps {
  conversationId?: string
  conversation?: Conversation // Full conversation object
  otherUserId?: string
  onBack?: () => void
  onDeleteConversation?: (conversationId: string) => void
  onMessageSent?: () => void // Callback to notify parent when message is sent
}

export const OneOnOneChat = ({ 
  conversationId, 
  conversation,
  otherUserId, 
  onBack,
  onDeleteConversation,
  onMessageSent
}: OneOnOneChatProps) => {
  const { user } = useUser()
  const { containerRef, scrollToBottom } = useChatScroll()
  const {
    messages,
    conversation: hookConversation,
    isConnected,
    isLoading,
    error,
    sendMessage
  } = useOneOnOneChat({ conversationId, otherUserId, onMessageSent })

  // Use the passed conversation object if available, otherwise fall back to hook data
  const activeConversation = conversation || hookConversation

  const [newMessage, setNewMessage] = useState('')

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected) return

      sendMessage(newMessage)
      setNewMessage('')
    },
    [newMessage, isConnected, sendMessage]
  )

  const handleDeleteConversation = useCallback((e?: Event) => {
    // Prevent multiple triggers
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!conversationId || !onDeleteConversation) return
    // Just call the parent handler - it will show the confirmation dialog
    onDeleteConversation(conversationId)
  }, [conversationId, onDeleteConversation])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-destructive text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Error loading conversation</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            {onBack && (
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!activeConversation) {
    return (
      <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Aucune conversation trouvée</h3>
            <p className="text-muted-foreground">
              Commencez une conversation pour discuter
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          Connecting to chat...
        </div>
      )}

      {/* Chat Header */}
      <div className="border-b border-border bg-muted/30 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-1.5 sm:p-2 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            
            {activeConversation.is_group ? (
              <div className="relative shrink-0">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                  <AvatarFallback className="bg-blue-500 text-white">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                <AvatarImage src={activeConversation.other_user?.avatar_url} />
                <AvatarFallback>
                  {activeConversation.other_user?.display_name?.[0] || 
                   activeConversation.other_user?.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <h2 className="font-semibold text-sm sm:text-base truncate">
                  {activeConversation.is_group 
                    ? activeConversation.name
                    : (activeConversation.other_user?.display_name || activeConversation.other_user?.username)
                  }
                </h2>
                
                {activeConversation.is_group ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <Users className="w-3 h-3 text-muted-foreground hidden sm:block" />
                    <span className="text-xs text-muted-foreground">
                      {activeConversation.participants?.length || 0}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activeConversation.other_user?.is_online ? "bg-green-500" : "bg-gray-400"
                    )} />
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {activeConversation.other_user?.is_online ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </div>
                )}
              </div>
              
              {activeConversation.is_group && activeConversation.participants && (
                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                  {activeConversation.participants.slice(0, 3).map((p: User) => p.username).join(', ')}
                  {activeConversation.participants.length > 3 && ` et ${activeConversation.participants.length - 3} autres`}
                </p>
              )}
              
              {!activeConversation.is_group && !activeConversation.other_user?.is_online && (
                <p className="text-xs text-muted-foreground hidden sm:block truncate">
                  Vu {new Date(activeConversation.other_user?.last_seen || '').toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1.5 sm:p-2 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  handleDeleteConversation()
                }}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {activeConversation.is_group ? 'Quitter le groupe' : 'Supprimer la conversation'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-muted flex items-center justify-center">
                <Send className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">Aucun message</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Commencez la conversation en envoyant un message ci-dessous
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null
              const showHeader = !prevMessage || prevMessage.sender_id !== message.sender_id
              const isOwnMessage = message.sender_id === user?.id

              return (
                <div
                  key={message.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                  <ChatMessageItem
                    message={{
                      id: message.id,
                      content: message.content,
                      user: {
                        name: message.sender.username
                      },
                      createdAt: message.created_at
                    }}
                    isOwnMessage={isOwnMessage}
                    showHeader={showHeader}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-border bg-background p-3 sm:p-4">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <Input
              className={cn(
                'rounded-full bg-muted/50 border-0 pr-3 text-sm transition-all duration-300 focus:bg-background focus:border-border',
                'h-10 sm:h-auto'
              )}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isConnected ? "Tapez un message..." : "Connexion..."}
              disabled={!isConnected}
            />
          </div>
          {isConnected && newMessage.trim() && (
            <Button
              className="rounded-full aspect-square p-0 w-10 h-10 shrink-0 animate-in fade-in slide-in-from-right-4 duration-300"
              type="submit"
              disabled={!isConnected}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}
