-- Create additional buildings and floors for Abu Dhabi University
INSERT INTO public.buildings (name, site_id, description, floor_count) VALUES
('Engineering Building', '0165a940-2cc2-4260-bcc8-2c70e101f19b', 'Main engineering and computer science building', 5),
('Science Building', '0165a940-2cc2-4260-bcc8-2c70e101f19b', 'Laboratory and research building', 4),
('Library Building', '0165a940-2cc2-4260-bcc8-2c70e101f19b', 'Central library and study areas', 3);

-- Create floors for Engineering Building
INSERT INTO public.floors (building_id, floor_number, name, area_sqm) VALUES
((SELECT id FROM public.buildings WHERE name = 'Engineering Building'), 1, 'Ground Floor - Lobby', 1200),
((SELECT id FROM public.buildings WHERE name = 'Engineering Building'), 2, 'Computer Labs', 1000),
((SELECT id FROM public.buildings WHERE name = 'Engineering Building'), 3, 'Lecture Halls', 1100),
((SELECT id FROM public.buildings WHERE name = 'Engineering Building'), 4, 'Faculty Offices', 800),
((SELECT id FROM public.buildings WHERE name = 'Engineering Building'), 5, 'Research Labs', 900);

-- Create floors for Science Building
INSERT INTO public.floors (building_id, floor_number, name, area_sqm) VALUES
((SELECT id FROM public.buildings WHERE name = 'Science Building'), 1, 'Chemistry Labs', 1000),
((SELECT id FROM public.buildings WHERE name = 'Science Building'), 2, 'Physics Labs', 950),
((SELECT id FROM public.buildings WHERE name = 'Science Building'), 3, 'Biology Labs', 1050),
((SELECT id FROM public.buildings WHERE name = 'Science Building'), 4, 'Research Center', 800);

-- Create floors for Library Building
INSERT INTO public.floors (building_id, floor_number, name, area_sqm) VALUES
((SELECT id FROM public.buildings WHERE name = 'Library Building'), 1, 'Main Reading Area', 1500),
((SELECT id FROM public.buildings WHERE name = 'Library Building'), 2, 'Study Rooms', 1200),
((SELECT id FROM public.buildings WHERE name = 'Library Building'), 3, 'Archives & Research', 1000);

-- Create mock ULTRADETEKT 03M devices across different floors
INSERT INTO public.devices (name, device_type, mac_address, serial_number, firmware_version, status, battery_level, signal_strength, floor_id, installation_date, calibration_due_date) VALUES
-- Engineering Building devices
('ULTRA-ENG-001', 'ULTRADETEKT 03M', '00:1B:44:11:3A:B7', 'ULT230001', 'v2.1.4', 'online', 87, -45, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Engineering Building') AND floor_number = 1), '2024-01-15', '2024-07-15'),
('ULTRA-ENG-002', 'ULTRADETEKT 03M', '00:1B:44:11:3A:B8', 'ULT230002', 'v2.1.4', 'online', 92, -38, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Engineering Building') AND floor_number = 2), '2024-01-15', '2024-07-15'),
('ULTRA-ENG-003', 'ULTRADETEKT 03M', '00:1B:44:11:3A:B9', 'ULT230003', 'v2.1.4', 'online', 78, -52, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Engineering Building') AND floor_number = 3), '2024-01-16', '2024-07-16'),
('ULTRA-ENG-004', 'ULTRADETEKT 03M', '00:1B:44:11:3A:BA', 'ULT230004', 'v2.1.4', 'offline', 65, -68, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Engineering Building') AND floor_number = 4), '2024-01-16', '2024-07-16'),
('ULTRA-ENG-005', 'ULTRADETEKT 03M', '00:1B:44:11:3A:BB', 'ULT230005', 'v2.1.3', 'online', 89, -41, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Engineering Building') AND floor_number = 5), '2024-01-17', '2024-07-17'),

-- Science Building devices
('ULTRA-SCI-001', 'ULTRADETEKT 03M', '00:1B:44:11:3A:BC', 'ULT230006', 'v2.1.4', 'online', 94, -35, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Science Building') AND floor_number = 1), '2024-01-18', '2024-07-18'),
('ULTRA-SCI-002', 'ULTRADETEKT 03M', '00:1B:44:11:3A:BD', 'ULT230007', 'v2.1.4', 'error', 23, -78, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Science Building') AND floor_number = 2), '2024-01-18', '2024-07-18'),
('ULTRA-SCI-003', 'ULTRADETEKT 03M', '00:1B:44:11:3A:BE', 'ULT230008', 'v2.1.4', 'online', 81, -48, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Science Building') AND floor_number = 3), '2024-01-19', '2024-07-19'),
('ULTRA-SCI-004', 'ULTRADETEKT 03M', '00:1B:44:11:3A:BF', 'ULT230009', 'v2.1.4', 'online', 76, -55, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Science Building') AND floor_number = 4), '2024-01-19', '2024-07-19'),

-- Library Building devices
('ULTRA-LIB-001', 'ULTRADETEKT 03M', '00:1B:44:11:3A:C0', 'ULT230010', 'v2.1.4', 'online', 85, -42, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Library Building') AND floor_number = 1), '2024-01-20', '2024-07-20'),
('ULTRA-LIB-002', 'ULTRADETEKT 03M', '00:1B:44:11:3A:C1', 'ULT230011', 'v2.1.4', 'online', 90, -39, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Library Building') AND floor_number = 2), '2024-01-20', '2024-07-20'),
('ULTRA-LIB-003', 'ULTRADETEKT 03M', '00:1B:44:11:3A:C2', 'ULT230012', 'v2.1.3', 'offline', 58, -72, (SELECT id FROM public.floors WHERE building_id = (SELECT id FROM public.buildings WHERE name = 'Library Building') AND floor_number = 3), '2024-01-21', '2024-07-21');

-- Enable real-time functionality for sensor readings
ALTER TABLE public.sensor_readings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;

-- Enable real-time functionality for devices  
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;