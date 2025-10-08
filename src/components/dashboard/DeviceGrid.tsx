import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Wifi, WifiOff, AlertCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAqiColor } from '@/utils/chartDataUtils';

interface DeviceGridProps {
  devicesByBuilding: Array<{
    buildingName: string;
    buildingId: string;
    devices: any[];
  }>;
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  loading: boolean;
}

export function DeviceGrid({ devicesByBuilding, selectedDeviceId, onDeviceSelect, loading }: DeviceGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-[140px]" />
        ))}
      </div>
    );
  }

  if (devicesByBuilding.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No devices found matching your filters</p>
      </Card>
    );
  }

  const getAqiGradient = (aqi: number) => {
    if (aqi <= 50) return 'from-success/20 via-success/10 to-transparent';
    if (aqi <= 100) return 'from-warning/20 via-warning/10 to-transparent';
    if (aqi <= 150) return 'from-destructive/30 via-destructive/15 to-transparent';
    return 'from-destructive/40 via-destructive/20 to-transparent';
  };

  const getAqiLabel = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    return 'Hazardous';
  };

  const getStatusIndicator = (device: any) => {
    if (device.status === 'offline') return {
      color: 'bg-muted-foreground/20',
      pulse: false,
      icon: WifiOff
    };
    const aqi = device.sensor?.aqi || 0;
    if (aqi <= 50) return {
      color: 'bg-success',
      pulse: true,
      icon: Activity
    };
    if (aqi <= 100) return {
      color: 'bg-warning',
      pulse: true,
      icon: Activity
    };
    return {
      color: 'bg-destructive',
      pulse: true,
      icon: AlertCircle
    };
  };

  return (
    <div className="space-y-8">
      {devicesByBuilding.map((buildingGroup) => (
        <div key={buildingGroup.buildingId} className="space-y-6">
          {/* Building Header */}
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-title-large font-medium text-foreground">
              {buildingGroup.buildingName}
            </h2>
            <Badge variant="secondary" className="ml-2 text-sm px-3 py-1">
              {buildingGroup.devices.length} {buildingGroup.devices.length === 1 ? 'device' : 'devices'}
            </Badge>
          </div>

          {/* Device Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {buildingGroup.devices.map((device) => {
              const isSelected = device.id === selectedDeviceId;
              const aqi = device.sensor?.aqi || 0;
              const isOnline = device.status === 'online';
              const statusInfo = getStatusIndicator(device);
              const StatusIcon = statusInfo.icon;

              return (
                 <Card
                  key={device.id}
                  className={cn(
                    'group relative cursor-pointer transition-all duration-200 overflow-hidden',
                    'bg-card border',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40'
                  )}
                  style={{ boxShadow: isSelected ? 'var(--elevation-2)' : 'var(--elevation-1)' }}
                  onClick={() => onDeviceSelect(device.id)}
                >
                  <CardContent className="relative p-6 space-y-4">
                    {/* Header Section */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Status Indicator */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className={cn('w-2.5 h-2.5 rounded-full', statusInfo.color)} />
                            {statusInfo.pulse && (
                              <div className={cn(
                                'absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping',
                                statusInfo.color,
                                'opacity-75'
                              )} />
                            )}
                          </div>
                          <span className="text-sm font-bold text-foreground uppercase tracking-wide">
                            {isOnline ? 'Live' : 'Offline'}
                          </span>
                        </div>

                        {/* Device Name */}
                        <h3 className="font-medium text-lg leading-tight text-foreground">
                          {device.room?.name || device.name}
                        </h3>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-base text-muted-foreground font-medium">
                          <MapPin className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">
                            {device.floor?.name || `Floor ${device.floor?.floor_number || 'N/A'}`}
                          </span>
                        </div>
                      </div>

                      {/* Room Type Badge */}
                      {device.roomType && device.roomType !== 'Untagged' && (
                        <Badge 
                          variant="secondary" 
                          className="text-sm px-3 py-1"
                        >
                          {device.roomType}
                        </Badge>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border" />

                    {/* AQI/Status Display */}
                    {isOnline ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* AQI Value */}
                          <div
                            className="flex items-center justify-center w-20 h-20 rounded-xl text-3xl font-bold text-white transition-transform duration-200 hover:scale-105"
                            style={{ backgroundColor: getAqiColor(aqi) }}
                          >
                            {aqi}
                          </div>

                          {/* AQI Details */}
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide">Air Quality</p>
                            <p className="text-base font-bold" style={{ color: getAqiColor(aqi) }}>
                              {getAqiLabel(aqi)}
                            </p>
                            <div className="flex items-center gap-1.5 text-sm text-foreground font-medium">
                              <Activity className="h-4 w-4" />
                              <span>{device.sensor?.pm25?.toFixed(1) || '--'} μg/m³</span>
                            </div>
                          </div>
                        </div>

                        {/* Alert Icon */}
                        {aqi > 100 && (
                          <AlertCircle className="h-6 w-6 text-destructive" />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 py-2">
                        <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-muted">
                          <WifiOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide">Status</p>
                          <p className="text-base font-bold text-foreground">Offline</p>
                          <p className="text-sm text-muted-foreground font-medium">No data available</p>
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
  );
}
