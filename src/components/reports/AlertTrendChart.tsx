import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AlertTrendData {
  date: string;
  critical: number;
  warning: number;
  info: number;
}

interface AlertTrendChartProps {
  data: AlertTrendData[];
}

export default function AlertTrendChart({ data }: AlertTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No alert data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          className="text-xs"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          label={{ value: 'Alert Count', angle: -90, position: 'insideLeft' }}
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
        <Bar dataKey="critical" name="Critical" fill="#ef4444" stackId="a" />
        <Bar dataKey="warning" name="Warning" fill="#f59e0b" stackId="a" />
        <Bar dataKey="info" name="Info" fill="#3b82f6" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
