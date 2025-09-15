import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RealtimeData, Metric, AqiMetric, AqiLevel } from '../types';

interface RealtimeDataContextType {
  realtimeData: Record<string, RealtimeData>;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const RealtimeDataContext = createContext<RealtimeDataContextType | undefined>(undefined);

// --- Data Simulator ---
const DEVICE_IDS = [
    'sim-device-01', 'sim-device-02', 'sim-device-03',
    'sim-device-04', 'sim-device-05', 'sim-device-06',
    'sim-device-07', 'sim-device-08', 'sim-device-09', 'sim-device-10'
];

const generateReading = (metric: Metric | AqiMetric, baseValue: number, variance: number) => {
    const value = Math.max(0, baseValue + (Math.random() - 0.5) * variance);
    let unit = '';
    let quality: AqiLevel | undefined = undefined;

    switch (metric) {
        case 'pm25':
        case 'pm10':
        case 'pm1':
            unit = 'µg/m³';
            if (metric === 'pm25') {
                if (value <= 12) quality = 'Good';
                else if (value <= 35.4) quality = 'Moderate';
                else if (value <= 55.4) quality = 'Unhealthy for Sensitive Groups';
                else if (value <= 150.4) quality = 'Unhealthy';
                else if (value <= 250.4) quality = 'Very Unhealthy';
                else quality = 'Hazardous';
            }
            break;
        case 'temperature':
            unit = '°C';
            break;
        case 'humidity':
            unit = '%';
            break;
        case 'pressure':
            unit = 'hPa';
            break;
        case 'co2':
            unit = 'ppm';
            break;
        case 'co':
        case 'no2':
        case 'o3':
        case 'so2':
            unit = 'ppb';
            break;
        case 'noise':
            unit = 'dB';
            break;
        case 'radiation':
            unit = 'µSv/h';
            break;
        case 'wind_speed':
            unit = 'm/s';
            break;
        case 'wind_direction':
            unit = '°';
            break;
        case 'voc':
            unit = 'ppb';
            break;
        case 'iaqi':
            unit = '';
            if (value <= 50) quality = 'Good';
            else if (value <= 100) quality = 'Moderate';
            else if (value <= 150) quality = 'Unhealthy for Sensitive Groups';
            else if (value <= 200) quality = 'Unhealthy';
            else if (value <= 300) quality = 'Very Unhealthy';
            else quality = 'Hazardous';
            break;
    }

    return {
        metric,
        value: Math.round(value * 10) / 10,
        unit,
        quality,
        timestamp: new Date().toISOString()
    };
};

const generateRealtimeData = (deviceId: string): RealtimeData => {
    const readings = [
        generateReading('pm25', 15, 20),
        generateReading('pm10', 25, 30),
        generateReading('pm1', 10, 15),
        generateReading('temperature', 22, 10),
        generateReading('humidity', 55, 20),
        generateReading('pressure', 1013, 20),
        generateReading('co2', 400, 200),
        generateReading('co', 0.5, 1),
        generateReading('no2', 20, 40),
        generateReading('o3', 30, 50),
        generateReading('so2', 5, 10),
        generateReading('noise', 45, 20),
        generateReading('radiation', 0.1, 0.05),
        generateReading('wind_speed', 3, 5),
        generateReading('wind_direction', 180, 360),
        generateReading('voc', 50, 100),
        generateReading('iaqi', 75, 50)
    ];

    return {
        deviceId,
        timestamp: new Date().toISOString(),
        readings
    };
};

export const RealtimeDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [realtimeData, setRealtimeData] = useState<Record<string, RealtimeData>>({});
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

    useEffect(() => {
        // Simulate connection
        const connectionTimer = setTimeout(() => {
            setConnectionStatus('connected');
        }, 1000);

        // Generate initial data
        const initialData: Record<string, RealtimeData> = {};
        DEVICE_IDS.forEach(deviceId => {
            initialData[deviceId] = generateRealtimeData(deviceId);
        });
        setRealtimeData(initialData);

        // Set up real-time updates
        const updateInterval = setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance to update data each interval
                const updatedData: Record<string, RealtimeData> = {};
                DEVICE_IDS.forEach(deviceId => {
                    updatedData[deviceId] = generateRealtimeData(deviceId);
                });
                setRealtimeData(updatedData);
            }
        }, 3000); // Update every 3 seconds

        return () => {
            clearTimeout(connectionTimer);
            clearInterval(updateInterval);
        };
    }, []);

    return (
        <RealtimeDataContext.Provider value={{ realtimeData, connectionStatus }}>
            {children}
        </RealtimeDataContext.Provider>
    );
};

export const useRealtimeData = () => {
    const context = useContext(RealtimeDataContext);
    if (context === undefined) {
        throw new Error('useRealtimeData must be used within a RealtimeDataProvider');
    }
    return context;
};