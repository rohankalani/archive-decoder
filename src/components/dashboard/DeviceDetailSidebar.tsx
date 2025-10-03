import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, MapPin, Thermometer, Droplets, Wind, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAqiColor } from '@/utils/chartDataUtils';

interface DeviceDetailSidebarProps {
  device: any;
  onClose: () => void;
}

export function DeviceDetailSidebar({ device, onClose }: DeviceDetailSidebarProps) {
  const sensor = device.sensor;
  const aqi = sensor?.aqi || 0;
  
  // Determine dominant pollutant
  const getDominantPollutant = () => {
    const pollutants = [
      { name: 'PM2.5', value: sensor?.pm25 || 0, threshold: 35 },
      { name: 'PM10', value: sensor?.pm10 || 0, threshold: 150 },
      { name: 'CO₂', value: sensor?.co2 || 0, threshold: 1000 },
      { name: 'VOC', value: sensor?.voc || 0, threshold: 500 },
      { name: 'HCHO', value: sensor?.hcho || 0, threshold: 100 },
    ];

    // Find the pollutant with the highest ratio to its threshold
    let dominant = pollutants[0];
    let maxRatio = 0;

    pollutants.forEach(p => {
      const ratio = p.value / p.threshold;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        dominant = p;
      }
    });

    return dominant.name;
  };

  const dominantPollutant = getDominantPollutant();

  const metrics = [
    {
      label: 'Temperature',
      value: sensor?.temperature?.toFixed(1) || '--',
      unit: '°C',
      icon: Thermometer,
      color: 'text-blue-500'
    },
    {
      label: 'Humidity',
      value: sensor?.humidity?.toFixed(0) || '--',
      unit: '%',
      icon: Droplets,
      color: 'text-cyan-500'
    },
    {
      label: 'CO₂',
      value: sensor?.co2?.toFixed(0) || '--',
      unit: 'ppm',
      icon: Wind,
      color: 'text-orange-500'
    },
    {
      label: 'PM2.5',
      value: sensor?.pm25?.toFixed(1) || '--',
      unit: 'μg/m³',
      icon: Activity,
      color: 'text-purple-500'
    },
    {
      label: 'PM10',
      value: sensor?.pm10?.toFixed(1) || '--',
      unit: 'μg/m³',
      icon: Activity,
      color: 'text-pink-500'
    },
    {
      label: 'VOC',
      value: sensor?.voc?.toFixed(0) || '--',
      unit: 'ppb',
      icon: Wind,
      color: 'text-amber-500'
    },
    {
      label: 'HCHO',
      value: sensor?.hcho?.toFixed(0) || '--',
      unit: 'ppb',
      icon: Activity,
      color: 'text-red-500'
    }
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-[400px] border-l border-border bg-card overflow-auto z-50 shadow-2xl">
        <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Device Details</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

      <div className="p-4 space-y-4">
        {/* Device Name & Location */}
        <div>
          <h4 className="text-lg font-bold mb-1">{device.name}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{device.locationString}</span>
          </div>
          {device.room && (
            <Badge variant="outline" className="mt-2 text-xs">
              {device.room.name}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Metrics List */}
        <div className="space-y-2.5">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <metric.icon className={cn('h-3.5 w-3.5', metric.color)} />
                <span className="text-xs font-medium text-muted-foreground">
                  {metric.label}
                </span>
              </div>
              <div className="text-right">
                <span className={cn("text-sm font-bold", metric.color)}>{metric.value}</span>
                <span className="text-xs text-muted-foreground ml-1">{metric.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dominant Pollutant */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">Dominant Pollutant</p>
          <p className="text-sm font-bold" style={{ color: getAqiColor(aqi) }}>
            {dominantPollutant}
          </p>
        </div>

        {/* Last Updated */}
        {sensor?.last_updated && (
          <>
            <Separator />
            <p className="text-xs text-muted-foreground text-center">
              Last updated: {new Date(sensor.last_updated).toLocaleString()}
            </p>
          </>
        )}
      </div>
      </div>
    </>
  );
}
