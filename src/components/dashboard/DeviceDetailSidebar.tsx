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
  
  const getAqiStatus = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAqiTextColor = (aqi: number) => {
    // Use dark text for yellow (Moderate 51-100) for better contrast
    if (aqi > 50 && aqi <= 100) return 'text-gray-900';
    // White text for all other colors
    return 'text-white';
  };

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
      unit: 'μg/m³',
      icon: Activity,
      color: 'text-red-500'
    }
  ];

  return (
    <div className="w-[320px] border-l border-border bg-card overflow-auto">
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

        {/* AQI Score */}
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground mb-2">Air Quality Score</p>
          <div
            className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold",
              getAqiTextColor(aqi)
            )}
            style={{ backgroundColor: getAqiColor(aqi) }}
          >
            {aqi}
          </div>
          <p className="text-xs font-medium mt-1" style={{ color: getAqiColor(aqi) }}>
            {getAqiStatus(aqi)}
          </p>
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
                <span className="text-sm font-bold">{metric.value}</span>
                <span className="text-xs text-muted-foreground ml-1">{metric.unit}</span>
              </div>
            </div>
          ))}
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
  );
}
