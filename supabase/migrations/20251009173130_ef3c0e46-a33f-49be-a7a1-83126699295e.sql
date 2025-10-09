-- Create index to speed up device/time queries for sensor_readings
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_ts ON public.sensor_readings (device_id, timestamp DESC);