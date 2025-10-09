import { useState, Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimplifiedReportData } from '@/hooks/useSimplifiedReportData';
import { InlineLoader } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { ExportButton } from '@/components/reports/ExportButton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Layout } from '@/components/Layout';

const BuildingComparisonChart = lazy(() => import('@/components/reports/BuildingComparisonChart'));

export default function BuildingsReport() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, isLoading, error, refetch } = useSimplifiedReportData(startDate, endDate);

  if (isLoading) {
    return (
      <Layout>
        <InlineLoader text="Loading buildings data..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorDisplay 
          error={error} 
          variant="inline" 
          onRetry={refetch}
          onGoHome={() => navigate('/reports')}
        />
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <ErrorDisplay 
          error={new Error('No data available')} 
          variant="inline"
          onRetry={refetch}
          onGoHome={() => navigate('/reports')}
        />
      </Layout>
    );
  }

  const goodBuildings = data.buildings.filter(b => b.status === 'good').length;
  const moderateBuildings = data.buildings.filter(b => b.status === 'moderate').length;
  const unhealthyBuildings = data.buildings.filter(b => b.status === 'unhealthy').length;

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Buildings Report</h1>
          <p className="text-muted-foreground">Air quality comparison across buildings</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton reportTitle="Buildings Report" />
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Good Air Quality</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goodBuildings}</div>
            <p className="text-xs text-muted-foreground">Buildings with AQI ≤ 50</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderate Quality</CardTitle>
            <Building2 className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderateBuildings}</div>
            <p className="text-xs text-muted-foreground">Buildings with AQI 51-100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unhealthy Quality</CardTitle>
            <Building2 className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unhealthyBuildings}</div>
            <p className="text-xs text-muted-foreground">Buildings with AQI &gt; 100</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Building Comparison</CardTitle>
          <CardDescription>Average AQI across all buildings</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<InlineLoader text="Loading chart..." />}>
            <BuildingComparisonChart buildings={data.buildings} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buildings Overview</CardTitle>
          <CardDescription>{data.buildings.length} total buildings monitored</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.buildings.map((building) => (
              <div key={building.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{building.name}</p>
                    <p className="text-sm text-muted-foreground">{building.deviceCount} devices</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">AQI {building.aqi}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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
      </div>
    </Layout>
  );
}
