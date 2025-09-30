-- Step 1: Clear all room_id references from devices first
UPDATE devices SET room_id = NULL WHERE room_id IS NOT NULL;

-- Step 2: Clean up any existing classroom rooms from previous migration attempts
DELETE FROM rooms WHERE room_type = 'Classroom';

-- Step 3: Create classrooms for ALL floors across ALL buildings
-- We'll create 4 classrooms per floor with building-specific naming
WITH floor_buildings AS (
  SELECT 
    f.id as floor_id,
    f.floor_number,
    b.name as building_name,
    s.name as site_name
  FROM floors f
  JOIN buildings b ON f.building_id = b.id
  JOIN sites s ON b.site_id = s.id
)
INSERT INTO rooms (id, floor_id, name, description, room_number, room_type, capacity, area_sqm)
SELECT 
  gen_random_uuid(),
  fb.floor_id,
  fb.building_name || ' Classroom ' || ((fb.floor_number * 100) + series.room_seq) as name,
  'Standard classroom for lectures and tutorials' as description,
  ((fb.floor_number * 100) + series.room_seq)::text as room_number,
  'Classroom' as room_type,
  30 + (random() * 20)::int as capacity,
  65 + (random() * 20)::numeric as area_sqm
FROM floor_buildings fb
CROSS JOIN generate_series(1, 4) as series(room_seq);

-- Step 4: Assign ALL devices to classrooms and update their names
-- Distribute devices evenly across available classrooms on their floor
WITH numbered_devices AS (
  SELECT 
    d.id as device_id,
    d.floor_id,
    ROW_NUMBER() OVER (PARTITION BY d.floor_id ORDER BY d.created_at) as device_num
  FROM devices d
),
numbered_rooms AS (
  SELECT 
    r.id as room_id,
    r.floor_id,
    r.name as room_name,
    ROW_NUMBER() OVER (PARTITION BY r.floor_id ORDER BY r.room_number) as room_num
  FROM rooms r
  WHERE r.room_type = 'Classroom'
),
room_counts AS (
  SELECT floor_id, COUNT(*) as total_rooms
  FROM numbered_rooms
  GROUP BY floor_id
)
UPDATE devices
SET 
  room_id = nr.room_id,
  name = nr.room_name
FROM numbered_devices nd
JOIN numbered_rooms nr ON nd.floor_id = nr.floor_id 
  AND ((nd.device_num - 1) % (SELECT total_rooms FROM room_counts WHERE floor_id = nd.floor_id) + 1) = nr.room_num
WHERE devices.id = nd.device_id;