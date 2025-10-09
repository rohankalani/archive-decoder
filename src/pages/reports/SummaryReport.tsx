import { useState, useRef, Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEnhancedReportData } from '@/hooks/useEnhancedReportData';
import { InlineLoader } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { ExportButton } from '@/components/reports/ExportButton';
import { TrendComparison } from '@/components/reports/TrendComparison';
import { InsightsPanel } from '@/components/reports/InsightsPanel';
import { PollutantBreakdown } from '@/components/reports/PollutantBreakdown';
import { Activity, AlertTriangle, Cpu, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BuildingComparisonChart = lazy(() => import('@/components/reports/BuildingComparisonChart'));
const CO2TrendChart = lazy(() => import('@/components/reports/CO2TrendChart'));
const AlertTrendChart = lazy(() => import('@/components/reports/AlertTrendChart'));

export default function SummaryReport() {
  console.log('🎯 SummaryReport component mounted');
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
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

  const { data, isLoading, error, refetch } = useEnhancedReportData(startDate, endDate, false);

  console.log('📊 SummaryReport state:', { isLoading, hasError: !!error, hasData: !!data });

  if (data) {
    console.log('📊 Summary data details:', {
      avgAqi: data.summary.avgAqi,
      totalAlerts: data.summary.totalAlerts,
      devicesCount: data.summary.devicesCount,
      activeDevices: data.summary.activeDevices,
      buildingsLength: data.buildings?.length,
      classroomsLength: data.classrooms?.length
    });
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <InlineLoader text="Loading summary..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorDisplay 
          error={error} 
          variant="inline"
          onRetry={refetch}
          onGoHome={() => navigate('/reports')}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <ErrorDisplay 
          error={new Error('No data available')} 
          variant="inline"
          onRetry={refetch}
          onGoHome={() => navigate('/reports')}
        />
      </div>
    );
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
          <ExportButton reportTitle="Summary Report" reportContainerRef={reportRef} />
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

      <div ref={reportRef} className="space-y-6">
        {/* Key Metrics with Trends */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TrendComparison
            currentValue={data.summary.avgAqi}
            previousValue={data.previousPeriod.avgAqi}
            title="Average AQI"
            description={
              data.summary.avgAqi <= 50 ? 'Good' : 
              data.summary.avgAqi <= 100 ? 'Moderate' : 
              data.summary.avgAqi <= 150 ? 'Unhealthy for Sensitive' :
              data.summary.avgAqi <= 200 ? 'Unhealthy' :
              data.summary.avgAqi <= 300 ? 'Very Unhealthy' : 'Hazardous'
            }
            reverseColors={true}
          />

          <TrendComparison
            currentValue={data.summary.totalAlerts}
            previousValue={data.previousPeriod.totalAlerts}
            title="Total Alerts"
            description="During selected period"
            reverseColors={true}
          />

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

        {/* AI Insights */}
        <InsightsPanel insights={data.insights} />

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pollutants">Pollutants</TabsTrigger>
            <TabsTrigger value="buildings">Buildings</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Buildings Overview</CardTitle>
                  <CardDescription>{data.buildings.length} buildings monitored</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<InlineLoader text="Loading chart..." />}>
                    <BuildingComparisonChart buildings={data.buildings} />
                  </Suspense>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>CO2 Trend Analysis</CardTitle>
                  <CardDescription>Average CO2 levels by hour</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<InlineLoader text="Loading chart..." />}>
                    <CO2TrendChart co2Data={data.co2Trends} />
                  </Suspense>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Buildings</CardTitle>
                  <CardDescription>Best air quality metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.buildings
                      .filter(b => b.status === 'good')
                      .slice(0, 5)
                      .map((building) => (
                        <div key={building.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{building.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">AQI {building.aqi}</span>
                            <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">
                              Excellent
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Areas Needing Attention</CardTitle>
                  <CardDescription>Buildings with elevated AQI</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.buildings
                      .filter(b => b.status !== 'good')
                      .sort((a, b) => b.aqi - a.aqi)
                      .slice(0, 5)
                      .map((building) => (
                        <div key={building.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{building.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">AQI {building.aqi}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              building.status === 'moderate' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {building.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    {data.buildings.filter(b => b.status !== 'good').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        All buildings have good air quality
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pollutants" className="space-y-4">
            <PollutantBreakdown pollutants={data.pollutants} />
            
            <Card>
              <CardHeader>
                <CardTitle>Pollutant Guidelines</CardTitle>
                <CardDescription>Understanding air quality parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">PM2.5 (Fine Particles)</h4>
                    <p className="text-sm text-muted-foreground">
                      Good: 0-12 µg/m³ • Moderate: 12-35 µg/m³ • Unhealthy: 35-55 µg/m³
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">CO2 (Carbon Dioxide)</h4>
                    <p className="text-sm text-muted-foreground">
                      Good: &lt;800 ppm • Moderate: 800-1000 ppm • Unhealthy: &gt;1000 ppm
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">VOC (Volatile Compounds)</h4>
                    <p className="text-sm text-muted-foreground">
                      Good: 0-220 ppb • Moderate: 220-400 ppb • Unhealthy: &gt;400 ppb
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">PM10 (Coarse Particles)</h4>
                    <p className="text-sm text-muted-foreground">
                      Good: 0-50 µg/m³ • Moderate: 50-150 µg/m³ • Unhealthy: &gt;150 µg/m³
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buildings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Buildings</CardTitle>
                <CardDescription>{data.buildings.length} total buildings monitored</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.buildings.map((building) => (
                    <div key={building.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <span className="font-medium">{building.name}</span>
                        <p className="text-sm text-muted-foreground">{building.deviceCount} devices</p>
                      </div>
                      <div className="flex items-center gap-2">
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
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Trends</CardTitle>
                <CardDescription>Alert distribution over time</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<InlineLoader text="Loading chart..." />}>
                  <AlertTrendChart data={data.alertTrends} />
                </Suspense>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {data.alertTrends.reduce((sum, t) => sum + t.critical, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Require immediate action
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Warning Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">
                    {data.alertTrends.reduce((sum, t) => sum + t.warning, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Need monitoring
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Info Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {data.alertTrends.reduce((sum, t) => sum + t.info, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Informational only
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
