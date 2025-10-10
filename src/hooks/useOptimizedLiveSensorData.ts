import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OptimizedSensorApi, type LiveSensorData } from '@/lib/optimizedSensorApi';
import { logger } from '@/lib/errors';

interface OverallStats {
  aqi: number;
  temperature: number;
  humidity: number;
  co2: number;
  pm25: number;
  pm10: number;
  onlineDevices: number;
  totalDevices: number;
}

export function useOptimizedLiveSensorData() {
  const [sensorData, setSensorData] = useState<LiveSensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Fetch sensor data with optimized query
  const fetchLatestSensorData = useCallback(async () => {
    try {
      setError(null);
      const data = await OptimizedSensorApi.getAllLatestSensorReadings();
      setSensorData(data);
      setLastFetch(new Date());
    } catch (error) {
      const err = error as Error;
      
      // Handle transient PostgREST schema cache errors gracefully
      if (err.message?.includes('PGRST002') || 
          err.message?.includes('schema cache') ||
          err.message?.includes('timeout')) {
        logger.error('Temporary database connection issue, retrying...', err);
        setError(null); // Don't propagate transient errors
        // Don't show error toast for transient issues
      } else {
        logger.error('Error fetching optimized sensor data', err);
        setError(err);
        toast.error('Failed to fetch sensor data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Incremental update for real-time changes
  const handleIncrementalUpdate = useCallback(async (payload: any) => {
    try {
      // Only update if we have existing data to avoid race conditions
      if (sensorData.length === 0) return;

      // For now, do a full refresh but we can optimize this later
      // to only update the specific device that changed
      await fetchLatestSensorData();
    } catch (error) {
      logger.error('Error handling incremental update', error as Error);
    }
  }, [sensorData.length, fetchLatestSensorData]);

  // Calculate overall statistics (memoized)
  const getOverallStats = useCallback((): OverallStats | null => {
    if (sensorData.length === 0) return null;

    const onlineDevices = sensorData.filter(d => d.status === 'online');
    if (onlineDevices.length === 0) return null;

    const avgAQI = onlineDevices.reduce((sum, d) => sum + (d.aqi || 0), 0) / onlineDevices.length;
    const avgTemp = onlineDevices.reduce((sum, d) => sum + (d.temperature || 0), 0) / onlineDevices.length;
    const avgHumidity = onlineDevices.reduce((sum, d) => sum + (d.humidity || 0), 0) / onlineDevices.length;
    const avgCO2 = onlineDevices.reduce((sum, d) => sum + (d.co2 || 0), 0) / onlineDevices.length;
    const avgPM25 = onlineDevices.reduce((sum, d) => sum + (d.pm25 || 0), 0) / onlineDevices.length;
    const avgPM10 = onlineDevices.reduce((sum, d) => sum + (d.pm10 || 0), 0) / onlineDevices.length;

    return {
      aqi: Math.round(avgAQI),
      temperature: Math.round(avgTemp * 10) / 10,
      humidity: Math.round(avgHumidity * 10) / 10,
      co2: Math.round(avgCO2),
      pm25: Math.round(avgPM25 * 10) / 10,
      pm10: Math.round(avgPM10 * 10) / 10,
      onlineDevices: onlineDevices.length,
      totalDevices: sensorData.length
    };
  }, [sensorData]);

  useEffect(() => {
    // Initial fetch
    fetchLatestSensorData();

    // Set up real-time subscription with optimized handling
    const channel = supabase
      .channel('optimized-sensor-readings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings'
        },
        handleIncrementalUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices'
        },
        handleIncrementalUpdate
      )
      .subscribe();

    // Reduced frequency polling (60 seconds instead of 30)
    const interval = setInterval(fetchLatestSensorData, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchLatestSensorData, handleIncrementalUpdate]);

  return {
    sensorData,
    loading,
    error,
    lastFetch,
    overallStats: getOverallStats(),
    refetch: fetchLatestSensorData
  };
}