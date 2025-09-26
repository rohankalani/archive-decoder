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
    realEstateMetrics: {
      roomUsageHours: number;
      peakOccupancyPeriod: { start: number; end: number; description: string };
      roomEfficiencyScore: number;
      actualOccupancyRate: number;
    };
    occupancyTimeline: Array<{ hour: number; avgCO2: number; occupancyLevel: string; isOccupied: boolean }>;
    airQualityDuringClasses: {
      classHours: { avgCO2: number; avgAQI: number };
      offHours: { avgCO2: number; avgAQI: number };
    };
    ventilationEffectiveness: {
      recoveryTimeMinutes: number;
      maxCO2Reached: number;
      ventilationScore: number;
    };
    facilitiesInsights: {
      energyCostPerHour: number;
      hvacEfficiencyRating: string;
      maintenanceStatus: string;
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
        
        // Determine occupancy level based on CO2 patterns
        const getOccupancyLevel = (co2Level: number): { level: string; isOccupied: boolean } => {
          if (co2Level < 500) return { level: 'Unoccupied', isOccupied: false };
          if (co2Level < 800) return { level: 'Light Occupancy', isOccupied: true };
          if (co2Level < 1200) return { level: 'Active Use', isOccupied: true };
          return { level: 'High Occupancy', isOccupied: true };
        };

        // Analyze hourly patterns for occupancy timeline
        const hourlyData = co2Readings.reduce((acc, reading) => {
          const hour = new Date(reading.timestamp).getHours();
          if (!acc[hour]) acc[hour] = [];
          acc[hour].push(Number(reading.value));
          return acc;
        }, {} as Record<number, number[]>);

        const occupancyTimeline = Object.entries(hourlyData)
          .map(([hour, values]) => {
            const avgCO2 = values.reduce((s, v) => s + v, 0) / values.length;
            const occupancy = getOccupancyLevel(avgCO2);
            return {
              hour: parseInt(hour),
              avgCO2,
              occupancyLevel: occupancy.level,
              isOccupied: occupancy.isOccupied
            };
          })
          .sort((a, b) => a.hour - b.hour);

        // Calculate real estate metrics
        const occupiedHours = occupancyTimeline.filter(h => h.isOccupied).length;
        const roomUsageHours = (occupiedHours / 24) * 12; // Assume 12 hour work day
        
        // Find peak occupancy period
        const sortedByOccupancy = occupancyTimeline
          .filter(h => h.isOccupied)
          .sort((a, b) => b.avgCO2 - a.avgCO2);
        
        const peakStart = sortedByOccupancy[0]?.hour || 9;
        const peakEnd = Math.min(peakStart + 3, 18); // 3-hour peak period, max at 6PM
        
        const peakOccupancyPeriod = {
          start: peakStart,
          end: peakEnd,
          description: sortedByOccupancy[0] ? `${sortedByOccupancy[0].occupancyLevel}` : 'Normal Usage'
        };

        // Calculate room efficiency (how well space is used during scheduled hours)
        const scheduledHours = 12; // Assume 8AM-8PM schedule
        const actualUsageRate = (roomUsageHours / scheduledHours) * 100;
        const roomEfficiencyScore = Math.min(100, Math.max(0, actualUsageRate));

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

        // Calculate ventilation effectiveness
        const sortedCO2 = co2Readings.map(r => Number(r.value)).sort((a, b) => b - a);
        const maxCO2 = sortedCO2[0] || 400;
        const medianCO2 = sortedCO2[Math.floor(sortedCO2.length / 2)] || 400;
        const ventilationScore = Math.max(0, 100 - ((maxCO2 - 400) / 20)); // Score based on peak management

        // Facilities insights
        const baseEnergyCost = 0.15; // Base cost per hour
        const energyCostPerHour = baseEnergyCost * (roomUsageHours / 8); // Adjusted for usage
        const hvacEfficiencyRating = ventilationScore >= 80 ? 'Excellent' : ventilationScore >= 60 ? 'Good' : 'Needs Attention';
        const maintenanceStatus = ventilationScore >= 90 ? 'Optimal Performance' : 'Regular maintenance recommended';

        activityInsights = {
          averageCO2,
          realEstateMetrics: {
            roomUsageHours,
            peakOccupancyPeriod,
            roomEfficiencyScore,
            actualOccupancyRate: actualUsageRate
          },
          occupancyTimeline,
          airQualityDuringClasses,
          ventilationEffectiveness: {
            recoveryTimeMinutes: Math.round((maxCO2 - medianCO2) / 10), // Estimated based on CO2 decay
            maxCO2Reached: maxCO2,
            ventilationScore: Math.round(ventilationScore)
          },
          facilitiesInsights: {
            energyCostPerHour,
            hvacEfficiencyRating,
            maintenanceStatus
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