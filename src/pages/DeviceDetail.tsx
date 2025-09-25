import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import { useLiveSensorData } from '@/hooks/useLiveSensorData';
import { useLocations } from '@/hooks/useLocations';
import { useDevices } from '@/hooks/useDevices';
import { 
  ArrowLeft,
  Activity,
  Thermometer,
  Droplets,
  Wind,
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
    if (aqi <= 50) return { label: 'Good', color: 'success', bgColor: 'bg-success/10', borderColor: 'border-success' };
    if (aqi <= 100) return { label: 'Moderate', color: 'warning', bgColor: 'bg-warning/10', borderColor: 'border-warning' };
    return { label: 'Unhealthy', color: 'destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive' };
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
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{device.name}</h1>
            <div className={`h-3 w-3 rounded-full ${
              deviceSensorData.status === 'online' ? 'bg-success animate-pulse' : 'bg-muted'
            }`} />
            <span className="text-sm font-medium text-muted-foreground capitalize">
              {deviceSensorData.status}
            </span>
          </div>
          {floorLocation && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{floorLocation.site.name} → {floorLocation.building.name} → {floorLocation.floor.name || `Floor ${floorLocation.floor.floor_number}`}</span>
            </div>
          )}
        </div>

        {/* Alert Banner */}
        {(isSmokeDetected || isVOCHigh) && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <div>
                  <h3 className="font-semibold text-destructive">
                    {isSmokeDetected ? 'Smoke/Particulate Alert' : 'VOC Alert'}
                  </h3>
                  <p className="text-sm text-destructive/80">
                    {isSmokeDetected ? 'High PM2.5 levels detected. Possible smoke or vaping activity.' : 'High VOC levels detected.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main AQI Card */}
        <Card className="bg-card border-2">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg">Air Quality Index</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className={`text-8xl font-bold ${
              status.color === 'success' ? 'text-success' : 
              status.color === 'warning' ? 'text-warning' : 'text-destructive'
            }`}>
              {deviceSensorData.aqi || '--'}
            </div>
            <div className={`text-xl font-semibold ${
              status.color === 'success' ? 'text-success' : 
              status.color === 'warning' ? 'text-warning' : 'text-destructive'
            }`}>
              {status.label}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        {/* Environmental Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Environmental Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {deviceSensorData.temperature?.toFixed(1) || '--'}°C
                </div>
                <div className="text-sm text-muted-foreground">Temperature</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-500">
                  {deviceSensorData.humidity ? Math.round(deviceSensorData.humidity) : '--'}%
                </div>
                <div className="text-sm text-muted-foreground">Humidity</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {deviceSensorData.co2 ? Math.round(deviceSensorData.co2) : '--'} ppm
                </div>
                <div className="text-sm text-muted-foreground">CO₂</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pollutants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              Pollutants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {deviceSensorData.voc ? Math.round(deviceSensorData.voc) : '--'}
                </div>
                <div className="text-sm text-muted-foreground">VOC (ppb)</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {deviceSensorData.hcho ? (deviceSensorData.hcho * 1000).toFixed(0) : '--'}
                </div>
                <div className="text-sm text-muted-foreground">HCHO (μg/m³)</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {deviceSensorData.nox ? Math.round(deviceSensorData.nox) : '--'}
                </div>
                <div className="text-sm text-muted-foreground">NOx (index)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Particulate Matter */}
        <Card>
          <CardHeader>
            <CardTitle>Particulate Matter (μg/m³)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {deviceSensorData.pm03?.toFixed(1) || '--'}
                </div>
                <div className="text-xs text-muted-foreground">PM0.3</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {deviceSensorData.pm1?.toFixed(1) || '--'}
                </div>
                <div className="text-xs text-muted-foreground">PM1</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-red-500">
                  {deviceSensorData.pm25?.toFixed(1) || '--'}
                </div>
                <div className="text-xs text-muted-foreground">PM2.5</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {deviceSensorData.pm5?.toFixed(1) || '--'}
                </div>
                <div className="text-xs text-muted-foreground">PM5</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {deviceSensorData.pm10?.toFixed(1) || '--'}
                </div>
                <div className="text-xs text-muted-foreground">PM10</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Particle Count */}
        <Card>
          <CardHeader>
            <CardTitle>Particle Count (#/ft³)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {deviceSensorData.pc03 ? Math.round(deviceSensorData.pc03).toLocaleString() : '--'}
                </div>
                <div className="text-xs text-muted-foreground">PC0.3</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {deviceSensorData.pc05 ? Math.round(deviceSensorData.pc05).toLocaleString() : '--'}
                </div>
                <div className="text-xs text-muted-foreground">PC0.5</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {deviceSensorData.pc1 ? Math.round(deviceSensorData.pc1).toLocaleString() : '--'}
                </div>
                <div className="text-xs text-muted-foreground">PC1</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {deviceSensorData.pc25 ? Math.round(deviceSensorData.pc25).toLocaleString() : '--'}
                </div>
                <div className="text-xs text-muted-foreground">PC2.5</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {deviceSensorData.pc5 ? Math.round(deviceSensorData.pc5).toLocaleString() : '--'}
                </div>
                <div className="text-xs text-muted-foreground">PC5</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {deviceSensorData.pc10 ? Math.round(deviceSensorData.pc10).toLocaleString() : '--'}
                </div>
                <div className="text-xs text-muted-foreground">PC10</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Serial Number</span>
                <div className="font-medium">{device.serial_number || 'N/A'}</div>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Firmware</span>
                <div className="font-medium">{device.firmware_version || 'N/A'}</div>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Installation Date</span>
                <div className="font-medium">
                  {device.installation_date ? new Date(device.installation_date).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Last Calibration</span>
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