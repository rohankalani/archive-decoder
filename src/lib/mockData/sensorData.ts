/**
 * Realistic sensor data generation for Abu Dhabi University
 * Includes time-based variations and university-specific patterns
 */

import { mockDataManager } from './index';
import { mockFloors, mockRooms } from './locations';

export interface MockSensorReading {
  id: string;
  device_id: string;
  sensor_type: 'pm25' | 'pm10' | 'co2' | 'temperature' | 'humidity' | 'voc' | 'nox' | 'hcho' | 'pm03' | 'pm1' | 'pm5';
  value: number;
  unit: string;
  timestamp: Date;
  created_at: Date;
}

export interface MockDevice {
  id: string;
  name: string;
  floor_id: string;
  device_type: string;
  status: 'online' | 'offline' | 'maintenance';
  mac_address: string;
  serial_number: string;
  firmware_version: string;
  installation_date: string;
  battery_level: number;
  signal_strength: number;
  calibration_due_date: string;
  created_at: Date;
  updated_at: Date;
}

// Device configurations for different room types
const deviceConfigs = {
  'Lecture Hall': { pm25: [8, 25], co2: [400, 1200], temp: [22, 26], humidity: [40, 65] },
  'Laboratory': { pm25: [12, 40], co2: [450, 1500], temp: [20, 28], humidity: [35, 70] },
  'Classroom': { pm25: [6, 20], co2: [380, 900], temp: [21, 25], humidity: [45, 60] },
  'Computer Lab': { pm25: [10, 30], co2: [420, 1100], temp: [19, 24], humidity: [40, 55] },
  'Workshop': { pm25: [25, 80], co2: [500, 1800], temp: [18, 30], humidity: [30, 75] },
  'Reading Room': { pm25: [5, 15], co2: [350, 700], temp: [22, 24], humidity: [50, 60] },
  'Office': { pm25: [7, 20], co2: [380, 800], temp: [21, 25], humidity: [45, 65] }
};

// Generate mock devices based on rooms
export const generateMockDevices = (): MockDevice[] => {
  const devices: MockDevice[] = [];
  let deviceCounter = 1;

  // Create devices only for classrooms (air quality monitors are only in classrooms)
  const keyRooms = mockRooms.filter(room => 
    room.room_type === 'Classroom'
  );

  keyRooms.forEach(room => {
    const deviceId = `device-${String(deviceCounter).padStart(3, '0')}`;
    const serialNumber = `ADU${String(deviceCounter).padStart(4, '0')}`;
    const macAddress = `00:1B:44:11:3A:${String(deviceCounter).padStart(2, '0')}`;
    
    devices.push({
      id: deviceId,
      name: room.name, // Use actual classroom name like "Classroom 102"
      floor_id: room.floor_id,
      device_type: 'air_quality_sensor',
      status: 'online', // All devices online for mock data
      mac_address: macAddress,
      serial_number: serialNumber,
      firmware_version: '2.1.4',
      installation_date: new Date('2024-01-15').toISOString().split('T')[0],
      battery_level: Math.floor(Math.random() * 40) + 60, // 60-100%
      signal_strength: Math.floor(Math.random() * 30) - 70, // -70 to -40 dBm
      calibration_due_date: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Within 6 months
      created_at: new Date('2024-01-15'),
      updated_at: new Date()
    });
    
    deviceCounter++;
  });

  return devices;
};

