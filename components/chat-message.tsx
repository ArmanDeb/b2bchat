import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
  return (
    <div className={cn('flex mb-3 sm:mb-4', isOwnMessage ? 'justify-end' : 'justify-start')}>
      <div
        className={cn('max-w-[85%] sm:max-w-[75%] md:max-w-[70%] flex flex-col gap-1', {
          'items-end': isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn('flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs mb-1', {
              'justify-end flex-row-reverse': isOwnMessage,
            })}
          >
            <span className="font-medium text-foreground/80">{message.user.name}</span>
            <span className="text-foreground/50">
              {new Date(message.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            'py-2 px-3 sm:py-3 sm:px-4 rounded-2xl text-sm shadow-sm',
            isOwnMessage 
              ? 'bg-primary text-primary-foreground rounded-br-md' 
              : 'bg-muted text-foreground rounded-bl-md'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    </div>
  )
}
