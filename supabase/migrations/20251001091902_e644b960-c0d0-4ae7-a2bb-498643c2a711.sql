-- Add MAC address column to devices table for ESP32 identification
ALTER TABLE devices ADD COLUMN IF NOT EXISTS mac_address TEXT UNIQUE;

-- Create index on mac_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_devices_mac_address ON devices(mac_address);

-- Add comment for documentation
COMMENT ON COLUMN devices.mac_address IS 'Unique MAC address of the ESP32 device for identification and mapping';