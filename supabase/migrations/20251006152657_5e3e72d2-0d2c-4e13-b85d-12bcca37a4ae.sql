-- Phase 3: Database Schema Updates for Device Management

-- Add unique constraint on MAC address to prevent duplicates
ALTER TABLE devices 
ADD CONSTRAINT devices_mac_address_unique 
UNIQUE (mac_address);

-- Add unique constraint on serial number to prevent duplicates
ALTER TABLE devices 
ADD CONSTRAINT devices_serial_number_unique 
UNIQUE (serial_number);

-- Add index on mac_address for faster lookups during auto-registration
CREATE INDEX IF NOT EXISTS idx_devices_mac_address 
ON devices(mac_address);

-- Add index on serial_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_devices_serial_number 
ON devices(serial_number);

-- Add index on status for efficient filtering of pending devices
CREATE INDEX IF NOT EXISTS idx_devices_status 
ON devices(status);

-- Add comment explaining the device status workflow
COMMENT ON COLUMN devices.status IS 'Device status: pending (auto-registered, awaiting room assignment), offline (manually registered without room), online (assigned to room and sending data), error (malfunction detected)';

COMMENT ON COLUMN devices.mac_address IS 'Unique MAC address from device sticker/about screen. Used for auto-matching ESP32 connections.';

COMMENT ON COLUMN devices.serial_number IS 'Unique serial number from device sticker/about screen. Required for device identification.';