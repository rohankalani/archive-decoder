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

// Color coding functions based on thresholds
const getPM25Color = (value: number) => {
  if (value <= 12) return 'text-green-500';
  if (value <= 35.4) return 'text-yellow-500';
  if (value <= 55.4) return 'text-orange-500';
  return 'text-red-500';
};

const getPM10Color = (value: number) => {
  if (value <= 54) return 'text-green-500';
  if (value <= 154) return 'text-yellow-500';
  if (value <= 254) return 'text-orange-500';
  return 'text-red-500';
};

const getCO2Color = (value: number) => {
  if (value <= 600) return 'text-green-500';
  if (value <= 1000) return 'text-yellow-500';
  if (value <= 1500) return 'text-orange-500';
  return 'text-red-500';
};

const getVOCColor = (value: number) => {
  if (value <= 50) return 'text-green-500';
  if (value <= 100) return 'text-yellow-500';
  if (value <= 200) return 'text-orange-500';
  return 'text-red-500';
};

const getHCHOColor = (value: number) => {
  if (value <= 30) return 'text-green-500';
  if (value <= 80) return 'text-yellow-500';
  if (value <= 120) return 'text-orange-500';
  return 'text-red-500';
};

const getNOxColor = (value: number) => {
  if (value <= 0.5) return 'text-green-500';
  if (value <= 1) return 'text-yellow-500';
  if (value <= 2) return 'text-orange-500';
  return 'text-red-500';
};

const getPM03Color = (value: number) => {
  if (value <= 5) return 'text-green-500';
  if (value <= 10) return 'text-yellow-500';
  if (value <= 15) return 'text-orange-500';
  return 'text-red-500';
};

const getTempColor = (value: number) => {
  if (value >= 20 && value <= 24) return 'text-green-500';
  if (value >= 18 && value <= 26) return 'text-yellow-500';
  return 'text-orange-500';
};

const getHumidityColor = (value: number) => {
  if (value >= 40 && value <= 60) return 'text-green-500';
  if (value >= 30 && value <= 70) return 'text-yellow-500';
  return 'text-orange-500';
};

export function GlanceViewCard({ device, isSelected, onClick }: GlanceViewCardProps) {
  const aqi = device.sensor?.aqi || 0;
  const pm25 = device.sensor?.pm25 || 0;
  const pm10 = device.sensor?.pm10 || 0;
  const pm03 = device.sensor?.pm03 || 0;
  const pm1 = device.sensor?.pm1 || 0;
  const pm5 = device.sensor?.pm5 || 0;
  const co2 = device.sensor?.co2 || 0;
  const voc = device.sensor?.voc || 0;
  const hcho = device.sensor?.hcho || 0;
  const nox = device.sensor?.nox || 0;
  const temperature = device.sensor?.temperature || 0;
  const humidity = device.sensor?.humidity || 0;
  const pc03 = device.sensor?.pc03 || 0;
  const pc05 = device.sensor?.pc05 || 0;
  const pc1 = device.sensor?.pc1 || 0;
  const pc25 = device.sensor?.pc25 || 0;
  const pc5 = device.sensor?.pc5 || 0;
  const pc10 = device.sensor?.pc10 || 0;
  const isOffline = device.status !== 'online';

  const displayName = device.room?.name || device.name.split(' ').slice(-2).join(' ') || device.name;
  const floorName = device.floor?.name || `Floor ${device.floor?.floor_number || 'N/A'}`;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg p-4 relative',
        isSelected && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={onClick}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-base font-bold">{displayName}</div>
          <div className="text-xs text-muted-foreground">{floorName}</div>
        </div>
        {!isOffline && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-medium mb-1">AQI</div>
            <div
              className="font-bold text-3xl leading-none"
              style={{ color: getAqiColor(aqi) }}
            >
              {aqi}
            </div>
          </div>
        )}
      </div>

      {!isOffline ? (
        <div className="space-y-3">
          {/* Primary Sensors - 3 columns */}
          <div className="grid grid-cols-3 gap-3 pb-3 border-b">
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">PM2.5</div>
              <div className={cn("text-base font-semibold", getPM25Color(pm25))}>
                {pm25.toFixed(1)} <span className="text-xs text-muted-foreground">µg/m³</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">CO₂</div>
              <div className={cn("text-base font-semibold", getCO2Color(co2))}>
                {Math.round(co2)} <span className="text-xs text-muted-foreground">ppm</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">Temp</div>
              <div className={cn("text-base font-semibold", getTempColor(temperature))}>
                {temperature.toFixed(1)}<span className="text-xs text-muted-foreground">°C</span>
              </div>
            </div>
          </div>

          {/* Secondary Sensors - 3 columns */}
          <div className="grid grid-cols-3 gap-3 pb-3 border-b">
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">PM10</div>
              <div className={cn("text-sm font-medium", getPM10Color(pm10))}>
                {pm10.toFixed(1)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">VOC</div>
              <div className={cn("text-sm font-medium", getVOCColor(voc))}>
                {Math.round(voc)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">Humidity</div>
              <div className={cn("text-sm font-medium", getHumidityColor(humidity))}>
                {humidity.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Tertiary Sensors - 3 columns */}
          <div className="grid grid-cols-3 gap-3 pb-3 border-b">
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">HCHO</div>
              <div className={cn("text-sm font-medium", getHCHOColor(hcho))}>
                {hcho.toFixed(1)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">NOx</div>
              <div className={cn("text-sm font-medium", getNOxColor(nox))}>
                {nox.toFixed(1)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">PM0.3</div>
              <div className={cn("text-sm font-medium", getPM03Color(pm03))}>
                {pm03.toFixed(1)}
              </div>
            </div>
          </div>

          {/* PM Mass Concentrations - 2 columns - NO COLOR */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b">
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">PM1</div>
              <div className="text-sm font-medium text-foreground">{pm1.toFixed(1)} µg/m³</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">PM5</div>
              <div className="text-sm font-medium text-foreground">{pm5.toFixed(1)} µg/m³</div>
            </div>
          </div>

          {/* Particle Counts - 3 columns - NO COLOR */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="space-y-0.5">
              <div className="text-muted-foreground">PC0.3</div>
              <div className="font-medium text-foreground">{Math.round(pc03).toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground">PC0.5</div>
              <div className="font-medium text-foreground">{Math.round(pc05).toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground">PC1</div>
              <div className="font-medium text-foreground">{Math.round(pc1).toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground">PC2.5</div>
              <div className="font-medium text-foreground">{Math.round(pc25).toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground">PC5</div>
              <div className="font-medium text-foreground">{Math.round(pc5).toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground">PC10</div>
              <div className="font-medium text-foreground">{Math.round(pc10).toLocaleString()}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <WifiOff className="h-10 w-10 mb-2" />
          <span className="text-sm font-medium">Offline</span>
        </div>
      )}
    </Card>
  );
}
