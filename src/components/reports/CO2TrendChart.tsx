import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CO2Data } from '@/hooks/useSimplifiedReportData';

interface CO2TrendChartProps {
  co2Data: CO2Data[];
}

export default function CO2TrendChart({ co2Data }: CO2TrendChartProps) {
  if (co2Data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No CO2 data available
      </div>
    );
  }

  const chartData = co2Data.map(d => ({
    time: d.hour ? `${d.hour}:00` : 'N/A',
    average: d.avgValue,
    maximum: d.maxValue,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="time" 
          className="text-xs"
        />
        <YAxis 
          label={{ value: 'CO2 (ppm)', angle: -90, position: 'insideLeft' }}
          className="text-xs"
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="average" 
          name="Average CO2"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="maximum" 
          name="Maximum CO2"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
