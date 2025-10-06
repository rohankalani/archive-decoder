-- Add 'pending' status to device_status enum for unallocated devices
ALTER TYPE device_status ADD VALUE IF NOT EXISTS 'pending';

-- Update devices table to allow NULL floor_id for pending devices
ALTER TABLE devices ALTER COLUMN floor_id DROP NOT NULL;

-- Add comment for clarity
COMMENT ON TYPE device_status IS 'Device status: online (allocated and active), offline (allocated but inactive), error (allocated with errors), pending (not yet allocated to a room)';
