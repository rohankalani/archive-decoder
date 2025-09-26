import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useLiveSensorData } from '@/hooks/useLiveSensorData';
import { useHistoricalSensorData, TimePeriod } from '@/hooks/useHistoricalSensorData';
import { useLocations } from '@/hooks/useLocations';
import { useDevices } from '@/hooks/useDevices';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  ArrowLeft,
  Activity,
  AlertTriangle,
  Clock,
  MapPin
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function DeviceDetail() {
  console.log('DeviceDetail function start');
  
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1hr');
  
  console.log('DeviceDetail basic hooks ok', { deviceId, timePeriod });
  
  const { sensorData, loading: sensorLoading } = useLiveSensorData();
  console.log('useLiveSensorData ok');
  
  const { data: historicalData, loading: historicalLoading } = useHistoricalSensorData(deviceId || '', timePeriod);
  console.log('useHistoricalSensorData ok');
  
  const { devices, loading: devicesLoading } = useDevices();
  console.log('useDevices ok');
  
  const { floors, getFloorLocation } = useLocations();
  console.log('useLocations ok');
  
  const { getQualityFromAqi, getQualityColor, calculatePM25Aqi, calculatePM10Aqi, calculateHCHOAqi, calculateVOCAqi, calculateNOxAqi } = useSettings();
  console.log('useSettings ok');

  const device = devices.find(d => d.id === deviceId);
  const deviceSensorData = sensorData.find(s => s.device_id === deviceId);
  const floor = device ? floors.find(f => f.id === device.floor_id) : null;
  const floorLocation = floor ? getFloorLocation(floor) : null;

  const getAqiStatus = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'success' };
    if (aqi <= 100) return { label: 'Moderate', color: 'warning' };
    return { label: 'Unhealthy', color: 'destructive' };
  };

  // Generate chart data with AQI calculations and color coding
  const generateChartData = useMemo(() => {
    console.log('generateChartData called', { 
      deviceSensorData: !!deviceSensorData, 
      historicalDataLength: historicalData.length,
      calculatePM25Aqi: typeof calculatePM25Aqi,
      calculatePM10Aqi: typeof calculatePM10Aqi 
    });
    
    if (!deviceSensorData) {
      console.log('No deviceSensorData, returning empty data');
      return { 
        aqi: [], 
        environmental: [], 
        airQuality: [], 
        particulateMatter: [], 
        particleCount: [],
        bar: [] 
      };
    }

    // Process historical data for time-based charts
    const processedData = historicalData.map(item => {
      const time = new Date(item.timestamp);
      const timeLabel = time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      // Calculate sub-indices for AQI chart
      const pm25Aqi = item.pm25 ? calculatePM25Aqi(item.pm25) : 0;
      const pm10Aqi = item.pm10 ? calculatePM10Aqi(item.pm10) : 0;
      const hchoAqi = item.hcho ? calculateHCHOAqi(item.hcho) : 0;
      const vocAqi = item.voc ? calculateVOCAqi(item.voc) : 0;
      const noxAqi = item.nox ? calculateNOxAqi(item.nox) : 0;
      
      // Overall AQI is max of all sub-indices
      const overallAqi = Math.max(pm25Aqi, pm10Aqi, hchoAqi, vocAqi, noxAqi);
      
      return {
        time: timeLabel,
        // AQI data
        overallAqi,
        pm25Aqi,
        pm10Aqi,
        hchoAqi,
        vocAqi,
        noxAqi,
        // Environmental data
        temperature: item.temperature || 0,
        humidity: item.humidity || 0,
        co2: item.co2 || 0,
        // Air quality pollutants
        voc: item.voc || 0,
        hcho: item.hcho || 0,
        nox: item.nox || 0,
        // Particulate matter (assume we have current device data for missing historical PM values)
        pm25: item.pm25 || deviceSensorData.pm25 || 0,
        pm10: item.pm10 || deviceSensorData.pm10 || 0,
        pm03: deviceSensorData.pm03 || 0,
        pm1: deviceSensorData.pm1 || 0,
        pm5: deviceSensorData.pm5 || 0,
        // Particle count
        pc03: deviceSensorData.pc03 || 0,
        pc05: deviceSensorData.pc05 || 0,
        pc1: deviceSensorData.pc1 || 0,
        pc25: deviceSensorData.pc25 || 0,
        pc5: deviceSensorData.pc5 || 0,
        pc10: deviceSensorData.pc10 || 0
      };
    });

    // Calculate current averaged values for bar chart (keeping this for summary)
    const latestData = historicalData[historicalData.length - 1] || {} as any;
    const barData = [
      {
        name: 'PM2.5',
        value: latestData.pm25 || deviceSensorData.pm25 || 0,
        unit: 'μg/m³',
        aqi: (latestData.pm25 || deviceSensorData.pm25) ? calculatePM25Aqi(latestData.pm25 || deviceSensorData.pm25 || 0) : 0
      },
      {
        name: 'PM10',
        value: latestData.pm10 || deviceSensorData.pm10 || 0,
        unit: 'μg/m³',
        aqi: (latestData.pm10 || deviceSensorData.pm10) ? calculatePM10Aqi(latestData.pm10 || deviceSensorData.pm10 || 0) : 0
      },
      {
        name: 'HCHO',
        value: latestData.hcho || deviceSensorData.hcho || 0,
        unit: 'ppb',
        aqi: (latestData.hcho || deviceSensorData.hcho) ? calculateHCHOAqi(latestData.hcho || deviceSensorData.hcho || 0) : 0
      },
      {
        name: 'VOC',
        value: latestData.voc || deviceSensorData.voc || 0,
        unit: 'index',
        aqi: (latestData.voc || deviceSensorData.voc) ? calculateVOCAqi(latestData.voc || deviceSensorData.voc || 0) : 0
      }
    ];

    return { 
      aqi: processedData,
      environmental: processedData,
      airQuality: processedData,
      particulateMatter: processedData,
      particleCount: processedData,
      bar: barData 
    };
  }, [historicalData, deviceSensorData, calculatePM25Aqi, calculatePM10Aqi, calculateHCHOAqi, calculateVOCAqi, calculateNOxAqi]);
    const level = getQualityFromAqi(aqi);
    return getQualityColor(level);
  };

  if (sensorLoading || devicesLoading || historicalLoading) {
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
                <div className="text-xs text-muted-foreground">VOC (index)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-500">
                  {deviceSensorData.hcho ? Math.round(deviceSensorData.hcho) : '--'}
                </div>
                <div className="text-xs text-muted-foreground">HCHO (ppb)</div>
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

        {/* Charts Section */}
        <div className="space-y-4">
          {/* Time Period Selector */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Data Analysis Period</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="10min">10 Minutes</TabsTrigger>
                  <TabsTrigger value="1hr">1 Hour</TabsTrigger>
                  <TabsTrigger value="8hr">8 Hours</TabsTrigger>
                  <TabsTrigger value="24hr">24 Hours</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Pollutant Time Series Charts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pollutant Time Series (Averaged {timePeriod})</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="environmental">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="environmental">Environmental</TabsTrigger>
                  <TabsTrigger value="airquality">Air Quality</TabsTrigger>
                  <TabsTrigger value="pm">Particulate Matter</TabsTrigger>
                  <TabsTrigger value="pc">Particle Count</TabsTrigger>
                </TabsList>
                
                <TabsContent value="environmental" className="mt-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateChartData.environmental}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="time" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#f97316" 
                          strokeWidth={2}
                          name="Temperature (°C)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="humidity" 
                          stroke="#06b6d4" 
                          strokeWidth={2}
                          name="Humidity (%)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="co2" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="CO₂ (ppm)"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="airquality" className="mt-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateChartData.airQuality}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="time" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="voc" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name="VOC (index)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="hcho" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="HCHO (ppb)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="nox" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          name="NOx (index)"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="pm" className="mt-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateChartData.particulateMatter}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="time" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="pm03" 
                          stroke="#84cc16" 
                          strokeWidth={2}
                          name="PM0.3 (μg/m³)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pm1" 
                          stroke="#eab308" 
                          strokeWidth={2}
                          name="PM1 (μg/m³)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pm25" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          name="PM2.5 (μg/m³)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pm5" 
                          stroke="#f97316" 
                          strokeWidth={2}
                          name="PM5 (μg/m³)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pm10" 
                          stroke="#dc2626" 
                          strokeWidth={2}
                          name="PM10 (μg/m³)"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="pc" className="mt-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateChartData.particleCount}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="time" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="pc03" 
                          stroke="#84cc16" 
                          strokeWidth={2}
                          name="PC0.3 (#/m³)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pc05" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name="PC0.5 (#/m³)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pc1" 
                          stroke="#06b6d4" 
                          strokeWidth={2}
                          name="PC1 (#/m³)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pc25" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="PC2.5 (#/m³)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pc5" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          name="PC5 (#/m³)"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pc10" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          name="PC10 (#/m³)"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* AQI & Sub-Indices Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">AQI & Sub-Indices Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData.aqi}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      interval="preserveStartEnd"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="overallAqi" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="Overall AQI"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pm25Aqi" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="PM2.5 AQI"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pm10Aqi" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      name="PM10 AQI"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hchoAqi" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="HCHO AQI"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="vocAqi" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="VOC AQI"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="noxAqi" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      name="NOx AQI"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Current Pollutant Summary - Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Current Key Pollutant Levels (AQI Color-Coded)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generateChartData.bar} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {generateChartData.bar.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.aqi)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                {generateChartData.bar.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="font-medium">{item.value.toFixed(1)}</div>
                    <div className="text-muted-foreground">{item.unit}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}