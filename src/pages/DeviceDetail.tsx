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

export function DeviceDetail() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1hr');
  
  const { sensorData, loading: sensorLoading } = useLiveSensorData();
  const { data: historicalData, loading: historicalLoading } = useHistoricalSensorData(deviceId || '', timePeriod);
  const { devices, loading: devicesLoading } = useDevices();
  const { floors, getFloorLocation } = useLocations();
  const { getQualityFromAqi, getQualityColor, calculatePM25Aqi, calculatePM10Aqi, calculateHCHOAqi, calculateVOCAqi, calculateNOxAqi } = useSettings();

  const device = devices.find(d => d.id === deviceId);
  const deviceSensorData = sensorData.find(s => s.device_id === deviceId);
  const floor = device ? floors.find(f => f.id === device.floor_id) : null;
  const floorLocation = floor ? getFloorLocation(floor) : null;

  const getAqiStatus = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'success' };
    if (aqi <= 100) return { label: 'Moderate', color: 'warning' };
    return { label: 'Unhealthy', color: 'destructive' };
  };

  const getBarColor = (aqi: number) => {
    if (aqi <= 50) return 'hsl(var(--success))';
    if (aqi <= 100) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  // Generate chart data with AQI calculations and color coding
  const generateChartData = useMemo(() => {
    if (!deviceSensorData) {
      return { 
        aqi: [],
        environmental: [],
        pollutants: [],
        particulateMass: [],
        particulateCount: [],
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
        temperature: item.temperature || deviceSensorData.temperature || 0,
        humidity: item.humidity || deviceSensorData.humidity || 0,
        co2: item.co2 || deviceSensorData.co2 || 0,
        // Pollutants
        voc: item.voc || deviceSensorData.voc || 0,
        hcho: item.hcho || deviceSensorData.hcho || 0,
        nox: item.nox || deviceSensorData.nox || 0,
        // Particulate matter (mass) - only use what exists in historical data
        pm25: item.pm25 || deviceSensorData.pm25 || 0,
        pm10: item.pm10 || deviceSensorData.pm10 || 0,
        // Use current device data for particles not in historical data
        pm03: deviceSensorData.pm03 || 0,
        pm1: deviceSensorData.pm1 || 0,
        pm5: deviceSensorData.pm5 || 0,
        // Particle count (use current device data)
        pc03: deviceSensorData.pc03 || 0,
        pc05: deviceSensorData.pc05 || 0,
        pc1: deviceSensorData.pc1 || 0,
        pc25: deviceSensorData.pc25 || 0,
        pc5: deviceSensorData.pc5 || 0,
        pc10: deviceSensorData.pc10 || 0
      };
    });

    // Key pollutants summary data (current values)
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
      pollutants: processedData,
      particulateMass: processedData,
      particulateCount: processedData,
      bar: barData 
    };
  }, [historicalData, deviceSensorData, calculatePM25Aqi, calculatePM10Aqi, calculateHCHOAqi, calculateVOCAqi, calculateNOxAqi]);

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
        {/* Header */}
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

        {/* Alert Banner */}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* AQI Card */}
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

          {/* Environmental Conditions */}
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

        {/* Pollutants */}
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

        {/* Particulate Matter & Particle Count */}
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

        {/* Charts Section - Time Period Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Historical Data</h2>
            <div className="flex gap-2">
              {(['10min', '1hr', '8hr', '24hr'] as TimePeriod[]).map((period) => (
                <Button 
                  key={period} 
                  variant={timePeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimePeriod(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>

          {/* Key Pollutants Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Key Pollutants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generateChartData.bar}>
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
            </CardContent>
          </Card>

          {/* AQI & Sub-Indices - Line Chart (only one that should be line) */}
          <Card>
            <CardHeader>
              <CardTitle>AQI & Sub-Indices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData.aqi}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      interval="preserveStartEnd"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Legend />
                    <Line type="monotone" dataKey="overallAqi" stroke="hsl(var(--primary))" strokeWidth={2} name="Overall AQI" />
                    <Line type="monotone" dataKey="pm25Aqi" stroke="hsl(var(--destructive))" strokeWidth={1} name="PM2.5" />
                    <Line type="monotone" dataKey="pm10Aqi" stroke="hsl(var(--warning))" strokeWidth={1} name="PM10" />
                    <Line type="monotone" dataKey="vocAqi" stroke="hsl(var(--success))" strokeWidth={1} name="VOC" />
                    <Line type="monotone" dataKey="hchoAqi" stroke="hsl(var(--accent))" strokeWidth={1} name="HCHO" />
                    <Line type="monotone" dataKey="noxAqi" stroke="hsl(var(--muted-foreground))" strokeWidth={1} name="NOx" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid - ALL BAR CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Environmental Conditions Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Environmental Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateChartData.environmental}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Bar dataKey="temperature" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="humidity" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="co2" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pollutants Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Pollutants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateChartData.pollutants}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Bar dataKey="voc" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="hcho" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="nox" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Particulate Matter (Mass) Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Particulate Matter (Mass)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateChartData.particulateMass}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Bar dataKey="pm03" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pm1" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pm25" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pm5" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pm10" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Particulate Matter (Count) Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Particulate Matter (Count)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateChartData.particulateCount}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Bar dataKey="pc03" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pc05" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pc1" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pc25" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pc5" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pc10" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}