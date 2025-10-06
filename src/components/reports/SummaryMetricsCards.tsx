import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Activity, TrendingUp, Eye } from 'lucide-react';
import { SummaryMetrics } from '@/hooks/useGeneralReportData';

interface SummaryMetricsCardsProps {
  metrics: SummaryMetrics;
}

export const SummaryMetricsCards = ({ metrics }: SummaryMetricsCardsProps) => {
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'text-success';
    if (aqi <= 100) return 'text-warning';
    if (aqi <= 150) return 'text-destructive';
    return 'text-destructive';
  };

  const getAqiBackground = (aqi: number) => {
    if (aqi <= 50) return 'bg-success/10';
    if (aqi <= 100) return 'bg-warning/10';
    if (aqi <= 150) return 'bg-destructive/10';
    return 'bg-destructive/10';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Average AQI Card */}
      <Card className={`border-0 ${getAqiBackground(metrics.averageAqi)}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Average AQI</p>
              <p className={`text-3xl font-bold ${getAqiColor(metrics.averageAqi)}`}>
                {metrics.averageAqi}
              </p>
              <p className="text-xs text-muted-foreground">
                {metrics.averageAqi <= 50 ? 'Good' : metrics.averageAqi <= 100 ? 'Moderate' : 'Unhealthy'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getAqiBackground(metrics.averageAqi)}`}>
              <Activity className={`h-6 w-6 ${getAqiColor(metrics.averageAqi)}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Alerts Card */}
      <Card className="border-0 bg-destructive/10">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
              <p className="text-3xl font-bold text-destructive">{metrics.totalAlerts}</p>
              <p className="text-xs text-muted-foreground">Active incidents</p>
            </div>
            <div className="p-3 rounded-full bg-destructive/20">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Score Card */}
      <Card className="border-0 bg-primary/10">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Performance Score</p>
              <p className="text-3xl font-bold text-primary">{metrics.performanceScore}%</p>
              <p className="text-xs text-muted-foreground">
                {metrics.complianceRate.toFixed(0)}% compliance
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary/20">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices Monitored Card */}
      <Card className="border-0 bg-accent/10">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Devices Monitored</p>
              <p className="text-3xl font-bold text-accent-foreground">{metrics.devicesMonitored}</p>
              <p className="text-xs text-muted-foreground">Active sensors</p>
            </div>
            <div className="p-3 rounded-full bg-accent/20">
              <Eye className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
