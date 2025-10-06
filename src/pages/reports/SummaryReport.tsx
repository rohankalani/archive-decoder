import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimplifiedReportData } from '@/hooks/useSimplifiedReportData';
import { InlineLoader } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { ExportButton } from '@/components/reports/ExportButton';
import { Activity, AlertTriangle, Cpu, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function SummaryReport() {
  console.log('🎯 SummaryReport component mounted');
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    console.log('📅 Initial start date:', date.toISOString());
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    console.log('📅 Initial end date:', date.toISOString());
    return date;
  });

  const { data, isLoading, error } = useSimplifiedReportData(startDate, endDate);

  console.log('📊 SummaryReport state:', { isLoading, hasError: !!error, hasData: !!data });

  if (isLoading) {
    return <InlineLoader text="Loading summary..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} variant="inline" />;
  }

  if (!data) {
    return <ErrorDisplay error={new Error('No data available')} variant="inline" />;
  }

  const performanceScore = Math.round(
    (data.summary.activeDevices / data.summary.devicesCount) * 100
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Summary Report</h1>
          <p className="text-muted-foreground">Overview of air quality metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton reportTitle="Summary Report" />
          <Button variant="outline" onClick={() => navigate('/reports')}>
            Back to Reports
          </Button>
        </div>
      </div>

      <PeriodSelector
        onPeriodChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average AQI</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgAqi}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.avgAqi <= 50 ? 'Good' : data.summary.avgAqi <= 100 ? 'Moderate' : 'Unhealthy'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              During selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScore}%</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.activeDevices} of {data.summary.devicesCount} devices active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.devicesCount}</div>
            <p className="text-xs text-muted-foreground">
              Monitoring air quality
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Buildings Overview</CardTitle>
            <CardDescription>{data.buildings.length} buildings monitored</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.buildings.slice(0, 5).map((building) => (
                <div key={building.id} className="flex items-center justify-between">
                  <span className="text-sm">{building.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">AQI {building.aqi}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      building.status === 'good' ? 'bg-green-500/10 text-green-500' :
                      building.status === 'moderate' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {building.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classrooms Overview</CardTitle>
            <CardDescription>{data.classrooms.length} classrooms monitored</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.classrooms.slice(0, 5).map((classroom) => (
                <div key={classroom.id} className="flex items-center justify-between">
                  <span className="text-sm">{classroom.name}</span>
                  <span className="text-sm font-medium">AQI {classroom.aqi}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
