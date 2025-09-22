'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChat } from '@/components/realtime-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Users, 
  Plus, 
  Search,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  name: string
  type: 'direct' | 'group'
  participants: string[]
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

interface ChatInterfaceProps {
  username: string
}

export const ChatInterface = ({ username }: ChatInterfaceProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatName, setNewChatName] = useState('')
  const [newChatType, setNewChatType] = useState<'direct' | 'group'>('direct')
  const [newChatParticipant, setNewChatParticipant] = useState('')
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [roomToJoin, setRoomToJoin] = useState('')

  // Initialize with default conversations that all users can see
  useEffect(() => {
    const defaultConversations: Conversation[] = [
      {
        id: 'general',
        name: 'General Chat',
        type: 'group',
        participants: [username],
        lastMessage: 'Welcome to the chat!',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      },
      {
        id: 'test-room',
        name: 'Test Room',
        type: 'group',
        participants: [username],
        lastMessage: 'This is a test room for multiple users',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      }
    ]
    setConversations(defaultConversations)
    setActiveConversation('general')
  }, [username])

  const handleCreateConversation = () => {
    if (!newChatName.trim()) return

    // Create a simple room ID based on the chat name
    const roomId = newChatName.toLowerCase().replace(/\s+/g, '-')
    
    const newConversation: Conversation = {
      id: roomId,
      name: newChatName,
      type: newChatType,
      participants: [username],
      lastMessage: 'Conversation started',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    }

    setConversations(prev => [newConversation, ...prev])
    setActiveConversation(roomId)
    setShowNewChat(false)
    setNewChatName('')
    setNewChatParticipant('')
    
    // Show the room ID to the user so they can share it
    alert(`Room created! Share this Room ID with others: "${roomId}"`)
  }

  const handleJoinRoom = () => {
    if (!roomToJoin.trim()) return

    // Check if room already exists
    const existingRoom = conversations.find(conv => conv.id === roomToJoin)
    if (existingRoom) {
      setActiveConversation(roomToJoin)
    } else {
      // Create a new room with the specified ID
      const newRoom: Conversation = {
        id: roomToJoin,
        name: `Room: ${roomToJoin}`,
        type: 'group',
        participants: [username],
        lastMessage: 'Joined room',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      }
      setConversations(prev => [newRoom, ...prev])
      setActiveConversation(roomToJoin)
    }
    setShowJoinRoom(false)
    setRoomToJoin('')
  }

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeConv = conversations.find(conv => conv.id === activeConversation)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Chat</h1>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowJoinRoom(!showJoinRoom)}
                variant="outline"
                className="rounded-full"
              >
                Join
              </Button>
              <Button
                size="sm"
                onClick={() => setShowNewChat(!showNewChat)}
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

        {/* Join Room Form */}
        {showJoinRoom && (
          <Card className="m-4 p-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Room ID</label>
                <Input
                  placeholder="Enter room ID (e.g., 'test-room')"
                  value={roomToJoin}
                  onChange={(e) => setRoomToJoin(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ask the room creator for the Room ID to join their chat
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleJoinRoom}
                  disabled={!roomToJoin.trim()}
                  className="flex-1"
                >
                  Join Room
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowJoinRoom(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* New Chat Form */}
        {showNewChat && (
          <Card className="m-4 p-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Chat Name</label>
                <Input
                  placeholder="Enter chat name"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm"
                    variant={newChatType === 'direct' ? 'default' : 'outline'}
                    onClick={() => setNewChatType('direct')}
                    className="flex-1"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Direct
                  </Button>
                  <Button
                    size="sm"
                    variant={newChatType === 'group' ? 'default' : 'outline'}
                    onClick={() => setNewChatType('group')}
                    className="flex-1"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Group
                  </Button>
                </div>
              </div>

              {newChatType === 'direct' && (
                <div>
                  <label className="text-sm font-medium">Participant Username</label>
                  <Input
                    placeholder="Enter username"
                    value={newChatParticipant}
                    onChange={(e) => setNewChatParticipant(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateConversation}
                  disabled={!newChatName.trim()}
                  className="flex-1"
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewChat(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                After creating, share the Room ID with others so they can join
              </p>
            </div>
          </Card>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations found
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation.id)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors mb-2",
                    "hover:bg-muted/50",
                    activeConversation === conversation.id 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {conversation.type === 'direct' ? (
                        <User className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Users className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium truncate">{conversation.name}</span>
                    </div>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  
                  {conversation.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                  )}
                  
                  {conversation.lastMessageTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(conversation.lastMessageTime).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium">{username}</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                {activeConv.type === 'direct' ? (
                  <User className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Users className="w-5 h-5 text-muted-foreground" />
                )}
                <h2 className="text-lg font-semibold">{activeConv.name}</h2>
                <Badge variant="outline" className="text-xs">
                  {activeConv.type === 'direct' ? 'Direct' : 'Group'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {activeConv.participants.length} participant{activeConv.participants.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1">
              <RealtimeChat
                roomName={activeConv.id}
                username={username}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
