import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TimePeriod = '10min' | '1hr' | '8hr' | '24hr';

const METRICS = ['temperature', 'humidity', 'co2', 'voc', 'hcho', 'nox', 'no2', 'pm25', 'pm10', 'pm03', 'pm1', 'pm5', 'pc03', 'pc05', 'pc1', 'pc25', 'pc5', 'pc10'] as const;

const DEFAULTS: Record<string, number> = {
  temperature: 0,
  humidity: 0,
  co2: 400,
  voc: 0,
  hcho: 0,
  nox: 0,
  no2: 0,
  pm25: 0,
  pm10: 0,
  pm03: 0,
  pm1: 0,
  pm5: 0,
  pc03: 0,
  pc05: 0,
  pc1: 0,
  pc25: 0,
  pc5: 0,
  pc10: 0,
};

// Carry forward for different periods
const CARRY_FORWARD_CONFIG: Record<TimePeriod, number> = {
  '10min': 2 * 60 * 1000,     // 2 minutes
  '1hr': 15 * 60 * 1000,      // 15 minutes (3 intervals)
  '8hr': 90 * 60 * 1000,      // 1.5 hours (1-2 intervals)
  '24hr': 2 * 60 * 60 * 1000  // 2 hours (2 intervals)
};

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
        startTime = new Date(now.getTime() - 10 * 60 * 1000); // Last 10 minutes
        intervals = 10; // 10 one-minute intervals
        break;
      case '1hr':
        startTime = new Date(now.getTime() - 60 * 60 * 1000); // Last 1 hour
        intervals = 12; // 12 five-minute intervals
        break;
      case '8hr':
        startTime = new Date(now.getTime() - 8 * 60 * 60 * 1000); // Last 8 hours
        intervals = 8; // 8 one-hour intervals
        break;
      case '24hr':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        intervals = 24; // 24 one-hour intervals
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        intervals = 24;
    }
    
    return { startTime, intervals };
  };

  const getIntervalDuration = () => {
    switch (period) {
      case '10min': return 60 * 1000; // 1-minute intervals
      case '1hr': return 5 * 60 * 1000; // 5-minute intervals
      case '8hr': return 60 * 60 * 1000; // 1-hour intervals
      case '24hr': return 60 * 60 * 1000; // 1-hour intervals
      default: return 60 * 60 * 1000;
    }
  };

  const fetchHistoricalData = async (options?: { silent?: boolean; suppressToast?: boolean }) => {
    if (!deviceId) return;
    
    if (!options?.silent) setLoading(true);
    try {
      const { startTime, intervals } = getTimeRange();
      const intervalDuration = getIntervalDuration();
      
      // Fetch all sensor readings for the device within the time range
      const { data: readings, error } = await supabase
        .from('sensor_readings')
        .select('sensor_type, value, timestamp')
        .eq('device_id', deviceId)
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', new Date().toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Group readings by time intervals and calculate averages (O(N))
      const averagedData: AveragedSensorData[] = [];

      // Pre-initialize buckets
      const buckets: { sums: Record<string, number>; counts: Record<string, number>; ts: number }[] = Array.from({ length: intervals }, (_, i) => ({
        sums: {},
        counts: {},
        ts: startTime.getTime() + i * intervalDuration,
      }));

      const startMs = startTime.getTime();

      (readings || []).forEach((reading) => {
        const t = new Date(reading.timestamp).getTime();
        const idx = Math.floor((t - startMs) / intervalDuration);
        if (idx >= 0 && idx < intervals) {
          const bucket = buckets[idx];
          const key = reading.sensor_type;
          bucket.sums[key] = (bucket.sums[key] || 0) + reading.value;
          bucket.counts[key] = (bucket.counts[key] || 0) + 1;
        }
      });

      // Build averaged data per bucket WITH forward-fill
      const lastSeenVal: Record<string, number> = {};
      const lastSeenTs: Record<string, number> = {};
      const carryForwardMs = CARRY_FORWARD_CONFIG[period];

      for (let i = 0; i < intervals; i++) {
        const b = buckets[i];
        const bucketStart = b.ts;
        const averaged: AveragedSensorData = {
          timestamp: new Date(bucketStart).toISOString(),
        };

        // Process each metric with forward-fill
        METRICS.forEach((metric) => {
          let value: number;
          
          // If we have data for this metric in this bucket, use it
          if (b.sums[metric] !== undefined && b.counts[metric] > 0) {
            value = b.sums[metric] / b.counts[metric];
            lastSeenVal[metric] = value;
            lastSeenTs[metric] = bucketStart;
          } 
          // Otherwise, try to carry forward
          else if (
            lastSeenTs[metric] !== undefined &&
            bucketStart - lastSeenTs[metric] <= carryForwardMs
          ) {
            value = lastSeenVal[metric];
          } 
          // Fall back to default
          else {
            value = DEFAULTS[metric] || 0;
          }

          // Assign the value to the averaged object
          switch (metric) {
            case 'pm03': averaged.pm03 = value; break;
            case 'pm1': averaged.pm1 = value; break;
            case 'pm25': averaged.pm25 = value; break;
            case 'pm5': averaged.pm5 = value; break;
            case 'pm10': averaged.pm10 = value; break;
            case 'co2': averaged.co2 = value; break;
            case 'temperature': averaged.temperature = value; break;
            case 'humidity': averaged.humidity = value; break;
            case 'voc': averaged.voc = value; break;
            case 'hcho': averaged.hcho = value; break;
            case 'nox': averaged.nox = value; break;
            case 'no2': averaged.no2 = value; break;
            case 'pc03': averaged.pc03 = value; break;
            case 'pc05': averaged.pc05 = value; break;
            case 'pc1': averaged.pc1 = value; break;
            case 'pc25': averaged.pc25 = value; break;
            case 'pc5': averaged.pc5 = value; break;
            case 'pc10': averaged.pc10 = value; break;
          }
        });

        averagedData.push(averaged);
      }

      setData(averagedData);
    } catch (error) {
      console.error('Error fetching historical sensor data:', error);
      if (!options?.suppressToast) toast.error('Failed to fetch historical data');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
    
    // Set up real-time subscription for new sensor readings
    const channel = supabase
      .channel('sensor-readings-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_readings',
        filter: `device_id=eq.${deviceId}`
      }, (payload) => {
        console.log('[Historical] New sensor_readings INSERT', deviceId, payload.new);
        // Simple and reliable: refetch the entire window to keep buckets and x-axis correct
        fetchHistoricalData({ silent: true, suppressToast: true });
      })
      .subscribe((status) => {
        console.log('[Historical] Subscription status:', status);
      });
    
    // Polling fallback for real-time updates every 5 seconds
    const pollInterval = setInterval(() => {
      fetchHistoricalData({ silent: true, suppressToast: true });
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [deviceId, period]);

  return {
    data,
    loading,
    refetch: fetchHistoricalData
  };
}