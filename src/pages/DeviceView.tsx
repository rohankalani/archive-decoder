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
import { DeviceGridSkeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  Grid3X3,
  List,
  AlertTriangle,
  CheckCircle,
  Circle,
  Activity
} from 'lucide-react';

// Helper functions
const getAqiStatus = (aqi: number) => {
  if (aqi <= 50) return { label: 'Good', color: 'success', bgColor: 'bg-success/10', borderColor: 'border-success' };
  if (aqi <= 100) return { label: 'Moderate', color: 'warning', bgColor: 'bg-warning/10', borderColor: 'border-warning' };
  return { label: 'Unhealthy', color: 'destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive' };
};

const getSensorTypeDisplay = (aqi: number) => {
  if (aqi <= 50) return 'GOOD';
  if (aqi <= 100) return 'VOC';
  return 'PM2.5';
};

// Main component wrapped with error boundary  
const DeviceViewContent = memo(() => {
  const [viewMode, setViewMode] = useState<'glance' | 'detailed'>('detailed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const navigate = useNavigate();

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { sensorData, loading: sensorLoading, error } = useOptimizedLiveSensorData();
  const { devices, loading: devicesLoading } = useDevices();
  const { 
    sites, 
    buildings, 
    blocks, 
    floors, 
    loading: locationsLoading,
    getBuildingsBySite,
    getBlocksByBuilding,
    getFloorsByBuilding,
    getFloorLocation
  } = useLocations();


  // Filter buildings based on selected site
  const filteredBuildings = useMemo(() => {
    if (selectedSite === 'all') return buildings;
    return getBuildingsBySite(selectedSite);
  }, [selectedSite, buildings, getBuildingsBySite]);

  // Filter blocks based on selected building
  const filteredBlocks = useMemo(() => {
    if (selectedBuilding === 'all') return blocks;
    return blocks.filter(block => block.building_id === selectedBuilding);
  }, [selectedBuilding, blocks]);

  // Filter floors based on selected building
  const filteredFloors = useMemo(() => {
    if (selectedBuilding === 'all') return floors;
    return floors.filter(floor => floor.building_id === selectedBuilding);
  }, [selectedBuilding, floors]);

  // Optimized device filtering and grouping
  const filteredAndGroupedDevices = useMemo(() => {
    if (!sensorData.length || !devices.length) return {};
    
    let filtered = sensorData.filter(device => {
      // Search filter with debounced query
      if (debouncedSearchQuery && !device.device_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
        return false;
      }

      // Get device location info
      const deviceInfo = devices.find(d => d.id === device.device_id);
      if (!deviceInfo) return false;

      const floor = floors.find(f => f.id === deviceInfo.floor_id);
      if (!floor) return false;
      const floorLocation = getFloorLocation(floor);
      if (!floorLocation) return false;

      // Site filter
      if (selectedSite !== 'all' && floorLocation.site.id !== selectedSite) {
        return false;
      }

      // Building filter
      if (selectedBuilding !== 'all' && floorLocation.building.id !== selectedBuilding) {
        return false;
      }

      // Block filter
      if (selectedBlock !== 'all' && floorLocation.block?.id !== selectedBlock) {
        return false;
      }

      // Floor filter
      if (selectedFloor !== 'all' && floorLocation.floor.id !== selectedFloor) {
        return false;
      }

      return true;
    });

    // Group by site first, then by building within each site
    const grouped: Record<string, {
      siteName: string;
      buildings: Record<string, {
        buildingName: string;
        devices: typeof filtered;
      }>;
    }> = {};

    filtered.forEach(device => {
      const deviceInfo = devices.find(d => d.id === device.device_id);
      if (!deviceInfo) return;

      const floor = floors.find(f => f.id === deviceInfo.floor_id);
      if (!floor) return;
      const floorLocation = getFloorLocation(floor);
      if (!floorLocation) return;

      const siteKey = floorLocation.site.id;
      const buildingKey = floorLocation.building.id;

      if (!grouped[siteKey]) {
        grouped[siteKey] = {
          siteName: floorLocation.site.name,
          buildings: {}
        };
      }

      if (!grouped[siteKey].buildings[buildingKey]) {
        grouped[siteKey].buildings[buildingKey] = {
          buildingName: floorLocation.building.name,
          devices: []
        };
      }

      grouped[siteKey].buildings[buildingKey].devices.push(device);
    });

    return grouped;
  }, [sensorData, devices, debouncedSearchQuery, selectedSite, selectedBuilding, selectedBlock, selectedFloor, getFloorLocation]);

  if (sensorLoading || devicesLoading || locationsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Detailed Device View</h1>
            </div>
          </div>
          <DeviceGridSkeleton count={8} />
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
                Failed to load device data
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
            <h1 className="text-3xl font-bold tracking-tight">Detailed Device View</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* View Mode Toggle and Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'glance' ? 'default' : 'outline'}
              onClick={() => setViewMode('glance')}
              size="sm"
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Glance
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'outline'}
              onClick={() => setViewMode('detailed')}
              size="sm"
            >
              <List className="h-4 w-4 mr-2" />
              Detailed
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-[150px]">
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

            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Buildings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buildings</SelectItem>
                {filteredBuildings.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBlock} onValueChange={setSelectedBlock}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Blocks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blocks</SelectItem>
                {filteredBlocks.map((block) => (
                  <SelectItem key={block.id} value={block.id}>
                    {block.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFloor} onValueChange={setSelectedFloor}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Floors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {filteredFloors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.name || `Floor ${floor.floor_number}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Device Groups */}
        <div className="space-y-12">
          {Object.entries(filteredAndGroupedDevices).map(([siteKey, site]) => (
            <div key={siteKey} className="space-y-8">
              {/* Site Header */}
              <div className="border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-primary">{site.siteName}</h2>
              </div>

              {/* Buildings within Site */}
              {Object.entries(site.buildings).map(([buildingKey, building]) => (
                <div key={buildingKey} className="space-y-6">
                  {/* Building Header */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">{building.buildingName}</h3>
                    <div className="h-px bg-border/50"></div>
                  </div>

                  {/* Device Cards */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {building.devices.map((device) => {
                      const deviceInfo = devices.find(d => d.id === device.device_id);
                      const floor = deviceInfo ? floors.find(f => f.id === deviceInfo.floor_id) : null;
                      const floorLocation = floor ? getFloorLocation(floor) : null;
                      const status = getAqiStatus(device.aqi || 0);
                      
                      // Check for smoke/vape detection (high PM2.5 values)
                      const isSmokeDetected = device.pm25 && device.pm25 > 100;
                      const isVOCHigh = device.voc && device.voc > 500;
                      
                       return (
                         <Card 
                           key={device.device_id} 
                           className="bg-card/95 backdrop-blur border-2 border-border/20 transition-all hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 group cursor-pointer aspect-[4/3]"
                           onClick={() => navigate(`/device/${device.device_id}`)}
                         >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                  {device.device_name}
                                </CardTitle>
                                <p className="text-sm font-medium text-muted-foreground">
                                  {floorLocation?.floor.name || `Floor ${floorLocation?.floor.floor_number}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {/* Smoke/Vape Indicator */}
                                {(isSmokeDetected || isVOCHigh) && (
                                  <div className="flex items-center gap-1 bg-destructive/20 text-destructive px-2 py-1 rounded-full">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span className="text-xs font-medium">
                                      {isSmokeDetected ? 'SMOKE' : 'VOC'}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Status Indicator */}
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${
                                    device.status === 'online' ? 'bg-success animate-pulse' : 'bg-muted'
                                  }`} />
                                  <span className="text-xs font-medium text-muted-foreground capitalize">
                                    {device.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-6">
                            {/* AQI Display */}
                            <div className="text-center">
                              <div className="text-sm font-medium text-muted-foreground mb-2">
                                AQI ({getSensorTypeDisplay(device.aqi || 0)})
                              </div>
                              <div className={`text-5xl font-bold ${
                                status.color === 'success' ? 'text-success' : 
                                status.color === 'warning' ? 'text-warning' : 'text-destructive'
                              }`}>
                                {device.aqi || '--'}
                              </div>
                              <div className={`text-sm font-medium mt-1 ${
                                status.color === 'success' ? 'text-success' : 
                                status.color === 'warning' ? 'text-warning' : 'text-destructive'
                              }`}>
                                {status.label}
                              </div>
                            </div>

                            {/* Sensor Grid */}
                            {device.status === 'online' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                    <span className="text-sm font-medium text-muted-foreground">PM2.5</span>
                                  </div>
                                  <div className="text-lg font-bold text-foreground">
                                    {device.pm25?.toFixed(1) || '--'}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">μg/m³</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                    <span className="text-sm font-medium text-muted-foreground">CO₂</span>
                                  </div>
                                  <div className="text-lg font-bold text-foreground">
                                    {device.co2 ? Math.round(device.co2) : '--'}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">ppm</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                                    <span className="text-sm font-medium text-muted-foreground">Temp</span>
                                  </div>
                                  <div className="text-lg font-bold text-foreground">
                                    {device.temperature?.toFixed(1) || '--'}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">°C</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-cyan-500"></div>
                                    <span className="text-sm font-medium text-muted-foreground">Humidity</span>
                                  </div>
                                  <div className="text-lg font-bold text-foreground">
                                    {device.humidity ? Math.round(device.humidity) : '--'}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">%</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                                    <span className="text-sm font-medium text-muted-foreground">VOC</span>
                                  </div>
                                  <div className="text-lg font-bold text-foreground">
                                    {device.voc ? Math.round(device.voc) : '--'}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">ppb</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm font-medium text-muted-foreground">HCHO</span>
                                  </div>
                                  <div className="text-lg font-bold text-foreground">
                                    {device.hcho ? (device.hcho * 1000).toFixed(0) : '--'}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">μg/m³</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {Object.keys(filteredAndGroupedDevices).length === 0 && (
            <Card className="bg-card/95 backdrop-blur">
              <CardContent className="p-12 text-center">
                <div className="text-lg text-muted-foreground">
                  No devices found matching the current filters.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
});

DeviceViewContent.displayName = 'DeviceViewContent';

export function DeviceView() {
  return (
    <ErrorBoundary>
      <DeviceViewContent />
    </ErrorBoundary>
  );
}