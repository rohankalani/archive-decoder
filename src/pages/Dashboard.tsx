import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Wind, 
  Droplets, 
  Gauge, 
  ThermometerSun,
  AlertTriangle,
  CheckCircle,
  Circle
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [mockData, setMockData] = useState({
    pm25: 15.2,
    pm10: 22.8,
    co2: 420,
    temperature: 24.5,
    humidity: 45,
    aqi: 85
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMockData(prev => ({
        pm25: prev.pm25 + (Math.random() - 0.5) * 2,
        pm10: prev.pm10 + (Math.random() - 0.5) * 3,
        co2: prev.co2 + (Math.random() - 0.5) * 10,
        temperature: prev.temperature + (Math.random() - 0.5) * 1,
        humidity: prev.humidity + (Math.random() - 0.5) * 5,
        aqi: Math.max(0, prev.aqi + (Math.random() - 0.5) * 10)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getAqiStatus = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'bg-success', icon: CheckCircle };
    if (aqi <= 100) return { label: 'Moderate', color: 'bg-warning', icon: Circle };
    return { label: 'Unhealthy', color: 'bg-danger', icon: AlertTriangle };
  };

  const status = getAqiStatus(mockData.aqi);
  const StatusIcon = status.icon;

  return (
    <Layout>
      <div className="grid gap-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
          <p className="text-muted-foreground">Real-time environmental monitoring</p>
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
                  <div className="text-3xl font-bold">{Math.round(mockData.aqi)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusIcon className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">{status.label}</span>
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
              <div className="text-2xl font-bold">{mockData.pm25.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">µg/m³</p>
            </CardContent>
          </Card>

          {/* PM10 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">PM10</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.pm10.toFixed(1)}</div>
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
                  <div className="text-2xl font-bold">{Math.round(mockData.co2)}</div>
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
                  <div className="text-2xl font-bold">{mockData.temperature.toFixed(1)}°</div>
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
                  <div className="text-2xl font-bold">{Math.round(mockData.humidity)}%</div>
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
                  <div className="text-2xl font-bold text-success">Online</div>
                  <p className="text-xs text-muted-foreground">ROSAIQ 03M</p>
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

        {/* Location Status */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Abu Dhabi Estimada</CardTitle>
              <CardDescription>Main monitoring site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">Good</p>
                  <p className="text-sm text-muted-foreground">AQI: 45</p>
                </div>
                <Badge variant="secondary" className="bg-success text-success-foreground">
                  Online
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Burjeel Hospital</CardTitle>
              <CardDescription>Healthcare facility monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">Moderate</p>
                  <p className="text-sm text-muted-foreground">AQI: 78</p>
                </div>
                <Badge variant="secondary" className="bg-warning text-warning-foreground">
                  Online
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Dubai Green Building</CardTitle>
              <CardDescription>Sustainable building monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">Good</p>
                  <p className="text-sm text-muted-foreground">AQI: 32</p>
                </div>
                <Badge variant="secondary" className="bg-success text-success-foreground">
                  Online
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}