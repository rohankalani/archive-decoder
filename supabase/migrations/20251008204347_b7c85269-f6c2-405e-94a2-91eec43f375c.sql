
-- Fix Security Issue: role_consistency_check view has no RLS protection
-- This view exposes user IDs, emails, and role information
-- Restrict access to super admins only

-- Enable RLS on the role_consistency_check view
ALTER VIEW role_consistency_check SET (security_barrier = true);

-- Note: Views don't support RLS directly, so we need to drop and recreate it as a table
-- Or we can create a security definer function to access it

-- Better approach: Drop the view and create a security definer function instead
DROP VIEW IF EXISTS role_consistency_check;

-- Create a security definer function that only admins can call
CREATE OR REPLACE FUNCTION public.check_role_consistency()
RETURNS TABLE (
  id uuid,
  email text,
  profile_role text,
  actual_role text,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.email,
    p.role::text AS profile_role,
    ur.role::text AS actual_role,
    CASE
      WHEN ur.role IS NULL THEN 'Missing user_roles entry'::text
      WHEN p.role::text <> ur.role::text THEN 'Role mismatch'::text
      ELSE 'OK'::text
    END AS status
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  WHERE public.is_user_admin(auth.uid()); -- Only allow admins to call this
$$;

-- Grant execute permission only to authenticated users
-- The function itself checks for admin status
GRANT EXECUTE ON FUNCTION public.check_role_consistency() TO authenticated;

COMMENT ON FUNCTION public.check_role_consistency() IS 
  'Admin-only function to check consistency between profiles.role and user_roles.role. Only accessible to admins via the is_user_admin() check.';
