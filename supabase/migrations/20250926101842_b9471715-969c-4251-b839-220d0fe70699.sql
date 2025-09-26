-- Add new sensor types to support all Arduino ESP sensor data
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pm01';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pm03';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pm05';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pm1';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pm5';

-- Particle count sensors
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pc01';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pc03';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pc05';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pc1';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pc25';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pc5';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'pc10';

-- Gas sensors
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'hcho';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'nox';

-- AQI data (only overall and dominant pollutant as requested)
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'aqi_overall';
ALTER TYPE sensor_type ADD VALUE IF NOT EXISTS 'dominant_pollutant';