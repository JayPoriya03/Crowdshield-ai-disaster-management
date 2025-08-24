-- CrowdShield AI Database Schema for Nashik Kumbh 2027
-- This script creates all necessary tables for crowd and disaster management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'resolved', 'investigating');
CREATE TYPE camera_type AS ENUM ('droidcam', 'frontend', 'fixed');
CREATE TYPE camera_status AS ENUM ('online', 'offline', 'maintenance');

-- Locations table for key areas in Nashik Kumbh
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    area_type VARCHAR(100), -- 'ghat', 'temple', 'parking', 'medical', 'security'
    capacity INTEGER, -- maximum safe capacity for the area
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cameras table for managing all camera feeds
CREATE TABLE IF NOT EXISTS public.cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    camera_type camera_type NOT NULL,
    status camera_status DEFAULT 'offline',
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    stream_url TEXT, -- for DroidCam or external streams
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    field_of_view INTEGER DEFAULT 90, -- degrees
    resolution VARCHAR(20) DEFAULT '1920x1080',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crowd data table for storing real-time crowd counts from YOLO detection
CREATE TABLE IF NOT EXISTS public.crowd_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    person_count INTEGER NOT NULL DEFAULT 0,
    density_level DECIMAL(5, 2), -- people per square meter
    confidence_score DECIMAL(3, 2), -- YOLO detection confidence (0.00-1.00)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- store additional YOLO detection data
);

-- Alerts table for emergency and crowd management alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity alert_severity NOT NULL,
    status alert_status DEFAULT 'active',
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    camera_id UUID REFERENCES public.cameras(id) ON DELETE SET NULL,
    triggered_by VARCHAR(100), -- 'crowd_density', 'manual', 'system'
    crowd_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Heat map data for visualization
CREATE TABLE IF NOT EXISTS public.heat_map_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    intensity DECIMAL(5, 2) NOT NULL, -- crowd density intensity (0.00-100.00)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'camera' -- 'camera', 'manual', 'estimated'
);

-- User profiles for admin and operators
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'operator', -- 'admin', 'operator', 'viewer'
    phone VARCHAR(20),
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heat_map_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for locations (readable by all authenticated users)
CREATE POLICY "locations_select_authenticated" ON public.locations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "locations_insert_admin" ON public.locations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin')
        )
    );

CREATE POLICY "locations_update_admin" ON public.locations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin')
        )
    );

-- RLS Policies for cameras
CREATE POLICY "cameras_select_authenticated" ON public.cameras
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "cameras_insert_admin" ON public.cameras
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin')
        )
    );

CREATE POLICY "cameras_update_operators" ON public.cameras
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'operator')
        )
    );

-- RLS Policies for crowd_data (readable by all, insertable by system/operators)
CREATE POLICY "crowd_data_select_authenticated" ON public.crowd_data
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "crowd_data_insert_operators" ON public.crowd_data
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'operator')
        )
    );

-- RLS Policies for alerts
CREATE POLICY "alerts_select_authenticated" ON public.alerts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "alerts_insert_operators" ON public.alerts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'operator')
        )
    );

CREATE POLICY "alerts_update_operators" ON public.alerts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'operator')
        )
    );

-- RLS Policies for heat_map_data
CREATE POLICY "heat_map_data_select_authenticated" ON public.heat_map_data
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "heat_map_data_insert_operators" ON public.heat_map_data
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'operator')
        )
    );

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX idx_crowd_data_timestamp ON public.crowd_data(timestamp DESC);
CREATE INDEX idx_crowd_data_camera_id ON public.crowd_data(camera_id);
CREATE INDEX idx_crowd_data_location_id ON public.crowd_data(location_id);
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX idx_cameras_status ON public.cameras(status);
CREATE INDEX idx_heat_map_data_timestamp ON public.heat_map_data(timestamp DESC);
CREATE INDEX idx_heat_map_data_location_id ON public.heat_map_data(location_id);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cameras_updated_at BEFORE UPDATE ON public.cameras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
