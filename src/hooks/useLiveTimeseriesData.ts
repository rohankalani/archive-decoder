import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDebounce } from './useDebounce';
import {
  calculatePM25Aqi,
  calculatePM10Aqi,
  calculateVOCAqi,
  calculateHCHOAqi,
  calculateNOxAqi
} from '@/utils/chartDataUtils';

const UAE_TZ = 'Asia/Dubai';

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
  count: number;
  pm25: number;
  pm10: number;
  pm03: number;
  pm1: number;
  pm5: number;
  temperature: number;
  humidity: number;
  co2: number;
  voc: number;
  hcho: number;
  nox: number;
  pc03: number;
  pc05: number;
  pc1: number;
  pc25: number;
  pc5: number;
  pc10: number;
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
  const flushTrigger = useRef(0);
  
  // Debounced flush trigger to reduce re-renders
  const debouncedFlushTrigger = useDebounce(flushTrigger.current, 1000);

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

    // Create a sorted array of bucket data
    const bucketArray: LiveBucketData[] = [];
    
    for (let i = 0; i < numBuckets; i++) {
      const bucketStart = Math.floor((now - (numBuckets - i - 1) * bucketMs) / bucketMs) * bucketMs;
      const acc = bucketsRef.current.get(bucketStart);
      
      if (acc && acc.count > 0) {
        const count = acc.count;
        const pm25 = acc.pm25 / count;
        const pm10 = acc.pm10 / count;
        const voc = acc.voc / count;
        const hcho = acc.hcho / count;
        const nox = acc.nox / count;

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
          temperature: acc.temperature / count,
          humidity: acc.humidity / count,
          co2: acc.co2 / count,
          voc,
          hcho,
          nox,
          pm25,
          pm10,
          pm03: acc.pm03 / count,
          pm1: acc.pm1 / count,
          pm5: acc.pm5 / count,
          pc03: acc.pc03 / count,
          pc05: acc.pc05 / count,
          pc1: acc.pc1 / count,
          pc25: acc.pc25 / count,
          pc5: acc.pc5 / count,
          pc10: acc.pc10 / count
        });
      } else {
        // Empty bucket with zeros
        bucketArray.push({
          timestamp: bucketStart,
          time: formatUaeTime(bucketStart),
          overallAqi: 0,
          pm25Aqi: 0,
          pm10Aqi: 0,
          hchoAqi: 0,
          vocAqi: 0,
          noxAqi: 0,
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
        });
      }
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
      count: 0,
      pm25: 0,
      pm10: 0,
      pm03: 0,
      pm1: 0,
      pm5: 0,
      temperature: 0,
      humidity: 0,
      co2: 0,
      voc: 0,
      hcho: 0,
      nox: 0,
      pc03: 0,
      pc05: 0,
      pc1: 0,
      pc25: 0,
      pc5: 0,
      pc10: 0
    };

    existing.count++;

    switch (reading.sensor_type) {
      case 'pm25':
        existing.pm25 += reading.value || 0;
        break;
      case 'pm10':
        existing.pm10 += reading.value || 0;
        break;
      case 'pm03':
        existing.pm03 += reading.value || 0;
        break;
      case 'pm1':
        existing.pm1 += reading.value || 0;
        break;
      case 'pm5':
        existing.pm5 += reading.value || 0;
        break;
      case 'temperature':
        existing.temperature += reading.value || 0;
        break;
      case 'humidity':
        existing.humidity += reading.value || 0;
        break;
      case 'co2':
        existing.co2 += reading.value || 0;
        break;
      case 'voc':
        existing.voc += reading.value || 0;
        break;
      case 'hcho':
        existing.hcho += reading.value || 0;
        break;
      case 'nox':
        existing.nox += reading.value || 0;
        break;
      case 'pc03':
        existing.pc03 += reading.value || 0;
        break;
      case 'pc05':
        existing.pc05 += reading.value || 0;
        break;
      case 'pc1':
        existing.pc1 += reading.value || 0;
        break;
      case 'pc25':
        existing.pc25 += reading.value || 0;
        break;
      case 'pc5':
        existing.pc5 += reading.value || 0;
        break;
      case 'pc10':
        existing.pc10 += reading.value || 0;
        break;
      default:
        break;
    }

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

  // Effect to flush pending updates
  useEffect(() => {
    if (debouncedFlushTrigger > 0) {
      flushBucketsToSeries();
    }
  }, [debouncedFlushTrigger, flushBucketsToSeries]);

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
          // Trigger debounced flush
          flushTrigger.current++;
        }
      )
      .subscribe();

    // Advance window timer every 10 seconds
    const advanceTimer = setInterval(() => {
      flushBucketsToSeries();
    }, bucketMs);

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
