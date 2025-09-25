-- Add calibration_due_date column to devices table and remove last_maintenance
ALTER TABLE public.devices 
DROP COLUMN IF EXISTS last_maintenance,
DROP COLUMN IF EXISTS calibration_date,
ADD COLUMN IF NOT EXISTS calibration_due_date DATE;