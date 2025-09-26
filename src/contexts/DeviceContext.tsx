/**
 * DEPRECATED: This DeviceContext is being replaced by UnifiedMockDataContext
 * This file is kept for backward compatibility but should not be used in new code
 * Use useUnifiedMockData() instead
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Device, Location } from '@/types';
import { useUnifiedMockData } from './UnifiedMockDataContext';

// Legacy mock data - replaced by Abu Dhabi University structure
const LOCATIONS: Location[] = [
  {
    id: 'abu-dhabi-university',
    name: 'Abu Dhabi University Main Campus',
    coordinates: [24.4539, 54.3773],
    address: 'Al Ain - Abu Dhabi Road, Abu Dhabi, UAE'
  }
];

// Legacy mock devices - replaced by realistic university devices
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
  const mockData = useUnifiedMockData();
  
  // Transform mock devices to legacy Device format for backward compatibility
  const transformedDevices: Device[] = mockData.devices.map(device => ({
    id: device.id,
    name: device.name,
    type: 'air-quality' as const,
    location: LOCATIONS[0], // All devices belong to Abu Dhabi University
    isOnline: device.status === 'online',
    lastSeen: new Date().toISOString(),
    batteryLevel: device.battery_level,
    signalStrength: device.signal_strength,
    version: device.firmware_version,
    sensors: ['pm03', 'pm1', 'pm25', 'pm5', 'pm10', 'co2', 'hcho', 'voc', 'nox']
  }));

  const getDevicesByLocation = (locationId: string): Device[] => {
    return transformedDevices.filter(device => device.location.id === locationId);
  };

  const getDeviceById = (deviceId: string): Device | undefined => {
    return transformedDevices.find(device => device.id === deviceId);
  };

  const updateDeviceStatus = (deviceId: string, isOnline: boolean) => {
    // This would need to be implemented to update the unified mock data
    console.log(`Legacy updateDeviceStatus called for ${deviceId}: ${isOnline}`);
  };

  return (
    <DeviceContext.Provider value={{
      devices: transformedDevices,
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