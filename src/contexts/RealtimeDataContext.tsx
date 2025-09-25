import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RealtimeData, SensorReading, Metric } from '@/types';
import { useDevices } from './DeviceContext';
import { useSettings } from './SettingsContext';

interface RealtimeDataContextType {
  realtimeData: RealtimeData[];
  getDeviceData: (deviceId: string) => RealtimeData | undefined;
  isLoading: boolean;
}

const RealtimeDataContext = createContext<RealtimeDataContextType | undefined>(undefined);

export function RealtimeDataProvider({ children }: { children: ReactNode }) {
  const [realtimeData, setRealtimeData] = useState<RealtimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { devices } = useDevices();
  const { getQualityFromAqi, getMetricQuality } = useSettings();

  // Generate realistic sensor readings for ULTRADETEKT 03M
  const generateSensorReading = (metric: Metric, timestamp: string): SensorReading => {
    let value: number;
    let unit: string;

    switch (metric) {
      case 'pm03':
        value = Math.random() * 50000 + 10000; // particles/ft³
        unit = '#/ft³';
        break;
      case 'pm1':
        value = Math.random() * 30000 + 5000; // particles/ft³
        unit = '#/ft³';
        break;
      case 'pm25':
        value = Math.random() * 150 + 5; // µg/m³
        unit = 'µg/m³';
        break;
      case 'pm5':
        value = Math.random() * 100 + 5; // µg/m³
        unit = 'µg/m³';
        break;
      case 'pm10':
        value = Math.random() * 200 + 10; // µg/m³
        unit = 'µg/m³';
        break;
      case 'co2':
        value = Math.random() * 2000 + 400; // ppm
        unit = 'ppm';
        break;
      case 'hcho':
        value = Math.random() * 200 + 10; // ppb
        unit = 'ppb';
        break;
      case 'voc':
        value = Math.random() * 500 + 50; // index 0-500
        unit = 'index';
        break;
      case 'nox':
        value = Math.random() * 300 + 20; // index 0-500
        unit = 'index';
        break;
      case 'temperature':
        value = Math.random() * 15 + 20; // 20-35°C
        unit = '°C';
        break;
      case 'humidity':
        value = Math.random() * 40 + 30; // 30-70%
        unit = '%';
        break;
      default:
        value = 0;
        unit = '';
    }

    const quality = getMetricQuality(metric, value);

    return {
      metric,
      value: Math.round(value * 100) / 100,
      unit,
      quality: quality as any,
      timestamp
    };
  };

  // Generate realtime data for all online devices
  const generateRealtimeData = (): RealtimeData[] => {
    const timestamp = new Date().toISOString();
    
    return devices
      .filter(device => device.isOnline)
      .map(device => {
        const readings: SensorReading[] = [
          generateSensorReading('pm03', timestamp),
          generateSensorReading('pm1', timestamp),
          generateSensorReading('pm25', timestamp),
          generateSensorReading('pm5', timestamp),
          generateSensorReading('pm10', timestamp),
          generateSensorReading('co2', timestamp),
          generateSensorReading('hcho', timestamp),
          generateSensorReading('voc', timestamp),
          generateSensorReading('nox', timestamp),
          generateSensorReading('temperature', timestamp),
          generateSensorReading('humidity', timestamp)
        ];

        // Calculate AQI based on key pollutants (simplified)
        const pm25Reading = readings.find(r => r.metric === 'pm25');
        const co2Reading = readings.find(r => r.metric === 'co2');
        const vocReading = readings.find(r => r.metric === 'voc');
        
        let aqi = 50; // Default good AQI
        if (pm25Reading && pm25Reading.value > 35) aqi = Math.min(150, 50 + pm25Reading.value);
        if (co2Reading && co2Reading.value > 1000) aqi = Math.max(aqi, Math.min(200, 100 + (co2Reading.value - 1000) / 50));
        if (vocReading && vocReading.value > 200) aqi = Math.max(aqi, Math.min(300, 150 + (vocReading.value - 200) / 10));

        const level = getQualityFromAqi(aqi);

        return {
          deviceId: device.id,
          timestamp,
          readings,
          aqi: Math.round(aqi),
          overallQuality: level
        };
      });
  };

  // Initialize and update realtime data
  useEffect(() => {
    setIsLoading(true);
    
    // Initial data generation
    const initialData = generateRealtimeData();
    setRealtimeData(initialData);
    setIsLoading(false);

    // Update data every 30 seconds (typical MQTT interval)
    const interval = setInterval(() => {
      const newData = generateRealtimeData();
      setRealtimeData(newData);
    }, 30000);

    return () => clearInterval(interval);
  }, [devices, getQualityFromAqi, getMetricQuality]);

  const getDeviceData = (deviceId: string): RealtimeData | undefined => {
    return realtimeData.find(data => data.deviceId === deviceId);
  };

  return (
    <RealtimeDataContext.Provider value={{
      realtimeData,
      getDeviceData,
      isLoading
    }}>
      {children}
    </RealtimeDataContext.Provider>
  );
}

export function useRealtimeData() {
  const context = useContext(RealtimeDataContext);
  if (context === undefined) {
    throw new Error('useRealtimeData must be used within a RealtimeDataProvider');
  }
  return context;
}