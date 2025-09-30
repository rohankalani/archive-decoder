-- Remove blocks from the architecture
-- Floors will now link directly to buildings

-- First, update floors table to link directly to buildings
-- Set building_id for any floors that don't have it (get from their block)
UPDATE floors 
SET building_id = blocks.building_id
FROM blocks
WHERE floors.block_id = blocks.id AND floors.building_id IS NULL;

-- Make building_id not nullable
ALTER TABLE floors ALTER COLUMN building_id SET NOT NULL;

-- Remove the block_id column from floors
ALTER TABLE floors DROP COLUMN block_id;

-- Drop the blocks table
DROP TABLE IF EXISTS blocks CASCADE;