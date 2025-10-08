-- Fix rohankalani@gmail.com admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('d949bbe9-e467-4ba2-916d-7e58e9e3cb7a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix aerocountiaq@gmail.com profile to match actual supervisor role
UPDATE public.profiles 
SET role = 'supervisor'
WHERE id = 'e4c6bdba-cf30-4696-a0d7-7e06ec730306';

-- Create view to check role consistency across tables
CREATE OR REPLACE VIEW public.role_consistency_check AS
SELECT 
  p.id,
  p.email,
  p.role::text as profile_role,
  ur.role::text as actual_role,
  CASE 
    WHEN ur.role IS NULL THEN 'Missing user_roles entry'
    WHEN p.role::text != ur.role::text THEN 'Role mismatch'
    ELSE 'OK'
  END as status
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;

-- Create function to sync profile role when user_roles changes
CREATE OR REPLACE FUNCTION sync_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET role = NEW.role
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically sync roles
CREATE TRIGGER sync_profile_role_trigger
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_role();