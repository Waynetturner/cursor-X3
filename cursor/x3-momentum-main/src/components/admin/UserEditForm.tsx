
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';
import { UserProfile } from '@/types/admin';

interface UserEditFormProps {
  editForm: Partial<UserProfile>;
  setEditForm: (form: Partial<UserProfile>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const UserEditForm = ({ editForm, setEditForm, onSave, onCancel }: UserEditFormProps) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">First Name</label>
          <Input
            value={editForm.first_name || ''}
            onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
            placeholder="First name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Last Name</label>
          <Input
            value={editForm.last_name || ''}
            onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
            placeholder="Last name"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          value={editForm.email || ''}
          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
          placeholder="Email address"
          type="email"
        />
      </div>
      <div className="flex space-x-2">
        <Button onClick={onSave} size="sm" className="flex items-center gap-1">
          <Save className="h-3 w-3" />
          Save
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm" className="flex items-center gap-1">
          <X className="h-3 w-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
};
