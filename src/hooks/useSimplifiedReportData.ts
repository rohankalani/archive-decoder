import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedMockData } from '@/contexts/UnifiedMockDataContext';

// Flat, focused interfaces - no complex nesting
export interface ReportSummary {
  avgAqi: number;
  totalAlerts: number;
  devicesCount: number;
  activeDevices: number;
}

export interface BuildingMetric {
  id: string;
  name: string;
  aqi: number;
  status: 'good' | 'moderate' | 'unhealthy';
  deviceCount: number;
}

export interface ClassroomData {
  id: string;
  name: string;
  roomNumber: string;
  aqi: number;
  floorId: string;
  buildingId: string;
}

export interface CO2Data {
  hour: number;
  avgValue: number;
  maxValue: number;
}

export interface SimplifiedReportData {
  summary: ReportSummary;
  buildings: BuildingMetric[];
  classrooms: ClassroomData[];
  co2Trends: CO2Data[];
}

interface UseSimplifiedReportDataResult {
  data: SimplifiedReportData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Generate mock report data from mock devices and locations
function generateMockReportData(mockDevices: any[], mockLocations: any): SimplifiedReportData {
  const devices = mockDevices || [];
  const buildings = mockLocations?.buildings || [];
  const floors = mockLocations?.floors || [];
  const rooms = mockLocations?.rooms || [];

  console.log('🔧 Generating mock report data:', {
    devicesCount: devices.length,
    buildingsCount: buildings.length,
    floorsCount: floors.length,
    roomsCount: rooms.length
  });

  // Generate summary
  const activeDevices = devices.filter(d => d.status === 'online').length;
  const avgAqi = devices.length > 0
    ? devices.reduce((sum, d) => sum + (Math.random() * 50 + 20), 0) / devices.length
    : 45;

  const summary: ReportSummary = {
    avgAqi: Math.round(avgAqi),
    totalAlerts: Math.floor(Math.random() * 10),
    devicesCount: devices.length,
    activeDevices,
  };

  // Generate building metrics
  const buildingMetrics: BuildingMetric[] = buildings.map((building: any) => {
    const aqi = Math.round(Math.random() * 80 + 20);
    const buildingFloors = floors.filter((f: any) => f.building_id === building.id);
    const buildingRooms = rooms.filter((r: any) => 
      buildingFloors.some((f: any) => f.id === r.floor_id)
    );
    const deviceCount = devices.filter((d: any) => 
      buildingRooms.some((r: any) => r.id === d.room_id)
    ).length;

    return {
      id: building.id,
      name: building.name,
      aqi,
      status: aqi <= 50 ? 'good' : aqi <= 100 ? 'moderate' : 'unhealthy',
      deviceCount,
    };
  });

  // Generate classroom data
  const classrooms: ClassroomData[] = rooms.map((room: any) => {
    const aqi = Math.round(Math.random() * 80 + 20);
    const floor = floors.find((f: any) => f.id === room.floor_id);

    return {
      id: room.id,
      name: room.name,
      roomNumber: room.room_number || '',
      aqi,
      floorId: room.floor_id,
      buildingId: floor?.building_id || '',
    };
  });

  // Generate CO2 trends (24 hours)
  const co2Trends: CO2Data[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    avgValue: Math.round(400 + Math.random() * 600 + (hour >= 8 && hour <= 18 ? 300 : 0)),
    maxValue: Math.round(600 + Math.random() * 800 + (hour >= 8 && hour <= 18 ? 400 : 0)),
  }));

  const result = {
    summary,
    buildings: buildingMetrics,
    classrooms,
    co2Trends,
  };

  console.log('✅ Mock report data generated:', {
    summary,
    buildingsCount: buildingMetrics.length,
    classroomsCount: classrooms.length,
    co2TrendsCount: co2Trends.length
  });

  return result;
}

interface UseSimplifiedReportDataResult {
  data: SimplifiedReportData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSimplifiedReportData(
  startDate: Date,
  endDate: Date
): UseSimplifiedReportDataResult {
  const { isUsingMockData, devices: mockDevices, locations: mockLocations } = useUnifiedMockData();
  const [data, setData] = useState<SimplifiedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      console.log('📊 Fetching report data...', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(),
        isUsingMockData 
      });
      setIsLoading(true);
      setError(null);

      // Use mock data if enabled
      if (isUsingMockData) {
        console.log('📊 Using mock data for reports');
        const mockReportData = generateMockReportData(mockDevices, mockLocations);
        setData(mockReportData);
        setIsLoading(false);
        return;
      }

