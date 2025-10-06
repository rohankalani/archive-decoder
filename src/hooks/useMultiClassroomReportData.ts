import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateEnhancedOccupancy, OccupancyReading } from '@/utils/occupancyUtils';

interface DateRange {
  from: Date;
  to: Date;
}

interface ClassroomReportData {
  classroomId: string;
  classroomName: string;
  building: string;
  floor: number;
  totalReadings: number;
  averageAqi: number | null;
  operatingHoursAqi: number;
  afterHoursAqi: number;
  averageCO2: number;
  operatingHoursCO2: number;
  afterHoursCO2: number;
  averageTemperature: number;
  operatingHoursTemp: number;
  afterHoursTemp: number;
  temperatureStability: number;
  roomUsageHours: number;
  roomEfficiencyScore: number;
  ventilationScore: number;
  hvacEfficiencyRating: string;
  alertCount: number;
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  recommendations: string[];
  operatingHours?: { start: number; end: number };
  peakPollution?: {
    value: number;
    sensorType: string;
    unit: string;
    timestamp: string;
  } | null;
}

interface MultiClassroomReportParams {
  dateRange: DateRange;
  operatingHours: { start: number; end: number };
  selectedBuildings?: string[];
}

export function useMultiClassroomReportData(params: MultiClassroomReportParams) {
  const [classroomsData, setClassroomsData] = useState<ClassroomReportData[]>([]);
  const [consolidatedSummary, setConsolidatedSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simple AQI calculation (PM2.5 based)
  const calculateAqi = useCallback((pm25: number): number => {
    if (pm25 <= 12) return (50 / 12) * pm25;
    if (pm25 <= 35.4) return 50 + ((100 - 50) / (35.4 - 12)) * (pm25 - 12);
    if (pm25 <= 55.4) return 100 + ((150 - 100) / (55.4 - 35.4)) * (pm25 - 35.4);
    if (pm25 <= 150.4) return 150 + ((200 - 150) / (150.4 - 55.4)) * (pm25 - 55.4);
    if (pm25 <= 250.4) return 200 + ((300 - 200) / (250.4 - 150.4)) * (pm25 - 150.4);
    return 300 + ((500 - 300) / (500.4 - 250.4)) * (pm25 - 250.4);
  }, []);

  const generateRecommendations = useCallback((data: {
    efficiency: number;
    ventilation: number;
    operatingCO2: number;
    afterHoursCO2: number;
    operatingTemp: number;
    afterHoursTemp: number;
    tempStability: number;
    alertCount: number;
  }): string[] => {
    const recommendations: string[] = [];

    if (data.efficiency < 60) {
      recommendations.push("📊 Consider schedule optimization - room underutilized during peak hours");
    }
    
    if (data.operatingCO2 > 1000) {
      recommendations.push("🌬️ Increase ventilation during class hours - CO₂ levels elevated");
    }

    if (data.afterHoursCO2 > 600) {
      recommendations.push("🌙 Investigate after-hours activity - unexpected occupancy detected");
    }

    if (data.tempStability > 3) {
      recommendations.push("🌡️ HVAC system needs attention - temperature fluctuations detected");
    }

    if (Math.abs(data.operatingTemp - data.afterHoursTemp) < 1) {
      recommendations.push("⚡ Energy savings opportunity - similar temps suggest HVAC optimization needed");
    }

    if (data.ventilation < 70) {
      recommendations.push("🔧 Ventilation system maintenance recommended - poor air circulation");
    }

    if (data.alertCount > 5) {
      recommendations.push("⚠️ Immediate attention required - multiple air quality alerts");
    }

    // Add positive reinforcement for good performance
    if (data.efficiency > 80 && data.ventilation > 80) {
      recommendations.push("🏆 Excellent performance - benchmark classroom for expansion");
    }

    return recommendations.slice(0, 4); // Limit to most important recommendations
  }, []);

  const getClassroomStatus = useCallback((efficiency: number, ventilation: number, alertCount: number): ClassroomReportData['status'] => {
    if (alertCount > 10) return 'critical';
    if (efficiency > 80 && ventilation > 80 && alertCount < 3) return 'excellent';
    if (efficiency > 60 && ventilation > 60 && alertCount < 5) return 'good';
    return 'needs_attention';
  }, []);

  const fetchClassroomReports = useCallback(async () => {
    if (isLoading) return; // Prevent multiple concurrent fetches
    
    // Stable reference check - don't fetch if params haven't actually changed
    const currentParamsKey = `${params.dateRange.from.getTime()}-${params.dateRange.to.getTime()}-${params.operatingHours.start}-${params.operatingHours.end}-${params.selectedBuildings?.join(',') || 'all'}`;
    
    setIsLoading(true);
    try {
      // Get all devices with their location information and room operating hours
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select(`
          id, name, status, floor_id, room_id,
          floors(floor_number),
          rooms(operating_hours_start, operating_hours_end, capacity)
        `);

      if (devicesError) throw devicesError;

      if (!devices || devices.length === 0) {
        setClassroomsData([]);
        return;
      }

      // Fetch sensor readings for all devices
      const deviceIds = devices.map(d => d.id);
      const { data: readings, error: readingsError } = await supabase
        .from('sensor_readings')
        .select('*')
        .in('device_id', deviceIds)
        .gte('timestamp', params.dateRange.from.toISOString())
        .lte('timestamp', params.dateRange.to.toISOString());

      if (readingsError) throw readingsError;

      // Fetch alerts for all devices
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('device_id')
        .in('device_id', deviceIds)
        .gte('created_at', params.dateRange.from.toISOString())
        .lte('created_at', params.dateRange.to.toISOString());

      if (alertsError) throw alertsError;

      // Process data for each classroom (device)
      const classroomResults: ClassroomReportData[] = [];

      for (const device of devices) {
        const deviceReadings = readings?.filter(r => r.device_id === device.id) || [];
        const deviceAlerts = alerts?.filter(a => a.device_id === device.id) || [];

        if (deviceReadings.length === 0) continue;

        // Get room-specific operating hours or use default
        const roomOperatingHours = device.rooms?.operating_hours_start && device.rooms?.operating_hours_end
          ? { start: device.rooms.operating_hours_start, end: device.rooms.operating_hours_end }
          : params.operatingHours;

        // Filter readings by operating hours vs after hours
        const operatingHoursReadings = deviceReadings.filter(r => {
          const hour = new Date(r.timestamp).getHours();
          return hour >= roomOperatingHours.start && hour <= roomOperatingHours.end;
        });

        const afterHoursReadings = deviceReadings.filter(r => {
          const hour = new Date(r.timestamp).getHours();
          return hour < roomOperatingHours.start || hour > roomOperatingHours.end;
        });

        // Get sensor data by type
        const co2Readings = deviceReadings.filter(r => r.sensor_type === 'co2');
        const pm25Readings = deviceReadings.filter(r => r.sensor_type === 'pm25');
        const temperatureReadings = deviceReadings.filter(r => r.sensor_type === 'temperature');

        // Operating hours specific readings
        const operatingCO2Readings = operatingHoursReadings.filter(r => r.sensor_type === 'co2');
        const operatingPM25Readings = operatingHoursReadings.filter(r => r.sensor_type === 'pm25');
        const operatingTempReadings = operatingHoursReadings.filter(r => r.sensor_type === 'temperature');

        // After hours specific readings
        const afterHoursCO2Readings = afterHoursReadings.filter(r => r.sensor_type === 'co2');
        const afterHoursPM25Readings = afterHoursReadings.filter(r => r.sensor_type === 'pm25');
        const afterHoursTempReadings = afterHoursReadings.filter(r => r.sensor_type === 'temperature');

        // Calculate averages
        const avgCO2 = co2Readings.length > 0 
          ? co2Readings.reduce((sum, r) => sum + Number(r.value), 0) / co2Readings.length
          : 400;

        const avgPM25 = pm25Readings.length > 0
          ? pm25Readings.reduce((sum, r) => sum + Number(r.value), 0) / pm25Readings.length
          : 0;

        const avgTemp = temperatureReadings.length > 0
          ? temperatureReadings.reduce((sum, r) => sum + Number(r.value), 0) / temperatureReadings.length
          : 22;

        // Operating hours averages
        const operatingCO2 = operatingCO2Readings.length > 0
          ? operatingCO2Readings.reduce((sum, r) => sum + Number(r.value), 0) / operatingCO2Readings.length
          : avgCO2;

        const operatingPM25 = operatingPM25Readings.length > 0
          ? operatingPM25Readings.reduce((sum, r) => sum + Number(r.value), 0) / operatingPM25Readings.length
          : avgPM25;

        const operatingTemp = operatingTempReadings.length > 0
          ? operatingTempReadings.reduce((sum, r) => sum + Number(r.value), 0) / operatingTempReadings.length
          : avgTemp;

        // After hours averages
        const afterHoursCO2 = afterHoursCO2Readings.length > 0
          ? afterHoursCO2Readings.reduce((sum, r) => sum + Number(r.value), 0) / afterHoursCO2Readings.length
          : 400;

        const afterHoursPM25 = afterHoursPM25Readings.length > 0
          ? afterHoursPM25Readings.reduce((sum, r) => sum + Number(r.value), 0) / afterHoursPM25Readings.length
          : avgPM25;

        const afterHoursTemp = afterHoursTempReadings.length > 0
          ? afterHoursTempReadings.reduce((sum, r) => sum + Number(r.value), 0) / afterHoursTempReadings.length
          : avgTemp;

        // Calculate temperature stability (standard deviation)
        const tempStability = temperatureReadings.length > 1
          ? Math.sqrt(temperatureReadings.reduce((sum, r) => {
              const diff = Number(r.value) - avgTemp;
              return sum + (diff * diff);
            }, 0) / (temperatureReadings.length - 1))
          : 0;

        // Calculate enhanced room occupancy with CO2 decay modeling
        const occupancyReadings = co2Readings.map(reading => ({
          timestamp: new Date(reading.timestamp),
          co2: Number(reading.value),
          temperature: temperatureReadings.find(r => 
            Math.abs(new Date(r.timestamp).getTime() - new Date(reading.timestamp).getTime()) < 300000 // 5 min window
          )?.value,
          humidity: deviceReadings.find(r => 
            r.sensor_type === 'humidity' && 
            Math.abs(new Date(r.timestamp).getTime() - new Date(reading.timestamp).getTime()) < 300000
          )?.value
        })) as OccupancyReading[];

        const roomCapacity = device.rooms?.capacity || 30; // Use room capacity if available, default to 30
        const roomOccupancyPercentage = calculateEnhancedOccupancy(occupancyReadings, roomCapacity);
        
        // Calculate room usage hours based on enhanced occupancy detection
        const operatingHoursCO2Mapped = operatingCO2Readings.map(reading => ({
          timestamp: new Date(reading.timestamp),
          co2: Number(reading.value)
        })) as OccupancyReading[];
        
        // Group by hour and check occupancy for each hour during operating period
        const hourlyOccupancy = operatingHoursCO2Mapped.reduce((acc, reading) => {
          const hour = reading.timestamp.getHours();
          if (!acc[hour]) acc[hour] = [];
          acc[hour].push(reading);
          return acc;
        }, {} as Record<number, OccupancyReading[]>);

        const occupiedHours = Object.values(hourlyOccupancy).filter(hourReadings => {
          const hourOccupancy = calculateEnhancedOccupancy(hourReadings, roomCapacity);
          return hourOccupancy > 20; // Consider occupied if >20% capacity
        }).length;

        const totalOperatingHours = roomOperatingHours.end - roomOperatingHours.start;
        const roomUsageHours = occupiedHours;
        const roomEfficiencyScore = roomOccupancyPercentage;

        // Calculate ventilation score
        const maxCO2 = Math.max(...co2Readings.map(r => Number(r.value)));
        const ventilationScore = Math.max(0, 100 - ((maxCO2 - 400) / 20));

        // HVAC efficiency rating
        const hvacEfficiencyRating = ventilationScore >= 80 ? 'Excellent' : 
                                   ventilationScore >= 60 ? 'Good' : 'Needs Attention';

        // Calculate AQI values
        const averageAqi = avgPM25 > 0 ? calculateAqi(avgPM25) : null;
        const operatingHoursAqi = operatingPM25 > 0 ? calculateAqi(operatingPM25) : (averageAqi || 0);
        const afterHoursAqi = afterHoursPM25 > 0 ? calculateAqi(afterHoursPM25) : (averageAqi || 0);

        // Generate recommendations
        const recommendations = generateRecommendations({
          efficiency: roomEfficiencyScore,
          ventilation: ventilationScore,
          operatingCO2,
          afterHoursCO2,
          operatingTemp,
          afterHoursTemp: afterHoursTemp,
          tempStability,
          alertCount: deviceAlerts.length
        });

        // Determine status
        const status = getClassroomStatus(roomEfficiencyScore, ventilationScore, deviceAlerts.length);

        // Find peak pollution event
        const sortedByValue = deviceReadings.sort((a, b) => Number(b.value) - Number(a.value));
        const peakPollution = sortedByValue.length > 0 ? {
          value: Number(sortedByValue[0].value),
          sensorType: sortedByValue[0].sensor_type,
          unit: sortedByValue[0].unit,
          timestamp: sortedByValue[0].timestamp,
        } : null;

        classroomResults.push({
          classroomId: device.id,
          classroomName: device.name,
          building: 'Building', // Simplified for now
          floor: device.floors?.floor_number || 1,
          totalReadings: deviceReadings.length,
          averageAqi,
          operatingHoursAqi,
          afterHoursAqi,
          averageCO2: avgCO2,
          operatingHoursCO2: operatingCO2,
          afterHoursCO2,
          averageTemperature: avgTemp,
          operatingHoursTemp: operatingTemp,
          afterHoursTemp,
          temperatureStability: tempStability,
          roomUsageHours,
          roomEfficiencyScore,
          ventilationScore: Math.round(ventilationScore),
          hvacEfficiencyRating,
          alertCount: deviceAlerts.length,
          status,
          recommendations,
          peakPollution,
          // Store room-specific operating hours for display
          operatingHours: roomOperatingHours
        } as any);
      }

      setClassroomsData(classroomResults);

    } catch (error) {
      console.error('Error fetching classroom reports:', error);
      toast.error('Failed to fetch classroom reports');
    } finally {
      setIsLoading(false);
    }
  }, [
    params.dateRange.from.getTime(), 
    params.dateRange.to.getTime(), 
    params.operatingHours.start, 
    params.operatingHours.end, 
    params.selectedBuildings?.join(','),
    calculateAqi, 
    generateRecommendations, 
    getClassroomStatus,
    isLoading
  ]);

  const generateConsolidatedReport = useCallback(async () => {
    if (!classroomsData || classroomsData.length === 0) {
      toast.error('No classroom data available for report generation');
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Prepare consolidated data for AI analysis
      const totalClassrooms = classroomsData.length;
      const averageEfficiency = classroomsData.reduce((sum, c) => sum + c.roomEfficiencyScore, 0) / totalClassrooms;
      const excellentClassrooms = classroomsData.filter(c => c.status === 'excellent').length;
      const needsAttentionClassrooms = classroomsData.filter(c => c.status === 'needs_attention' || c.status === 'critical').length;
      const totalAlerts = classroomsData.reduce((sum, c) => sum + c.alertCount, 0);

      // Top and bottom performers
      const topPerformer = classroomsData.reduce((best, current) => 
        current.roomEfficiencyScore > best.roomEfficiencyScore ? current : best
      );
      const bottomPerformer = classroomsData.reduce((worst, current) => 
        current.roomEfficiencyScore < worst.roomEfficiencyScore ? current : worst
      );

      // Temperature insights
      const avgOperatingTemp = classroomsData.reduce((sum, c) => sum + c.operatingHoursTemp, 0) / totalClassrooms;
      const avgAfterHoursTemp = classroomsData.reduce((sum, c) => sum + c.afterHoursTemp, 0) / totalClassrooms;
      const maxTempVariation = Math.max(...classroomsData.map(c => Math.abs(c.operatingHoursTemp - c.afterHoursTemp)));

      const consolidatedData = {
        totalClassrooms,
        averageEfficiency,
        excellentClassrooms,
        needsAttentionClassrooms,
        totalAlerts,
        topPerformer: {
          name: topPerformer.classroomName,
          building: topPerformer.building,
          efficiency: topPerformer.roomEfficiencyScore,
          ventilation: topPerformer.ventilationScore
        },
        bottomPerformer: {
          name: bottomPerformer.classroomName,
          building: bottomPerformer.building,
          efficiency: bottomPerformer.roomEfficiencyScore,
          issues: bottomPerformer.recommendations.join('; ')
        },
        temperatureInsights: {
          avgOperatingTemp,
          avgAfterHoursTemp,
          maxTempVariation,
          energySavingOpportunity: maxTempVariation < 2 ? 'High' : 'Moderate'
        },
        operatingHours: params.operatingHours,
        dateRange: params.dateRange
      };

      const { data, error } = await supabase.functions.invoke('generate-consolidated-classroom-report', {
        body: {
          consolidatedData,
          classroomsData: classroomsData.slice(0, 10), // Send top 10 for detailed analysis
        },
      });

      if (error) throw error;

      setConsolidatedSummary(data.summary);
      toast.success('Consolidated report generated successfully');
    } catch (error) {
      console.error('Error generating consolidated report:', error);
      toast.error('Failed to generate consolidated report');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [classroomsData, params.dateRange, params.operatingHours]);

  useEffect(() => {
    // Don't fetch if we don't have valid date ranges
    if (!params.dateRange?.from || !params.dateRange?.to) return;
    
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Only fetch after component has settled (debounce)
    fetchTimeoutRef.current = setTimeout(() => {
      fetchClassroomReports();
    }, 100); // Reduced debounce time
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [
    params.dateRange.from.getTime(), 
    params.dateRange.to.getTime(), 
    params.operatingHours.start, 
    params.operatingHours.end,
    params.selectedBuildings?.join(',')
  ]); // More stable dependencies

  return {
    classroomsData,
    consolidatedSummary,
    isLoading,
    isGeneratingReport,
    generateConsolidatedReport,
    refetch: fetchClassroomReports,
  };
}