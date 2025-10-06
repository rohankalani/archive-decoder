import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { CO2Analysis } from '@/hooks/useGeneralReportData';
import { Wind, Clock, TrendingUp } from 'lucide-react';

interface CO2AnalysisDashboardProps {
  analysis: CO2Analysis;
}

export const CO2AnalysisDashboard = ({ analysis }: CO2AnalysisDashboardProps) => {
  const peakTimesData = analysis.peakTimes
    .sort((a, b) => a.hour - b.hour)
    .map(pt => ({
      hour: `${pt.hour}:00`,
      value: Math.round(pt.value),
    }));

  const correlationData = [
    { name: 'Temperature', correlation: analysis.correlations.temperature * 100 },
    { name: 'VOC', correlation: analysis.correlations.voc * 100 },
    { name: 'Overall AQI', correlation: analysis.correlations.aqi * 100 },
  ];

  const getCO2Status = (level: number) => {
    if (level < 800) return { label: 'Good', color: 'text-success' };
    if (level < 1000) return { label: 'Moderate', color: 'text-warning' };
    return { label: 'Poor', color: 'text-destructive' };
  };

  const status = getCO2Status(analysis.averageLevel);

  return (
    <div className="space-y-6">
      {/* CO2 Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wind className="h-5 w-5" />
            CO2 Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Average CO2 Level</p>
              <p className={`text-4xl font-bold ${status.color}`}>
                {analysis.averageLevel}
              </p>
              <p className="text-xs text-muted-foreground">ppm - {status.label}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Peak Hour</p>
              <p className="text-4xl font-bold text-primary">
                {analysis.peakTimes[0]?.hour || 0}:00
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round(analysis.peakTimes[0]?.value || 0)} ppm
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Strongest Correlation</p>
              <p className="text-4xl font-bold text-accent-foreground">VOC</p>
              <p className="text-xs text-muted-foreground">
                {(analysis.correlations.voc * 100).toFixed(0)}% correlation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Times Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              CO2 Levels by Hour
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Average CO2 concentration throughout the day
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={peakTimesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  label={{ value: 'CO2 (ppm)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Correlations Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              CO2 Correlations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Relationship between CO2 and other metrics
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={correlationData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  label={{ value: 'Correlation (%)', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: number) => [`${value.toFixed(0)}%`, 'Correlation']}
                />
                <Bar dataKey="correlation" fill="hsl(var(--accent))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
