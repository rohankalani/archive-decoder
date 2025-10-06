import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DominantPollutant } from '@/hooks/useGeneralReportData';

interface DominantPollutantPieChartProps {
  pollutants: DominantPollutant[];
}

const COLORS = {
  'PM2.5': 'hsl(var(--destructive))',
  'PM10': 'hsl(var(--warning))',
  'VOC': 'hsl(var(--primary))',
  'HCHO': 'hsl(var(--accent))',
  'CO2': 'hsl(var(--secondary))',
  'NOx': 'hsl(var(--muted))',
};

export const DominantPollutantPieChart = ({ pollutants }: DominantPollutantPieChartProps) => {
  const chartData = pollutants.map(p => ({
    name: p.pollutant,
    value: p.percentage,
    count: p.count,
  }));

  const renderCustomLabel = (entry: any) => {
    return `${entry.name}: ${entry.value}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dominant Pollutants Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Breakdown of air quality issues by pollutant type
        </p>
      </CardHeader>
      <CardContent>
        {pollutants.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || 'hsl(var(--muted))'} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-foreground">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.value}% ({data.count} instances)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {pollutants.map((pollutant) => (
                <div key={pollutant.pollutant} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[pollutant.pollutant as keyof typeof COLORS] }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{pollutant.pollutant}</p>
                    <p className="text-xs text-muted-foreground">{pollutant.count} events</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No pollutant data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
