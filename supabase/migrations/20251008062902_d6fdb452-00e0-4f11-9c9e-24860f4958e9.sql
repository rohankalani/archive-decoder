-- Increase precision of sensor_readings.value column to handle large particle count values
-- Current: NUMERIC(10,4) - max ~1 million
-- New: NUMERIC(15,4) - max ~1 trillion (enough for particle counts)
ALTER TABLE public.sensor_readings 
ALTER COLUMN value TYPE NUMERIC(15,4);