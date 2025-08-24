-- Seed initial data for Nashik Kumbh 2027 locations
-- Key locations around Ram Kund and other important areas

INSERT INTO public.locations (name, description, latitude, longitude, area_type, capacity) VALUES
-- Main Ghats
('Ram Kund Main Ghat', 'Primary bathing ghat at Ram Kund', 19.9975, 73.7873, 'ghat', 5000),
('Sita Gufaa Ghat', 'Sacred cave ghat near Ram Kund', 19.9980, 73.7870, 'ghat', 2000),
('Naroshankar Ghat', 'Historic ghat for pilgrims', 19.9970, 73.7875, 'ghat', 3000),

-- Temples
('Kalaram Temple', 'Major temple complex', 19.9965, 73.7890, 'temple', 4000),
('Sunder Narayan Temple', 'Important pilgrimage site', 19.9985, 73.7860, 'temple', 1500),
('Ganga Ghat Temple', 'Riverside temple complex', 19.9990, 73.7880, 'temple', 2500),

-- Infrastructure
('Main Parking Area 1', 'Primary vehicle parking near Ram Kund', 19.9960, 73.7850, 'parking', 1000),
('Main Parking Area 2', 'Secondary parking facility', 19.9995, 73.7895, 'parking', 800),
('Medical Camp 1', 'Primary medical facility', 19.9978, 73.7885, 'medical', 200),
('Medical Camp 2', 'Secondary medical post', 19.9968, 73.7865, 'medical', 100),
('Security Control Room', 'Main security coordination center', 19.9972, 73.7878, 'security', 50),
('Emergency Assembly Point', 'Evacuation gathering area', 19.9955, 73.7840, 'security', 10000);

-- Insert sample cameras for key locations
INSERT INTO public.cameras (name, camera_type, status, location_id, latitude, longitude, field_of_view) VALUES
('Ram Kund Main View', 'fixed', 'online', 
    (SELECT id FROM public.locations WHERE name = 'Ram Kund Main Ghat'), 
    19.9975, 73.7873, 120),
('Kalaram Temple Entrance', 'fixed', 'online', 
    (SELECT id FROM public.locations WHERE name = 'Kalaram Temple'), 
    19.9965, 73.7890, 90),
('Main Parking Monitor', 'fixed', 'online', 
    (SELECT id FROM public.locations WHERE name = 'Main Parking Area 1'), 
    19.9960, 73.7850, 180),
('Security Control Camera', 'fixed', 'online', 
    (SELECT id FROM public.locations WHERE name = 'Security Control Room'), 
    19.9972, 73.7878, 360);
