
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { UserProfile } from '@/types/admin';

interface UserCardProps {
  user: UserProfile;
  onEdit: (user: UserProfile) => void;
  onDelete: (userId: string, userEmail: string) => void;
}

export const UserCard = ({ user, onEdit, onDelete }: UserCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-medium">
            {user.first_name || user.last_name 
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : 'No name set'
            }
          </div>
          <div className="text-sm text-gray-600">{user.email}</div>
          <div className="text-xs text-gray-400">
            Joined: {new Date(user.created_at).toLocaleDateString()}
          </div>
          {user.demographics && Object.keys(user.demographics).length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Demographics: Age {user.demographics.age}, {user.demographics.gender}, {user.demographics.location}
            </div>
          )}
        </div>
        <div className="flex space-x-1">
          <Button 
            onClick={() => onEdit(user)} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button 
            onClick={() => onDelete(user.id, user.email)} 
            variant="destructive" 
            size="sm"
            className="flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};
