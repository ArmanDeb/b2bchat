'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Users, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/hooks/use-conversations'

interface GroupChatSelectorProps {
  users: User[]
  onBack: () => void
  onCreateGroup: (selectedUserIds: string[], groupName: string) => Promise<void>
  isCreating?: boolean
}

export const GroupChatSelector = ({ 
  users, 
  onBack, 
  onCreateGroup, 
  isCreating = false 
}: GroupChatSelectorProps) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleCreateGroup = async () => {
    if (selectedUserIds.length === 0) return
    
    // For single user selection, we don't need a group name
    if (selectedUserIds.length === 1) {
      await onCreateGroup(selectedUserIds, '')
      return
    }

    // For multiple users, use provided name or generate a default one
    const finalGroupName = groupName.trim() || `Group with ${selectedUserIds.length + 1} members`
    await onCreateGroup(selectedUserIds, finalGroupName)
  }

  const isGroupChat = selectedUserIds.length > 1
  const canCreate = selectedUserIds.length > 0

  return (
    <Card className="m-4 p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-medium">
              {isGroupChat ? 'Créer un groupe' : 'Nouvelle conversation'}
            </h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onBack}
            className="p-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Group Name Input (only for groups) */}
        {isGroupChat && (
          <div>
            <Input
              placeholder="Nom du groupe (optionnel)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">
              Si vous ne spécifiez pas de nom, un nom sera généré automatiquement
            </p>
          </div>
        )}

        {/* Search */}
        <Input
          placeholder="Rechercher des utilisateurs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Selected Count */}
        {selectedUserIds.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4" />
            {selectedUserIds.length} {selectedUserIds.length === 1 ? 'personne sélectionnée' : 'personnes sélectionnées'}
          </div>
        )}

        {/* User List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredUsers.map((user) => {
            const isSelected = selectedUserIds.includes(user.id)
            
            return (
              <div
                key={user.id}
                onClick={() => handleToggleUser(user.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
                  isSelected 
                    ? "bg-primary/10 border-primary/30" 
                    : "hover:bg-muted/50 border-transparent"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => {}} // Handled by parent div click
                  className="pointer-events-none"
                />
                
                <Avatar className="w-10 h-10">
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
                  <p className="text-xs text-muted-foreground">
                    {user.is_online ? 'En ligne' : `Vu ${new Date(user.last_seen).toLocaleString()}`}
                  </p>
                </div>
              </div>
            )
          })}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>

        {/* Create Button */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={!canCreate || isCreating}
            className="flex-1"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Création...
              </div>
            ) : (
              <>
                {isGroupChat ? 'Créer le groupe' : 'Démarrer la conversation'}
                ({selectedUserIds.length})
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
