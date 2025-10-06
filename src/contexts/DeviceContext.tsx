/**
 * DEPRECATED: This DeviceContext is no longer used
 * Use direct Supabase queries instead
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { Device, Location } from '@/types';

// Legacy mock data - replaced by Abu Dhabi University structure
const LOCATIONS: Location[] = [
  {
    id: 'abu-dhabi-university',
    name: 'Abu Dhabi University Main Campus',
    coordinates: [24.4539, 54.3773],
    address: 'Al Ain - Abu Dhabi Road, Abu Dhabi, UAE'
  }
];

// Legacy - no longer providing devices
const MOCK_DEVICES: Device[] = [];

interface DeviceContextType {
  devices: Device[];
  locations: Location[];
  getDevicesByLocation: (locationId: string) => Device[];
  getDeviceById: (deviceId: string) => Device | undefined;
  updateDeviceStatus: (deviceId: string, isOnline: boolean) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const getDevicesByLocation = (locationId: string): Device[] => {
    return [];
  };

  const getDeviceById = (deviceId: string): Device | undefined => {
    return undefined;
  };

  const updateDeviceStatus = (deviceId: string, isOnline: boolean) => {
    console.log(`Legacy updateDeviceStatus called for ${deviceId}: ${isOnline}`);
  };

  return (
    <DeviceContext.Provider value={{
      devices: [],
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