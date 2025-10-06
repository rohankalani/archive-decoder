-- Add operating hours columns to rooms table
ALTER TABLE public.rooms 
ADD COLUMN operating_hours_start integer DEFAULT 8 CHECK (operating_hours_start >= 0 AND operating_hours_start <= 23),
ADD COLUMN operating_hours_end integer DEFAULT 18 CHECK (operating_hours_end >= 0 AND operating_hours_end <= 23);

-- Add a comment to help with understanding
COMMENT ON COLUMN public.rooms.operating_hours_start IS 'Start hour for room operations in 24-hour format (0-23)';
COMMENT ON COLUMN public.rooms.operating_hours_end IS 'End hour for room operations in 24-hour format (0-23)';