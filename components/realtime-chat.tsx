'use client'

import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import {
  type ChatMessage,
  useRealtimeChat,
} from '@/hooks/use-realtime-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
  })
  const [newMessage, setNewMessage] = useState('')

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages]
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    return sortedMessages
  }, [initialMessages, realtimeMessages])

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected) return

      sendMessage(newMessage)
      setNewMessage('')
    },
    [newMessage, isConnected, sendMessage]
  )

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        {!isConnected && allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Connexion...</p>
            </div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4 max-w-md">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Aucun message</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Commencez la conversation en envoyant un message ci-dessous
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {allMessages.map((message, index) => {
              const prevMessage = index > 0 ? allMessages[index - 1] : null
              const showHeader = !prevMessage || prevMessage.user.name !== message.user.name

              return (
                <div
                  key={message.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                  <ChatMessageItem
                    message={message}
                    isOwnMessage={message.user.name === username}
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
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
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