      // Fetch sensor readings from Supabase
      const { data: readings, error: readingsError } = await supabase
        .from('sensor_readings')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      console.log('📊 Sensor readings fetched:', { count: readings?.length, error: readingsError });

      if (readingsError) throw readingsError;

      // Fetch alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (alertsError) throw alertsError;

      // Fetch devices with rooms, floors, and buildings
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('*, rooms(id, name, room_number, floor_id)');

      if (devicesError) throw devicesError;

      const { data: floors, error: floorsError } = await supabase
        .from('floors')
        .select('id, building_id');

      if (floorsError) throw floorsError;

      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('id, name');

      if (buildingsError) throw buildingsError;

      // Calculate summary metrics
      const aqiReadings = readings?.filter(r => r.sensor_type === 'aqi_overall') || [];
      const avgAqi = aqiReadings.length > 0
        ? aqiReadings.reduce((sum, r) => sum + Number(r.value), 0) / aqiReadings.length
        : 0;

      const activeDevices = devices?.filter(d => d.status === 'online').length || 0;

      const summary: ReportSummary = {
        avgAqi: Math.round(avgAqi),
        totalAlerts: alerts?.length || 0,
        devicesCount: devices?.length || 0,
        activeDevices,
      };

      // Calculate building metrics
      const buildingMap = new Map<string, { readings: number[]; deviceIds: Set<string>; name: string }>();
      
      aqiReadings.forEach(reading => {
        const device = devices?.find(d => d.id === reading.device_id);
        if (!device?.rooms) return;

        const floor = floors?.find(f => f.id === device.rooms.floor_id);
        if (!floor) return;

        const building = buildings?.find(b => b.id === floor.building_id);
        if (!building) return;
        
        if (!buildingMap.has(building.id)) {
          buildingMap.set(building.id, { readings: [], deviceIds: new Set(), name: building.name });
        }
        const buildingData = buildingMap.get(building.id)!;
        buildingData.readings.push(Number(reading.value));
        buildingData.deviceIds.add(reading.device_id);
      });

      const buildingMetrics: BuildingMetric[] = Array.from(buildingMap.entries()).map(([id, data]) => {
        const avg = data.readings.reduce((sum, v) => sum + v, 0) / data.readings.length;
        
        return {
          id,
          name: data.name,
          aqi: Math.round(avg),
          status: avg <= 50 ? 'good' : avg <= 100 ? 'moderate' : 'unhealthy',
          deviceCount: data.deviceIds.size,
        };
      });

      // Calculate classroom data
      const classrooms: ClassroomData[] = devices
        ?.filter(d => d.rooms)
        .map(d => {
          const roomReadings = aqiReadings.filter(r => r.device_id === d.id);
          const avgAqi = roomReadings.length > 0
            ? roomReadings.reduce((sum, r) => sum + Number(r.value), 0) / roomReadings.length
            : 0;

          const floor = floors?.find(f => f.id === d.rooms!.floor_id);

          return {
            id: d.rooms!.id,
            name: d.rooms!.name,
            roomNumber: d.rooms!.room_number || '',
            aqi: Math.round(avgAqi),
            floorId: d.rooms!.floor_id,
            buildingId: floor?.building_id || '',
          };
        }) || [];

      // Calculate CO2 trends by hour
      const co2Readings = readings?.filter(r => r.sensor_type === 'co2') || [];
      const hourlyData = new Map<number, { values: number[] }>();

      co2Readings.forEach(reading => {
        const hour = new Date(reading.timestamp).getHours();
        if (!hourlyData.has(hour)) {
          hourlyData.set(hour, { values: [] });
        }
        hourlyData.get(hour)!.values.push(Number(reading.value));
      });

      const co2Trends: CO2Data[] = Array.from(hourlyData.entries())
        .map(([hour, data]) => ({
          hour,
          avgValue: Math.round(data.values.reduce((sum, v) => sum + v, 0) / data.values.length),
          maxValue: Math.round(Math.max(...data.values)),
        }))
        .sort((a, b) => a.hour - b.hour);

      setData({
        summary,
        buildings: buildingMetrics,
        classrooms,
        co2Trends,
      });
    } catch (err) {
      console.error('❌ Error fetching report data:', err);
      setError(err as Error);
    } finally {
      console.log('✅ Report data fetch complete');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate.getTime(), endDate.getTime()]);

  return { data, isLoading, error, refetch: fetchData };
}
