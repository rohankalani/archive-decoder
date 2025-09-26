import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DateRange {
  from: Date;
  to: Date;
}

interface ReportDataParams {
  dateRange: DateRange;
  deviceId?: string;
  locationId?: string;
}

interface ReportData {
  totalReadings: number;
  averageAqi: number | null;
  peakPollution: {
    value: number;
    sensorType: string;
    unit: string;
    timestamp: string;
  } | null;
  alertCount: number;
  sensorBreakdown: Array<{
    sensorType: string;
    average: number;
    max: number;
    min: number;
    count: number;
  }>;
  activityInsights?: {
    averageCO2: number;
    peakActivityHours: Array<{ hour: number; avgCO2: number; activityLevel: string; intensity: number }>;
    spaceUtilization: number;
    busyDays: Array<{ day: string; avgCO2: number; activityScore: number }>;
    airQualityDuringClasses: {
      classHours: { avgCO2: number; avgAQI: number };
      offHours: { avgCO2: number; avgAQI: number };
    };
    spaceEfficiency: {
      lowActivityPeriods: number;
      highActivityPeriods: number;
      optimalActivityPercentage: number;
    };
    ventilationEffectiveness: {
      recoveryTimeMinutes: number;
      maxCO2Reached: number;
      ventilationScore: number;
    };
  };
  externalComparison?: {
    outdoorPM25: number;
    indoorAdvantage: number;
    protectionValue: string;
    airQualityAdvantage: number;
  };
}

