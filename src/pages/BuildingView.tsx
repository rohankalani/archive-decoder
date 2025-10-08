import React, { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/Layout';
import { useOptimizedLiveSensorData } from '@/hooks/useOptimizedLiveSensorData';
import { useLocations } from '@/hooks/useLocations';
import { useDevices } from '@/hooks/useDevices';
import { useDebounce } from '@/hooks/useDebounce';
import { BuildingGridSkeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  Building2,
  AlertTriangle,
  Activity,
  ChevronRight,
  Wifi,
  WifiOff
} from 'lucide-react';

// Helper function for AQI status - 6-level system
const getAqiStatus = (aqi: number) => {
  if (aqi <= 50) return { label: 'Good', color: 'hsl(120, 85%, 35%)', bgColor: 'bg-success/10', borderColor: 'border-success' };
  if (aqi <= 100) return { label: 'Moderate', color: 'hsl(45, 100%, 40%)', bgColor: 'bg-warning/10', borderColor: 'border-warning' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: 'hsl(30, 100%, 45%)', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500' };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'hsl(0, 100%, 45%)', bgColor: 'bg-destructive/10', borderColor: 'border-destructive' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: 'hsl(280, 90%, 35%)', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500' };
  return { label: 'Hazardous', color: 'hsl(320, 100%, 25%)', bgColor: 'bg-red-900/10', borderColor: 'border-red-900' };
};

// Helper function to calculate AQI for each pollutant using Settings breakpoints
const calculatePollutantAqi = (value: number, ranges: any): number => {
  if (value <= ranges.R1_HIGH) return 50 * ((value - ranges.R1_LOW) / (ranges.R1_HIGH - ranges.R1_LOW));
  if (value <= ranges.R2_HIGH) return 50 + 50 * ((value - ranges.R2_LOW) / (ranges.R2_HIGH - ranges.R2_LOW));
  if (value <= ranges.R3_HIGH) return 100 + 50 * ((value - ranges.R3_LOW) / (ranges.R3_HIGH - ranges.R3_LOW));
  if (value <= ranges.R4_HIGH) return 150 + 50 * ((value - ranges.R4_LOW) / (ranges.R4_HIGH - ranges.R4_LOW));
  if (value <= ranges.R5_HIGH) return 200 + 100 * ((value - ranges.R5_LOW) / (ranges.R5_HIGH - ranges.R5_LOW));
  if (value <= ranges.R6_HIGH) return 300 + 200 * ((value - ranges.R6_LOW) / (ranges.R6_HIGH - ranges.R6_LOW));
  return 500;
};

// Helper function to determine dominant pollutant
const getDominantPollutant = (sensorData: any) => {
  const pollutants = [
    { 
      name: 'PM2.5', 
      value: sensorData.pm25 || 0, 
      unit: 'µg/m³',
      aqi: calculatePollutantAqi(sensorData.pm25 || 0, {
        R1_LOW: 0, R1_HIGH: 12.0,
        R2_LOW: 12.1, R2_HIGH: 35.4,
        R3_LOW: 35.5, R3_HIGH: 55.4,
        R4_LOW: 55.5, R4_HIGH: 150.4,
        R5_LOW: 150.5, R5_HIGH: 250.4,
        R6_LOW: 250.5, R6_HIGH: 350.4
      })
    },
    { 
      name: 'PM10', 
      value: sensorData.pm10 || 0, 
      unit: 'µg/m³',
      aqi: calculatePollutantAqi(sensorData.pm10 || 0, {
        R1_LOW: 0, R1_HIGH: 54,
        R2_LOW: 55, R2_HIGH: 154,
        R3_LOW: 155, R3_HIGH: 254,
        R4_LOW: 255, R4_HIGH: 354,
        R5_LOW: 355, R5_HIGH: 424,
        R6_LOW: 425, R6_HIGH: 604
      })
    },
    { 
      name: 'VOC', 
      value: sensorData.voc || 0, 
      unit: 'ppb',
      aqi: calculatePollutantAqi(sensorData.voc || 0, {
        R1_LOW: 0, R1_HIGH: 50,
        R2_LOW: 51, R2_HIGH: 100,
        R3_LOW: 101, R3_HIGH: 150,
        R4_LOW: 151, R4_HIGH: 200,
        R5_LOW: 201, R5_HIGH: 300,
        R6_LOW: 301, R6_HIGH: 500
      })
    },
    { 
      name: 'HCHO', 
      value: sensorData.hcho || 0, 
      unit: 'µg/m³',
      aqi: calculatePollutantAqi(sensorData.hcho || 0, {
        R1_LOW: 0, R1_HIGH: 30,
        R2_LOW: 31, R2_HIGH: 50,
        R3_LOW: 51, R3_HIGH: 100,
        R4_LOW: 101, R4_HIGH: 200,
        R5_LOW: 201, R5_HIGH: 300,
        R6_LOW: 301, R6_HIGH: 500
      })
    },
    { 
      name: 'NOx', 
      value: sensorData.nox || 0, 
      unit: 'ppb',
      aqi: calculatePollutantAqi(sensorData.nox || 0, {
        R1_LOW: 0, R1_HIGH: 50,
        R2_LOW: 51, R2_HIGH: 100,
        R3_LOW: 101, R3_HIGH: 150,
        R4_LOW: 151, R4_HIGH: 200,
        R5_LOW: 201, R5_HIGH: 300,
        R6_LOW: 301, R6_HIGH: 500
      })
    }
  ];

  // Find pollutant with highest AQI
  const dominant = pollutants.reduce((max, p) => p.aqi > max.aqi ? p : max, pollutants[0]);
  return dominant;
};

// Memoized building card component for performance
const BuildingCard = memo(({ buildingId, stats, onBuildingClick }: {
  buildingId: string;
  stats: any;
  onBuildingClick: (id: string) => void;
}) => {
  const status = getAqiStatus(stats.avgAqi);
  
  // Get AQI color helper
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-success';
    if (aqi <= 100) return 'bg-warning';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-destructive';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-red-900';
  };
  
  return (
    <Card 
      className="bg-card hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/30 group"
      onClick={() => onBuildingClick(buildingId)}
    >
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Left Side - Building Info */}
          <div className="w-80 flex-shrink-0 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                  {stats.buildingName}
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                {stats.siteName}
              </p>
            </div>

            {(stats.smokeDetected || stats.vocDetected || stats.alertCount > 0) && (
              <div className="flex items-center gap-2 bg-destructive/20 text-destructive px-3 py-2 rounded-lg w-fit">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">{stats.alertCount} Alerts</span>
              </div>
            )}

            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Average AQI
              </div>
              <div className="text-3xl font-bold" style={{ color: status.color }}>
                {stats.avgAqi}
              </div>
              <div className="text-sm font-medium" style={{ color: status.color }}>
                {status.label}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Devices</span>
                <span className="text-sm font-bold">{stats.totalDevices}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Wifi className="h-3 w-3 text-success" />
                  <span className="text-sm font-medium text-muted-foreground">Online</span>
                </div>
                <span className="text-sm font-bold text-success">{stats.onlineDevices}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Offline</span>
                </div>
                <span className="text-sm font-bold text-muted-foreground">{stats.offlineDevices}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-sm font-medium text-muted-foreground">Peak AQI</span>
                <span className="text-sm font-bold" style={{ color: getAqiStatus(stats.maxAqi).color }}>
                  {stats.maxAqi}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Classroom AQI Grid */}
          {stats.classrooms && stats.classrooms.length > 0 && (
            <div className="flex-1 border-l border-border/50 pl-6">
              <div className="text-sm font-medium text-muted-foreground mb-4">
                Classroom Air Quality ({stats.classrooms.length} rooms)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {stats.classrooms.map((classroom: any, idx: number) => (
                  <div 
                    key={idx}
                    className="flex flex-col gap-3"
                  >
                    <div className={`h-48 rounded-3xl ${getAqiColor(classroom.aqi)} transition-all duration-200 hover:scale-105 hover:shadow-md flex flex-col items-center justify-center p-6`}>
                      <span className="text-6xl font-bold text-foreground">
                        {classroom.aqi}
                      </span>
                      <span className="text-2xl font-semibold text-foreground/80 leading-tight mt-2">
                        {classroom.dominantPollutant}
                      </span>
                      <span className="text-xl font-medium text-foreground/70 leading-tight">
                        {classroom.dominantValue} {classroom.dominantUnit}
                      </span>
                    </div>
                    <div className="text-lg font-medium text-muted-foreground text-center truncate">
                      {classroom.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

BuildingCard.displayName = 'BuildingCard';

// Main component wrapped with error boundary
const BuildingViewContent = memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const navigate = useNavigate();
  
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { sensorData, loading: sensorLoading, error } = useOptimizedLiveSensorData();
  const { devices, loading: devicesLoading } = useDevices();
  const { 
    sites, 
    buildings, 
    floors,
    loading: locationsLoading,
    getBuildingsBySite,
    getFloorLocation
  } = useLocations();

  // Filter buildings based on selected site (memoized)
  const filteredBuildings = useMemo(() => {
    if (selectedSite === 'all') return buildings;
    return getBuildingsBySite(selectedSite);
  }, [selectedSite, buildings, getBuildingsBySite]);

  // Optimized building stats calculation
  const buildingStats = useMemo(() => {
    if (!sensorData.length || !devices.length || !buildings.length) return {};

    const stats: Record<string, {
      buildingName: string;
      siteName: string;
      totalDevices: number;
      onlineDevices: number;
      offlineDevices: number;
      avgAqi: number;
      maxAqi: number;
      alertCount: number;
      smokeDetected: boolean;
      vocDetected: boolean;
      classrooms: Array<{ name: string; aqi: number; status: string }>;
    }> = {};

    filteredBuildings.forEach(building => {
      if (debouncedSearchQuery && !building.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
        return;
      }

      const buildingFloors = floors.filter(f => f.building_id === building.id);
      const buildingDevices = devices.filter(d => 
        buildingFloors.some(f => f.id === d.floor_id)
      );
      
      const buildingSensorData = sensorData.filter(s => 
        buildingDevices.some(d => d.id === s.device_id)
      );

      if (buildingDevices.length === 0) return;

      const site = sites.find(s => s.id === building.site_id);
      const onlineDevices = buildingSensorData.filter(s => s.status === 'online').length;
      const avgAqi = buildingSensorData.length > 0 ? 
        buildingSensorData.reduce((sum, s) => sum + (s.aqi || 0), 0) / buildingSensorData.length : 0;
      const maxAqi = Math.max(...buildingSensorData.map(s => s.aqi || 0));
      
      const smokeDetected = buildingSensorData.some(s => s.pm25 && s.pm25 > 100);
      const vocDetected = buildingSensorData.some(s => s.voc && s.voc > 500);
      const alertCount = buildingSensorData.filter(s => 
        (s.pm25 && s.pm25 > 100) || (s.voc && s.voc > 500) || (s.aqi && s.aqi > 100)
      ).length;

      // Get classroom/device data with AQI and dominant pollutant
      const classrooms = buildingSensorData
        .filter(s => s.status === 'online')
        .map(sensor => {
          const device = buildingDevices.find(d => d.id === sensor.device_id);
          const dominant = getDominantPollutant(sensor);
          return {
            name: device?.name.split(' ').slice(-2).join(' ') || 'Unknown',
            aqi: Math.round(sensor.aqi || 0),
            status: sensor.status,
            dominantPollutant: dominant.name,
            dominantValue: dominant.value.toFixed(1),
            dominantUnit: dominant.unit
          };
        })
        .sort((a, b) => b.aqi - a.aqi); // Sort by AQI descending

      stats[building.id] = {
        buildingName: building.name,
        siteName: site?.name || 'Unknown Site',
        totalDevices: buildingDevices.length,
        onlineDevices,
        offlineDevices: buildingDevices.length - onlineDevices,
        avgAqi: Math.round(avgAqi),
        maxAqi,
        alertCount,
        smokeDetected,
        vocDetected,
        classrooms
      };
    });

    return stats;
  }, [filteredBuildings, floors, devices, sensorData, debouncedSearchQuery, sites]);

  const handleBuildingClick = (buildingId: string) => {
    navigate(`/devices?building=${buildingId}`);
  };

  if (sensorLoading || devicesLoading || locationsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Building Overview</h1>
              <p className="text-muted-foreground">Monitor air quality across all buildings</p>
            </div>
          </div>
          <BuildingGridSkeleton count={6} />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="bg-card/95 backdrop-blur">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <div className="text-lg font-medium text-foreground mb-2">
                Failed to load building data
              </div>
              <div className="text-muted-foreground mb-4">
                {error.message}
              </div>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Building Overview</h1>
            <p className="text-muted-foreground">Monitor air quality across all buildings</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search buildings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Site Filter */}
        <div className="flex items-center gap-4">
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Building Cards - Horizontal Layout */}
        <div className="space-y-4">
          {Object.entries(buildingStats).map(([buildingId, stats]) => (
            <BuildingCard
              key={buildingId}
              buildingId={buildingId}
              stats={stats}
              onBuildingClick={handleBuildingClick}
            />
          ))}
        </div>

        {Object.keys(buildingStats).length === 0 && (
          <Card className="bg-card/95 backdrop-blur">
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium text-foreground mb-2">
                No buildings found
              </div>
              <div className="text-muted-foreground">
                No buildings match the current filters.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
});

BuildingViewContent.displayName = 'BuildingViewContent';

export function BuildingView() {
  return (
    <ErrorBoundary>
      <BuildingViewContent />
    </ErrorBoundary>
  );
}