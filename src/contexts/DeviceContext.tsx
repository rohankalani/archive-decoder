import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Device } from '../types';

interface DeviceContextType {
    devices: Device[];
    updateDevice: (deviceId: string, updates: Partial<Device>) => void;
    addDevice: (device: Device) => void;
    removeDevice: (deviceId: string) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Mock device data
const mockDevices: Device[] = [
    {
        id: 'sim-device-01',
        name: 'Main Campus Sensor',
        type: 'air-quality',
        location: {
            id: 'loc-1',
            name: 'Main Campus Building A',
            coordinates: [40.7128, -74.0060],
            address: '123 Main St, New York, NY'
        },
        isOnline: true,
        lastSeen: new Date().toISOString(),
        batteryLevel: 87,
        signalStrength: -65,
        version: '2.1.3',
        sensors: ['pm25', 'pm10', 'pm1', 'temperature', 'humidity', 'pressure']
    },
    {
        id: 'sim-device-02',
        name: 'Parking Lot Monitor',
        type: 'air-quality',
        location: {
            id: 'loc-2',
            name: 'Parking Lot North',
            coordinates: [40.7589, -73.9851],
            address: '456 Park Ave, New York, NY'
        },
        isOnline: true,
        lastSeen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        batteryLevel: 92,
        signalStrength: -58,
        version: '2.1.3',
        sensors: ['pm25', 'pm10', 'temperature', 'humidity', 'co2']
    },
    {
        id: 'sim-device-03',
        name: 'Garden Area Sensor',
        type: 'air-quality',
        location: {
            id: 'loc-3',
            name: 'Garden Area West',
            coordinates: [40.7505, -73.9934],
            address: '789 Garden Rd, New York, NY'
        },
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        batteryLevel: 23,
        signalStrength: -89,
        version: '2.0.8',
        sensors: ['pm25', 'pm10', 'temperature', 'humidity', 'no2', 'o3']
    },
    {
        id: 'sim-device-04',
        name: 'Rooftop Weather Station',
        type: 'weather',
        location: {
            id: 'loc-4',
            name: 'Building B Rooftop',
            coordinates: [40.7614, -73.9776],
            address: '321 Sky Dr, New York, NY'
        },
        isOnline: true,
        lastSeen: new Date().toISOString(),
        batteryLevel: 78,
        signalStrength: -52,
        version: '1.8.4',
        sensors: ['temperature', 'humidity', 'pressure', 'wind_speed', 'wind_direction']
    },
    {
        id: 'sim-device-05',
        name: 'Street Level Monitor',
        type: 'air-quality',
        location: {
            id: 'loc-5',
            name: 'Street Level East',
            coordinates: [40.7282, -73.7949],
            address: '654 Street Blvd, New York, NY'
        },
        isOnline: true,
        lastSeen: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
        batteryLevel: 95,
        signalStrength: -61,
        version: '2.1.3',
        sensors: ['pm25', 'pm10', 'co', 'no2', 'noise']
    },
    {
        id: 'sim-device-06',
        name: 'Industrial Zone Sensor',
        type: 'air-quality',
        location: {
            id: 'loc-6',
            name: 'Industrial Zone South',
            coordinates: [40.6892, -74.0445],
            address: '987 Industrial Way, New York, NY'
        },
        isOnline: true,
        lastSeen: new Date().toISOString(),
        batteryLevel: 84,
        signalStrength: -67,
        version: '2.1.3',
        sensors: ['pm25', 'pm10', 'co', 'so2', 'voc', 'radiation']
    },
    {
        id: 'sim-device-07',
        name: 'Residential Area Monitor',
        type: 'air-quality',
        location: {
            id: 'loc-7',
            name: 'Residential Block 12',
            coordinates: [40.7831, -73.9712],
            address: '159 Home St, New York, NY'
        },
        isOnline: false,
        lastSeen: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        batteryLevel: 12,
        signalStrength: -95,
        version: '2.0.8',
        sensors: ['pm25', 'pm10', 'temperature', 'humidity', 'co2']
    },
    {
        id: 'sim-device-08',
        name: 'Harbor Monitor',
        type: 'air-quality',
        location: {
            id: 'loc-8',
            name: 'Harbor Front',
            coordinates: [40.7074, -74.0113],
            address: '753 Harbor Dr, New York, NY'
        },
        isOnline: true,
        lastSeen: new Date().toISOString(),
        batteryLevel: 89,
        signalStrength: -55,
        version: '2.1.3',
        sensors: ['pm25', 'pm10', 'humidity', 'pressure', 'wind_speed', 'wind_direction']
    },
    {
        id: 'sim-device-09',
        name: 'University Campus Sensor',
        type: 'air-quality',
        location: {
            id: 'loc-9',
            name: 'University Campus Central',
            coordinates: [40.8176, -73.9482],
            address: '852 Campus Ave, New York, NY'
        },
        isOnline: true,
        lastSeen: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
        batteryLevel: 91,
        signalStrength: -59,
        version: '2.1.3',
        sensors: ['pm25', 'pm10', 'pm1', 'co2', 'voc', 'noise']
    },
    {
        id: 'sim-device-10',
        name: 'Airport Perimeter Monitor',
        type: 'air-quality',
        location: {
            id: 'loc-10',
            name: 'Airport Perimeter Zone',
            coordinates: [40.6413, -73.7781],
            address: '741 Airport Rd, New York, NY'
        },
        isOnline: true,
        lastSeen: new Date().toISOString(),
        batteryLevel: 76,
        signalStrength: -63,
        version: '2.1.3',
        sensors: ['pm25', 'pm10', 'co', 'no2', 'o3', 'noise']
    }
];

export const DeviceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [devices, setDevices] = useState<Device[]>(mockDevices);

    const updateDevice = (deviceId: string, updates: Partial<Device>) => {
        setDevices(prev => 
            prev.map(device => 
                device.id === deviceId ? { ...device, ...updates } : device
            )
        );
    };

    const addDevice = (device: Device) => {
        setDevices(prev => [...prev, device]);
    };

    const removeDevice = (deviceId: string) => {
        setDevices(prev => prev.filter(device => device.id !== deviceId));
    };

    return (
        <DeviceContext.Provider value={{
            devices,
            updateDevice,
            addDevice,
            removeDevice
        }}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDevices = () => {
    const context = useContext(DeviceContext);
    if (context === undefined) {
        throw new Error('useDevices must be used within a DeviceProvider');
    }
    return context;
};