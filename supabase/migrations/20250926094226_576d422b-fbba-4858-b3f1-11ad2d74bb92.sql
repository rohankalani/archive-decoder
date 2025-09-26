-- Create an optimized function to get latest sensor readings for all devices
-- This eliminates the N+1 query pattern by using window functions

CREATE OR REPLACE FUNCTION get_latest_sensor_readings_optimized()
RETURNS TABLE (
  device_id UUID,
  device_name TEXT,
  device_status device_status,
  sensor_type sensor_type,
  value NUMERIC,
  unit TEXT,
  reading_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_readings AS (
    SELECT 
      sr.device_id,
      sr.sensor_type,
      sr.value,
      sr.unit,
      sr.timestamp,
      ROW_NUMBER() OVER (PARTITION BY sr.device_id, sr.sensor_type ORDER BY sr.timestamp DESC) as rn
    FROM sensor_readings sr
    INNER JOIN devices d ON sr.device_id = d.id
  )
  SELECT 
    lr.device_id,
    d.name as device_name,
    d.status as device_status,
    lr.sensor_type,
    lr.value,
    lr.unit,
    lr.timestamp as reading_timestamp
  FROM latest_readings lr
  INNER JOIN devices d ON lr.device_id = d.id
  WHERE lr.rn = 1
  ORDER BY lr.device_id, lr.sensor_type;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_sensor_readings_optimized() TO authenticated;

-- Create an index to optimize the sensor readings query if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_sensor_time 
ON sensor_readings (device_id, sensor_type, timestamp DESC);

-- Create an index for better device lookups
CREATE INDEX IF NOT EXISTS idx_devices_status 
ON devices (status) WHERE status IN ('online', 'offline', 'error');