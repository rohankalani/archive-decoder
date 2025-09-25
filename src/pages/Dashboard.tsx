import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring via MQTT • RosaiQ ULTRADETEKT 03M
          </p>
        </div>
      </div>

      {/* Location Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abu Dhabi Estimada</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">45</span>
                <div className="px-2 py-1 rounded text-white text-xs" style={{backgroundColor: 'hsl(120, 100%, 40%)'}}>
                  Good
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>2/2 devices online</span>
                <span>Abu Dhabi, UAE</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Burjeel Hospital</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">78</span>
                <div className="px-2 py-1 rounded text-white text-xs" style={{backgroundColor: 'hsl(60, 100%, 50%)'}}>
                  Moderate
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>1/2 devices online</span>
                <span>Abu Dhabi, UAE</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dubai Green Building</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">32</span>
                <div className="px-2 py-1 rounded text-white text-xs" style={{backgroundColor: 'hsl(120, 100%, 40%)'}}>
                  Good
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>2/2 devices online</span>
                <span>Dubai, UAE</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Status */}
      <Card>
        <CardHeader>
          <CardTitle>ULTRADETEKT 03M Devices</CardTitle>
          <CardDescription>Real-time air quality monitoring devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8">
              <Activity className="h-8 w-8 animate-pulse mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Initializing MQTT connection...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Monitoring PM2.5, PM10, CO₂, HCHO, VOC, NOₓ
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}