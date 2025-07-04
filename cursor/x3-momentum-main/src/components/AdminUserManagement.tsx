
import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserEditForm } from './admin/UserEditForm';
import { UserCard } from './admin/UserCard';
import { UserProfile } from '@/types/admin';

export const AdminUserManagement = () => {
  const { user } = useAuth();
  const { users, isLoading, loadUsers, saveUserChanges, deleteUser } = useUserManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // Only show for admin user
  if (!user || user.email !== 'wayne@waynetturner.com') {
    return null;
  }

  const startEdit = (userToEdit: UserProfile) => {
    setEditingUser(userToEdit.id);
    setEditForm({
      id: userToEdit.id,
      email: userToEdit.email,
      first_name: userToEdit.first_name,
      last_name: userToEdit.last_name
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleSaveUser = async () => {
    const success = await saveUserChanges(editForm);
    if (success) {
      setEditingUser(null);
      setEditForm({});
    }
  };

  const filteredUsers = users.filter(userItem => 
    userItem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userItem.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userItem.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-blue-700 mb-2">👥 User Management</h3>
        <p className="text-sm text-blue-600 mb-4">
          Manage user accounts, profiles, and data
        </p>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={loadUsers} disabled={isLoading} size="sm">
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredUsers.map((userItem) => (
          <div key={userItem.id}>
            {editingUser === userItem.id ? (
              <UserEditForm
                editForm={editForm}
                setEditForm={setEditForm}
                onSave={handleSaveUser}
                onCancel={cancelEdit}
              />
            ) : (
              <UserCard
                user={userItem}
                onEdit={startEdit}
                onDelete={deleteUser}
              />
            )}
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No users found matching your search.' : 'No users found.'}
        </div>
      )}
    </div>
  );
};
