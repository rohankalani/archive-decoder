import { supabase } from '@/integrations/supabase/client';
import { logger } from './errors';

export interface OptimizedSensorReading {
  device_id: string;
  device_name: string;
  device_status: 'online' | 'offline' | 'maintenance' | 'error';
  sensor_type: string;
  value: number;
  unit: string;
  reading_timestamp: string;
}

export interface LiveSensorData {
  device_id: string;
  device_name: string;
  pm03?: number;
  pm1?: number;
  pm25?: number;
  pm5?: number;
  pm10?: number;
  co2?: number;
  temperature?: number;
  humidity?: number;
  voc?: number;
  hcho?: number;
  no2?: number;
  nox?: number;
  pc03?: number;
  pc05?: number;
  pc1?: number;
  pc25?: number;
  pc5?: number;
  pc10?: number;
  aqi?: number;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  last_updated: string;
}

// Calculate AQI based on PM2.5 values (simplified US EPA formula)
const calculateAQI = (pm25: number): number => {
  if (pm25 <= 12) return Math.round((50 / 12) * pm25);
  if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
  if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
  if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
  if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
  return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301);
};

export class OptimizedSensorApi {
  // Single query to get all latest sensor readings for all devices
  static async getAllLatestSensorReadings(): Promise<LiveSensorData[]> {
    try {
      // Try to use the optimized RPC function first
      const { data: readings, error } = await supabase.rpc('get_latest_sensor_readings_optimized');
      
      if (error) {
        logger.error('RPC function failed, using fallback', error);
        return this.getAllLatestSensorReadingsFallback();
      }

      if (!readings || readings.length === 0) {
        return [];
      }

      return this.processReadingsToLiveData(readings);
    } catch (error) {
      logger.error('Error fetching optimized sensor readings', error as Error);
      // Fallback to manual query
      return this.getAllLatestSensorReadingsFallback();
    }
  }

  // Fallback method using manual query optimization
  static async getAllLatestSensorReadingsFallback(): Promise<LiveSensorData[]> {
    try {
      // Step 1: Get all devices
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('id, name, status');

      if (devicesError) throw devicesError;
      if (!devices || devices.length === 0) return [];

      // Step 2: Get latest readings using a more optimized query with DISTINCT ON
      const { data: readings, error: readingsError } = await supabase
        .from('sensor_readings')
        .select(`
          device_id,
          sensor_type,
          value,
          unit,
          timestamp
        `)
        .in('device_id', devices.map(d => d.id))
        .order('device_id, sensor_type, timestamp', { ascending: false });

      if (readingsError) throw readingsError;

      // Step 3: Process readings to get latest per device per sensor type
      const deviceMap = new Map(devices.map(d => [d.id, d]));
      const latestReadings = this.getLatestReadingsPerDevicePerType(readings || []);
      
      return this.combineDeviceAndReadingData(deviceMap, latestReadings);
    } catch (error) {
      logger.error('Error in fallback sensor readings fetch', error as Error);
      throw error;
    }
  }

  // Process raw readings to get latest per device per sensor type
  private static getLatestReadingsPerDevicePerType(readings: any[]) {
    const latest: Record<string, Record<string, { value: number; timestamp: string }>> = {};
    
    readings.forEach(reading => {
      const deviceKey = reading.device_id;
      const sensorKey = reading.sensor_type;
      
      if (!latest[deviceKey]) {
        latest[deviceKey] = {};
      }
      
      if (!latest[deviceKey][sensorKey] || 
          new Date(reading.timestamp) > new Date(latest[deviceKey][sensorKey].timestamp)) {
        latest[deviceKey][sensorKey] = {
          value: reading.value,
          timestamp: reading.timestamp
        };
      }
    });
    
    return latest;
  }

  // Combine device info with reading data
  private static combineDeviceAndReadingData(
    deviceMap: Map<string, any>, 
    latestReadings: Record<string, Record<string, { value: number; timestamp: string }>>
  ): LiveSensorData[] {
    const results: LiveSensorData[] = [];
    
    deviceMap.forEach((device, deviceId) => {
      const readings = latestReadings[deviceId] || {};
      
      const pm25Value = readings.pm25?.value || 0;
      const aqi = pm25Value > 0 ? calculateAQI(pm25Value) : undefined;
      
      const lastUpdated = Object.values(readings).reduce((latest, reading) => {
        return !latest || new Date(reading.timestamp) > new Date(latest) 
          ? reading.timestamp 
          : latest;
      }, '') || new Date().toISOString();
      
      results.push({
        device_id: deviceId,
        device_name: device.name,
        pm03: readings.pm03?.value,
        pm1: readings.pm1?.value,
        pm25: readings.pm25?.value,
        pm5: readings.pm5?.value,
        pm10: readings.pm10?.value,
        co2: readings.co2?.value,
        temperature: readings.temperature?.value,
        humidity: readings.humidity?.value,
        voc: readings.voc?.value,
        hcho: readings.hcho?.value,
        no2: readings.no2?.value,
        nox: readings.nox?.value,
        pc03: readings.pc03?.value,
        pc05: readings.pc05?.value,
        pc1: readings.pc1?.value,
        pc25: readings.pc25?.value,
        pc5: readings.pc5?.value,
        pc10: readings.pc10?.value,
        aqi,
        status: device.status as 'online' | 'offline' | 'maintenance' | 'error',
        last_updated: lastUpdated
      });
    });
    
    return results;
  }

  // Process readings from RPC function (if available)
  private static processReadingsToLiveData(readings: OptimizedSensorReading[]): LiveSensorData[] {
    // Group readings by device
    const deviceGroups: Record<string, OptimizedSensorReading[]> = {};
    
    readings.forEach(reading => {
      if (!deviceGroups[reading.device_id]) {
        deviceGroups[reading.device_id] = [];
      }
      deviceGroups[reading.device_id].push(reading);
    });

    return Object.entries(deviceGroups).map(([deviceId, deviceReadings]) => {
      const firstReading = deviceReadings[0];
      const readingMap: Record<string, number> = {};
      
      deviceReadings.forEach(reading => {
        readingMap[reading.sensor_type] = reading.value;
      });
      
      const pm25Value = readingMap.pm25 || 0;
      const aqi = pm25Value > 0 ? calculateAQI(pm25Value) : undefined;
      
      const lastUpdated = deviceReadings.reduce((latest, reading) => {
        return !latest || new Date(reading.reading_timestamp) > new Date(latest) 
          ? reading.reading_timestamp 
          : latest;
      }, '');
      
      return {
        device_id: deviceId,
        device_name: firstReading.device_name,
        pm03: readingMap.pm03,
        pm1: readingMap.pm1,
        pm25: readingMap.pm25,
        pm5: readingMap.pm5,
        pm10: readingMap.pm10,
        co2: readingMap.co2,
        temperature: readingMap.temperature,
        humidity: readingMap.humidity,
        voc: readingMap.voc,
        hcho: readingMap.hcho,
        no2: readingMap.no2,
        nox: readingMap.nox,
        pc03: readingMap.pc03,
        pc05: readingMap.pc05,
        pc1: readingMap.pc1,
        pc25: readingMap.pc25,
        pc5: readingMap.pc5,
        pc10: readingMap.pc10,
        aqi,
        status: firstReading.device_status,
        last_updated: lastUpdated
      };
    });
  }
}