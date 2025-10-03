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
import { GlanceViewCard } from '@/components/devices/GlanceViewCard';
import { DeviceDetailSidebar } from '@/components/dashboard/DeviceDetailSidebar';
import { TimelineChart } from '@/components/dashboard/TimelineChart';
import { DeviceTableView } from '@/components/devices/DeviceTableView';
import { 
  Search,
  Grid3X3,
  List,
  AlertTriangle,
  CheckCircle,
  Circle,
  Activity,
  MapPin
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
  const [viewMode, setViewMode] = useState<'glance' | 'detailed'>('glance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
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
    getFloorsByBuilding,
    getFloorLocation
  } = useLocations();


  // Filter buildings based on selected site
  const filteredBuildings = useMemo(() => {
    if (selectedSite === 'all') return buildings;
    return getBuildingsBySite(selectedSite);
  }, [selectedSite, buildings, getBuildingsBySite]);

  // Filter floors based on selected building
  const filteredFloors = useMemo(() => {
    if (selectedBuilding === 'all') return floors;
    return floors.filter(floor => floor.building_id === selectedBuilding);
  }, [selectedBuilding, floors]);

  // Optimized device filtering and grouping with floor names
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
        devices: Array<{
          device_id: string;
          device_name: string;
          aqi: number;
          pm25?: number;
          pm10?: number;
          co2?: number;
          voc?: number;
          status: 'online' | 'offline';
          floor_name?: string;
        }>;
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

      grouped[siteKey].buildings[buildingKey].devices.push({
        device_id: device.device_id,
        device_name: device.device_name,
        aqi: device.aqi || 0,
        pm25: device.pm25,
        pm10: device.pm10,
        co2: device.co2,
        voc: device.voc,
        status: device.status as 'online' | 'offline',
        floor_name: floorLocation.floor.name || `Floor ${floorLocation.floor.floor_number}`
      });
    });

    return grouped;
  }, [sensorData, devices, debouncedSearchQuery, selectedSite, selectedBuilding, selectedFloor, floors, getFloorLocation]);

  // Get flat list of devices with full data for glance view
  const devicesWithFullData = useMemo(() => {
    if (!sensorData.length || !devices.length) return [];
    
    return sensorData.map(sensor => {
      const deviceInfo = devices.find(d => d.id === sensor.device_id);
      if (!deviceInfo) return null;

      const floor = floors.find(f => f.id === deviceInfo.floor_id);
      if (!floor) return null;
      
      const floorLocation = getFloorLocation(floor);
      if (!floorLocation) return null;

      // Apply filters
      if (selectedSite !== 'all' && floorLocation.site.id !== selectedSite) return null;
      if (selectedBuilding !== 'all' && floorLocation.building.id !== selectedBuilding) return null;
      if (selectedFloor !== 'all' && floorLocation.floor.id !== selectedFloor) return null;
      if (debouncedSearchQuery && !sensor.device_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) return null;

      return {
        id: sensor.device_id,
        name: sensor.device_name,
        status: sensor.status,
        locationString: `${floorLocation.site.name} > ${floorLocation.building.name} > ${floorLocation.floor.name || `Floor ${floorLocation.floor.floor_number}`}`,
        building: floorLocation.building,
        floor: floorLocation.floor,
        sensor: {
          aqi: sensor.aqi,
          temperature: sensor.temperature,
          humidity: sensor.humidity,
          co2: sensor.co2,
          pm25: sensor.pm25,
          pm10: sensor.pm10,
          voc: sensor.voc,
          hcho: sensor.hcho,
          last_updated: sensor.last_updated
        },
        ...deviceInfo
      };
    }).filter(Boolean);
  }, [sensorData, devices, floors, getFloorLocation, selectedSite, selectedBuilding, selectedFloor, debouncedSearchQuery]);

  // Group devices by building for glance view
  const devicesByBuilding = useMemo(() => {
    const grouped = new Map<string, { buildingName: string; buildingId: string; devices: any[] }>();
    
    devicesWithFullData.forEach(device => {
      const buildingName = device.building?.name || 'Unassigned Building';
      const buildingId = device.building?.id || 'unassigned';
      
      if (!grouped.has(buildingId)) {
        grouped.set(buildingId, {
          buildingName,
          buildingId,
          devices: []
        });
      }
      
      grouped.get(buildingId)!.devices.push(device);
    });
    
    return Array.from(grouped.values());
  }, [devicesWithFullData]);

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId) return null;
    return devicesWithFullData.find(d => d.id === selectedDeviceId);
  }, [selectedDeviceId, devicesWithFullData]);

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
            <h1 className="text-3xl font-bold tracking-tight">Device View</h1>
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
              Cards
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'outline'}
              onClick={() => setViewMode('detailed')}
              size="sm"
            >
              <List className="h-4 w-4 mr-2" />
              Table
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

        {/* Device Display - Conditional based on view mode */}
        {viewMode === 'glance' ? (
          <div className="relative">
            {/* Device Cards Grid - Grouped by Building */}
            <div className="overflow-auto h-[calc(100vh-320px)]">
              {devicesByBuilding.length > 0 ? (
                <div className="space-y-6 pb-4">
                  {devicesByBuilding.map((buildingGroup) => (
                    <div key={buildingGroup.buildingId} className="space-y-3">
                      {/* Building Header */}
                      <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                        <h2 className="text-lg font-bold text-foreground">
                          {buildingGroup.buildingName}
                        </h2>
                        <Badge variant="secondary">
                          {buildingGroup.devices.length} {buildingGroup.devices.length === 1 ? 'device' : 'devices'}
                        </Badge>
                      </div>

                      {/* Device Cards - Fixed min-width to prevent distortion */}
                      <div className="grid gap-4" style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))'
                      }}>
                        {buildingGroup.devices.map((device) => (
                          <GlanceViewCard
                            key={device.id}
                            device={device}
                            isSelected={selectedDeviceId === device.id}
                            onClick={() => setSelectedDeviceId(device.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="bg-card/95 backdrop-blur">
                  <CardContent className="p-12 text-center">
                    <div className="text-lg text-muted-foreground">
                      No devices found matching the current filters.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar - Overlay */}
            {selectedDevice && (
              <DeviceDetailSidebar
                device={selectedDevice}
                onClose={() => setSelectedDeviceId(null)}
              />
            )}
          </div>
        ) : (
          <div>
            {Object.keys(filteredAndGroupedDevices).length > 0 ? (
              <DeviceTableView
                groupedDevices={filteredAndGroupedDevices}
                onDeviceClick={(deviceId) => navigate(`/device/${deviceId}`)}
              />
            ) : (
              <Card className="bg-card/95 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <div className="text-lg text-muted-foreground">
                    No devices found matching the current filters.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Timeline Chart - Only in Glance Mode with selected device */}
        {viewMode === 'glance' && selectedDevice && (
          <div className="mt-6">
            <TimelineChart
              devices={[selectedDevice]}
              selectedDeviceId={selectedDeviceId}
            />
          </div>
        )}
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