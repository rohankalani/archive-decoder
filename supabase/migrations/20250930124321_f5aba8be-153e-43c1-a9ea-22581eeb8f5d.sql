-- Fix Personal Information Exposure in profiles table
-- Drop the overly permissive policy that allows everyone to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policy: Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create admin exception: Admins can view all profiles for management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin_or_super_admin(auth.uid()));