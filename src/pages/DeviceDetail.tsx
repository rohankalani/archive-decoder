import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useDeviceLiveSnapshot } from '@/hooks/useDeviceLiveSnapshot';
import { useHistoricalSensorData, TimePeriod } from '@/hooks/useHistoricalSensorData';
import { useLiveTimeseriesData } from '@/hooks/useLiveTimeseriesData';

import { useLocations } from '@/hooks/useLocations';
import { useDevices } from '@/hooks/useDevices';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Toggle states for each chart type
  const [environmentalParam, setEnvironmentalParam] = useState<'temperature' | 'humidity' | 'co2'>('temperature');
  const [pollutantParam, setPollutantParam] = useState<'voc' | 'hcho' | 'nox'>('voc');
  const [pmMassParam, setPmMassParam] = useState<'pm03' | 'pm1' | 'pm25' | 'pm5' | 'pm10'>('pm25');
  const [pmCountParam, setPmCountParam] = useState<'pc03' | 'pc05' | 'pc1' | 'pc25' | 'pc5' | 'pc10'>('pc25');
  
  const { sensor, loading: sensorLoading } = useDeviceLiveSnapshot(deviceId || '');
  
  // Historical data (1hr/8hr/24hr)
  const { data: historicalData, loading: historicalLoading } = useHistoricalSensorData(
    deviceId || '',
    timePeriod,
  );
  
  // Live 10-minute stream
  const { series: liveSeries } = useLiveTimeseriesData(deviceId || '', { windowMs: 10 * 60 * 1000, bucketMs: 10 * 1000 });
  
  const { devices, loading: devicesLoading } = useDevices();
  const { floors, getFloorLocation } = useLocations();
  const { getQualityFromAqi, getQualityColor, calculatePM25Aqi, calculatePM10Aqi, calculateHCHOAqi, calculateVOCAqi, calculateNOxAqi } = useSettings();

  // Update timestamp when data changes
  React.useEffect(() => {
    if (historicalData.length > 0) {
      setLastUpdate(new Date());
    }
  }, [historicalData]);

  const device = devices.find(d => d.id === deviceId);
  const deviceSensorData = sensor;
  const floor = device ? floors.find(f => f.id === device.floor_id) : null;
  const floorLocation = floor ? getFloorLocation(floor) : null;

  const getAqiStatus = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'success' };
    if (aqi <= 100) return { label: 'Moderate', color: 'warning' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: 'orange' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'destructive' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: 'purple' };
    return { label: 'Hazardous', color: 'maroon' };
  };

  const getCO2Color = (co2: number): string => {
    if (co2 < 800) return 'hsl(120, 85%, 35%)';
    if (co2 < 1200) return 'hsl(45, 100%, 40%)';
    if (co2 < 1500) return 'hsl(30, 100%, 45%)';
    if (co2 < 2000) return 'hsl(0, 100%, 45%)';
    if (co2 < 3000) return 'hsl(280, 90%, 35%)';
    return 'hsl(320, 100%, 25%)';
  };

  const getHumidityColor = (humidity: number): string => {
    if (humidity >= 40 && humidity <= 60) return 'hsl(120, 85%, 35%)';
    if ((humidity >= 30 && humidity < 40) || (humidity > 60 && humidity <= 70)) return 'hsl(45, 100%, 40%)';
    if ((humidity >= 20 && humidity < 30) || (humidity > 70 && humidity <= 80)) return 'hsl(30, 100%, 45%)';
    return 'hsl(0, 100%, 45%)';
  };

  const getBarColor = (aqi: number) => {
    return getAqiColor(aqi);
  };

  // Helper functions for Y-axis scaling
  const formatCompact = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  };

  const snapTopValue = (max: number) => {
    if (!max || max <= 0) return 10;
    const padded = max * 1.2;
    const steps = [10, 100, 1e3, 5e3, 1e4, 5e4, 1e5, 5e5, 1e6, 5e6, 1e7, 5e7, 1e8, 5e8, 1e9];
    return steps.find(s => padded <= s) ?? 1e9;
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
    // Choose data source based on time period
    if (timePeriod === '10min') {
      if (!liveSeries || liveSeries.length === 0) {
        return {
          aqi: [], environmental: [], pollutants: [], particulateMass: [], particulateCount: [], bar: []
        };
      }
      const processedData = liveSeries;
      const avgAqiData = calculateAverageAqiData(processedData);
      const dataCount = Math.max(avgAqiData.count, 1);
      const barData = [
        { name: 'PM2.5', value: Math.round(avgAqiData.pm25Aqi / dataCount), unit: 'AQI', aqi: Math.round(avgAqiData.pm25Aqi / dataCount) },
        { name: 'PM10', value: Math.round(avgAqiData.pm10Aqi / dataCount), unit: 'AQI', aqi: Math.round(avgAqiData.pm10Aqi / dataCount) },
        { name: 'HCHO', value: Math.round(avgAqiData.hchoAqi / dataCount), unit: 'AQI', aqi: Math.round(avgAqiData.hchoAqi / dataCount) },
        { name: 'VOC', value: Math.round(avgAqiData.vocAqi / dataCount), unit: 'AQI', aqi: Math.round(avgAqiData.vocAqi / dataCount) },
        { name: 'NOx', value: Math.round(avgAqiData.noxAqi / dataCount), unit: 'AQI', aqi: Math.round(avgAqiData.noxAqi / dataCount) }
      ];
      return { aqi: processedData, environmental: processedData, pollutants: processedData, particulateMass: processedData, particulateCount: processedData, bar: barData };
    }

    // Historical periods
    if (!historicalData || historicalData.length === 0) {
      return {
        aqi: [], environmental: [], pollutants: [], particulateMass: [], particulateCount: [], bar: []
      };
    }

    const processedData = generateDeterministicSensorData(historicalData, deviceSensorData, timePeriod);

    if (!processedData.length) {
      return {
        aqi: [], environmental: [], pollutants: [], particulateMass: [], particulateCount: [], bar: []
      };
    }

    const avgAqiData = calculateAverageAqiData(processedData);
    const dataCount = Math.max(avgAqiData.count, 1);
    const barData = [
      { name: 'PM2.5', value: Math.round(avgAqiData.pm25Aqi / dataCount), unit: 'AQI', aqi: Math.round(avgAqiData.pm25Aqi / dataCount) },
      { name: 'PM10', value: Math.round(avgAqiData.pm10Aqi / dataCount), unit: 'AQI', aqi: Math.round(avgAqiData.pm10Aqi / dataCount) },
      { name: 'HCHO', value: Math.round(avgAqiData.hchoAqi / dataCount), unit: 'AQI', aqi: Math.round(avgAqiData.hchoAqi / dataCount) },
      { name: 'VOC', value: Math.round(avgAqiData.vocAqi / dataCount), unit: 'AQI', aqi: Math.round(avgAqiData.vocAqi / dataCount) },
      { name: 'NOx', value: Math.round(avgAqiData.noxAqi / dataCount), unit: 'AQI', aqi: Math.round(avgAqiData.noxAqi / dataCount) }
    ];

    return { aqi: processedData, environmental: processedData, pollutants: processedData, particulateMass: processedData, particulateCount: processedData, bar: barData };
  }, [historicalData, deviceSensorData, timePeriod, liveSeries]);

  // Calculate dynamic Y-axis maximums for each parameter
  const yAxisMaxValues = useMemo(() => {
    const data = generateChartData.environmental;
    if (!data || data.length === 0) return {};

    const getMax = (key: string) => {
      const values = data.map(d => d[key]).filter(v => v !== undefined && v !== null && !isNaN(v));
      return values.length > 0 ? Math.max(...values) : 0;
    };

    return {
      temperature: Math.max(35, Math.ceil(getMax('temperature') * 1.15)),
      humidity: Math.min(100, Math.max(50, Math.ceil(getMax('humidity') * 1.1))),
      co2: Math.max(1000, Math.ceil(getMax('co2') * 1.1)),
      voc: Math.max(100, Math.ceil(getMax('voc') * 1.2)),
      hcho: Math.max(10, Math.ceil(getMax('hcho') * 1.5)),
      nox: Math.max(10, Math.ceil(getMax('nox') * 1.5)),
      pm03: Math.max(10, Math.ceil(getMax('pm03') * 1.2)),
      pm1: Math.max(10, Math.ceil(getMax('pm1') * 1.2)),
      pm25: Math.max(15, Math.ceil(getMax('pm25') * 1.2)),
      pm5: Math.max(15, Math.ceil(getMax('pm5') * 1.2)),
      pm10: Math.max(20, Math.ceil(getMax('pm10') * 1.2)),
      pc03: snapTopValue(Math.max(getMax('pc03') * 1.15, 1000)),
      pc05: snapTopValue(Math.max(getMax('pc05') * 1.15, 1000)),
      pc1: snapTopValue(Math.max(getMax('pc1') * 1.15, 1000)),
      pc25: snapTopValue(Math.max(getMax('pc25') * 1.15, 1000)),
      pc5: snapTopValue(Math.max(getMax('pc5') * 1.15, 1000)),
      pc10: snapTopValue(Math.max(getMax('pc10') * 1.15, 1000)),
    };
  }, [generateChartData.environmental]);

  // Only show loading spinner on initial device load
  if (devicesLoading && !device) {
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

  if (!device) {
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

  const status = getAqiStatus(deviceSensorData?.aqi || 0);
  const isSmokeDetected = (deviceSensorData?.pm25 ?? 0) > 100;
  const isVOCHigh = (deviceSensorData?.voc ?? 0) > 500;

  return (
    <Layout showBackButton>
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{device.name}</h1>
            <div className={`h-2 w-2 rounded-full ${
              deviceSensorData?.status === 'online' ? 'bg-success animate-pulse' : 'bg-muted'
            }`} />
            <span className="text-xs text-muted-foreground capitalize">
              {deviceSensorData?.status || 'unknown'}
            </span>
            <div className="flex items-center gap-2 text-xs text-success ml-auto">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Live Data • Updated {lastUpdate.toLocaleTimeString()}</span>
            </div>
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
                {deviceSensorData?.aqi ?? '--'}
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
                  <div className="text-3xl font-bold text-orange-500">
                    {deviceSensorData?.temperature?.toFixed(1) || '--'}°C
                  </div>
                  <div className="text-sm text-muted-foreground">Temp</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: deviceSensorData?.humidity ? getHumidityColor(deviceSensorData?.humidity) : 'hsl(var(--muted-foreground))' }}>
                    {deviceSensorData?.humidity ? Math.round(deviceSensorData?.humidity) : '--'}%
                  </div>
                  <div className="text-sm text-muted-foreground">Humidity</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: deviceSensorData?.co2 ? getCO2Color(deviceSensorData?.co2) : 'hsl(var(--muted-foreground))' }}>
                    {deviceSensorData?.co2 ? Math.round(deviceSensorData?.co2) : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">CO₂ ppm</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pollutants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pollutants</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold" 
                     style={{ color: deviceSensorData?.voc ? (
                       deviceSensorData?.voc <= 100 ? getQualityColor('Good') :
                       deviceSensorData?.voc <= 200 ? getQualityColor('Moderate') :
                       deviceSensorData?.voc <= 300 ? getQualityColor('Unhealthy for Sensitive Groups') :
                       deviceSensorData?.voc <= 400 ? getQualityColor('Unhealthy') :
                       deviceSensorData?.voc <= 450 ? getQualityColor('Very Unhealthy') :
                       getQualityColor('Hazardous')
                     ) : 'hsl(var(--muted-foreground))' }}
                  >
                    {deviceSensorData?.voc ? Math.round(deviceSensorData?.voc) : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">VOC (index)</div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold" 
                     style={{ color: deviceSensorData?.hcho ? (
                       deviceSensorData?.hcho <= 30 ? getQualityColor('Good') :
                       deviceSensorData?.hcho <= 80 ? getQualityColor('Moderate') :
                       deviceSensorData?.hcho <= 120 ? getQualityColor('Unhealthy for Sensitive Groups') :
                       deviceSensorData?.hcho <= 200 ? getQualityColor('Unhealthy') :
                       deviceSensorData?.hcho <= 300 ? getQualityColor('Very Unhealthy') :
                       getQualityColor('Hazardous')
                     ) : 'hsl(var(--muted-foreground))' }}
                  >
                    {deviceSensorData?.hcho ? Math.round(deviceSensorData?.hcho) : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">HCHO (ppb)</div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold" 
                     style={{ color: deviceSensorData?.nox ? (
                       deviceSensorData?.nox <= 100 ? getQualityColor('Good') :
                       deviceSensorData?.nox <= 200 ? getQualityColor('Moderate') :
                       deviceSensorData?.nox <= 300 ? getQualityColor('Unhealthy for Sensitive Groups') :
                       deviceSensorData?.nox <= 400 ? getQualityColor('Unhealthy') :
                       deviceSensorData?.nox <= 450 ? getQualityColor('Very Unhealthy') :
                       getQualityColor('Hazardous')
                     ) : 'hsl(var(--muted-foreground))' }}
                  >
                    {deviceSensorData?.nox ? Math.round(deviceSensorData?.nox) : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">NOx (index)</div>
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Particulate Matter & Particle Count */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Particulate Matter (μg/m³)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {deviceSensorData?.pm03?.toFixed(1) || '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PM0.3</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {deviceSensorData?.pm1?.toFixed(1) || '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PM1</div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-lg font-bold" 
                    style={{ color: deviceSensorData?.pm25 ? (
                      deviceSensorData?.pm25 <= 50.4 ? getQualityColor('Good') :
                      deviceSensorData?.pm25 <= 60.4 ? getQualityColor('Moderate') :
                      deviceSensorData?.pm25 <= 75.4 ? getQualityColor('Unhealthy for Sensitive Groups') :
                      deviceSensorData?.pm25 <= 150.4 ? getQualityColor('Unhealthy') :
                      deviceSensorData?.pm25 <= 250.4 ? getQualityColor('Very Unhealthy') :
                      getQualityColor('Hazardous')
                    ) : 'hsl(var(--muted-foreground))' }}
                  >
                    {deviceSensorData?.pm25?.toFixed(1) || '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PM2.5</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {deviceSensorData?.pm5?.toFixed(1) || '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PM5</div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-lg font-bold" 
                    style={{ color: deviceSensorData?.pm10 ? (
                      deviceSensorData?.pm10 <= 75.0 ? getQualityColor('Good') :
                      deviceSensorData?.pm10 <= 150.0 ? getQualityColor('Moderate') :
                      deviceSensorData?.pm10 <= 250.0 ? getQualityColor('Unhealthy for Sensitive Groups') :
                      deviceSensorData?.pm10 <= 350.0 ? getQualityColor('Unhealthy') :
                      deviceSensorData?.pm10 <= 420.0 ? getQualityColor('Very Unhealthy') :
                      getQualityColor('Hazardous')
                    ) : 'hsl(var(--muted-foreground))' }}
                  >
                    {deviceSensorData?.pm10?.toFixed(1) || '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PM10</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Particle Count (#/m³)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {deviceSensorData?.pc03 ? Math.round(deviceSensorData?.pc03).toLocaleString() : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PC0.3</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {deviceSensorData?.pc05 ? Math.round(deviceSensorData?.pc05).toLocaleString() : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PC0.5</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {deviceSensorData?.pc1 ? Math.round(deviceSensorData?.pc1).toLocaleString() : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PC1</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {deviceSensorData?.pc25 ? Math.round(deviceSensorData?.pc25).toLocaleString() : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PC2.5</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {deviceSensorData?.pc5 ? Math.round(deviceSensorData?.pc5).toLocaleString() : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PC5</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {deviceSensorData?.pc10 ? Math.round(deviceSensorData?.pc10).toLocaleString() : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">PC10</div>
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
                  disabled={historicalLoading}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading overlay for charts - only on initial load */}
          <div className="relative">
            {historicalLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50 backdrop-blur-sm rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading charts...</span>
                </div>
              </div>
            )}

            <div className={cn(historicalLoading && "opacity-50 pointer-events-none")}>
              {/* Key Pollutants Bar Chart - Average AQI for selected time period */}
              <Card>
            <CardHeader>
              <CardTitle>Key Pollutants - Average AQI ({timePeriod})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generateChartData.bar} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        domain={[0, (dataMax: number) => Math.max(100, Math.ceil((dataMax ?? 50) * 1.15))]}
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
                    <LineChart data={generateChartData.aqi} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      domain={[0, (dataMax: number) => Math.max(100, Math.ceil((dataMax ?? 50) * 1.15))]}
                      label={{ value: 'AQI', angle: -90, position: 'insideLeft' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="overallAqi" stroke="hsl(var(--primary))" strokeWidth={2} name="Overall AQI" isAnimationActive={false} />
                    <Line type="monotone" dataKey="pm25Aqi" stroke="hsl(var(--destructive))" strokeWidth={1} name="PM2.5" isAnimationActive={false} />
                    <Line type="monotone" dataKey="pm10Aqi" stroke="hsl(var(--warning))" strokeWidth={1} name="PM10" isAnimationActive={false} />
                    <Line type="monotone" dataKey="vocAqi" stroke="hsl(var(--success))" strokeWidth={1} name="VOC" isAnimationActive={false} />
                    <Line type="monotone" dataKey="hchoAqi" stroke="hsl(var(--accent))" strokeWidth={1} name="HCHO" isAnimationActive={false} />
                    <Line type="monotone" dataKey="noxAqi" stroke="hsl(var(--muted-foreground))" strokeWidth={1} name="NOx" isAnimationActive={false} />
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
                    <BarChart data={generateChartData.environmental} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        domain={[
                          environmentalParam === 'co2' ? 400 : 0,
                          yAxisMaxValues[environmentalParam] || 100
                        ]}
                        label={{ 
                          value: environmentalParam === 'temperature' ? '°C' :
                                 environmentalParam === 'humidity' ? '%' :
                                 'ppm',
                          angle: -90, 
                          position: 'insideLeft' 
                        }}
                      />
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
                    <BarChart data={generateChartData.pollutants} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        domain={[0, yAxisMaxValues[pollutantParam] || 100]}
                        label={{ 
                          value: pollutantParam === 'voc' ? 'index' :
                                 pollutantParam === 'hcho' ? 'ppb' :
                                 'index',
                          angle: -90, 
                          position: 'insideLeft' 
                        }}
                      />
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
                    <BarChart data={generateChartData.particulateMass} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        domain={[0, yAxisMaxValues[pmMassParam] || 20]}
                        label={{ value: 'μg/m³', angle: -90, position: 'insideLeft' }}
                      />
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
                    <BarChart data={generateChartData.particulateCount} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        domain={[0, yAxisMaxValues[pmCountParam] || 10000]}
                        tickFormatter={formatCompact}
                        label={{ value: '#/m³', angle: -90, position: 'insideLeft' }}
                      />
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
        </div>
      </div>
    </Layout>
  );
}