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
  const { profile } = useAuth();

  const fetchUsers = async () => {
    try {
      // Security check: Only admins and super_admins can view all profiles
      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
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
      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        toast.error('You do not have permission to create users');
        throw new Error('Unauthorized: Insufficient permissions');
      }

      // Note: In a real implementation, you'd typically use Supabase Auth Admin API
      // to create the user account. For now, we'll just create the profile.
      // You would need to set up proper user invitation flow.
      
      // Note: In a real implementation, you'd use Supabase Auth Admin API
      // For demo purposes, we'll create a profile entry directly
      const userId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          department: userData.department,
        })
        .select()
        .single();

      if (error) throw error;
      
      setUsers(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserData) => {
    try {
      // Security check: Only admins and super_admins can update users
      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        toast.error('You do not have permission to update users');
        throw new Error('Unauthorized: Insufficient permissions');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
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
      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        toast.error('You do not have permission to delete users');
        throw new Error('Unauthorized: Insufficient permissions');
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
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