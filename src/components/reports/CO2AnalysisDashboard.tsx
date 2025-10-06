import { Card } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { Wind } from 'lucide-react';

interface CO2AnalysisDashboardProps {
  co2Analysis: {
    averageCO2: number;
    peakTimesHeatMap: Array<{ hour: number; avgCO2: number }>;
    correlations: {
      co2VsTemp: Array<{ co2: number; temp: number }>;
      co2VsVOC: Array<{ co2: number; voc: number }>;
      co2VsAQI: Array<{ co2: number; aqi: number }>;
    };
  };
}

export function CO2AnalysisDashboard({ co2Analysis }: CO2AnalysisDashboardProps) {
  const getHeatMapColor = (co2: number) => {
    if (co2 < 600) return 'hsl(120, 100%, 40%)'; // Good
    if (co2 < 800) return 'hsl(60, 100%, 50%)'; // Moderate
    if (co2 < 1000) return 'hsl(30, 100%, 50%)'; // Unhealthy
    return 'hsl(0, 100%, 50%)'; // Very Unhealthy
  };

  return (
    <div className="space-y-6">
      {/* Average CO2 Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Average CO₂ Level</p>
            <p className="text-4xl font-bold text-primary">{co2Analysis.averageCO2.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">ppm (Operating Hours)</p>
          </div>
          <Wind className="w-12 h-12 text-primary/20" />
        </div>
      </Card>

      {/* Peak Times Heat Map */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">CO₂ Levels by Hour</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={co2Analysis.peakTimesHeatMap}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'CO₂ (ppm)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="avgCO2" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Correlation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CO2 vs Temperature */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">CO₂ vs Temperature</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="co2" name="CO₂" unit=" ppm" />
              <YAxis dataKey="temp" name="Temp" unit="°C" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter 
                data={co2Analysis.correlations.co2VsTemp} 
                fill="hsl(var(--primary))"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        {/* CO2 vs VOC */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">CO₂ vs VOC</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="co2" name="CO₂" unit=" ppm" />
              <YAxis dataKey="voc" name="VOC" unit=" ppb" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter 
                data={co2Analysis.correlations.co2VsVOC} 
                fill="hsl(var(--secondary))"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        {/* CO2 vs AQI */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">CO₂ vs Overall AQI</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="co2" name="CO₂" unit=" ppm" />
              <YAxis dataKey="aqi" name="AQI" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter 
                data={co2Analysis.correlations.co2VsAQI} 
                fill="hsl(var(--accent))"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
