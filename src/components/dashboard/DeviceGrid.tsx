import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Wifi, WifiOff, AlertCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAqiColor } from '@/utils/chartDataUtils';

interface DeviceGridProps {
  devices: any[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  loading: boolean;
}

export function DeviceGrid({ devices, selectedDeviceId, onDeviceSelect, loading }: DeviceGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-[140px]" />
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5">
      {devices.map((device) => {
        const isSelected = device.id === selectedDeviceId;
        const aqi = device.sensor?.aqi || 0;
        const isOnline = device.status === 'online';
        const statusInfo = getStatusIndicator(device);
        const StatusIcon = statusInfo.icon;

        return (
          <Card
            key={device.id}
            className={cn(
              'group relative cursor-pointer transition-all duration-300 hover-lift overflow-hidden',
              'backdrop-blur-sm bg-card/50 border-2 active:scale-95',
              isSelected
                ? 'border-primary shadow-2xl ring-2 ring-primary/30 scale-105'
                : 'border-border/50 hover:border-primary/40 hover:shadow-xl'
            )}
            onClick={() => onDeviceSelect(device.id)}
          >
            {/* Gradient Background Overlay */}
            {isOnline && (
              <div 
                className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                  getAqiGradient(aqi)
                )}
              />
            )}

            <CardContent className="relative p-4 md:p-5 space-y-3 md:space-y-4">
              {/* Header Section */}
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
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
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {isOnline ? 'Live' : 'Offline'}
                    </span>
                  </div>

                  {/* Device Name */}
                  <h3 className="font-semibold text-sm md:text-base leading-tight truncate group-hover:text-primary transition-colors">
                    {device.name}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                    <span className="truncate">{device.locationString}</span>
                  </div>
                </div>

                {/* Room Type Badge */}
                {device.roomType && (
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20 font-medium flex-shrink-0"
                  >
                    {device.roomType}
                  </Badge>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* AQI/Status Display */}
              {isOnline ? (
                <div className="flex items-center justify-between">
                  {/* Large AQI Circle */}
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative group/aqi">
                      <div
                        className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl text-xl md:text-2xl font-bold text-white shadow-lg transition-transform duration-300 active:scale-95 group-hover/aqi:scale-110"
                        style={{ backgroundColor: getAqiColor(aqi) }}
                      >
                        {aqi}
                      </div>
                      {/* Glow Effect */}
                      <div 
                        className="absolute inset-0 rounded-2xl blur-xl opacity-40 group-hover/aqi:opacity-60 transition-opacity"
                        style={{ backgroundColor: getAqiColor(aqi) }}
                      />
                    </div>

                    {/* AQI Details */}
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">Air Quality</p>
                      <p className="text-sm font-bold" style={{ color: getAqiColor(aqi) }}>
                        {getAqiLabel(aqi)}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Activity className="h-3 w-3" />
                        <span>{device.sensor?.pm25?.toFixed(1) || '--'} μg/m³</span>
                      </div>
                    </div>
                  </div>

                  {/* Alert Icon */}
                  {aqi > 100 && (
                    <div className="animate-pulse">
                      <StatusIcon className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 md:gap-4 py-2">
                  {/* Offline Icon */}
                  <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 backdrop-blur">
                    <WifiOff className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
                  </div>

                  {/* Offline Status */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Status</p>
                    <p className="text-sm font-bold text-muted-foreground">Offline</p>
                    <p className="text-xs text-muted-foreground/70">No data available</p>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-l-[40px] border-t-primary border-l-transparent">
                <div className="absolute -top-9 -left-7 w-3 h-3 bg-primary-foreground rounded-full" />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
