import React from 'react';
import { Card } from '@/components/ui/card';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAqiColor } from '@/utils/chartDataUtils';
import { useSettings } from '@/contexts/SettingsContext';

interface GlanceViewCardProps {
  device: any;
  isSelected: boolean;
  onClick: () => void;
}

export function GlanceViewCard({ device, isSelected, onClick }: GlanceViewCardProps) {
  const { 
    calculatePM25Aqi, 
    calculatePM10Aqi, 
    calculateVOCAqi, 
    calculateHCHOAqi, 
    calculateNOxAqi,
    getQualityFromAqi,
    getQualityColor
  } = useSettings();

  // Add safety checks and logging
  if (!device) {
    console.error('GlanceViewCard: device is null or undefined');
    return null;
  }

  if (!device.sensor) {
    console.warn('GlanceViewCard: device.sensor is missing for device:', device.id);
  }

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

  const displayName = device.room?.name || device.name?.split(' ').slice(-2).join(' ') || device.name || 'Unknown Device';
  const floorName = device.floor?.name || `Floor ${device.floor?.floor_number || 'N/A'}`;

  // Calculate AQI for each sensor and get color based on level
  const getColorFromValue = (calculateFn: (val: number) => number, value: number) => {
    if (value === 0) return 'text-muted-foreground';
    const aqiValue = calculateFn(value);
    const level = getQualityFromAqi(aqiValue);
    const color = getQualityColor(level);
    return color;
  };

  // CO2 color based on standard thresholds mapped to AQI levels
  const getCO2Color = (value: number) => {
    if (value === 0) return 'text-muted-foreground';
    if (value <= 600) return getQualityColor('Good');
    if (value <= 1000) return getQualityColor('Moderate');
    if (value <= 1500) return getQualityColor('Unhealthy for Sensitive Groups');
    if (value <= 2000) return getQualityColor('Unhealthy');
    if (value <= 5000) return getQualityColor('Very Unhealthy');
    return getQualityColor('Hazardous');
  };

  const getTempColor = (value: number) => {
    if (value === 0) return 'text-muted-foreground';
    if (value >= 20 && value <= 24) return getQualityColor('Good');
    if (value >= 18 && value <= 26) return getQualityColor('Moderate');
    if (value >= 16 && value <= 28) return getQualityColor('Unhealthy for Sensitive Groups');
    return getQualityColor('Unhealthy');
  };

  const getHumidityColor = (value: number) => {
    if (value === 0) return 'text-muted-foreground';
    if (value >= 40 && value <= 60) return getQualityColor('Good');
    if (value >= 30 && value <= 70) return getQualityColor('Moderate');
    if (value >= 20 && value <= 80) return getQualityColor('Unhealthy for Sensitive Groups');
    return getQualityColor('Unhealthy');
  };

  const getPM03Color = (value: number) => {
    if (value === 0) return 'text-muted-foreground';
    if (value <= 5) return getQualityColor('Good');
    if (value <= 10) return getQualityColor('Moderate');
    if (value <= 15) return getQualityColor('Unhealthy for Sensitive Groups');
    return getQualityColor('Unhealthy');
  };

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
          <div className="text-lg font-bold text-foreground">{displayName}</div>
          <div className="text-sm text-muted-foreground font-medium">{floorName}</div>
        </div>
        {!isOffline && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide mb-1">AQI</div>
            <div
              className="font-bold text-4xl leading-none"
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
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">PM2.5</div>
              <div className="text-lg font-semibold" style={{ color: getColorFromValue(calculatePM25Aqi, pm25) }}>
                {pm25.toFixed(1)} <span className="text-sm text-foreground font-medium">µg/m³</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">CO₂</div>
              <div className="text-lg font-semibold" style={{ color: getCO2Color(co2) }}>
                {Math.round(co2)} <span className="text-sm text-foreground font-medium">ppm</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">Temp</div>
              <div className="text-lg font-semibold" style={{ color: getTempColor(temperature) }}>
                {temperature.toFixed(1)}<span className="text-sm text-foreground font-medium">°C</span>
              </div>
            </div>
          </div>

          {/* Secondary Sensors - 3 columns */}
          <div className="grid grid-cols-3 gap-3 pb-3 border-b">
            <div className="space-y-0.5">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">PM10</div>
              <div className="text-base font-bold text-foreground" style={{ color: getColorFromValue(calculatePM10Aqi, pm10) }}>
                {pm10.toFixed(1)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">VOC</div>
              <div className="text-base font-bold text-foreground" style={{ color: getColorFromValue(calculateVOCAqi, voc) }}>
                {Math.round(voc)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">Humidity</div>
              <div className="text-base font-bold text-foreground" style={{ color: getHumidityColor(humidity) }}>
                {humidity.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Tertiary Sensors - 3 columns */}
          <div className="grid grid-cols-3 gap-3 pb-3 border-b">
            <div className="space-y-0.5">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">HCHO</div>
              <div className="text-base font-bold text-foreground" style={{ color: getColorFromValue(calculateHCHOAqi, hcho) }}>
                {hcho.toFixed(1)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">NOx</div>
              <div className="text-base font-bold text-foreground" style={{ color: getColorFromValue(calculateNOxAqi, nox) }}>
                {nox.toFixed(1)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">PM0.3</div>
              <div className="text-base font-bold text-foreground" style={{ color: getPM03Color(pm03) }}>
                {pm03.toFixed(1)}
              </div>
            </div>
          </div>

          {/* PM Mass Concentrations - 2 columns - NO COLOR */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b">
            <div className="space-y-0.5">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">PM1</div>
              <div className="text-base font-bold text-foreground">{pm1.toFixed(1)} µg/m³</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">PM5</div>
              <div className="text-base font-bold text-foreground">{pm5.toFixed(1)} µg/m³</div>
            </div>
          </div>

          {/* Particle Counts - 3 columns - NO COLOR */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="space-y-0.5">
              <div className="text-muted-foreground font-bold uppercase tracking-wide">PC0.3</div>
              <div className="font-bold text-foreground">{Math.round(pc03).toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground font-bold uppercase tracking-wide">PC0.5</div>
              <div className="font-bold text-foreground">{Math.round(pc05).toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground font-bold uppercase tracking-wide">PC1</div>
              <div className="font-bold text-foreground">{Math.round(pc1).toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground font-bold uppercase tracking-wide">PC2.5</div>
              <div className="font-bold text-foreground">{Math.round(pc25).toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground font-bold uppercase tracking-wide">PC5</div>
              <div className="font-bold text-foreground">{Math.round(pc5).toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground font-bold uppercase tracking-wide">PC10</div>
              <div className="font-bold text-foreground">{Math.round(pc10).toLocaleString()}</div>
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
