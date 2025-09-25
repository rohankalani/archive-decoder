-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE public.device_status AS ENUM ('online', 'offline', 'maintenance', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.sensor_type AS ENUM ('temperature', 'humidity', 'pm25', 'pm10', 'co2', 'co', 'no2', 'o3', 'voc', 'pressure');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sites table (Abu Dhabi University campuses)
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buildings table
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    floor_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocks table (sections within buildings)
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Floors table
CREATE TABLE IF NOT EXISTS public.floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    name TEXT,
    area_sqm DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table for admin management
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role public.user_role DEFAULT 'viewer',
    department TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices table (air quality sensors)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    device_type TEXT DEFAULT 'air_quality_sensor',
    mac_address TEXT UNIQUE,
    serial_number TEXT UNIQUE,
    firmware_version TEXT,
    status public.device_status DEFAULT 'offline',
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    signal_strength INTEGER CHECK (signal_strength >= -100 AND signal_strength <= 0),
    installation_date DATE,
    last_maintenance DATE,
    calibration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sensor readings table (time-series data for charts)
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    sensor_type public.sensor_type NOT NULL,
    value DECIMAL(10, 4) NOT NULL,
    unit TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Air quality thresholds table
CREATE TABLE IF NOT EXISTS public.air_quality_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_type public.sensor_type NOT NULL,
    good_max DECIMAL(10, 4),
    moderate_max DECIMAL(10, 4),
    unhealthy_sensitive_max DECIMAL(10, 4),
    unhealthy_max DECIMAL(10, 4),
    very_unhealthy_max DECIMAL(10, 4),
    hazardous_min DECIMAL(10, 4),
    unit TEXT NOT NULL,
    region TEXT DEFAULT 'UAE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sensor_type, region)
);

-- Alerts table for threshold violations
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    sensor_type public.sensor_type NOT NULL,
    severity public.alert_severity NOT NULL,
    message TEXT NOT NULL,
    value DECIMAL(10, 4) NOT NULL,
    threshold_value DECIMAL(10, 4) NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_buildings_site_id ON public.buildings(site_id);
CREATE INDEX IF NOT EXISTS idx_blocks_building_id ON public.blocks(building_id);
CREATE INDEX IF NOT EXISTS idx_floors_block_id ON public.floors(block_id);
CREATE INDEX IF NOT EXISTS idx_devices_floor_id ON public.devices(floor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_id ON public.sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON public.sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_timestamp ON public.sensor_readings(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON public.alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON public.alerts(is_resolved) WHERE is_resolved = false;

-- Insert sample data for Abu Dhabi University
INSERT INTO public.sites (name, description, address, latitude, longitude) VALUES
('Abu Dhabi University Main Campus', 'Main campus of Abu Dhabi University', 'Al Ain Road, Abu Dhabi, UAE', 25.2048, 55.2708)
ON CONFLICT DO NOTHING;

-- Insert default UAE air quality thresholds
INSERT INTO public.air_quality_thresholds (sensor_type, good_max, moderate_max, unhealthy_sensitive_max, unhealthy_max, very_unhealthy_max, hazardous_min, unit) VALUES
('pm25', 12.0, 35.4, 55.4, 150.4, 250.4, 250.5, 'μg/m³'),
('pm10', 54.0, 154.0, 254.0, 354.0, 424.0, 425.0, 'μg/m³'),
('co2', 400.0, 1000.0, 2000.0, 5000.0, 40000.0, 40001.0, 'ppm'),
('co', 0.0, 4.4, 9.4, 12.4, 15.4, 15.5, 'ppm'),
('no2', 0.0, 53.0, 100.0, 360.0, 649.0, 650.0, 'ppb'),
('o3', 0.0, 54.0, 70.0, 85.0, 105.0, 106.0, 'ppb'),
('temperature', 16.0, 26.0, 32.0, 40.0, 45.0, 46.0, '°C'),
('humidity', 30.0, 60.0, 70.0, 80.0, 90.0, 91.0, '%'),
('voc', 0.0, 220.0, 660.0, 2200.0, 5500.0, 5501.0, 'ppb'),
('pressure', 1013.0, 1020.0, 1030.0, 1040.0, 1050.0, 1051.0, 'hPa')
ON CONFLICT (sensor_type, region) DO NOTHING;