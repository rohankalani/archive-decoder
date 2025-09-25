import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Device, Location } from '@/types';

// Three specific locations as requested
const LOCATIONS: Location[] = [
  {
    id: 'abu-dhabi-estimada',
    name: 'Abu Dhabi Estimada',
    coordinates: [24.4539, 54.3773],
    address: 'Abu Dhabi, UAE'
  },
  {
    id: 'burjeel',
    name: 'Burjeel Hospital',
    coordinates: [24.4539, 54.3773],
    address: 'Abu Dhabi, UAE'
  },
  {
    id: 'dubai-green-building',
    name: 'Dubai Green Building',
    coordinates: [25.2048, 55.2708],
    address: 'Dubai, UAE'
  }
];

// Mock devices for the three locations
const MOCK_DEVICES: Device[] = [
  {
    id: 'device-001',
    name: 'ULTRADETEKT 03M - Floor 1',
    type: 'air-quality',
    location: LOCATIONS[0],
    isOnline: true,
    lastSeen: new Date().toISOString(),
    batteryLevel: 85,
    signalStrength: -45,
    version: '1.2.3',
    sensors: ['pm03', 'pm1', 'pm25', 'pm5', 'pm10', 'co2', 'hcho', 'voc', 'nox']
  },
  {
    id: 'device-002',
    name: 'ULTRADETEKT 03M - Reception',
    type: 'air-quality',
    location: LOCATIONS[0],
    isOnline: true,
    lastSeen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    batteryLevel: 92,
    signalStrength: -38,
    version: '1.2.3',
    sensors: ['pm03', 'pm1', 'pm25', 'pm5', 'pm10', 'co2', 'hcho', 'voc', 'nox']
  },
  {
    id: 'device-003',
    name: 'ULTRADETEKT 03M - Ward A',
    type: 'air-quality',
    location: LOCATIONS[1],
    isOnline: true,
    lastSeen: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
    batteryLevel: 78,
    signalStrength: -52,
    version: '1.2.3',
    sensors: ['pm03', 'pm1', 'pm25', 'pm5', 'pm10', 'co2', 'hcho', 'voc', 'nox']
  },
  {
    id: 'device-004',
    name: 'ULTRADETEKT 03M - ICU',
    type: 'air-quality',
    location: LOCATIONS[1],
    isOnline: false,
    lastSeen: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    batteryLevel: 15,
    signalStrength: -68,
    version: '1.2.3',
    sensors: ['pm03', 'pm1', 'pm25', 'pm5', 'pm10', 'co2', 'hcho', 'voc', 'nox']
  },
  {
    id: 'device-005',
    name: 'ULTRADETEKT 03M - Lobby',
    type: 'air-quality',
    location: LOCATIONS[2],
    isOnline: true,
    lastSeen: new Date().toISOString(),
    batteryLevel: 95,
    signalStrength: -35,
    version: '1.2.3',
    sensors: ['pm03', 'pm1', 'pm25', 'pm5', 'pm10', 'co2', 'hcho', 'voc', 'nox']
  },
  {
    id: 'device-006',
    name: 'ULTRADETEKT 03M - Office Area',
    type: 'air-quality',
    location: LOCATIONS[2],
    isOnline: true,
    lastSeen: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
    batteryLevel: 67,
    signalStrength: -49,
    version: '1.2.3',
    sensors: ['pm03', 'pm1', 'pm25', 'pm5', 'pm10', 'co2', 'hcho', 'voc', 'nox']
  }
];

interface DeviceContextType {
  devices: Device[];
  locations: Location[];
  getDevicesByLocation: (locationId: string) => Device[];
  getDeviceById: (deviceId: string) => Device | undefined;
  updateDeviceStatus: (deviceId: string, isOnline: boolean) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);

  // Simulate device status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prevDevices => 
        prevDevices.map(device => ({
          ...device,
          lastSeen: device.isOnline ? new Date().toISOString() : device.lastSeen,
          signalStrength: device.isOnline ? 
            Math.floor(Math.random() * 30) - 70 : // -70 to -40 dBm
            device.signalStrength
        }))
      );
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getDevicesByLocation = (locationId: string): Device[] => {
    return devices.filter(device => device.location.id === locationId);
  };

  const getDeviceById = (deviceId: string): Device | undefined => {
    return devices.find(device => device.id === deviceId);
  };

  const updateDeviceStatus = (deviceId: string, isOnline: boolean) => {
    setDevices(prevDevices =>
      prevDevices.map(device =>
        device.id === deviceId
          ? { ...device, isOnline, lastSeen: new Date().toISOString() }
          : device
      )
    );
  };

  return (
    <DeviceContext.Provider value={{
      devices,
      locations: LOCATIONS,
      getDevicesByLocation,
      getDeviceById,
      updateDeviceStatus
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
}