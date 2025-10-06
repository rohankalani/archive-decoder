import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BuildingMetric } from '@/hooks/useGeneralReportData';
import { Building2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface BuildingComparisonGridProps {
  buildings: BuildingMetric[];
}

export const BuildingComparisonGrid = ({ buildings }: BuildingComparisonGridProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-success/10 text-success border-success/20';
      case 'moderate':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'unhealthy':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getTrendIcon = (trend: number[]) => {
    const first = trend[0];
    const last = trend[trend.length - 1];
    if (last > first) {
      return <TrendingUp className="h-4 w-4 text-destructive" />;
    }
    return <TrendingDown className="h-4 w-4 text-success" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Building Performance Comparison
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Air quality metrics across all buildings
        </p>
      </CardHeader>
      <CardContent>
        {buildings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building) => (
              <Card key={building.buildingId} className="border">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground">{building.buildingName}</h4>
                      <Badge variant="outline" className={getStatusColor(building.status)}>
                        {getStatusLabel(building.status)}
                      </Badge>
                    </div>
                    {getTrendIcon(building.trend)}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Average AQI</p>
                      <p className="text-2xl font-bold text-foreground">{building.averageAqi}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Alerts</p>
                      <p className="text-2xl font-bold text-foreground flex items-center gap-1">
                        {building.totalAlerts}
                        {building.totalAlerts > 0 && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Mini Trend Chart */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">7-Day Trend</p>
                    <ResponsiveContainer width="100%" height={50}>
                      <LineChart data={building.trend.map((value, index) => ({ value, index }))}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={
                            building.status === 'good' 
                              ? 'hsl(var(--success))' 
                              : building.status === 'moderate'
                              ? 'hsl(var(--warning))'
                              : 'hsl(var(--destructive))'
                          }
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">No building data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
