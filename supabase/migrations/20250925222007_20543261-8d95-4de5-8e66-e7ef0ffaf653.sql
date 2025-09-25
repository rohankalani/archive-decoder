-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  floor_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  room_number TEXT,
  room_type TEXT, -- 'classroom', 'office', 'lab', 'auditorium', etc.
  capacity INTEGER,
  area_sqm NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rooms table
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rooms
CREATE POLICY "Admins can manage rooms" 
ON public.rooms 
FOR ALL 
USING (is_admin_or_super_admin(auth.uid()));

CREATE POLICY "Authenticated users can view rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();