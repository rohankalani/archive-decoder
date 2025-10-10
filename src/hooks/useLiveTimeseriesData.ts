import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  calculatePM25Aqi,
  calculatePM10Aqi,
  calculateVOCAqi,
  calculateHCHOAqi,
  calculateNOxAqi
} from '@/utils/chartDataUtils';

const UAE_TZ = 'Asia/Dubai';

// Metrics to track for forward-filling
const METRICS = [
  'temperature', 'humidity', 'co2', 'voc', 'hcho', 'nox',
  'pm25', 'pm10', 'pm03', 'pm1', 'pm5',
  'pc03', 'pc05', 'pc1', 'pc25', 'pc5', 'pc10'
] as const;

// Default values when no data exists and no value to carry forward
const DEFAULTS: Record<string, number> = {
  temperature: 0,
  humidity: 0,
  co2: 400,
  voc: 0,
  hcho: 0,
  nox: 0,
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
  pc10: 0
};

// How long to carry forward a value before falling back to defaults (5 minutes)
const CARRY_FORWARD_MS = 5 * 60 * 1000;

interface LiveBucketData {
  timestamp: number;
  time: string;
  overallAqi: number;
  pm25Aqi: number;
  pm10Aqi: number;
  hchoAqi: number;
  vocAqi: number;
  noxAqi: number;
  temperature: number;
  humidity: number;
  co2: number;
  voc: number;
  hcho: number;
  nox: number;
  pm25: number;
  pm10: number;
  pm03: number;
  pm1: number;
  pm5: number;
  pc03: number;
  pc05: number;
  pc1: number;
  pc25: number;
  pc5: number;
  pc10: number;
}

interface SensorAccumulator {
  sums: Record<string, number>;
  counts: Record<string, number>;
}

interface UseLiveTimeseriesOptions {
  windowMs?: number;
  bucketMs?: number;
}

