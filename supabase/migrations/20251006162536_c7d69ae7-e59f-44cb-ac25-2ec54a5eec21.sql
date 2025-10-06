-- Clean up all existing devices and related data
-- Delete in order to respect any foreign key constraints

-- Delete all sensor readings
DELETE FROM sensor_readings;

-- Delete all alerts
DELETE FROM alerts;

-- Delete all devices
DELETE FROM devices;

-- Reset sequences if needed and verify cleanup
DO $$ 
BEGIN
  RAISE NOTICE 'Cleanup complete. All devices, sensor readings, and alerts have been deleted.';
END $$;