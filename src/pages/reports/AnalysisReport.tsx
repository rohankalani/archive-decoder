import { useState, Suspense, lazy, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEnhancedReportData } from '@/hooks/useEnhancedReportData';
import { InlineLoader } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { ExportButton } from '@/components/reports/ExportButton';
import { PollutantBreakdown } from '@/components/reports/PollutantBreakdown';
import { InsightsPanel } from '@/components/reports/InsightsPanel';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Wind, Thermometer, Droplets } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CO2TrendChart = lazy(() => import('@/components/reports/CO2TrendChart'));

export default function AnalysisReport() {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, isLoading, error } = useEnhancedReportData(startDate, endDate, false);

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
        <div className="flex items-center gap-2">
          <ExportButton reportTitle="Analysis Report" reportContainerRef={reportRef} />
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
        <Tabs defaultValue="co2" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="co2">CO2 Analysis</TabsTrigger>
            <TabsTrigger value="pollutants">Pollutants</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="co2" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average CO2</CardTitle>
                  <Wind className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgCO2} ppm</div>
                  <p className="text-xs text-muted-foreground">Across all hours</p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      avgCO2 <= 800 ? 'bg-green-500/10 text-green-500' :
                      avgCO2 <= 1000 ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {avgCO2 <= 800 ? 'Good' : avgCO2 <= 1000 ? 'Moderate' : 'Poor'}
                    </span>
                  </div>
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
                  <div className="mt-2 text-xs text-muted-foreground">
                    {maxCO2 > 1500 ? 'Critical ventilation needed' : 
                     maxCO2 > 1000 ? 'Consider ventilation' : 
                     'Within acceptable range'}
                  </div>
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
                  {peakHour && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Typical occupancy peak time
                    </div>
                  )}
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
                <CardDescription>Breakdown by hour with status indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.co2Trends.map((trend) => {
                    const status = trend.avgValue <= 800 ? 'good' : trend.avgValue <= 1000 ? 'moderate' : 'poor';
                    return (
                      <div key={trend.hour} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Wind className={`h-4 w-4 ${
                            status === 'good' ? 'text-green-500' :
                            status === 'moderate' ? 'text-yellow-500' :
                            'text-red-500'
                          }`} />
                          <span className="text-sm font-medium">{trend.hour}:00 - {trend.hour + 1}:00</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Avg: </span>
                            <span className="font-medium">{trend.avgValue} ppm</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Max: </span>
                            <span className="font-medium">{trend.maxValue} ppm</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            status === 'good' ? 'bg-green-500/10 text-green-500' :
                            status === 'moderate' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CO2 Guidelines</CardTitle>
                <CardDescription>Understanding CO2 levels and their impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-green-500/5">
                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
                    <div>
                      <p className="font-medium text-sm">Good (&lt;800 ppm)</p>
                      <p className="text-xs text-muted-foreground">Optimal indoor air quality. No ventilation adjustments needed.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-500/5">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1"></div>
                    <div>
                      <p className="font-medium text-sm">Moderate (800-1000 ppm)</p>
                      <p className="text-xs text-muted-foreground">Acceptable levels. Consider increasing ventilation during peak occupancy.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-red-500/5">
                    <div className="w-3 h-3 rounded-full bg-red-500 mt-1"></div>
                    <div>
                      <p className="font-medium text-sm">Poor (&gt;1000 ppm)</p>
                      <p className="text-xs text-muted-foreground">Elevated levels. Increase ventilation immediately to improve air quality and comfort.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pollutants" className="space-y-4">
            <PollutantBreakdown pollutants={data.pollutants} />

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Environmental Factors</CardTitle>
                  <CardDescription>Temperature and humidity impact on air quality</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Thermometer className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium text-sm">Temperature Impact</p>
                          <p className="text-xs text-muted-foreground">Affects pollutant concentration</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">Moderate</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Droplets className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">Humidity Levels</p>
                          <p className="text-xs text-muted-foreground">Influences air quality perception</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">Normal</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Actions to improve air quality</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.pollutants.some(p => p.status === 'critical' || p.status === 'unhealthy') && (
                      <div className="flex items-start gap-2 p-2 bg-red-500/10 rounded">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1"></div>
                        <p className="text-sm">Increase ventilation in areas with poor air quality</p>
                      </div>
                    )}
                    {avgCO2 > 1000 && (
                      <div className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1"></div>
                        <p className="text-sm">Schedule ventilation system maintenance</p>
                      </div>
                    )}
                    <div className="flex items-start gap-2 p-2 bg-blue-500/10 rounded">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
                      <p className="text-sm">Monitor peak hours for optimal HVAC scheduling</p>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                      <p className="text-sm">Continue regular sensor calibration checks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <InsightsPanel insights={data.insights} />

            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
                <CardDescription>Key findings from this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Air Quality Trends</h4>
                    <p className="text-sm text-muted-foreground">
                      Average AQI of {data.summary.avgAqi} indicates {
                        data.summary.avgAqi <= 50 ? 'excellent air quality across campus' :
                        data.summary.avgAqi <= 100 ? 'acceptable air quality with room for improvement' :
                        'elevated pollution levels requiring attention'
                      }.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">CO2 Performance</h4>
                    <p className="text-sm text-muted-foreground">
                      Average CO2 at {avgCO2} ppm {
                        avgCO2 <= 800 ? 'meets optimal ventilation standards' :
                        avgCO2 <= 1000 ? 'is within acceptable range but could be improved' :
                        'exceeds recommended levels and requires ventilation improvements'
                      }.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Peak Activity Patterns</h4>
                    <p className="text-sm text-muted-foreground">
                      {peakHour ? `Peak CO2 levels occur around ${peakHour.hour}:00, correlating with maximum occupancy periods.` :
                       'Insufficient data to determine peak activity patterns.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
