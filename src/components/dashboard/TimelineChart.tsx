import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useHistoricalSensorData, TimePeriod } from '@/hooks/useHistoricalSensorData';
import { getAqiColor } from '@/utils/chartDataUtils';
import { format } from 'date-fns';

interface TimelineChartProps {
  devices: any[];
  selectedDeviceId: string | null;
}

export function TimelineChart({ devices, selectedDeviceId }: TimelineChartProps) {
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [chartData, setChartData] = useState<any[]>([]);

  // Determine period for hook
  const period: TimePeriod = timeRange === '24h' ? '1hr' : timeRange === '7d' ? '8hr' : '24hr';
  
  // Get first selected device or first device
  const primaryDeviceId = selectedDeviceIds.length > 0 ? selectedDeviceIds[0] : (devices[0]?.id || '');
  
  const { data: historicalData, loading } = useHistoricalSensorData(primaryDeviceId, period);

  // Transform data for chart
  useEffect(() => {
    if (!historicalData || historicalData.length === 0) {
      setChartData([]);
      return;
    }

    const transformed = historicalData.map(reading => {
      const time = new Date(reading.timestamp);
      const hours = time.getHours();
      const minutes = time.getMinutes();
      
      // Format ACTUAL timestamp from database based on time range
      let timestamp: string;
      if (timeRange === '24h') {
        timestamp = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else if (timeRange === '7d') {
        timestamp = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        timestamp = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      // Use ACTUAL PM2.5 value from database
      const pm25 = reading.pm25 || 0;
      const aqi = pm25 <= 12 ? Math.round((50 / 12) * pm25) :
                  pm25 <= 35.4 ? Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51) :
                  pm25 <= 55.4 ? Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101) :
                  Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
      
      const deviceName = devices.find(d => d.id === primaryDeviceId)?.name || 'Device';
      
      return {
        timestamp,
        [deviceName]: aqi
      };
    });

    setChartData(transformed);
  }, [historicalData, devices, primaryDeviceId, timeRange]);

  // Calculate dynamic Y-axis max based on actual data
  const yAxisMax = useMemo(() => {
    if (chartData.length === 0) return 200;
    
    let maxValue = 0;
    chartData.forEach(point => {
      Object.keys(point).forEach(key => {
        if (key !== 'timestamp' && typeof point[key] === 'number') {
          maxValue = Math.max(maxValue, point[key]);
        }
      });
    });
    
    // Add 15% padding and round up to nearest 10
    return Math.max(100, Math.ceil((maxValue * 1.15) / 10) * 10);
  }, [chartData]);

  // Get colors for devices
  const deviceColors = useMemo(() => {
    const colors = [
      '#3b82f6', // blue
      '#ef4444', // red
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
    ];

    return devices.slice(0, 5).reduce((acc, device, index) => {
      acc[device.name] = colors[index % colors.length];
      return acc;
    }, {} as Record<string, string>);
  }, [devices]);

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDeviceIds(prev => {
      if (prev.includes(deviceId)) {
        return prev.filter(id => id !== deviceId);
      } else {
        return [...prev, deviceId];
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Air Quality Timeline</CardTitle>
          </div>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as '24h' | '7d' | '30d')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Device Selection */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm font-medium text-muted-foreground mr-2">Select devices:</span>
          {devices.slice(0, 8).map(device => (
            <Badge
              key={device.id}
              variant={selectedDeviceIds.includes(device.id) || (selectedDeviceIds.length === 0 && devices.indexOf(device) < 5) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleDeviceToggle(device.id)}
            >
              {device.name}
            </Badge>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timestamp"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{ value: 'AQI', angle: -90, position: 'insideLeft' }}
                domain={[0, yAxisMax]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {Object.entries(deviceColors).map(([deviceName, color]: [string, string]) => (
                <Line
                  key={deviceName}
                  type="monotone"
                  dataKey={deviceName}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {loading ? 'Loading historical data...' : 'No historical data available'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
