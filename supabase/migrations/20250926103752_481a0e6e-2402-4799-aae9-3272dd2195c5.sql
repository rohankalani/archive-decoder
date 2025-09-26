-- First, drop the function that depends on the old enum
DROP FUNCTION IF EXISTS public.get_latest_sensor_readings_optimized();

-- Remove sensor types data that don't exist in hardware or are not needed
DELETE FROM sensor_readings WHERE sensor_type IN ('co', 'o3', 'pressure', 'pm01', 'pc01', 'pc10');
DELETE FROM air_quality_thresholds WHERE sensor_type IN ('co', 'o3', 'pressure', 'pm01', 'pc01', 'pc10');
DELETE FROM alerts WHERE sensor_type IN ('co', 'o3', 'pressure', 'pm01', 'pc01', 'pc10');

-- Update the sensor_type enum to remove unwanted types
ALTER TYPE sensor_type RENAME TO sensor_type_old;

CREATE TYPE sensor_type AS ENUM (
  'temperature',
  'humidity', 
  'pm25',
  'pm10',
  'co2',
  'no2',
  'voc',
  'pm03',
  'pm05', 
  'pm1',
  'pm5',
  'pc03',
  'pc05',
  'pc1', 
  'pc25',
  'pc5',
  'hcho',
  'nox',
  'aqi_overall',
  'dominant_pollutant'
);

-- Update existing tables to use new enum
ALTER TABLE sensor_readings ALTER COLUMN sensor_type TYPE sensor_type USING sensor_type::text::sensor_type;
ALTER TABLE air_quality_thresholds ALTER COLUMN sensor_type TYPE sensor_type USING sensor_type::text::sensor_type;
ALTER TABLE alerts ALTER COLUMN sensor_type TYPE sensor_type USING sensor_type::text::sensor_type;

-- Drop the old enum
DROP TYPE sensor_type_old;

-- Recreate the optimized function with new enum
CREATE OR REPLACE FUNCTION public.get_latest_sensor_readings_optimized()
 RETURNS TABLE(device_id uuid, device_name text, device_status device_status, sensor_type sensor_type, value numeric, unit text, reading_timestamp timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;