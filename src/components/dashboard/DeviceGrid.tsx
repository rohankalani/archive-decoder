import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Wifi, WifiOff, AlertCircle } from 'lucide-react';
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

  const getStatusColor = (device: any) => {
    if (device.status === 'offline') return 'bg-gray-400';
    const aqi = device.sensor?.aqi || 0;
    return getAqiColor(aqi);
  };

  const getStatusDot = (device: any) => {
    if (device.status === 'offline') return 'bg-gray-400';
    const aqi = device.sensor?.aqi || 0;
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {devices.map((device) => {
        const isSelected = device.id === selectedDeviceId;
        const aqi = device.sensor?.aqi || 0;
        const hasAlert = device.status === 'online' && aqi > 100;

        return (
          <Card
            key={device.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md border-2',
              isSelected
                ? 'border-primary shadow-lg ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => onDeviceSelect(device.id)}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={cn('w-2 h-2 rounded-full', getStatusDot(device))}
                    />
                    <h3 className="font-semibold text-sm truncate">{device.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{device.locationString}</span>
                  </div>
                </div>
                
                {hasAlert && (
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 ml-2" />
                )}
              </div>

              {/* AQI Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {device.status === 'online' ? (
                    <>
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold text-white"
                        style={{ backgroundColor: getAqiColor(aqi) }}
                      >
                        {aqi}
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">AQI Score</p>
                        <p className="font-medium">{device.sensor?.pm25?.toFixed(1) || '--'} μg/m³</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                        <WifiOff className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium text-muted-foreground">Offline</p>
                      </div>
                    </>
                  )}
                </div>

                {device.roomType && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0">
                    {device.roomType}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
