-- Update all existing devices to online status
UPDATE devices SET status = 'online' WHERE status != 'online';

-- Insert devices for all classrooms that don't have devices yet
INSERT INTO devices (name, device_type, status, floor_id, room_id, mac_address, serial_number, firmware_version, battery_level, signal_strength)
SELECT 
  b.name || ' ' || r.name AS device_name,
  'air_quality_sensor' AS device_type,
  'online' AS status,
  r.floor_id,
  r.id AS room_id,
  'MAC-' || substr(md5(random()::text), 1, 12) AS mac_address,
  'SN-' || substr(md5(random()::text), 1, 10) AS serial_number,
  'v2.1.0' AS firmware_version,
  CAST(85 + (random() * 15) AS INTEGER) AS battery_level,
  CAST(-50 - (random() * 30) AS INTEGER) AS signal_strength
FROM rooms r
JOIN floors f ON r.floor_id = f.id
JOIN buildings b ON f.building_id = b.id
WHERE r.room_type = 'Classroom'
AND NOT EXISTS (
  SELECT 1 FROM devices d 
  WHERE d.room_id = r.id
);