import { useState, Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimplifiedReportData } from '@/hooks/useSimplifiedReportData';
import { InlineLoader } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Wind } from 'lucide-react';

const CO2TrendChart = lazy(() => import('@/components/reports/CO2TrendChart'));

export default function AnalysisReport() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, isLoading, error } = useSimplifiedReportData(startDate, endDate);

  if (isLoading) {
    return <InlineLoader text="Loading analysis..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} variant="inline" />;
  }

  if (!data) {
    return <ErrorDisplay error={new Error('No data available')} variant="inline" />;
  }

  const avgCO2 = data.co2Trends.length > 0
    ? Math.round(data.co2Trends.reduce((sum, t) => sum + t.avgValue, 0) / data.co2Trends.length)
    : 0;

  const maxCO2 = data.co2Trends.length > 0
    ? Math.max(...data.co2Trends.map(t => t.maxValue))
    : 0;

  const peakHour = data.co2Trends.length > 0
    ? data.co2Trends.reduce((max, t) => t.avgValue > max.avgValue ? t : max, data.co2Trends[0])
    : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analysis Report</h1>
          <p className="text-muted-foreground">CO2 trends and pollutant analysis</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/reports')}>
          Back to Reports
        </Button>
      </div>

      <PeriodSelector
        onPeriodChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CO2</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCO2} ppm</div>
            <p className="text-xs text-muted-foreground">Across all hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak CO2</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maxCO2} ppm</div>
            <p className="text-xs text-muted-foreground">Maximum recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {peakHour ? `${peakHour.hour}:00` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {peakHour ? `${peakHour.avgValue} ppm average` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CO2 Trend by Hour</CardTitle>
          <CardDescription>Average and maximum CO2 levels throughout the day</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<InlineLoader text="Loading chart..." />}>
            <CO2TrendChart co2Data={data.co2Trends} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hourly CO2 Details</CardTitle>
          <CardDescription>Breakdown by hour</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.co2Trends.map((trend) => (
              <div key={trend.hour} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm font-medium">{trend.hour}:00 - {trend.hour + 1}:00</span>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Avg: </span>
                    <span className="font-medium">{trend.avgValue} ppm</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Max: </span>
                    <span className="font-medium">{trend.maxValue} ppm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
