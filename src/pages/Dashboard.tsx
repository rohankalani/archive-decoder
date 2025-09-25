import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveSensorData } from '@/hooks/useLiveSensorData';
import { useDevices } from '@/hooks/useDevices';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Wind, 
  Droplets, 
  Gauge, 
  ThermometerSun,
  AlertTriangle,
  CheckCircle,
  Circle,
  Activity,
  Loader2
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { sensorData, loading: sensorLoading, overallStats } = useLiveSensorData();
  const { devices, loading: devicesLoading } = useDevices();

  // Loading state
  if (sensorLoading || devicesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading dashboard data...</span>
          </div>
        </div>
      </Layout>
    );
  }

  const getAqiStatus = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'bg-success', icon: CheckCircle };
    if (aqi <= 100) return { label: 'Moderate', color: 'bg-warning', icon: Circle };
    return { label: 'Unhealthy', color: 'bg-danger', icon: AlertTriangle };
  };

  // Use real data or fallback to defaults
  const currentData = overallStats || {
    aqi: 0,
    temperature: 0,
    humidity: 0,
    co2: 0,
    pm25: 0,
    pm10: 0,
    onlineDevices: 0,
    totalDevices: devices.length
  };

  const status = getAqiStatus(currentData.aqi);
  const StatusIcon = status.icon;

  return (
    <Layout>
      <div className="grid gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time environmental monitoring • {currentData.onlineDevices}/{currentData.totalDevices} devices online
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-success animate-pulse" />
            <span className="text-sm font-medium">Live Data</span>
          </div>
        </div>

        {/* Current Status Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* AQI Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Air Quality Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{currentData.aqi || '--'}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusIcon className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      {currentData.aqi > 0 ? status.label : 'No data'}
                    </span>
                  </div>
                </div>
                <div className={`rounded-full p-4 ${status.color}/20`}>
                  <Gauge className={`h-8 w-8 ${status.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PM2.5 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">PM2.5</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentData.pm25 ? currentData.pm25.toFixed(1) : '--'}
              </div>
              <p className="text-xs text-muted-foreground">µg/m³</p>
            </CardContent>
          </Card>

          {/* PM10 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">PM10</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentData.pm10 ? currentData.pm10.toFixed(1) : '--'}
              </div>
              <p className="text-xs text-muted-foreground">µg/m³</p>
            </CardContent>
          </Card>
        </div>

        {/* Environmental Parameters */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* CO2 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">CO₂</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {currentData.co2 ? Math.round(currentData.co2) : '--'}
                  </div>
                  <p className="text-xs text-muted-foreground">ppm</p>
                </div>
                <Wind className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Temperature */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {currentData.temperature ? `${currentData.temperature.toFixed(1)}°` : '--'}
                  </div>
                  <p className="text-xs text-muted-foreground">Celsius</p>
                </div>
                <ThermometerSun className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Humidity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Humidity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {currentData.humidity ? `${Math.round(currentData.humidity)}%` : '--'}
                  </div>
                  <p className="text-xs text-muted-foreground">Relative</p>
                </div>
                <Droplets className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Device Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Device Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-success">
                    {currentData.onlineDevices}/{currentData.totalDevices}
                  </div>
                  <p className="text-xs text-muted-foreground">Devices Online</p>
                </div>
                <div className="h-3 w-3 bg-success rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {user?.user_metadata?.role === 'admin' && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Management Portal</h3>
                    <p className="text-muted-foreground">Configure sites, buildings, and devices</p>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/management">
                    <Building2 className="h-4 w-4 mr-2" />
                    Go to Management
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-time Device Data */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Live Device Monitoring</h2>
          {sensorData.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sensorData.slice(0, 6).map((device) => {
                const deviceStatus = getAqiStatus(device.aqi || 0);
                return (
                  <Card key={device.device_id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{device.device_name}</CardTitle>
                      <CardDescription>
                        Last updated: {new Date(device.last_updated).toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">
                            {device.aqi ? deviceStatus.label : 'No data'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            AQI: {device.aqi || '--'}
                          </p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`${
                            device.status === 'online' 
                              ? 'bg-success text-success-foreground' 
                              : device.status === 'error'
                                ? 'bg-destructive text-destructive-foreground'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                        </Badge>
                      </div>
                      {device.status === 'online' && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">PM2.5:</span>
                            <span>{device.pm25?.toFixed(1) || '--'} µg/m³</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Temperature:</span>
                            <span>{device.temperature?.toFixed(1) || '--'}°C</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Humidity:</span>
                            <span>{device.humidity?.toFixed(0) || '--'}%</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No sensor data available. Devices are being set up...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}