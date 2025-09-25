import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/Layout';
import { useLiveSensorData } from '@/hooks/useLiveSensorData';
import { useLocations } from '@/hooks/useLocations';
import { useDevices } from '@/hooks/useDevices';
import { 
  Search,
  Grid3X3,
  List,
  AlertTriangle,
  CheckCircle,
  Circle,
  Activity
} from 'lucide-react';

export function DeviceView() {
  const [viewMode, setViewMode] = useState<'glance' | 'detailed'>('detailed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');

  const { sensorData, loading: sensorLoading } = useLiveSensorData();
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

  // Filter and group devices
  const filteredAndGroupedDevices = useMemo(() => {
    let filtered = sensorData.filter(device => {
      // Search filter
      if (searchQuery && !device.device_name.toLowerCase().includes(searchQuery.toLowerCase())) {
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

    // Group by location hierarchy
    const grouped: Record<string, {
      siteName: string;
      buildingName: string;
      devices: typeof filtered;
    }> = {};

    filtered.forEach(device => {
      const deviceInfo = devices.find(d => d.id === device.device_id);
      if (!deviceInfo) return;

      const floor = floors.find(f => f.id === deviceInfo.floor_id);
      if (!floor) return;
      const floorLocation = getFloorLocation(floor);
      if (!floorLocation) return;

      const key = `${floorLocation.site.id}-${floorLocation.building.id}`;
      if (!grouped[key]) {
        grouped[key] = {
          siteName: floorLocation.site.name,
          buildingName: floorLocation.building.name,
          devices: []
        };
      }
      grouped[key].devices.push(device);
    });

    return grouped;
  }, [sensorData, devices, searchQuery, selectedSite, selectedBuilding, selectedBlock, selectedFloor, getFloorLocation]);

  if (sensorLoading || devicesLoading || locationsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 animate-spin" />
            <span>Loading device data...</span>
          </div>
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
        <div className="space-y-8">
          {Object.entries(filteredAndGroupedDevices).map(([key, group]) => (
            <div key={key} className="space-y-4">
              {/* Location Header */}
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-primary">{group.siteName}</h2>
                <h3 className="text-lg text-muted-foreground">{group.buildingName}</h3>
              </div>

              {/* Device Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.devices.map((device) => {
                  const deviceInfo = devices.find(d => d.id === device.device_id);
                  const floor = deviceInfo ? floors.find(f => f.id === deviceInfo.floor_id) : null;
                  const floorLocation = floor ? getFloorLocation(floor) : null;
                  const status = getAqiStatus(device.aqi || 0);
                  
                  return (
                    <Card 
                      key={device.device_id} 
                      className={`${status.bgColor} ${status.borderColor} border-2 transition-all hover:shadow-lg`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base font-medium">
                              {device.device_name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {floorLocation?.floor.name || `Floor ${floorLocation?.floor.floor_number}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${
                              device.status === 'online' ? 'bg-success animate-pulse' : 'bg-muted'
                            }`} />
                            <span className="text-xs text-muted-foreground capitalize">
                              {device.status}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* AQI Display */}
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">
                            AQI ({getSensorTypeDisplay(device.aqi || 0)})
                          </div>
                          <div className={`text-4xl font-bold text-${status.color}`}>
                            {device.aqi || '--'}
                          </div>
                        </div>

                        {/* Sensor Grid */}
                        {device.status === 'online' && (
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-primary"></div>
                                <span className="text-muted-foreground">PM2.5</span>
                              </div>
                              <div className="font-medium">
                                {device.pm25?.toFixed(1) || '--'} <span className="text-xs">μg/m³</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                <span className="text-muted-foreground">CO₂</span>
                              </div>
                              <div className="font-medium">
                                {device.co2 ? Math.round(device.co2) : '--'} <span className="text-xs">ppm</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                <span className="text-muted-foreground">Temp.</span>
                              </div>
                              <div className="font-medium">
                                {device.temperature?.toFixed(1) || '--'} <span className="text-xs">°C</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                                <span className="text-muted-foreground">Humidity</span>
                              </div>
                              <div className="font-medium">
                                {device.humidity ? Math.round(device.humidity) : '--'} <span className="text-xs">%</span>
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

          {Object.keys(filteredAndGroupedDevices).length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  No devices found matching the current filters.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}