-- Disable the auto-generation of sensor data for production use
-- This was creating fake devices every 6 seconds for demo purposes

-- Unschedule the cron job
SELECT cron.unschedule('generate-sensor-data-6sec');