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

// Helper function for AQI status
const getAqiStatus = (aqi: number) => {
  if (aqi <= 50) return { label: 'Good', color: 'success', bgColor: 'bg-success/10', borderColor: 'border-success' };
  if (aqi <= 100) return { label: 'Moderate', color: 'warning', bgColor: 'bg-warning/10', borderColor: 'border-warning' };
  return { label: 'Unhealthy', color: 'destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive' };
};

// Memoized building card component for performance
const BuildingCard = memo(({ buildingId, stats, onBuildingClick }: {
  buildingId: string;
  stats: any;
  onBuildingClick: (id: string) => void;
}) => {
  const status = getAqiStatus(stats.avgAqi);
  
  return (
    <Card 
      className="bg-card hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/30 group"
      onClick={() => onBuildingClick(buildingId)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
              {stats.buildingName}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">
              {stats.siteName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(stats.smokeDetected || stats.vocDetected || stats.alertCount > 0) && (
              <div className="flex items-center gap-1 bg-destructive/20 text-destructive px-2 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs font-medium">{stats.alertCount}</span>
              </div>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center p-4 rounded-lg bg-muted/30">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Average AQI
          </div>
          <div className={`text-3xl font-bold ${
            status.color === 'success' ? 'text-success' : 
            status.color === 'warning' ? 'text-warning' : 'text-destructive'
          }`}>
            {stats.avgAqi}
          </div>
          <div className={`text-sm font-medium ${
            status.color === 'success' ? 'text-success' : 
            status.color === 'warning' ? 'text-warning' : 'text-destructive'
          }`}>
            {status.label}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Devices</span>
            <span className="text-sm font-bold">{stats.totalDevices}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-success" />
                <span className="text-xs font-medium text-muted-foreground">Online</span>
              </div>
              <span className="text-sm font-bold text-success">{stats.onlineDevices}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <WifiOff className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Offline</span>
              </div>
              <span className="text-sm font-bold text-muted-foreground">{stats.offlineDevices}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-xs font-medium text-muted-foreground">Peak AQI</span>
            <span className={`text-sm font-bold ${
              getAqiStatus(stats.maxAqi).color === 'success' ? 'text-success' : 
              getAqiStatus(stats.maxAqi).color === 'warning' ? 'text-warning' : 'text-destructive'
            }`}>
              {stats.maxAqi}
            </span>
          </div>
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
        vocDetected
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

        {/* Building Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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