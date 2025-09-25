-- Update any existing maintenance status devices to offline
UPDATE public.devices 
SET status = 'offline' 
WHERE status = 'maintenance';