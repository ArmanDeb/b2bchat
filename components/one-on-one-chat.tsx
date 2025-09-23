'use client'

import { useOneOnOneChat } from '@/hooks/use-one-on-one-chat'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, ArrowLeft, MoreVertical } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface OneOnOneChatProps {
  conversationId?: string
  otherUserId?: string
  onBack?: () => void
}

export const OneOnOneChat = ({ 
  conversationId, 
  otherUserId, 
  onBack 
}: OneOnOneChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()
  const { user } = useUser()
  const {
    messages,
    conversation,
    isConnected,
    isLoading,
    error,
    sendMessage
  } = useOneOnOneChat({ conversationId, otherUserId })

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

  if (!conversation) {
    return (
      <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No conversation found</h3>
            <p className="text-muted-foreground">
              Start a conversation with someone to begin chatting
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
      <div className="border-b border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversation.other_user.avatar_url} />
              <AvatarFallback>
                {conversation.other_user.display_name?.[0] || 
                 conversation.other_user.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">
                  {conversation.other_user.display_name || conversation.other_user.username}
                </h2>
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    conversation.other_user.is_online ? "bg-green-500" : "bg-gray-400"
                  )} />
                  <span className="text-xs text-muted-foreground">
                    {conversation.other_user.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              {!conversation.other_user.is_online && (
                <p className="text-xs text-muted-foreground">
                  Last seen {new Date(conversation.other_user.last_seen).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Send className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
              <p className="text-sm text-muted-foreground">
                Start the conversation by sending a message below
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null
              const showHeader = !prevMessage || prevMessage.sender_id !== message.sender_id
              // Compare with the current user's ID from the conversation context
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
      <div className="border-t border-border bg-background p-4">
        <form onSubmit={handleSendMessage} className="flex w-full gap-3">
          <div className="flex-1 relative">
            <Input
              className={cn(
                'rounded-full bg-muted/50 border-0 pr-12 text-sm transition-all duration-300 focus:bg-background focus:border-border',
                isConnected && newMessage.trim() ? 'w-full' : 'w-full'
              )}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
            />
          </div>
          {isConnected && newMessage.trim() && (
            <Button
              className="rounded-full aspect-square p-0 w-10 h-10 animate-in fade-in slide-in-from-right-4 duration-300"
              type="submit"
              disabled={!isConnected}
            >
              <Send className="size-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}
