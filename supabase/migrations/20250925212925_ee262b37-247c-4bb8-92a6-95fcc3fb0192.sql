-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE public.device_status AS ENUM ('online', 'offline', 'maintenance', 'error');
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'viewer');
CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.sensor_type AS ENUM ('temperature', 'humidity', 'pm25', 'pm10', 'co2', 'co', 'no2', 'o3', 'voc', 'pressure');

-- Sites table (Abu Dhabi University campuses)
CREATE TABLE public.sites (
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
CREATE TABLE public.buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    floor_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocks table (sections within buildings)
CREATE TABLE public.blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Floors table
CREATE TABLE public.floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    name TEXT,
    area_sqm DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table for admin management
CREATE TABLE public.profiles (
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
CREATE TABLE public.devices (
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
CREATE TABLE public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    sensor_type public.sensor_type NOT NULL,
    value DECIMAL(10, 4) NOT NULL,
    unit TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Air quality thresholds table
CREATE TABLE public.air_quality_thresholds (
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
CREATE TABLE public.alerts (
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
CREATE TABLE public.audit_logs (
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

-- Enable Row Level Security
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.air_quality_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'super_admin') FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for basic access control
-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin_or_super_admin(auth.uid()));

-- Location hierarchy policies (read access for all authenticated users)
CREATE POLICY "Authenticated users can view sites" ON public.sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sites" ON public.sites FOR ALL USING (public.is_admin_or_super_admin(auth.uid()));

CREATE POLICY "Authenticated users can view buildings" ON public.buildings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage buildings" ON public.buildings FOR ALL USING (public.is_admin_or_super_admin(auth.uid()));

CREATE POLICY "Authenticated users can view blocks" ON public.blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage blocks" ON public.blocks FOR ALL USING (public.is_admin_or_super_admin(auth.uid()));

CREATE POLICY "Authenticated users can view floors" ON public.floors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage floors" ON public.floors FOR ALL USING (public.is_admin_or_super_admin(auth.uid()));

-- Device policies
CREATE POLICY "Authenticated users can view devices" ON public.devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage devices" ON public.devices FOR ALL USING (public.is_admin_or_super_admin(auth.uid()));

-- Sensor readings policies (public read for dashboard)
CREATE POLICY "Authenticated users can view sensor readings" ON public.sensor_readings FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert sensor readings" ON public.sensor_readings FOR INSERT WITH CHECK (true);

-- Thresholds policies
CREATE POLICY "Users can view thresholds" ON public.air_quality_thresholds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage thresholds" ON public.air_quality_thresholds FOR ALL USING (public.is_admin_or_super_admin(auth.uid()));

-- Alerts policies
CREATE POLICY "Users can view alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage alerts" ON public.alerts FOR ALL USING (public.is_admin_or_super_admin(auth.uid()));

-- Audit logs policies (admin only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_buildings_site_id ON public.buildings(site_id);
CREATE INDEX idx_blocks_building_id ON public.blocks(building_id);
CREATE INDEX idx_floors_block_id ON public.floors(block_id);
CREATE INDEX idx_devices_floor_id ON public.devices(floor_id);
CREATE INDEX idx_sensor_readings_device_id ON public.sensor_readings(device_id);
CREATE INDEX idx_sensor_readings_timestamp ON public.sensor_readings(timestamp DESC);
CREATE INDEX idx_sensor_readings_device_timestamp ON public.sensor_readings(device_id, timestamp DESC);
CREATE INDEX idx_alerts_device_id ON public.alerts(device_id);
CREATE INDEX idx_alerts_unresolved ON public.alerts(is_resolved) WHERE is_resolved = false;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON public.blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_floors_updated_at BEFORE UPDATE ON public.floors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_thresholds_updated_at BEFORE UPDATE ON public.air_quality_thresholds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
('pressure', 1013.0, 1020.0, 1030.0, 1040.0, 1050.0, 1051.0, 'hPa');

-- Create function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    'viewer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();