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
  const isOffline = device.status !== 'online';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg p-4 relative',
        isSelected && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={onClick}
    >
      {/* Device Name */}
      <div className="text-sm font-medium text-muted-foreground mb-2 truncate">
        {device.name}
      </div>

      {/* AQI Score Circle */}
      {!isOffline ? (
        <div className="flex items-center justify-center my-4">
          <div
            className="flex items-center justify-center rounded-full text-white font-bold w-16 h-16 text-2xl"
            style={{ backgroundColor: getAqiColor(aqi) }}
          >
            {aqi}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center my-4 text-muted-foreground">
          <WifiOff className="h-8 w-8 mb-2" />
          <span className="text-xs">Offline</span>
        </div>
      )}

      {/* Location Info */}
      <div className="text-xs text-muted-foreground truncate text-center">
        {device.locationString}
      </div>
    </Card>
  );
}
