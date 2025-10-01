-- Phase 1: Audit Log Enhancements

-- Add retention policy function to auto-delete old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$;

-- Create scheduled job to run cleanup monthly (via pg_cron)
-- Note: This requires pg_cron extension
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cleanup-audit-logs', '0 0 1 * *', 'SELECT public.cleanup_old_audit_logs()');
  END IF;
END;
$$;

-- Add IP anonymization function for GDPR compliance
CREATE OR REPLACE FUNCTION public.anonymize_ip(ip_address inet)
RETURNS inet
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Anonymize last octet for IPv4, last 80 bits for IPv6
  IF family(ip_address) = 4 THEN
    RETURN set_masklen(ip_address, 24);
  ELSE
    RETURN set_masklen(ip_address, 48);
  END IF;
END;
$$;

-- Add indexes for better audit log query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Phase 1: Profile Access Audit Logging
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  current_user_role user_role;
BEGIN
  current_user_id := auth.uid();
  
  -- Only log if an admin is viewing someone else's profile
  IF current_user_id IS NOT NULL AND current_user_id != NEW.id THEN
    SELECT role INTO current_user_role FROM public.profiles WHERE id = current_user_id;
    
    IF current_user_role IN ('admin', 'super_admin') THEN
      INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
      ) VALUES (
        current_user_id,
        'VIEW',
        'profiles',
        NEW.id,
        NULL,
        jsonb_build_object(
          'viewed_profile_id', NEW.id,
          'viewed_profile_email', NEW.email
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile access logging (on SELECT via views)
-- Note: We'll use a before update trigger as a proxy since we can't trigger on SELECT
CREATE TRIGGER log_profile_view_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_access();

-- Phase 1: Email Settings Audit Trail
CREATE OR REPLACE FUNCTION public.log_email_settings_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    'email_settings',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for email settings changes
CREATE TRIGGER audit_email_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_email_settings_changes();

-- Phase 2: Failed Login Tracking
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text
);

-- Enable RLS on failed login attempts
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view failed login attempts
CREATE POLICY "Admins can view failed login attempts"
ON public.failed_login_attempts
FOR SELECT
USING (is_admin_or_super_admin(auth.uid()));

-- System can insert failed login attempts
CREATE POLICY "System can insert failed login attempts"
ON public.failed_login_attempts
FOR INSERT
WITH CHECK (true);

-- Add index for failed login queries
CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON public.failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_logins_attempted_at ON public.failed_login_attempts(attempted_at DESC);

-- Cleanup old failed login attempts (keep only last 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_failed_logins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Schedule cleanup job for failed logins
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cleanup-failed-logins', '0 2 * * *', 'SELECT public.cleanup_old_failed_logins()');
  END IF;
END;
$$;

-- Phase 2: Security Events Table
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id uuid REFERENCES auth.users(id),
  ip_address inet,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events"
ON public.security_events
FOR SELECT
USING (is_admin_or_super_admin(auth.uid()));

-- System can insert security events
CREATE POLICY "System can insert security events"
ON public.security_events
FOR INSERT
WITH CHECK (true);

-- Add indexes for security events
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text,
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    ip_address,
    details
  ) VALUES (
    p_event_type,
    p_severity,
    p_user_id,
    p_ip_address,
    p_details
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

COMMENT ON TABLE public.audit_logs IS 'Audit trail with 1-year retention policy';
COMMENT ON TABLE public.failed_login_attempts IS 'Failed login attempts with 90-day retention';
COMMENT ON TABLE public.security_events IS 'Security events for monitoring and alerting';