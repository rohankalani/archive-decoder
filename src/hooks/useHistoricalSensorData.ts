import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TimePeriod = '10min' | '1hr' | '8hr' | '24hr';

export interface AveragedSensorData {
  timestamp: string;
  pm25?: number;
  pm10?: number;
  pm03?: number;
  pm1?: number;
  pm5?: number;
  co2?: number;
  temperature?: number;
  humidity?: number;
  voc?: number;
  hcho?: number;
  nox?: number;
  no2?: number;
  pc03?: number;
  pc05?: number;
  pc1?: number;
  pc25?: number;
  pc5?: number;
  pc10?: number;
}

export function useHistoricalSensorData(deviceId: string, period: TimePeriod = '1hr') {
  const [data, setData] = useState<AveragedSensorData[]>([]);
  const [loading, setLoading] = useState(true);

  const getTimeRange = () => {
    const now = new Date();
    let startTime: Date;
    let intervals: number;
    
    switch (period) {
      case '10min':
        startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Last 2 hours
        intervals = 12; // 12 ten-minute intervals
        break;
      case '1hr':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        intervals = 24; // 24 one-hour intervals
        break;
      case '8hr':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        intervals = 21; // 21 eight-hour intervals (3 per day)
        break;
      case '24hr':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        intervals = 30; // 30 daily intervals
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        intervals = 24;
    }
    
    return { startTime, intervals };
  };

  const getIntervalDuration = () => {
    switch (period) {
      case '10min': return 10 * 60 * 1000;
      case '1hr': return 60 * 60 * 1000;
      case '8hr': return 8 * 60 * 60 * 1000;
      case '24hr': return 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  };

  const fetchHistoricalData = async () => {
    if (!deviceId) return;
    
    setLoading(true);
    try {
      const { startTime, intervals } = getTimeRange();
      const intervalDuration = getIntervalDuration();
      
      // Fetch all sensor readings for the device within the time range
      const { data: readings, error } = await supabase
        .from('sensor_readings')
        .select('sensor_type, value, timestamp')
        .eq('device_id', deviceId)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Group readings by time intervals and calculate averages
      const averagedData: AveragedSensorData[] = [];
      
      for (let i = 0; i < intervals; i++) {
        const intervalStart = new Date(startTime.getTime() + i * intervalDuration);
        const intervalEnd = new Date(intervalStart.getTime() + intervalDuration);
        
        // Filter readings within this interval
        const intervalReadings = readings?.filter(reading => {
          const readingTime = new Date(reading.timestamp);
          return readingTime >= intervalStart && readingTime < intervalEnd;
        }) || [];

        // Group by sensor type and calculate averages
        const sensorAverages: Record<string, number> = {};
        const sensorCounts: Record<string, number> = {};
        
        intervalReadings.forEach(reading => {
          if (!sensorAverages[reading.sensor_type]) {
            sensorAverages[reading.sensor_type] = 0;
            sensorCounts[reading.sensor_type] = 0;
          }
          sensorAverages[reading.sensor_type] += reading.value;
          sensorCounts[reading.sensor_type]++;
        });

        // Calculate final averages
        const averaged: AveragedSensorData = {
          timestamp: intervalStart.toISOString()
        };

        Object.keys(sensorAverages).forEach(sensorType => {
          const avgValue = sensorAverages[sensorType] / sensorCounts[sensorType];
          switch (sensorType) {
            case 'pm03':
              averaged.pm03 = avgValue;
              break;
            case 'pm1':
              averaged.pm1 = avgValue;
              break;
            case 'pm25':
              averaged.pm25 = avgValue;
              break;
            case 'pm5':
              averaged.pm5 = avgValue;
              break;
            case 'pm10':
              averaged.pm10 = avgValue;
              break;
            case 'co2':
              averaged.co2 = avgValue;
              break;
            case 'temperature':
              averaged.temperature = avgValue;
              break;
            case 'humidity':
              averaged.humidity = avgValue;
              break;
            case 'voc':
              averaged.voc = avgValue;
              break;
            case 'hcho':
              averaged.hcho = avgValue;
              break;
            case 'nox':
              averaged.nox = avgValue;
              break;
            case 'no2':
              averaged.no2 = avgValue;
              break;
            case 'pc03':
              averaged.pc03 = avgValue;
              break;
            case 'pc05':
              averaged.pc05 = avgValue;
              break;
            case 'pc1':
              averaged.pc1 = avgValue;
              break;
            case 'pc25':
              averaged.pc25 = avgValue;
              break;
            case 'pc5':
              averaged.pc5 = avgValue;
              break;
            case 'pc10':
              averaged.pc10 = avgValue;
              break;
          }
        });

        averagedData.push(averaged);
      }
      
      setData(averagedData);
    } catch (error) {
      console.error('Error fetching historical sensor data:', error);
      toast.error('Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [deviceId, period]);

  return {
    data,
    loading,
    refetch: fetchHistoricalData
  };
}