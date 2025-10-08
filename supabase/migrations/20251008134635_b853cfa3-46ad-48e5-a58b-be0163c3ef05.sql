-- Disable email confirmation for new signups by setting email_confirm to false
-- This allows users to sign up and log in immediately without email verification

-- Note: This is configured in Supabase Auth settings, not via SQL
-- Users need to disable "Confirm email" in Authentication > Providers > Email settings

-- For now, we'll ensure the handle_new_user trigger works properly
-- and add better logging

-- The email confirmation setting must be changed in Supabase dashboard:
-- Go to Authentication > Providers > Email > Confirm email (toggle OFF)