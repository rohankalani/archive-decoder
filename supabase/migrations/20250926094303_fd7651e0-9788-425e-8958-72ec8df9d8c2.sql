-- Fix the security warning for function search_path by setting it properly
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;