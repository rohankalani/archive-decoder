import React from 'react';
import { Card } from '@/components/ui/card';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAqiColor } from '@/utils/chartDataUtils';

interface GlanceViewCardProps {
  device: any;
  isSelected: boolean;
  onClick: () => void;
}

export function GlanceViewCard({ device, isSelected, onClick }: GlanceViewCardProps) {
  const aqi = device.sensor?.aqi || 0;
  const pm25 = device.sensor?.pm25 || 0;
  const co2 = device.sensor?.co2 || 0;
  const voc = device.sensor?.voc || 0;
  const temperature = device.sensor?.temperature || 0;
  const humidity = device.sensor?.humidity || 0;
  const isOffline = device.status !== 'online';

  // Extract room/classroom name from device name
  // e.g., "Engineering Building Classroom 101" -> "Classroom 101"
  const displayName = device.room?.name || device.name.split(' ').slice(-2).join(' ') || device.name;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg p-3 relative min-w-[180px]',
        isSelected && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={onClick}
    >
      {/* Device Name - Show only room name */}
      <div className="text-sm font-semibold mb-3 truncate">
        {displayName}
      </div>

      {!isOffline ? (
        <div className="space-y-2">
          {/* AQI - Prominent */}
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="text-xs text-muted-foreground font-medium">AQI</span>
            <span
              className="font-bold text-2xl"
              style={{ color: getAqiColor(aqi) }}
            >
              {aqi}
            </span>
          </div>

          {/* Sensor Grid - 2 columns */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PM2.5</span>
              <span className="font-medium">{pm25.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CO₂</span>
              <span className="font-medium">{co2}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VOC</span>
              <span className="font-medium">{voc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temp</span>
              <span className="font-medium">{temperature.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-muted-foreground">Humidity</span>
              <span className="font-medium">{humidity.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <WifiOff className="h-8 w-8 mb-2" />
          <span className="text-xs">Offline</span>
        </div>
      )}

      {/* Location Info - Show only floor */}
      <div className="text-xs text-muted-foreground truncate text-center mt-3 pt-2 border-t">
        {device.floor?.name || `Floor ${device.floor?.floor_number || 'N/A'}`}
      </div>
    </Card>
  );
}
