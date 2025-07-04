
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile, DeleteUserResponse } from '@/types/admin';

// Define the shape of data returned from Supabase profiles query
interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

// Define the shape of auth user data
interface AuthUser {
  id: string;
  email?: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Get user profiles first
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          created_at
        `);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        toast.error('Failed to load user profiles');
        return;
      }

      // Get user demographics separately
      const { data: demographicsData, error: demographicsError } = await supabase
        .from('user_demographics')
        .select(`
          user_id,
          age,
          gender,
          location,
          fitness_level
        `);

      if (demographicsError) {
        console.error('Error loading demographics:', demographicsError);
        // Don't return here - continue without demographics data
      }

      // Get auth users for email addresses
      const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.error('Error loading auth users:', authError);
        toast.error('Failed to load user authentication data');
        return;
      }

      // Combine the data - ensure we have valid profiles data
      const profiles: ProfileRow[] = profilesData || [];
      const authUsers: AuthUser[] = authUsersData?.users || [];
      
      const combinedUsers: UserProfile[] = profiles.map((profile: ProfileRow) => {
        // For text user IDs, we need to find auth users by matching the ID as a string
        const authUser = authUsers.find((u: AuthUser) => u.id === profile.id);
        const demographics = demographicsData?.find(d => d.user_id === profile.id);
        
        return {
          id: profile.id,
          email: authUser?.email || 'No email found',
          first_name: profile.first_name || undefined,
          last_name: profile.last_name || undefined,
          created_at: profile.created_at,
          demographics: demographics ? {
            age: demographics.age,
            gender: demographics.gender,
            location: demographics.location,
            fitness_level: demographics.fitness_level
          } : undefined
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserChanges = async (editForm: Partial<UserProfile>) => {
    if (!editForm.id) return false;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name
        })
        .eq('id', editForm.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        toast.error('Failed to update profile');
        return false;
      }

      // Update email if changed
      const currentUser = users.find(u => u.id === editForm.id);
      if (currentUser && editForm.email && editForm.email !== currentUser.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          editForm.id,
          { email: editForm.email }
        );

        if (emailError) {
          console.error('Error updating email:', emailError);
          toast.error('Failed to update email address');
          return false;
        }
      }

      toast.success('User updated successfully');
      loadUsers(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error saving user changes:', error);
      toast.error('Failed to save changes');
      return false;
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail} and ALL their data? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('delete_user_and_data', {
        target_email: userEmail
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast.error(`Failed to delete user: ${error.message}`);
        return;
      }

      const response = data as unknown as DeleteUserResponse;
      if (response.success) {
        toast.success(response.message);
        loadUsers(); // Refresh the list
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('An unexpected error occurred while deleting user');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    isLoading,
    loadUsers,
    saveUserChanges,
    deleteUser
  };
};
