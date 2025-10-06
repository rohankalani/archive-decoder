import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Building2, AlertCircle } from 'lucide-react';

interface SummaryMetricsCardsProps {
  summary: {
    avgAqi: number;
    totalAlerts: { critical: number; high: number; medium: number; low: number };
    buildingPerformanceScore: number;
    dominantPollutants: Array<{
      type: string;
      avgAqi: number;
      percentage: number;
    }>;
  };
  aqiColor: string;
}

export function SummaryMetricsCards({ summary, aqiColor }: SummaryMetricsCardsProps) {
  const totalAlertCount = Object.values(summary.totalAlerts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Average AQI Card */}
      <Card className="p-6 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ backgroundColor: aqiColor }}
        />
        <div className="relative">
          <p className="text-sm font-medium text-muted-foreground mb-2">Average AQI</p>
          <p 
            className="text-4xl font-bold mb-1"
            style={{ color: aqiColor }}
          >
            {summary.avgAqi.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">During Operating Hours</p>
        </div>
      </Card>

      {/* Performance Score Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">Performance Score</p>
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <p className="text-4xl font-bold text-primary mb-1">
          {summary.buildingPerformanceScore.toFixed(0)}
        </p>
        <p className="text-xs text-muted-foreground">Out of 100</p>
      </Card>

      {/* Total Alerts Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
          <AlertTriangle className="w-4 h-4 text-orange-500" />
        </div>
        <p className="text-4xl font-bold mb-2">{totalAlertCount}</p>
        <div className="flex gap-2 flex-wrap">
          {summary.totalAlerts.critical > 0 && (
            <Badge variant="destructive" className="text-xs">
              {summary.totalAlerts.critical} Critical
            </Badge>
          )}
          {summary.totalAlerts.high > 0 && (
            <Badge className="bg-orange-500 text-white text-xs">
              {summary.totalAlerts.high} High
            </Badge>
          )}
          {summary.totalAlerts.medium > 0 && (
            <Badge className="bg-yellow-500 text-black text-xs">
              {summary.totalAlerts.medium} Medium
            </Badge>
          )}
        </div>
      </Card>

      {/* Dominant Pollutant Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">Top Pollutant</p>
          <AlertCircle className="w-4 h-4 text-accent" />
        </div>
        <p className="text-2xl font-bold mb-1">
          {summary.dominantPollutants[0]?.type || 'N/A'}
        </p>
        <p className="text-xs text-muted-foreground">
          {summary.dominantPollutants[0]?.percentage.toFixed(1)}% of buildings
        </p>
      </Card>
    </div>
  );
}
