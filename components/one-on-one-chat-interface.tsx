'use client'

import { useState } from 'react'
import { useConversations } from '@/hooks/use-conversations'
import { OneOnOneChat } from '@/components/one-on-one-chat'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageCircle, 
  Search, 
  Plus,
  ArrowLeft,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OneOnOneChatInterfaceProps {
  username: string
}

export const OneOnOneChatInterface = ({ username }: OneOnOneChatInterfaceProps) => {
  const {
    conversations,
    users,
    isLoading,
    startConversation
  } = useConversations()

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserList, setShowUserList] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleStartConversation = async (userId: string) => {
    const conversationId = await startConversation(userId)
    if (conversationId) {
      setActiveConversationId(conversationId)
      setSelectedUserId(userId)
      setShowUserList(false)
    }
  }

  const handleSelectConversation = (conversationId: string, otherUserId: string) => {
    setActiveConversationId(conversationId)
    setSelectedUserId(otherUserId)
  }

  const handleBack = () => {
    setActiveConversationId(null)
    setSelectedUserId(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowUserList(!showUserList)}
                variant="outline"
                className="rounded-full"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* User List for New Chat */}
        {showUserList && (
          <Card className="m-4 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Start New Chat</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowUserList(false)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleStartConversation(user.id)}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.display_name?.[0] || user.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {user.display_name || user.username}
                        </span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          user.is_online ? "bg-green-500" : "bg-gray-400"
                        )} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new chat to begin messaging</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id, conversation.other_user.id)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors mb-2",
                    "hover:bg-muted/50",
                    activeConversationId === conversation.id 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conversation.other_user.avatar_url} />
                      <AvatarFallback>
                        {conversation.other_user.display_name?.[0] || 
                         conversation.other_user.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">
                          {conversation.other_user.display_name || conversation.other_user.username}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            conversation.other_user.is_online ? "bg-green-500" : "bg-gray-400"
                          )} />
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {conversation.last_message && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conversation.last_message.content}
                        </p>
                      )}
                      
                      {conversation.last_message && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(conversation.last_message.created_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{username}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversationId && selectedUserId ? (
          <OneOnOneChat
            conversationId={activeConversationId}
            otherUserId={selectedUserId}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground mb-4">
                Choose a conversation from the sidebar to start chatting
              </p>
              <Button onClick={() => setShowUserList(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
