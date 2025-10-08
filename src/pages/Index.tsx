import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocations } from '@/hooks/useLocations';
import { useDevices, Device } from '@/hooks/useDevices';
import { useOptimizedLiveSensorData } from '@/hooks/useOptimizedLiveSensorData';
import { Download, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAqiColor } from '@/utils/chartDataUtils';
import { DeviceDetailSidebar } from '@/components/dashboard/DeviceDetailSidebar';
import { DeviceGrid } from '@/components/dashboard/DeviceGrid';
import { TimelineChart } from '@/components/dashboard/TimelineChart';

const Index = () => {
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const { sites, buildings, floors, rooms, loading: locationsLoading } = useLocations();
  const { devices, loading: devicesLoading, refetch: refetchDevices } = useDevices();
  const { sensorData, loading: sensorLoading, refetch: refetchSensorData } = useOptimizedLiveSensorData();

  const handleRefresh = () => {
    refetchDevices();
    refetchSensorData();
  };

  // Get unique room types
  const roomTypes = useMemo(() => {
    const types = new Set(rooms.map(r => r.room_type).filter(Boolean));
    return Array.from(types) as string[];
  }, [rooms]);

  // Filter buildings based on selected site
  const filteredBuildings = useMemo(() => {
    if (selectedSite === 'all') return buildings;
    return buildings.filter(b => b.site_id === selectedSite);
  }, [buildings, selectedSite]);

  // Filter floors based on selected building
  const filteredFloors = useMemo(() => {
    if (selectedFloor !== 'all') return floors.filter(f => f.id === selectedFloor);
    if (selectedBuilding !== 'all') return floors.filter(f => f.building_id === selectedBuilding);
    return floors;
  }, [floors, selectedBuilding, selectedFloor]);

  // Get devices with their locations and sensor data
  const devicesWithData = useMemo(() => {
    return devices.map(device => {
      const floor = floors.find(f => f.id === device.floor_id);
      const room = rooms.find(r => r.floor_id === device.floor_id);
      const sensor = sensorData.find(s => s.device_id === device.id);
      
      let locationString = '';
      if (floor && floor.building) {
        locationString = `${floor.building.site?.name || 'Unknown'} - ${floor.building.name || 'Unknown'}`;
      }

      return {
        ...device,
        floor,
        room,
        sensor,
        locationString,
        roomType: room?.room_type || 'Untagged'
      };
    });
  }, [devices, floors, rooms, sensorData]);

  // Filter devices based on selections
  const filteredDevices = useMemo(() => {
    return devicesWithData.filter(device => {
      // Filter by floor
      const floorIds = filteredFloors.map(f => f.id);
      if (!floorIds.includes(device.floor_id)) return false;

      // Filter by room type
      if (selectedRoomType !== 'all' && device.roomType !== selectedRoomType) return false;

      // Filter by status
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'online' && device.status !== 'online') return false;
        if (selectedStatus === 'offline' && device.status !== 'offline') return false;
        if (selectedStatus === 'alert' && !device.sensor?.aqi || device.sensor.aqi <= 100) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by building name
      const buildingA = a.floor?.building?.name || '';
      const buildingB = b.floor?.building?.name || '';
      return buildingA.localeCompare(buildingB);
    });
  }, [devicesWithData, filteredFloors, selectedRoomType, selectedStatus]);

  // Group devices by building
  const devicesByBuilding = useMemo(() => {
    const grouped = new Map<string, { buildingName: string; buildingId: string; devices: any[] }>();
    
    filteredDevices.forEach(device => {
      const buildingName = device.floor?.building?.name || 'Unassigned Building';
      const buildingId = device.floor?.building?.id || 'unassigned';
      
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
  }, [filteredDevices]);

  const selectedDevice = useMemo(() => {
    return selectedDeviceId ? devicesWithData.find(d => d.id === selectedDeviceId) : null;
  }, [selectedDeviceId, devicesWithData]);

  const loading = locationsLoading || devicesLoading || sensorLoading;

  return (
    <Layout>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-headline-large font-medium text-foreground">Dashboard Overview</h1>
              <p className="text-body-large text-muted-foreground mt-2">
                Real-time air quality monitoring across all locations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
            {/* Filters Bar */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4">
                {/* Location Filters */}
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Building" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buildings</SelectItem>
                    {filteredBuildings.map(building => (
                      <SelectItem key={building.id} value={building.id}>{building.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Floors</SelectItem>
                    {filteredFloors.map(floor => (
                      <SelectItem key={floor.id} value={floor.id}>
                        {floor.name || `Floor ${floor.floor_number}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="alert">Has Alerts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Room Type Tabs */}
              <Tabs value={selectedRoomType} onValueChange={setSelectedRoomType} className="mt-6">
                <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {roomTypes.map(type => (
                    <TabsTrigger key={type} value={type}>{type}</TabsTrigger>
                  ))}
                  <TabsTrigger value="Untagged">Untagged</TabsTrigger>
                </TabsList>
              </Tabs>
            </Card>

              {/* Device Grid */}
              <DeviceGrid
                devicesByBuilding={devicesByBuilding}
                selectedDeviceId={selectedDeviceId}
                onDeviceSelect={setSelectedDeviceId}
                loading={loading}
              />

              {/* Timeline Section */}
              <TimelineChart
                devices={filteredDevices}
                selectedDeviceId={selectedDeviceId}
              />
            </div>
          </div>

          {/* Right Sidebar - Device Details */}
          {selectedDevice && (
            <DeviceDetailSidebar
              device={selectedDevice}
              onClose={() => setSelectedDeviceId(null)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
