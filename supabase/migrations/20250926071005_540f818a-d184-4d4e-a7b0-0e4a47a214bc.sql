-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, warning, error, success
  is_read BOOLEAN NOT NULL DEFAULT false,
  alert_id UUID REFERENCES public.alerts(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (is_admin_or_super_admin(auth.uid()));

-- Create email settings table for admin/supervisor emails
CREATE TABLE public.email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_settings
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_settings
CREATE POLICY "Admins can manage email settings" 
ON public.email_settings 
FOR ALL 
USING (is_admin_or_super_admin(auth.uid()));

-- Insert default email settings
INSERT INTO public.email_settings (setting_key, setting_value, description) VALUES
('admin_email', '', 'Email address for admin notifications'),
('supervisor_email', '', 'Email address for supervisor notifications'),
('alert_threshold_hours', '1', 'Hours before sending alert email for prolonged red category');

-- Create trigger for notifications updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for email_settings updated_at
CREATE TRIGGER update_email_settings_updated_at
BEFORE UPDATE ON public.email_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();