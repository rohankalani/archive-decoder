-- Make block_id optional in floors table and add building_id for direct relationship
ALTER TABLE public.floors 
ALTER COLUMN block_id DROP NOT NULL;

-- Add building_id column to floors for direct relationship when no blocks
ALTER TABLE public.floors 
ADD COLUMN building_id UUID;