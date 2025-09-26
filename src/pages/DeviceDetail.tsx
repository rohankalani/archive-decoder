import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useLiveSensorData } from '@/hooks/useLiveSensorData';
import { useLocations } from '@/hooks/useLocations';
import { useDevices } from '@/hooks/useDevices';
import { 
  ArrowLeft,
  Activity,
  AlertTriangle,
  Clock,
  MapPin
} from 'lucide-react';

export function DeviceDetail() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { sensorData, loading: sensorLoading } = useLiveSensorData();
  const { devices, loading: devicesLoading } = useDevices();
  const { floors, getFloorLocation } = useLocations();

  const device = devices.find(d => d.id === deviceId);
  const deviceSensorData = sensorData.find(s => s.device_id === deviceId);
  const floor = device ? floors.find(f => f.id === device.floor_id) : null;
  const floorLocation = floor ? getFloorLocation(floor) : null;

  const getAqiStatus = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'success' };
    if (aqi <= 100) return { label: 'Moderate', color: 'warning' };
    return { label: 'Unhealthy', color: 'destructive' };
  };

  if (sensorLoading || devicesLoading) {
    return (
      <Layout showBackButton>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 animate-spin" />
            <span>Loading device details...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!device || !deviceSensorData) {
    return (
      <Layout showBackButton>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Device Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested device could not be found.</p>
          <Button onClick={() => navigate('/devices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Devices
          </Button>
        </div>
      </Layout>
    );
  }

  const status = getAqiStatus(deviceSensorData.aqi || 0);
  const isSmokeDetected = deviceSensorData.pm25 && deviceSensorData.pm25 > 100;
  const isVOCHigh = deviceSensorData.voc && deviceSensorData.voc > 500;

  return (
    <Layout showBackButton>
      <div className="space-y-4">
        {/* Header - Compact */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{device.name}</h1>
            <div className={`h-2 w-2 rounded-full ${
              deviceSensorData.status === 'online' ? 'bg-success animate-pulse' : 'bg-muted'
            }`} />
            <span className="text-xs text-muted-foreground capitalize">
              {deviceSensorData.status}
            </span>
          </div>
          {floorLocation && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-3 w-3" />
              <span>{floorLocation.site.name} → {floorLocation.building.name} → {floorLocation.floor.name || `Floor ${floorLocation.floor.floor_number}`}</span>
            </div>
          )}
        </div>

        {/* Alert Banner - Compact */}
        {(isSmokeDetected || isVOCHigh) && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <div>
              <span className="text-sm font-medium text-destructive">
                {isSmokeDetected ? 'Smoke/Particulate Alert' : 'VOC Alert'}
              </span>
              <p className="text-xs text-destructive/80">
                {isSmokeDetected ? 'High PM2.5 levels detected' : 'High VOC levels detected'}
              </p>
            </div>
          </div>
        )}

        {/* Main Content Grid - More Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* AQI Card - Reduced size */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Air Quality Index</CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <div className={`text-5xl font-bold ${
                status.color === 'success' ? 'text-success' : 
                status.color === 'warning' ? 'text-warning' : 'text-destructive'
              }`}>
                {deviceSensorData.aqi || '--'}
              </div>
              <div className={`text-sm font-semibold ${
                status.color === 'success' ? 'text-success' : 
                status.color === 'warning' ? 'text-warning' : 'text-destructive'
              }`}>
                {status.label}
              </div>
            </CardContent>
          </Card>

          {/* Environmental Conditions - Reduced size */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Environmental Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-500">
                    {deviceSensorData.temperature?.toFixed(1) || '--'}°C
                  </div>
                  <div className="text-xs text-muted-foreground">Temp</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-cyan-500">
                    {deviceSensorData.humidity ? Math.round(deviceSensorData.humidity) : '--'}%
                  </div>
                  <div className="text-xs text-muted-foreground">Humidity</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-500">
                    {deviceSensorData.co2 ? Math.round(deviceSensorData.co2) : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">CO₂ ppm</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pollutants - Compact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pollutants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-500">
                  {deviceSensorData.voc ? Math.round(deviceSensorData.voc) : '--'}
                </div>
                <div className="text-xs text-muted-foreground">VOC (ppb)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-500">
                  {deviceSensorData.hcho ? (deviceSensorData.hcho * 1000).toFixed(0) : '--'}
                </div>
                <div className="text-xs text-muted-foreground">HCHO (μg/m³)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-500">
                  {deviceSensorData.nox ? Math.round(deviceSensorData.nox) : '--'}
                </div>
                <div className="text-xs text-muted-foreground">NOx (index)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Particulate Matter & Particle Count - Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Particulate Matter (μg/m³)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {deviceSensorData.pm03?.toFixed(1) || '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PM0.3</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {deviceSensorData.pm1?.toFixed(1) || '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PM1</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-red-500">
                    {deviceSensorData.pm25?.toFixed(1) || '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PM2.5</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {deviceSensorData.pm5?.toFixed(1) || '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PM5</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {deviceSensorData.pm10?.toFixed(1) || '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PM10</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Particle Count (#/m³)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {deviceSensorData.pc03 ? Math.round(deviceSensorData.pc03).toLocaleString() : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PC0.3</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {deviceSensorData.pc05 ? Math.round(deviceSensorData.pc05).toLocaleString() : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PC0.5</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {deviceSensorData.pc1 ? Math.round(deviceSensorData.pc1).toLocaleString() : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PC1</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {deviceSensorData.pc25 ? Math.round(deviceSensorData.pc25).toLocaleString() : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PC2.5</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {deviceSensorData.pc5 ? Math.round(deviceSensorData.pc5).toLocaleString() : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PC5</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {deviceSensorData.pc10 ? Math.round(deviceSensorData.pc10).toLocaleString() : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">PC10</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device Information - Compact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Serial Number</span>
                <div className="font-medium">{device.serial_number || 'N/A'}</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Firmware</span>
                <div className="font-medium">{device.firmware_version || 'N/A'}</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Installation</span>
                <div className="font-medium">
                  {device.installation_date ? new Date(device.installation_date).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Last Calibration</span>
                <div className="font-medium">
                  {device.calibration_due_date ? new Date(device.calibration_due_date).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}