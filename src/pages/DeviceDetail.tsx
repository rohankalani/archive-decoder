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
  generateDeterministicSensorData, 
  calculateAverageAqiData,
  calculatePM25Aqi,
  calculatePM10Aqi,
  calculateVOCAqi,
  calculateHCHOAqi,
  calculateNOxAqi,
  getAqiColor
} from '@/utils/chartDataUtils';
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
  
  // Toggle states for each chart type
  const [environmentalParam, setEnvironmentalParam] = useState<'temperature' | 'humidity' | 'co2'>('temperature');
  const [pollutantParam, setPollutantParam] = useState<'voc' | 'hcho' | 'nox'>('voc');
  const [pmMassParam, setPmMassParam] = useState<'pm03' | 'pm1' | 'pm25' | 'pm5' | 'pm10'>('pm25');
  const [pmCountParam, setPmCountParam] = useState<'pc03' | 'pc05' | 'pc1' | 'pc25' | 'pc5' | 'pc10'>('pc25');
  
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
    return getAqiColor(aqi);
  };

  // Additional AQI calculation functions for missing parameters
  const calculatePMAqi = (value: number, type: string) => {
    // Simple AQI calculation for PM parameters not covered
    if (type === 'pm03' || type === 'pm1' || type === 'pm5') {
      if (value <= 10) return 25;
      if (value <= 20) return 50;
      if (value <= 50) return 100;
      if (value <= 100) return 150;
      return 200;
    }
    return 0;
  };

  const calculatePCAqi = (value: number) => {
    // Simple AQI calculation for particle count
    if (value <= 1000) return 25;
    if (value <= 5000) return 50;
    if (value <= 15000) return 100;
    if (value <= 50000) return 150;
    return 200;
  };

  // Generate chart data with AQI calculations and color coding
  const generateChartData = useMemo(() => {
    if (!historicalData.length || !deviceSensorData) {
      return { 
        aqi: [],
        environmental: [],
        pollutants: [],
        particulateMass: [],
        particulateCount: [],
        bar: [] 
      };
    }

    // Generate deterministic data using the new utility function
    const processedData = generateDeterministicSensorData(historicalData, deviceSensorData, timePeriod);

    // Calculate average AQI data using the new utility function
    const avgAqiData = calculateAverageAqiData(processedData);
    const dataCount = Math.max(avgAqiData.count, 1);
    
    const barData = [
      {
        name: 'PM2.5',
        value: Math.round(avgAqiData.pm25Aqi / dataCount),
        unit: 'AQI',
        aqi: Math.round(avgAqiData.pm25Aqi / dataCount)
      },
      {
        name: 'PM10',
        value: Math.round(avgAqiData.pm10Aqi / dataCount),
        unit: 'AQI',
        aqi: Math.round(avgAqiData.pm10Aqi / dataCount)
      },
      {
        name: 'HCHO',
        value: Math.round(avgAqiData.hchoAqi / dataCount),
        unit: 'AQI',
        aqi: Math.round(avgAqiData.hchoAqi / dataCount)
      },
      {
        name: 'VOC',
        value: Math.round(avgAqiData.vocAqi / dataCount),
        unit: 'AQI',
        aqi: Math.round(avgAqiData.vocAqi / dataCount)
      },
      {
        name: 'NOx',
        value: Math.round(avgAqiData.noxAqi / dataCount),
        unit: 'AQI',
        aqi: Math.round(avgAqiData.noxAqi / dataCount)
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
  }, [historicalData, deviceSensorData, timePeriod]);

  // Debug particle count data
  console.log('Particle Count Debug:', {
    deviceSensorData: {
      pc03: deviceSensorData?.pc03,
      pc05: deviceSensorData?.pc05,
      pc1: deviceSensorData?.pc1,
      pc25: deviceSensorData?.pc25,
      pc5: deviceSensorData?.pc5,
      pc10: deviceSensorData?.pc10
    },
    particulateCountData: generateChartData.particulateCount,
    pmCountParam: pmCountParam
  });

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

          {/* Key Pollutants Bar Chart - Average AQI for selected time period */}
          <Card>
            <CardHeader>
              <CardTitle>Key Pollutants - Average AQI ({timePeriod})</CardTitle>
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
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        domain={[0, 500]}
                        label={{ value: 'AQI', angle: -90, position: 'insideLeft' }}
                      />
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
                <CardTitle className="flex items-center justify-between">
                  Environmental Conditions
                  <div className="flex gap-1">
                    <Button 
                      variant={environmentalParam === 'temperature' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEnvironmentalParam('temperature')}
                    >
                      Temp
                    </Button>
                    <Button 
                      variant={environmentalParam === 'humidity' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEnvironmentalParam('humidity')}
                    >
                      Humidity
                    </Button>
                    <Button 
                      variant={environmentalParam === 'co2' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEnvironmentalParam('co2')}
                    >
                      CO₂
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateChartData.environmental}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Bar 
                        dataKey={environmentalParam} 
                        radius={[4, 4, 0, 0]} 
                        name={
                          environmentalParam === 'temperature' ? 'Temperature (°C)' :
                          environmentalParam === 'humidity' ? 'Humidity (%)' :
                          'CO₂ (ppm)'
                        }
                      >
                        {generateChartData.environmental.map((entry, index) => {
                          let aqi = 0;
                          if (environmentalParam === 'temperature') {
                            aqi = entry.temperature > 30 ? 150 : entry.temperature > 25 ? 100 : 50;
                          } else if (environmentalParam === 'humidity') {
                            aqi = entry.humidity > 70 || entry.humidity < 30 ? 150 : entry.humidity > 60 || entry.humidity < 40 ? 100 : 50;
                          } else {
                            aqi = entry.co2 > 1000 ? 150 : entry.co2 > 800 ? 100 : 50;
                          }
                          return <Cell key={`cell-${index}`} fill={getBarColor(aqi)} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pollutants Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Pollutants
                  <div className="flex gap-1">
                    <Button 
                      variant={pollutantParam === 'voc' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPollutantParam('voc')}
                    >
                      VOC
                    </Button>
                    <Button 
                      variant={pollutantParam === 'hcho' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPollutantParam('hcho')}
                    >
                      HCHO
                    </Button>
                    <Button 
                      variant={pollutantParam === 'nox' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPollutantParam('nox')}
                    >
                      NOx
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateChartData.pollutants}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Bar 
                        dataKey={pollutantParam} 
                        radius={[4, 4, 0, 0]} 
                        name={
                          pollutantParam === 'voc' ? 'VOC (index)' :
                          pollutantParam === 'hcho' ? 'HCHO (ppb)' :
                          'NOx (index)'
                        }
                      >
                        {generateChartData.pollutants.map((entry, index) => {
                          let aqi = 0;
                          if (pollutantParam === 'voc') {
                            aqi = calculateVOCAqi(entry.voc);
                          } else if (pollutantParam === 'hcho') {
                            aqi = calculateHCHOAqi(entry.hcho);
                          } else {
                            aqi = calculateNOxAqi(entry.nox);
                          }
                          return <Cell key={`cell-${index}`} fill={getBarColor(aqi)} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Particulate Matter (Mass) Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Particulate Matter (Mass)
                  <div className="flex gap-1">
                    <Button 
                      variant={pmMassParam === 'pm03' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmMassParam('pm03')}
                    >
                      PM0.3
                    </Button>
                    <Button 
                      variant={pmMassParam === 'pm1' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmMassParam('pm1')}
                    >
                      PM1
                    </Button>
                    <Button 
                      variant={pmMassParam === 'pm25' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmMassParam('pm25')}
                    >
                      PM2.5
                    </Button>
                    <Button 
                      variant={pmMassParam === 'pm5' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmMassParam('pm5')}
                    >
                      PM5
                    </Button>
                    <Button 
                      variant={pmMassParam === 'pm10' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmMassParam('pm10')}
                    >
                      PM10
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateChartData.particulateMass}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Bar 
                        dataKey={pmMassParam} 
                        radius={[4, 4, 0, 0]} 
                        name={`${pmMassParam.toUpperCase()} (μg/m³)`}
                      >
                        {generateChartData.particulateMass.map((entry, index) => {
                          let aqi = 0;
                          if (pmMassParam === 'pm25') {
                            aqi = calculatePM25Aqi(entry.pm25);
                          } else if (pmMassParam === 'pm10') {
                            aqi = calculatePM10Aqi(entry.pm10);
                          } else {
                            aqi = calculatePMAqi(entry[pmMassParam], pmMassParam);
                          }
                          return <Cell key={`cell-${index}`} fill={getBarColor(aqi)} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Particulate Matter (Count) Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Particulate Matter (Count)
                  <div className="flex gap-1">
                    <Button 
                      variant={pmCountParam === 'pc03' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmCountParam('pc03')}
                    >
                      PC0.3
                    </Button>
                    <Button 
                      variant={pmCountParam === 'pc05' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmCountParam('pc05')}
                    >
                      PC0.5
                    </Button>
                    <Button 
                      variant={pmCountParam === 'pc1' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmCountParam('pc1')}
                    >
                      PC1
                    </Button>
                    <Button 
                      variant={pmCountParam === 'pc25' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmCountParam('pc25')}
                    >
                      PC2.5
                    </Button>
                    <Button 
                      variant={pmCountParam === 'pc5' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmCountParam('pc5')}
                    >
                      PC5
                    </Button>
                    <Button 
                      variant={pmCountParam === 'pc10' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPmCountParam('pc10')}
                    >
                      PC10
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateChartData.particulateCount}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Bar 
                        dataKey={pmCountParam} 
                        radius={[4, 4, 0, 0]} 
                        name={`${pmCountParam.toUpperCase()} (#/m³)`}
                      >
                        {generateChartData.particulateCount.map((entry, index) => {
                          const aqi = calculatePCAqi(entry[pmCountParam]);
                          return <Cell key={`cell-${index}`} fill={getBarColor(aqi)} />;
                        })}
                      </Bar>
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