import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DominantPollutantPieChartProps {
  data: Array<{
    type: string;
    avgAqi: number;
    percentage: number;
  }>;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(120, 100%, 40%)',
  'hsl(30, 100%, 50%)',
  'hsl(0, 100%, 50%)'
];

export function DominantPollutantPieChart({ data }: DominantPollutantPieChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.type,
    value: item.percentage,
    aqi: item.avgAqi,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Dominant Pollutant Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)}% (AQI: ${props.payload.aqi.toFixed(0)})`,
              props.payload.name
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
