import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  MapPin,
  Activity,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Gauge,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { useDevices } from '@/contexts/DeviceContext';
import { useRealtimeData } from '@/contexts/RealtimeDataContext';
import { useSettings } from '@/contexts/SettingsContext';
import { AqiLevel } from '@/types';
import { format } from 'date-fns';

export function Dashboard() {
  const { devices, locations } = useDevices();
  const { realtimeData, getDeviceData, isLoading } = useRealtimeData();
  const { getQualityColor } = useSettings();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Filter devices by selected location
  const filteredDevices = selectedLocation === 'all' 
    ? devices 
    : devices.filter(device => device.location.id === selectedLocation);

  // Get location stats
  const locationStats = locations.map(location => {
    const locationDevices = devices.filter(d => d.location.id === location.id);
    const onlineDevices = locationDevices.filter(d => d.isOnline);
    const locationData = realtimeData.filter(data => 
      locationDevices.some(device => device.id === data.deviceId)
    );
    
    const avgAqi = locationData.length > 0 
      ? Math.round(locationData.reduce((sum, data) => sum + data.aqi, 0) / locationData.length)
      : 0;
    
    const worstQuality = locationData.reduce((worst: AqiLevel, data) => {
      const levels: AqiLevel[] = ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];
      return levels.indexOf(data.overallQuality) > levels.indexOf(worst) ? data.overallQuality : worst;
    }, 'Good');

    return {
      location,
      totalDevices: locationDevices.length,
      onlineDevices: onlineDevices.length,
      avgAqi,
      quality: worstQuality
    };
  });

  // Prepare chart data
  const aqiChartData = realtimeData.map(data => {
    const device = devices.find(d => d.id === data.deviceId);
    return {
      name: device?.name.split(' - ')[1] || device?.name || 'Unknown',
      location: device?.location.name || 'Unknown',
      aqi: data.aqi,
      quality: data.overallQuality,
      fill: getQualityColor(data.overallQuality)
    };
  });

  // Quality distribution for pie chart
  const qualityDistribution = realtimeData.reduce((acc, data) => {
    acc[data.overallQuality] = (acc[data.overallQuality] || 0) + 1;
    return acc;
  }, {} as Record<AqiLevel, number>);

  const pieData = Object.entries(qualityDistribution).map(([quality, count]) => ({
    name: quality,
    value: count,
    fill: getQualityColor(quality as AqiLevel)
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading air quality data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring via MQTT • {realtimeData.length} devices active
          </p>
        </div>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(location => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {locationStats.map(({ location, totalDevices, onlineDevices, avgAqi, quality }) => (
          <Card key={location.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{location.name}</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{avgAqi}</span>
                  <Badge 
                    variant="secondary" 
                    style={{ backgroundColor: getQualityColor(quality), color: 'white' }}
                  >
                    {quality}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{onlineDevices}/{totalDevices} devices online</span>
                  <span>{location.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="aqi-overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aqi-overview">AQI Overview</TabsTrigger>
          <TabsTrigger value="quality-distribution">Quality Distribution</TabsTrigger>
          <TabsTrigger value="device-status">Device Status</TabsTrigger>
        </TabsList>

        <TabsContent value="aqi-overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current AQI by Device</CardTitle>
              <CardDescription>Real-time air quality index readings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={aqiChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value} AQI`,
                      `${props.payload.quality}`
                    ]}
                    labelFormatter={(label: string, payload: any) => 
                      payload?.[0]?.payload.location ? 
                      `${label} (${payload[0].payload.location})` : 
                      label
                    }
                  />
                  <Bar dataKey="aqi" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality-distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Air Quality Distribution</CardTitle>
              <CardDescription>Distribution of air quality levels across all devices</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="device-status" className="space-y-4">
          <div className="grid gap-4">
            {filteredDevices.map(device => {
              const deviceData = getDeviceData(device.id);
              const isOnline = device.isOnline;
              const lastSeen = new Date(device.lastSeen);
              const timeSinceLastSeen = Math.floor((Date.now() - lastSeen.getTime()) / 60000);

              return (
                <Card key={device.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {device.location.name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOnline ? (
                          <Badge variant="default" className="bg-green-500">
                            <Wifi className="h-3 w-3 mr-1" />
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <WifiOff className="h-3 w-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                        {deviceData && (
                          <Badge 
                            variant="secondary"
                            style={{ 
                              backgroundColor: getQualityColor(deviceData.overallQuality),
                              color: 'white'
                            }}
                          >
                            AQI {deviceData.aqi}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {/* Device Status */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Battery className="h-4 w-4" />
                          <span>Battery: {device.batteryLevel}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Signal className="h-4 w-4" />
                          <span>Signal: {device.signalStrength} dBm</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last seen: {timeSinceLastSeen < 1 ? 'Just now' : `${timeSinceLastSeen}m ago`}
                        </div>
                      </div>

                      {/* Key Readings */}
                      {deviceData && (
                        <>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">PM2.5</div>
                            <div className="text-lg font-bold">
                              {deviceData.readings.find(r => r.metric === 'pm25')?.value.toFixed(1)} µg/m³
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {deviceData.readings.find(r => r.metric === 'pm25')?.quality}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-sm font-medium">CO₂</div>
                            <div className="text-lg font-bold">
                              {deviceData.readings.find(r => r.metric === 'co2')?.value.toFixed(0)} ppm
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {deviceData.readings.find(r => r.metric === 'co2')?.quality}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-sm font-medium">VOC</div>
                            <div className="text-lg font-bold">
                              {deviceData.readings.find(r => r.metric === 'voc')?.value.toFixed(0)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {deviceData.readings.find(r => r.metric === 'voc')?.quality}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}