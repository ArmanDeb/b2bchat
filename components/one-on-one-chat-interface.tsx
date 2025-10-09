'use client'

import { useState, useEffect } from 'react'
import { useConversations, type Conversation } from '@/hooks/use-conversations'
import { OneOnOneChat } from '@/components/one-on-one-chat'
import { GroupChatSelector } from '@/components/group-chat-selector'
import { NotificationBell } from '@/components/notification-bell'
import { NotificationToastContainer } from '@/components/notification-toast'
import { useNotifications } from '@/hooks/use-notifications'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageCircle, 
  Search, 
  Plus,
  LogOut,
  Users
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
    isRefreshing,
    createGroupConversation,
    deleteConversation,
    loadConversations,
    forceRefresh
  } = useConversations()
  
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const supabase = createClient()
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  
  // Charger l'ID utilisateur
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    loadUser()
  }, [supabase])
  
  // Hook de notifications
  const {
    toastNotifications,
    unreadNotifications,
    removeToastNotification,
    markAllAsRead,
    markConversationAsRead
  } = useNotifications({ 
    userId, 
    conversations,
    activeConversationId // Ne pas afficher de notifications pour la conversation active
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserList, setShowUserList] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreateGroup = async (participantIds: string[], groupName: string) => {
    setIsCreatingGroup(true)
    try {
      const conversationId = await createGroupConversation(participantIds, groupName)
      if (conversationId) {
        console.log('Conversation created/found with ID:', conversationId)
        
        // Close the user list first
        setShowUserList(false)
        
        // Set the conversation ID immediately so the chat interface can load it
        setActiveConversationId(conversationId)
        
        // Wait a bit for the conversation to be fully created, then reload
        await new Promise(resolve => setTimeout(resolve, 300))
        await loadConversations(false)
        
        // Now find the conversation in the updated list
        setTimeout(() => {
          const conversation = conversations.find(c => c.id === conversationId)
          if (conversation) {
            console.log('Found conversation in state:', conversation)
            setActiveConversation(conversation)
          } else {
            console.log('Conversation not found in state, will be loaded by OneOnOneChat hook')
            // The OneOnOneChat component will load it via useOneOnOneChat hook
            setActiveConversation(null)
          }
        }, 100)
      }
    } catch (error) {
      console.error('Error in handleCreateGroup:', error)
    } finally {
      setIsCreatingGroup(false)
    }
  }

  const handleSelectConversation = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    setActiveConversationId(conversationId)
    setActiveConversation(conversation || null)
    // Marquer la conversation comme lue
    await markConversationAsRead(conversationId)
    // Rafraîchir les conversations pour mettre à jour le compteur
    await loadConversations(false)
  }

  const handleBack = () => {
    setActiveConversationId(null)
    setActiveConversation(null)
  }
  
  const handleNotificationClick = (conversationId: string) => {
    handleSelectConversation(conversationId)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const [isDeletingConversation, setIsDeletingConversation] = useState(false)
  
  const handleDeleteConversation = async (conversationId: string) => {
    // Prevent multiple simultaneous deletions
    if (isDeletingConversation) {
      console.log('[Delete] Already processing a deletion, skipping...')
      return
    }
    
    const conversation = conversations.find(c => c.id === conversationId)
    const isGroup = conversation?.is_group
    
    const confirmMessage = isGroup 
      ? 'Êtes-vous sûr de vouloir quitter ce groupe ? Vous pourrez être réinvité par un admin.'
      : 'Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.'
    
    if (window.confirm(confirmMessage)) {
      setIsDeletingConversation(true)
      try {
        const success = await deleteConversation(conversationId)
        if (success) {
          // If the deleted conversation was active, clear the active conversation
          if (activeConversationId === conversationId) {
            setActiveConversationId(null)
            setActiveConversation(null)
          }
        }
      } finally {
        setIsDeletingConversation(false)
      }
    }
  }

  return (
    <>
      {/* Notifications Toast */}
      <NotificationToastContainer
        notifications={toastNotifications}
        onRemove={removeToastNotification}
        onNotificationClick={handleNotificationClick}
      />
    
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar - Can be collapsed on desktop, hidden on mobile when chat is active */}
        <div className={cn(
          "border-r border-border bg-muted/30 flex flex-col transition-all duration-300",
          // Mobile behavior
          activeConversationId ? "hidden sm:flex" : "flex w-full",
          // Desktop behavior
          "sm:w-80 lg:w-96",
          isSidebarCollapsed && activeConversationId && "sm:w-0 sm:overflow-hidden"
        )}>
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold">Messages</h1>
                {isRefreshing && (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <div className="flex gap-1 sm:gap-2">
                <NotificationBell
                  notifications={unreadNotifications}
                  onNotificationClick={handleNotificationClick}
                  onMarkAllAsRead={markAllAsRead}
                />
                <Button
                  size="sm"
                  onClick={() => forceRefresh()}
                  variant="ghost"
                  className="rounded-full h-8 w-8 sm:h-9 sm:w-9 p-0"
                  title="Refresh conversations"
                >
                🔄
              </Button>
              <Button
                size="sm"
                onClick={() => setShowUserList(!showUserList)}
                variant="outline"
                className="rounded-full h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative px-3 sm:px-4 pb-3 shrink-0">
            <Search className="absolute left-6 sm:left-7 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 h-9 text-sm"
            />
          </div>
        </div>

        {/* Group Chat Selector */}
        {showUserList && (
          <GroupChatSelector
            users={filteredUsers}
            onBack={() => setShowUserList(false)}
            onCreateGroup={handleCreateGroup}
            isCreating={isCreatingGroup}
          />
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Chargement...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium mb-1">Aucune conversation</p>
              <p className="text-xs sm:text-sm">Commencez une nouvelle discussion</p>
            </div>
          ) : (
            <div className="p-2 sm:p-3">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-xl cursor-pointer mb-2",
                    "hover:bg-muted/50 active:scale-[0.98]",
                    activeConversationId === conversation.id 
                      ? "bg-primary/10 ring-1 ring-primary/20" 
                      : ""
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {conversation.is_group ? (
                      <div className="relative shrink-0">
                        <Avatar className="w-9 h-9 sm:w-11 sm:h-11">
                          <AvatarFallback className="bg-blue-500 text-white">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                          {conversation.participants?.length || 0}
                        </Badge>
                      </div>
                    ) : (
                      <Avatar className="w-9 h-9 sm:w-11 sm:h-11 shrink-0">
                        <AvatarImage src={conversation.other_user?.avatar_url} />
                        <AvatarFallback>
                          {conversation.other_user?.display_name?.[0] || 
                           conversation.other_user?.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-sm sm:text-base truncate">
                          {conversation.is_group 
                            ? conversation.name 
                            : (conversation.other_user?.display_name || conversation.other_user?.username)
                          }
                        </span>
                        {!conversation.is_group && conversation.other_user && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            conversation.other_user.is_online ? "bg-green-500" : "bg-gray-400"
                          )} />
                        )}
                      </div>
                      
                      {conversation.last_message && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {conversation.is_group && conversation.last_message.sender_name && (
                            <span className="font-medium">
                              {conversation.last_message.sender_name}: 
                            </span>
                          )}
                          {conversation.last_message.content}
                        </p>
                      )}
                      
                      {conversation.last_message && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-0.5">
                          {new Date(conversation.last_message.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    
                    {conversation.unread_count > 0 && (
                      <Badge className="h-5 min-w-[20px] rounded-full px-1.5 text-xs shrink-0 bg-primary">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-3 sm:p-4 border-t border-border shrink-0 bg-background/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="w-8 h-8 sm:w-9 sm:h-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary">
                {username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm sm:text-base truncate flex-1">{username}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground shrink-0 h-8 w-8 sm:h-9 sm:w-9"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area - Full width on mobile when conversation is active */}
      <div className={cn(
        "flex-1 flex flex-col",
        activeConversationId ? "flex w-full sm:w-auto" : "hidden sm:flex"
      )}>
        {activeConversationId ? (
          <OneOnOneChat
            conversationId={activeConversationId}
            conversation={activeConversation || undefined}
            otherUserId={activeConversation?.is_group ? undefined : activeConversation?.other_user?.id}
            onBack={handleBack}
            onDeleteConversation={handleDeleteConversation}
            onMessageSent={() => loadConversations(false)}
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Sélectionner une conversation</h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm">
                Choisissez une conversation dans la liste ou créez-en une nouvelle pour commencer à discuter
              </p>
              <Button onClick={() => setShowUserList(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