// Generate realistic sensor readings
export const generateSensorReading = (
  device: MockDevice, 
  sensorType: MockSensorReading['sensor_type'],
  timestamp: Date = new Date()
): MockSensorReading => {
  const room = mockRooms.find(r => r.id === device.floor_id);
  const roomType = room?.room_type || 'Office';
  const config = deviceConfigs[roomType as keyof typeof deviceConfigs] || deviceConfigs.Office;
  
  const multipliers = mockDataManager.getScenarioMultipliers();
  const scheduleMultiplier = mockDataManager.getUniversityScheduleMultiplier();
  
  let value: number;
  let unit: string;
  
  switch (sensorType) {
    case 'pm25':
      const basePM25 = config.pm25[0] + Math.random() * (config.pm25[1] - config.pm25[0]);
      value = Math.max(0, basePM25 * multipliers.particulateMultiplier * (0.8 + scheduleMultiplier * 0.4));
      unit = 'µg/m³';
      break;
      
    case 'pm10':
      const basePM10 = config.pm25[0] * 1.5 + Math.random() * (config.pm25[1] * 1.5 - config.pm25[0] * 1.5);
      value = Math.max(0, basePM10 * multipliers.particulateMultiplier * (0.8 + scheduleMultiplier * 0.4));
      unit = 'µg/m³';
      break;
      
    case 'co2':
      const baseCO2 = config.co2[0] + Math.random() * (config.co2[1] - config.co2[0]);
      value = Math.max(350, baseCO2 * multipliers.co2Multiplier * (0.5 + scheduleMultiplier * 1.0));
      unit = 'ppm';
      break;
      
    case 'temperature':
      const baseTemp = config.temp[0] + Math.random() * (config.temp[1] - config.temp[0]);
      // Add seasonal variation (simplified)
      const month = timestamp.getMonth();
      const seasonalOffset = Math.sin((month - 6) * Math.PI / 6) * 3; // ±3°C seasonal variation
      value = baseTemp + seasonalOffset + (Math.random() - 0.5) * 2;
      unit = '°C';
      break;
      
    case 'humidity':
      const baseHumidity = config.humidity[0] + Math.random() * (config.humidity[1] - config.humidity[0]);
      // Inverse correlation with temperature (simplified)
      const tempEffect = Math.random() * 10 - 5;
      value = Math.max(20, Math.min(90, baseHumidity + tempEffect));
      unit = '%';
      break;
      
    case 'voc':
      value = Math.random() * 0.5 * multipliers.particulateMultiplier * scheduleMultiplier;
      unit = 'mg/m³';
      break;
      
    case 'nox':
      value = Math.random() * 0.3 * multipliers.particulateMultiplier * scheduleMultiplier;
      unit = 'mg/m³';
      break;
      
    case 'hcho':
      value = Math.random() * 0.2 * multipliers.particulateMultiplier;
      unit = 'mg/m³';
      break;
      
    case 'pm03':
      value = Math.random() * 15 * multipliers.particulateMultiplier * scheduleMultiplier;
      unit = 'µg/m³';
      break;
      
    case 'pm1':
      value = Math.random() * 20 * multipliers.particulateMultiplier * scheduleMultiplier;
      unit = 'µg/m³';
      break;
      
    case 'pm5':
      value = Math.random() * 30 * multipliers.particulateMultiplier * scheduleMultiplier;
      unit = 'µg/m³';
      break;
      
    default:
      value = Math.random() * 100;
      unit = 'units';
  }
  
  return {
    id: `reading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    device_id: device.id,
    sensor_type: sensorType,
    value: Math.round(value * 100) / 100, // Round to 2 decimal places
    unit,
    timestamp,
    created_at: new Date()
  };
};

// Generate historical data for a device
export const generateHistoricalData = (
  device: MockDevice,
  hours: number = 24
): MockSensorReading[] => {
  const readings: MockSensorReading[] = [];
  const now = mockDataManager.getCurrentTime();
  const interval = 10 * 60 * 1000; // 10 minutes
  
  const sensorTypes: MockSensorReading['sensor_type'][] = [
    'pm25', 'pm10', 'co2', 'temperature', 'humidity', 'voc'
  ];
  
  for (let i = hours * 6; i >= 0; i--) { // 6 readings per hour (every 10 min)
    const timestamp = new Date(now.getTime() - i * interval);
    
    sensorTypes.forEach(sensorType => {
      readings.push(generateSensorReading(device, sensorType, timestamp));
    });
  }
  
  return readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

export const mockSensorData = {
  generateMockDevices,
  generateSensorReading,
  generateHistoricalData
};