export function useLiveTimeseriesData(
  deviceId: string,
  options: UseLiveTimeseriesOptions = {}
) {
  const { windowMs = 10 * 60 * 1000, bucketMs = 10 * 1000 } = options;
  const [series, setSeries] = useState<LiveBucketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const bucketsRef = useRef<Map<number, SensorAccumulator>>(new Map());
  const pendingUpdatesRef = useRef<any[]>([]);

  const formatUaeTime = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', {
      hour12: false,
      timeZone: UAE_TZ,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, []);

  const flushBucketsToSeries = useCallback(() => {
    const now = Date.now();
    const oldestBucket = now - windowMs;
    const numBuckets = Math.ceil(windowMs / bucketMs);

    // Track last seen values for forward-filling
    const lastSeenVal: Record<string, number> = {};
    const lastSeenTs: Record<string, number> = {};

    // Create a sorted array of bucket data
    const bucketArray: LiveBucketData[] = [];
    
    for (let i = 0; i < numBuckets; i++) {
      const bucketStart = Math.floor((now - (numBuckets - i - 1) * bucketMs) / bucketMs) * bucketMs;
      const acc = bucketsRef.current.get(bucketStart);
      
      // Get values for this bucket with forward-filling
      const getValue = (key: string): number => {
        const c = acc?.counts?.[key] || 0;
        const s = acc?.sums?.[key] || 0;
        
        if (c > 0) {
          // We have actual data for this bucket
          const value = s / c;
          lastSeenVal[key] = value;
          lastSeenTs[key] = bucketStart;
          return value;
        } else {
          // No data in this bucket - try to carry forward
          if (lastSeenTs[key] !== undefined && bucketStart - lastSeenTs[key] <= CARRY_FORWARD_MS) {
            return lastSeenVal[key];
          } else {
            // Too old or never seen - use default
            return DEFAULTS[key] || 0;
          }
        }
      };

      const temperature = getValue('temperature');
      const humidity = getValue('humidity');
      const co2 = getValue('co2');
      const voc = getValue('voc');
      const hcho = getValue('hcho');
      const nox = getValue('nox');
      const pm25 = getValue('pm25');
      const pm10 = getValue('pm10');
      const pm03 = getValue('pm03');
      const pm1 = getValue('pm1');
      const pm5 = getValue('pm5');
      const pc03 = getValue('pc03');
      const pc05 = getValue('pc05');
      const pc1 = getValue('pc1');
      const pc25 = getValue('pc25');
      const pc5 = getValue('pc5');
      const pc10 = getValue('pc10');

      // Calculate AQI based on the values (actual or carried forward)
      const pm25Aqi = calculatePM25Aqi(pm25);
      const pm10Aqi = calculatePM10Aqi(pm10);
      const vocAqi = calculateVOCAqi(voc);
      const hchoAqi = calculateHCHOAqi(hcho);
      const noxAqi = calculateNOxAqi(nox);
      const overallAqi = Math.max(pm25Aqi, pm10Aqi, vocAqi, hchoAqi, noxAqi);

      bucketArray.push({
        timestamp: bucketStart,
        time: formatUaeTime(bucketStart),
        overallAqi,
        pm25Aqi,
        pm10Aqi,
        hchoAqi,
        vocAqi,
        noxAqi,
        temperature,
        humidity,
        co2,
        voc,
        hcho,
        nox,
        pm25,
        pm10,
        pm03,
        pm1,
        pm5,
        pc03,
        pc05,
        pc1,
        pc25,
        pc5,
        pc10
      });
    }

    // Clean up old buckets
    for (const [key] of bucketsRef.current) {
      if (key < oldestBucket) {
        bucketsRef.current.delete(key);
      }
    }

    setSeries(bucketArray);
    setLastUpdate(new Date());
  }, [windowMs, bucketMs, formatUaeTime]);

  const addReadingToBucket = useCallback((reading: any) => {
    const timestamp = new Date(reading.timestamp).getTime();
    const bucketStart = Math.floor(timestamp / bucketMs) * bucketMs;
    
    const existing = bucketsRef.current.get(bucketStart) || {
      sums: {},
      counts: {}
    } as SensorAccumulator;

    const key = String(reading.sensor_type);
    const value = Number(reading.value) || 0;
    existing.sums[key] = (existing.sums[key] ?? 0) + value;
    existing.counts[key] = (existing.counts[key] ?? 0) + 1;

    bucketsRef.current.set(bucketStart, existing);
  }, [bucketMs]);

  const fetchInitialData = useCallback(async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      const startTime = new Date(Date.now() - windowMs);

      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', deviceId)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Clear existing buckets
      bucketsRef.current.clear();

      // Populate buckets with historical data
      if (data && data.length > 0) {
        data.forEach(reading => addReadingToBucket(reading));
      }

      flushBucketsToSeries();
    } catch (error) {
      console.error('Error fetching live timeseries data:', error);
      toast.error('Failed to load live data');
    } finally {
      setLoading(false);
    }
  }, [deviceId, windowMs, addReadingToBucket, flushBucketsToSeries]);

  useEffect(() => {
    if (!deviceId) return;

    fetchInitialData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`live-timeseries-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `device_id=eq.${deviceId}`
        },
        (payload) => {
          console.log('[Live Timeseries] New reading:', payload.new);
          addReadingToBucket(payload.new);
          flushBucketsToSeries(); // Immediate flush
        }
      )
      .subscribe((status) => {
        console.log('[Live Timeseries] Subscription status:', status);
      });

    // Advance window timer every 5 seconds for more responsive updates
    const advanceTimer = setInterval(() => {
      flushBucketsToSeries();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(advanceTimer);
    };
  }, [deviceId, fetchInitialData, addReadingToBucket, flushBucketsToSeries, bucketMs]);

  return {
    series,
    loading,
    lastUpdate,
    refetch: fetchInitialData
  };
}
