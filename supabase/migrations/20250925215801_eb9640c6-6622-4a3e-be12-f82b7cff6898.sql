-- Update user role to admin for rohankalani@gmail.com
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE email = 'rohankalani@gmail.com';