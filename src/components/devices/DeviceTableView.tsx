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

const getValueColor = (value: number | undefined, sensor: 'pm' | 'co2' | 'voc') => {
  if (!value) return 'text-muted-foreground';
  
  switch (sensor) {
    case 'pm':
      if (value <= 12) return 'text-success';
      if (value <= 35) return 'text-warning';
      return 'text-destructive';
    case 'co2':
      if (value <= 600) return 'text-success';
      if (value <= 1000) return 'text-warning';
      return 'text-destructive';
    case 'voc':
      if (value <= 220) return 'text-success';
      if (value <= 660) return 'text-warning';
      return 'text-destructive';
    default:
      return 'text-foreground';
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
                          <TableHead className="w-20">AQI</TableHead>
                          <TableHead className="min-w-[150px]">Name</TableHead>
                          <TableHead className="text-right">PM₂.₅</TableHead>
                          <TableHead className="text-right">PM₁₀</TableHead>
                          <TableHead className="text-right">CO₂</TableHead>
                          <TableHead className="text-right">TVOC</TableHead>
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
                                  <p className="font-medium text-foreground">{device.device_name}</p>
                                  <p className="text-xs text-muted-foreground">{device.floor_name || 'Unknown Floor'}</p>
                                </div>
                              </TableCell>
                              
                              {/* PM2.5 */}
                              <TableCell className="text-right">
                                {!isOffline ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={cn('text-sm font-medium', getValueColor(device.pm25, 'pm'))}>
                                      {device.pm25?.toFixed(0) || '--'}
                                    </span>
                                    <div className={cn('w-1.5 h-1.5 rounded-full', getValueColor(device.pm25, 'pm').replace('text-', 'bg-'))} />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              
                              {/* PM10 */}
                              <TableCell className="text-right">
                                {!isOffline ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={cn('text-sm font-medium', getValueColor(device.pm10, 'pm'))}>
                                      {device.pm10?.toFixed(0) || '--'}
                                    </span>
                                    <div className={cn('w-1.5 h-1.5 rounded-full', getValueColor(device.pm10, 'pm').replace('text-', 'bg-'))} />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              
                              {/* CO2 */}
                              <TableCell className="text-right">
                                {!isOffline ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={cn('text-sm font-medium', getValueColor(device.co2, 'co2'))}>
                                      {device.co2?.toFixed(0) || '--'}
                                    </span>
                                    <div className={cn('w-1.5 h-1.5 rounded-full', getValueColor(device.co2, 'co2').replace('text-', 'bg-'))} />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              
                              {/* TVOC */}
                              <TableCell className="text-right">
                                {!isOffline ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={cn('text-sm font-medium', getValueColor(device.voc, 'voc'))}>
                                      {device.voc?.toFixed(0) || '--'}
                                    </span>
                                    <div className={cn('w-1.5 h-1.5 rounded-full', getValueColor(device.voc, 'voc').replace('text-', 'bg-'))} />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">--</span>
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
