-- Step 1: Add room_id column to devices table
ALTER TABLE devices ADD COLUMN room_id uuid REFERENCES rooms(id);

-- Step 2: Create classroom rooms for existing floors
-- Academic Building 1 - Ground Floor classrooms
INSERT INTO rooms (id, floor_id, name, description, room_number, room_type, capacity, area_sqm)
SELECT 
  gen_random_uuid(),
  id as floor_id,
  'Classroom ' || (100 + row_number) as name,
  'Standard classroom for lectures and tutorials' as description,
  (100 + row_number)::text as room_number,
  'Classroom' as room_type,
  30 + (random() * 20)::int as capacity,
  65 + (random() * 20)::numeric as area_sqm
FROM (
  SELECT id, generate_series(1, 5) as row_number
  FROM floors
  WHERE floor_number = 0
  LIMIT 1
) subquery;

-- Academic Building 1 - First Floor classrooms
INSERT INTO rooms (id, floor_id, name, description, room_number, room_type, capacity, area_sqm)
SELECT 
  gen_random_uuid(),
  id as floor_id,
  'Classroom ' || (200 + row_number) as name,
  'Standard classroom for lectures and tutorials' as description,
  (200 + row_number)::text as room_number,
  'Classroom' as room_type,
  30 + (random() * 20)::int as capacity,
  65 + (random() * 20)::numeric as area_sqm
FROM (
  SELECT id, generate_series(1, 5) as row_number
  FROM floors
  WHERE floor_number = 1
  LIMIT 1
) subquery;

-- Academic Building 1 - Second Floor classrooms
INSERT INTO rooms (id, floor_id, name, description, room_number, room_type, capacity, area_sqm)
SELECT 
  gen_random_uuid(),
  id as floor_id,
  'Classroom ' || (300 + row_number) as name,
  'Standard classroom for lectures and tutorials' as description,
  (300 + row_number)::text as room_number,
  'Classroom' as room_type,
  30 + (random() * 20)::int as capacity,
  65 + (random() * 20)::numeric as area_sqm
FROM (
  SELECT id, generate_series(1, 5) as row_number
  FROM floors
  WHERE floor_number = 2
  LIMIT 1
) subquery;

-- Step 3: Assign existing devices to classrooms and update their names
-- This will distribute devices across available classrooms
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
)
UPDATE devices
SET 
  room_id = nr.room_id,
  name = nr.room_name
FROM numbered_devices nd
JOIN numbered_rooms nr ON nd.floor_id = nr.floor_id 
  AND ((nd.device_num - 1) % 5 + 1) = nr.room_num
WHERE devices.id = nd.device_id;

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_devices_room_id ON devices(room_id);

-- Step 5: Add comment to document the change
COMMENT ON COLUMN devices.room_id IS 'Links device to a specific room within the floor';
