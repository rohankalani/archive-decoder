import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  role: 'viewer' | 'admin' | 'supervisor' | 'super_admin';
  department?: string;
}

interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  role?: 'viewer' | 'admin' | 'supervisor' | 'super_admin';
  department?: string;
  phone?: string;
  is_active?: boolean;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchUsers = async () => {
    try {
      // Security check: Only admins and super_admins can view all profiles
      if (!isAdmin) {
        console.error('Unauthorized: User does not have permission to view all profiles');
        toast.error('You do not have permission to view user profiles');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      // Security check: Only admins and super_admins can create users
      if (!isAdmin) {
        toast.error('You do not have permission to create users');
        throw new Error('Unauthorized: Insufficient permissions');
      }

      // Generate a default password (user should change this on first login)
      const defaultPassword = `${userData.first_name}${Math.floor(Math.random() * 10000)}!`

      // Call the edge function to create user via Supabase Admin API
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: userData.email,
          password: defaultPassword,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          department: userData.department,
        },
      })

      if (error) {
        console.error('Edge function error:', error)
        throw error
      }

      if (data?.error) {
        console.error('User creation error:', data.error)
        throw new Error(data.error)
      }

      console.log('User created successfully:', data)
      
      // Refresh the user list
      await fetchUsers()
      
      toast.success(`User created! Default password: ${defaultPassword}`)
      return data.user
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserData) => {
    try {
      // Security check: Only admins and super_admins can update users
      if (!isAdmin) {
        toast.error('You do not have permission to update users');
        throw new Error('Unauthorized: Insufficient permissions');
      }

      // Update profile (excluding role)
      const { first_name, last_name, department, phone, is_active } = userData;
      const { data, error } = await supabase
        .from('profiles')
        .update({ first_name, last_name, department, phone, is_active })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update role in user_roles table if role is being changed
      if (userData.role) {
        // Delete existing role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        // Insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: userData.role
          });

        if (roleError) throw roleError;
      }
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...data } : user
      ));
      
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Security check: Only admins and super_admins can delete users
      if (!isAdmin) {
        toast.error('You do not have permission to delete users');
        throw new Error('Unauthorized: Insufficient permissions');
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      // user_roles will be deleted automatically via CASCADE
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
  };
}