export function useReportData(params: ReportDataParams) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build device filter query
      let deviceQuery = supabase
        .from('sensor_readings')
        .select('*, devices!inner(*)')
        .gte('timestamp', params.dateRange.from.toISOString())
        .lte('timestamp', params.dateRange.to.toISOString());

      if (params.deviceId) {
        deviceQuery = deviceQuery.eq('device_id', params.deviceId);
      }

      // If location filter is specified, filter devices by location
      if (params.locationId) {
        // First, get devices in the specified location
        const { data: locationDevices } = await supabase
          .from('devices')
          .select('id, floors!inner(*, buildings!inner(*, sites!inner(*)))')
          .or(`floors.building_id.eq.${params.locationId},floors.buildings.site_id.eq.${params.locationId}`);

        if (locationDevices && locationDevices.length > 0) {
          const deviceIds = locationDevices.map(d => d.id);
          deviceQuery = deviceQuery.in('device_id', deviceIds);
        }
      }

      const { data: readings, error: readingsError } = await deviceQuery;

      if (readingsError) throw readingsError;

      // Get alerts for the same period
      let alertQuery = supabase
        .from('alerts')
        .select('*')
        .gte('created_at', params.dateRange.from.toISOString())
        .lte('created_at', params.dateRange.to.toISOString());

      if (params.deviceId) {
        alertQuery = alertQuery.eq('device_id', params.deviceId);
      }

      const { data: alerts, error: alertsError } = await alertQuery;
      if (alertsError) throw alertsError;

      if (!readings || readings.length === 0) {
        setReportData({
          totalReadings: 0,
          averageAqi: null,
          peakPollution: null,
          alertCount: alerts?.length || 0,
          sensorBreakdown: [],
        });
        return;
      }

      // Calculate AQI from PM2.5 readings (simplified calculation)
      const pm25Readings = readings.filter(r => r.sensor_type === 'pm25');
      const averagePm25 = pm25Readings.length > 0 
        ? pm25Readings.reduce((sum, r) => sum + Number(r.value), 0) / pm25Readings.length
        : null;
      
      // Simple AQI calculation (PM2.5 based)
      const calculateAqi = (pm25: number): number => {
        if (pm25 <= 12) return (50 / 12) * pm25;
        if (pm25 <= 35.4) return 50 + ((100 - 50) / (35.4 - 12)) * (pm25 - 12);
        if (pm25 <= 55.4) return 100 + ((150 - 100) / (55.4 - 35.4)) * (pm25 - 35.4);
        if (pm25 <= 150.4) return 150 + ((200 - 150) / (150.4 - 55.4)) * (pm25 - 55.4);
        if (pm25 <= 250.4) return 200 + ((300 - 200) / (250.4 - 150.4)) * (pm25 - 150.4);
        return 300 + ((500 - 300) / (500.4 - 250.4)) * (pm25 - 250.4);
      };

      const averageAqi = averagePm25 ? calculateAqi(averagePm25) : null;

      // Find peak pollution event
      const sortedByValue = readings.sort((a, b) => Number(b.value) - Number(a.value));
      const peakPollution = sortedByValue.length > 0 ? {
        value: Number(sortedByValue[0].value),
        sensorType: sortedByValue[0].sensor_type,
        unit: sortedByValue[0].unit,
        timestamp: sortedByValue[0].timestamp,
      } : null;

      // Calculate sensor breakdown
      const sensorGroups = readings.reduce((acc, reading) => {
        const type = reading.sensor_type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(Number(reading.value));
        return acc;
      }, {} as Record<string, number[]>);

      const sensorBreakdown = Object.entries(sensorGroups).map(([type, values]) => ({
        sensorType: type,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        max: Math.max(...values),
        min: Math.min(...values),
        count: values.length,
      }));

      // Enhanced Activity & Space Intelligence Analysis
      const co2Readings = readings.filter(r => r.sensor_type === 'co2');
      let activityInsights = undefined;

      if (co2Readings.length > 0) {
        const averageCO2 = co2Readings.reduce((sum, r) => sum + Number(r.value), 0) / co2Readings.length;
        
        // Determine activity level based on CO2 patterns (no people counting)
        const getActivityLevel = (co2Level: number): { level: string; intensity: number } => {
          if (co2Level < 500) return { level: 'Low Activity', intensity: 20 };
          if (co2Level < 800) return { level: 'Moderate Activity', intensity: 50 };
          if (co2Level < 1200) return { level: 'High Activity', intensity: 80 };
          return { level: 'Peak Activity', intensity: 100 };
        };

        // Analyze hourly patterns
        const hourlyData = co2Readings.reduce((acc, reading) => {
          const hour = new Date(reading.timestamp).getHours();
          if (!acc[hour]) acc[hour] = [];
          acc[hour].push(Number(reading.value));
          return acc;
        }, {} as Record<number, number[]>);

        const peakActivityHours = Object.entries(hourlyData)
          .map(([hour, values]) => {
            const avgCO2 = values.reduce((s, v) => s + v, 0) / values.length;
            const activity = getActivityLevel(avgCO2);
            return {
              hour: parseInt(hour),
              avgCO2,
              activityLevel: activity.level,
              intensity: activity.intensity
            };
          })
          .sort((a, b) => b.avgCO2 - a.avgCO2)
          .slice(0, 8);

        // Analyze daily patterns
        const dailyData = co2Readings.reduce((acc, reading) => {
          const day = new Date(reading.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
          if (!acc[day]) acc[day] = [];
          acc[day].push(Number(reading.value));
          return acc;
        }, {} as Record<string, number[]>);

        const busyDays = Object.entries(dailyData)
          .map(([day, values]) => {
            const avgCO2 = values.reduce((s, v) => s + v, 0) / values.length;
            const activityScore = Math.min(100, ((avgCO2 - 400) / 1000) * 100);
            return { day, avgCO2, activityScore: Math.max(0, activityScore) };
          })
          .sort((a, b) => b.activityScore - a.activityScore);

        // Class hours vs off-hours analysis (assuming 8AM-6PM are class hours)
        const classHoursReadings = co2Readings.filter(r => {
          const hour = new Date(r.timestamp).getHours();
          return hour >= 8 && hour <= 18;
        });
        
        const offHoursReadings = co2Readings.filter(r => {
          const hour = new Date(r.timestamp).getHours();
          return hour < 8 || hour > 18;
        });

        const airQualityDuringClasses = {
          classHours: {
            avgCO2: classHoursReadings.length > 0 
              ? classHoursReadings.reduce((s, r) => s + Number(r.value), 0) / classHoursReadings.length
              : 0,
            avgAQI: classHoursReadings.length > 0 && averagePm25
              ? calculateAqi(averagePm25)
              : 0
          },
          offHours: {
            avgCO2: offHoursReadings.length > 0 
              ? offHoursReadings.reduce((s, r) => s + Number(r.value), 0) / offHoursReadings.length
              : 0,
            avgAQI: offHoursReadings.length > 0 && averagePm25
              ? calculateAqi(averagePm25 * 0.7) // Assume better air quality off-hours
              : 0
          }
        };

        // Activity efficiency calculations
        const highActivityReadings = co2Readings.filter(r => Number(r.value) > 1000).length;
        const lowActivityReadings = co2Readings.filter(r => Number(r.value) < 600).length;
        const totalCO2Readings = co2Readings.length;

        // Calculate ventilation effectiveness
        const sortedCO2 = co2Readings.map(r => Number(r.value)).sort((a, b) => b - a);
        const maxCO2 = sortedCO2[0] || 400;
        const medianCO2 = sortedCO2[Math.floor(sortedCO2.length / 2)] || 400;
        const ventilationScore = Math.max(0, 100 - ((maxCO2 - 400) / 20)); // Score based on peak management

        activityInsights = {
          averageCO2,
          peakActivityHours,
          spaceUtilization: Math.min(100, ((averageCO2 - 400) / 800) * 100),
          busyDays,
          airQualityDuringClasses,
          spaceEfficiency: {
            lowActivityPeriods: Math.round((lowActivityReadings / totalCO2Readings) * 100),
            highActivityPeriods: Math.round((highActivityReadings / totalCO2Readings) * 100),
            optimalActivityPercentage: Math.round(((totalCO2Readings - highActivityReadings - lowActivityReadings) / totalCO2Readings) * 100)
          },
          ventilationEffectiveness: {
            recoveryTimeMinutes: Math.round((maxCO2 - medianCO2) / 10), // Estimated based on CO2 decay
            maxCO2Reached: maxCO2,
            ventilationScore: Math.round(ventilationScore)
          }
        };
      }

      // Fetch external air quality comparison
      let externalComparison = undefined;
      try {
        const { data: externalData } = await supabase.functions.invoke('fetch-external-air-quality', {
          body: { location: 'abu-dhabi', indoorPM25: averagePm25 }
        });
        if (externalData) {
          externalComparison = externalData;
        }
      } catch (error) {
        console.warn('Could not fetch external air quality data:', error);
      }

      setReportData({
        totalReadings: readings.length,
        averageAqi,
        peakPollution,
        alertCount: alerts?.length || 0,
        sensorBreakdown,
        activityInsights,
        externalComparison,
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  }, [params.dateRange.from, params.dateRange.to, params.deviceId, params.locationId]);

  const generateReport = useCallback(async () => {
    if (!reportData) {
      toast.error('Please load report data first');
      return;
    }

    if (reportData.totalReadings === 0) {
      toast.error('No sensor data available for the selected period. Try a different date range or check if devices are collecting data.');
      return;
    }

    setIsGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-air-quality-report', {
        body: {
          reportData,
          dateRange: params.dateRange,
          deviceId: params.deviceId,
          locationId: params.locationId,
        },
      });

      if (error) throw error;

      setAiSummary(data.summary);
      toast.success('AI report generated successfully');
    } catch (error) {
      console.error('Error generating AI report:', error);
      toast.error('Failed to generate AI report');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [reportData, params.dateRange, params.deviceId, params.locationId]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return {
    reportData,
    aiSummary,
    isLoading,
    isGeneratingReport,
    generateReport,
    refetch: fetchReportData,
  };
}