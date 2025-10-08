import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { getAqiColor } from '@/utils/chartDataUtils';
import { Users } from 'lucide-react';

interface Device {
  device_id: string;
  device_name: string;
  aqi: number;
  pm25?: number;
  pm10?: number;
  co2?: number;
  voc?: number;
  status: 'online' | 'offline';
  floor_name?: string;
}

interface DeviceTableViewProps {
  groupedDevices: Record<string, {
    siteName: string;
    buildings: Record<string, {
      buildingName: string;
      devices: Device[];
    }>;
  }>;
  onDeviceClick: (deviceId: string) => void;
}

// Get color based on settings page breakpoints - returns HSL color string
const getValueColor = (value: number | undefined, sensor: 'pm25' | 'pm10' | 'co2' | 'voc'): string => {
  if (!value) return 'hsl(var(--muted-foreground))';
  
  switch (sensor) {
    case 'pm25':
      // PM2.5 breakpoints: 0-50 Good, 51-100 Moderate, 101-150 USG, 151-200 Unhealthy, 201-300 Very Unhealthy, 301+ Hazardous
      if (value <= 50) return 'hsl(120, 85%, 35%)';
      if (value <= 100) return 'hsl(45, 100%, 40%)';
      if (value <= 150) return 'hsl(30, 100%, 45%)';
      if (value <= 200) return 'hsl(0, 100%, 45%)';
      if (value <= 300) return 'hsl(280, 90%, 35%)';
      return 'hsl(320, 100%, 25%)';
      
    case 'pm10':
      // PM10 breakpoints: 0-50 Good, 51-100 Moderate, 101-150 USG, 151-250 Unhealthy, 251-350 Very Unhealthy, 351+ Hazardous
      if (value <= 50) return 'hsl(120, 85%, 35%)';
      if (value <= 100) return 'hsl(45, 100%, 40%)';
      if (value <= 150) return 'hsl(30, 100%, 45%)';
      if (value <= 250) return 'hsl(0, 100%, 45%)';
      if (value <= 350) return 'hsl(280, 90%, 35%)';
      return 'hsl(320, 100%, 25%)';
      
    case 'co2':
      // CO2 breakpoints: 0-600 Good, 601-1000 Moderate, 1001-1500 USG, 1501-2500 Unhealthy, 2501-5000 Very Unhealthy, 5001+ Hazardous
      if (value <= 600) return 'hsl(120, 85%, 35%)';
      if (value <= 1000) return 'hsl(45, 100%, 40%)';
      if (value <= 1500) return 'hsl(30, 100%, 45%)';
      if (value <= 2500) return 'hsl(0, 100%, 45%)';
      if (value <= 5000) return 'hsl(280, 90%, 35%)';
      return 'hsl(320, 100%, 25%)';
      
    case 'voc':
      // VOC breakpoints: 0-220 Good, 221-660 Moderate, 661-1430 USG, 1431-2200 Unhealthy, 2201-3300 Very Unhealthy, 3301+ Hazardous
      if (value <= 220) return 'hsl(120, 85%, 35%)';
      if (value <= 660) return 'hsl(45, 100%, 40%)';
      if (value <= 1430) return 'hsl(30, 100%, 45%)';
      if (value <= 2200) return 'hsl(0, 100%, 45%)';
      if (value <= 3300) return 'hsl(280, 90%, 35%)';
      return 'hsl(320, 100%, 25%)';
      
    default:
      return 'hsl(var(--foreground))';
  }
};

export function DeviceTableView({ groupedDevices, onDeviceClick }: DeviceTableViewProps) {
  return (
    <div className="space-y-8">
      {Object.entries(groupedDevices).map(([siteKey, site]) => (
        <div key={siteKey} className="space-y-6">
          {Object.entries(site.buildings).map(([buildingKey, building]) => (
            <Card key={buildingKey} className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{building.buildingName}</CardTitle>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-xs">
                      {building.devices.length} devices
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {site.siteName}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="overflow-x-auto -mx-6">
                  <div className="inline-block min-w-full align-middle px-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="w-12">
                            <Checkbox />
                          </TableHead>
                          <TableHead className="w-20 text-base font-medium">AQI</TableHead>
                          <TableHead className="min-w-[150px] text-base font-medium">Name</TableHead>
                          <TableHead className="text-right text-base font-medium">PM₂.₅</TableHead>
                          <TableHead className="text-right text-base font-medium">PM₁₀</TableHead>
                          <TableHead className="text-right text-base font-medium">CO₂</TableHead>
                          <TableHead className="text-right text-base font-medium">TVOC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {building.devices.map((device) => {
                          const aqiColor = getAqiColor(device.aqi || 0);
                          const isOffline = device.status !== 'online';
                          
                          return (
                            <TableRow
                              key={device.device_id}
                              className={cn(
                                'cursor-pointer transition-colors hover:bg-muted/30 active:bg-muted/50',
                                isOffline && 'opacity-60'
                              )}
                              onClick={() => onDeviceClick(device.device_id)}
                            >
                              <TableCell>
                                <Checkbox />
                              </TableCell>
                              
                              {/* AQI Value */}
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  {!isOffline ? (
                                    <span
                                      className="text-2xl md:text-3xl font-bold transition-transform active:scale-95 hover:scale-110"
                                      style={{ color: aqiColor }}
                                    >
                                      {device.aqi}
                                    </span>
                                  ) : (
                                    <span className="text-xl md:text-2xl text-muted-foreground font-medium">
                                      --
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              
                              {/* Device Name */}
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="text-base font-medium text-foreground">{device.device_name}</p>
                                  <p className="text-sm text-muted-foreground">{device.floor_name || 'Unknown Floor'}</p>
                                </div>
                              </TableCell>
                              
                              {/* PM2.5 */}
                              <TableCell className="text-right">
                                {!isOffline ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-base font-medium" style={{ color: getValueColor(device.pm25, 'pm25') }}>
                                      {device.pm25?.toFixed(0) || '--'}
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getValueColor(device.pm25, 'pm25') }} />
                                  </div>
                                ) : (
                                  <span className="text-base text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              
                              {/* PM10 */}
                              <TableCell className="text-right">
                                {!isOffline ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-base font-medium" style={{ color: getValueColor(device.pm10, 'pm10') }}>
                                      {device.pm10?.toFixed(0) || '--'}
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getValueColor(device.pm10, 'pm10') }} />
                                  </div>
                                ) : (
                                  <span className="text-base text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              
                              {/* CO2 */}
                              <TableCell className="text-right">
                                {!isOffline ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-base font-medium" style={{ color: getValueColor(device.co2, 'co2') }}>
                                      {device.co2?.toFixed(0) || '--'}
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getValueColor(device.co2, 'co2') }} />
                                  </div>
                                ) : (
                                  <span className="text-base text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              
                              {/* TVOC */}
                              <TableCell className="text-right">
                                {!isOffline ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-base font-medium" style={{ color: getValueColor(device.voc, 'voc') }}>
                                      {device.voc?.toFixed(0) || '--'}
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getValueColor(device.voc, 'voc') }} />
                                  </div>
                                ) : (
                                  <span className="text-base text-muted-foreground">--</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
