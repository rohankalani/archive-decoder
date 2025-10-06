import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BuildingMetric } from '@/hooks/useSimplifiedReportData';

interface BuildingComparisonChartProps {
  buildings: BuildingMetric[];
}

export default function BuildingComparisonChart({ buildings }: BuildingComparisonChartProps) {
  const chartData = buildings.map(building => ({
    name: building.name,
    aqi: building.aqi,
    fill: building.status === 'good' ? '#22c55e' : 
          building.status === 'moderate' ? '#eab308' : 
          '#ef4444'
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="name" 
          className="text-xs"
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis 
          label={{ value: 'AQI', angle: -90, position: 'insideLeft' }}
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
        <Bar 
          dataKey="aqi" 
          name="Average AQI"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
