import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, Building2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useEnhancedReportData } from '@/hooks/useEnhancedReportData';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { ExportButton } from '@/components/reports/ExportButton';
import { TrendComparison } from '@/components/reports/TrendComparison';
import { InsightsPanel } from '@/components/reports/InsightsPanel';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BuildingComparisonChart from '@/components/reports/BuildingComparisonChart';
import { Badge } from '@/components/ui/badge';

export function GeneralReportsSimple() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  const reportRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error } = useEnhancedReportData(dateRange.start, dateRange.end);

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load report data: {error.message}
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Air Quality Analysis Report</h1>
              <p className="text-muted-foreground">
                Comprehensive overview of air quality metrics and trends
              </p>
            </div>
          </div>
          {!isLoading && data && (
            <ExportButton
              reportTitle="Air Quality Analysis Report"
              reportContainerRef={reportRef}
            />
          )}
        </div>

        <PeriodSelector
          onPeriodChange={(start, end) => setDateRange({ start, end })}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading report data..." />
          </div>
        ) : data ? (
          <div ref={reportRef} className="space-y-6">
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <TrendComparison
                title="Average AQI"
                currentValue={data.summary.avgAqi}
                previousValue={data.previousPeriod.avgAqi}
                description="Campus-wide air quality index"
              />
              <TrendComparison
                title="Total Alerts"
                currentValue={data.summary.totalAlerts}
                previousValue={data.previousPeriod.totalAlerts}
                description="Threshold breaches"
                reverseColors
              />
              <TrendComparison
                title="Active Devices"
                currentValue={data.summary.activeDevices}
                previousValue={data.previousPeriod.activeDevices}
                description="Devices online"
              />
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-medium">Monitored Buildings</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.buildings.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {data.summary.devicesCount} sensor locations
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <InsightsPanel insights={data.insights} />

            {/* Detailed Analysis */}
            <Tabs defaultValue="buildings" className="space-y-4">
              <TabsList>
                <TabsTrigger value="buildings">Buildings</TabsTrigger>
                <TabsTrigger value="status">System Status</TabsTrigger>
                <TabsTrigger value="summary">Executive Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="buildings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Building Performance Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BuildingComparisonChart buildings={data.buildings} />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Performing Buildings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.buildings
                          .filter(b => b.status === 'good')
                          .slice(0, 5)
                          .map(building => (
                            <div key={building.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-green-500" />
                                <span className="font-medium">{building.name}</span>
                              </div>
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                AQI {building.aqi}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Buildings Needing Attention</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.buildings
                          .filter(b => b.status !== 'good')
                          .slice(0, 5)
                          .map(building => (
                            <div key={building.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="font-medium">{building.name}</span>
                              </div>
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                AQI {building.aqi}
                              </Badge>
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

              <TabsContent value="status" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Device Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Online</span>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {data.summary.activeDevices}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Offline</span>
                          <Badge variant="outline">
                            {data.summary.devicesCount - data.summary.activeDevices}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Uptime</span>
                          <Badge variant="outline">
                            {Math.round((data.summary.activeDevices / data.summary.devicesCount) * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Alert Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {data.alertTrends.length > 0 ? (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Critical</span>
                              <Badge variant="destructive">
                                {data.alertTrends.reduce((sum, d) => sum + d.critical, 0)}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Warning</span>
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                {data.alertTrends.reduce((sum, d) => sum + d.warning, 0)}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Info</span>
                              <Badge variant="outline">
                                {data.alertTrends.reduce((sum, d) => sum + d.info, 0)}
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No alerts in this period
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Data Quality</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Coverage</span>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {Math.round((data.summary.activeDevices / data.summary.devicesCount) * 100)}%
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Readings</span>
                          <Badge variant="outline">Real-time</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Overall Air Quality Status</h3>
                      <p className="text-sm text-muted-foreground">
                        The campus-wide average AQI of {data.summary.avgAqi} indicates{' '}
                        {data.summary.avgAqi <= 50
                          ? 'excellent air quality across all monitored spaces.'
                          : data.summary.avgAqi <= 100
                          ? 'moderate air quality. Some sensitive groups may experience minor issues.'
                          : 'unhealthy air quality that requires immediate attention and corrective action.'}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">System Performance</h3>
                      <p className="text-sm text-muted-foreground">
                        {data.summary.activeDevices} out of {data.summary.devicesCount} devices are
                        currently online ({Math.round((data.summary.activeDevices / data.summary.devicesCount) * 100)}%
                        uptime), providing comprehensive coverage across {data.buildings.length} buildings.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Key Recommendations</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {data.insights
                          .filter(i => i.type === 'warning' || i.type === 'critical')
                          .slice(0, 3)
                          .map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{insight.description}</span>
                            </li>
                          ))}
                        {data.insights.filter(i => i.type === 'warning' || i.type === 'critical').length === 0 && (
                          <li className="text-green-600">
                            No critical recommendations. Continue current maintenance practices.
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
