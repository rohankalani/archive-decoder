import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, TrendingUp, AlertTriangle, Users, Shield, Building, Layers } from 'lucide-react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useReportData } from '@/hooks/useReportData';
import { useMultiClassroomReportData } from '@/hooks/useMultiClassroomReportData';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useDevices } from '@/hooks/useDevices';
import { useLocations } from '@/hooks/useLocations';
import { Layout } from '@/components/Layout';
import { useUnifiedMockData } from '@/contexts/UnifiedMockDataContext';
import { ActivityInsights } from '@/components/reports/ActivityInsights';
import { ExternalComparison } from '@/components/reports/ExternalComparison';
import { ClassroomComparison } from '@/components/reports/ClassroomComparison';

interface DateRange {
  from: Date;
  to: Date;
}

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [reportMode, setReportMode] = useState<'single' | 'classroom-comparison'>('single');

  const { devices } = useDevices();
  const { sites, buildings } = useLocations();
  const { isUsingMockData, reports: mockReports } = useUnifiedMockData();

  // Calculate date range based on selected period with stable references
  const dateRange = useMemo((): DateRange => {
    if (selectedPeriod === 'custom' && customDateRange) {
      return {
        from: new Date(customDateRange.from.getTime()), // Create stable references
        to: new Date(customDateRange.to.getTime())
      };
    }

    const to = new Date();
    to.setHours(23, 59, 59, 999); // End of day for consistency
    let from: Date;

    switch (selectedPeriod) {
      case '1d':
        from = subDays(to, 1);
        break;
      case '7d':
        from = subDays(to, 7);
        break;
      case '30d':
        from = subDays(to, 30);
        break;
      case '3m':
        from = subMonths(to, 3);
        break;
      default:
        from = subDays(to, 7);
    }
    
    from.setHours(0, 0, 0, 0); // Start of day for consistency

    return { from, to };
  }, [selectedPeriod, customDateRange?.from?.getTime(), customDateRange?.to?.getTime()]);

  const { reportData, aiSummary, isLoading, isGeneratingReport, generateReport } = useReportData({
    dateRange,
    deviceId: selectedDevice === 'all' ? undefined : selectedDevice,
    locationId: selectedLocation === 'all' ? undefined : selectedLocation,
  });

  // Memoize hook parameters to prevent infinite re-renders
  const memoizedHookParams = useMemo(() => ({
    dateRange,
    operatingHours: { start: 8, end: 18 },
    selectedBuildings: selectedLocation === 'all' ? undefined : [selectedLocation]
  }), [dateRange.from.getTime(), dateRange.to.getTime(), selectedLocation]);

  const { classroomsData, consolidatedSummary, isLoading: isLoadingClassrooms, generateConsolidatedReport, isGeneratingReport: isGeneratingConsolidated } = useMultiClassroomReportData(memoizedHookParams);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    if (value === 'custom') {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
    }
  };

  const handleGenerateReport = async () => {
    await generateReport();
  };

  const handleDownloadReport = () => {
    if (!aiSummary || !reportData) return;

    const reportContent = `
Air Quality Report - ${format(dateRange.from, 'PPP')} to ${format(dateRange.to, 'PPP')}

${aiSummary}

Data Summary:
- Total Readings: ${reportData.totalReadings}
- Average AQI: ${reportData.averageAqi?.toFixed(1) || 'N/A'}
- Peak Pollution Event: ${reportData.peakPollution?.value?.toFixed(2) || 'N/A'} ${reportData.peakPollution?.unit || ''}
- Alert Count: ${reportData.alertCount}

Generated on: ${format(new Date(), 'PPP')}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `air-quality-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="AI Reports">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-8 glass-card animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 animate-gradient animate-gradient-shift"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-primary/20 glow-primary animate-pulse-glow">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  🚀 AI-Powered Reports
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Advanced air quality intelligence with executive insights and predictive analytics
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <Shield className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium">External Air Quality Comparison</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <TrendingUp className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Business Intelligence & ROI</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <Users className="w-5 h-5 text-tertiary" />
                <span className="text-sm font-medium">Space Activity Analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <Card className="glass-card hover-lift border-primary/20 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              ⚙️ Report Configuration
            </CardTitle>
            <CardDescription className="text-base">
              Configure your report parameters and generate AI-powered insights with external comparisons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Report Mode Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportMode} onValueChange={(value: 'single' | 'classroom-comparison') => setReportMode(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">📊 Single Location Report</SelectItem>
                    <SelectItem value="classroom-comparison">🏫 Classroom Comparison</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Period */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="3m">Last 3 Months</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Device Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Device</label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    {devices?.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {sites?.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} (Site)
                      </SelectItem>
                    ))}
                    {buildings?.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name} (Building)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range */}
            {showCustomDate && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Date Range</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !customDateRange?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange?.from ? (
                          format(customDateRange.from, "PPP")
                        ) : (
                          "Start date"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={customDateRange?.from}
                        onSelect={(date) =>
                          setCustomDateRange((prev) => ({
                            from: date || new Date(),
                            to: prev?.to || new Date(),
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !customDateRange?.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange?.to ? (
                          format(customDateRange.to, "PPP")
                        ) : (
                          "End date"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={customDateRange?.to}
                        onSelect={(date) =>
                          setCustomDateRange((prev) => ({
                            from: prev?.from || new Date(),
                            to: date || new Date(),
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {reportMode === 'single' ? (
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={isGeneratingReport}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold px-6 py-2 rounded-xl glow-primary hover-lift"
                  size="lg"
                >
                  {isGeneratingReport ? (
                    <>
                      <LoadingSpinner className="w-5 h-5 mr-2" />
                      🤖 Generating Intelligence...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      🚀 Generate AI Report
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={generateConsolidatedReport} 
                  disabled={isGeneratingConsolidated}
                  className="bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white font-semibold px-6 py-2 rounded-xl glow-secondary hover-lift"
                  size="lg"
                >
                  {isGeneratingConsolidated ? (
                    <>
                      <LoadingSpinner className="w-5 h-5 mr-2" />
                      🎯 Generating Consolidated Report...
                    </>
                  ) : (
                    <>
                      <Layers className="w-5 h-5 mr-2" />
                      🏫 Generate Classroom Comparison
                    </>
                  )}
                </Button>
              )}
              {aiSummary && (
                <Button 
                  variant="outline" 
                  onClick={handleDownloadReport}
                  className="border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50 px-6 py-2 rounded-xl hover-lift"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  📋 Download Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {(isLoading || isLoadingClassrooms) && (
          <Card className="glass-card border-primary/20">
            <CardContent className="p-12 text-center">
              <div className="animate-pulse-glow mb-6">
                <LoadingSpinner className="w-12 h-12 mx-auto text-primary" />
              </div>
              <p className="text-lg font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                🔄 Loading premium analytics data...
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Content - Single Location vs Classroom Comparison */}
        {reportMode === 'single' && (
          <Card className="glass-card hover-lift border-accent/20 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20 glow-accent">
                  <Building className="w-5 h-5 text-accent" />
                </div>
                📊 Single Location Analysis
              </CardTitle>
              <CardDescription>
                When "All Devices" is selected, this report aggregates data from all sensors in the chosen location to provide comprehensive air quality insights for that specific area, building, or site.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {reportMode === 'classroom-comparison' ? (
          <>
            {classroomsData.length > 0 && (
              <ClassroomComparison 
                classrooms={classroomsData}
                operatingHours={{ start: 8, end: 18 }}
              />
            )}
            {consolidatedSummary && (
              <Card className="glass-card hover-lift border-primary/20 shadow-2xl">
                <CardHeader>
                  <CardTitle>🎯 Executive Consolidated Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {consolidatedSummary}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Single Report Content */}
            {reportData && !isLoading && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
                  <Card className="glass-card hover-lift border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 glow-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-primary-glow">📊 Total Readings</CardTitle>
                      <div className="p-2 rounded-lg bg-primary/20 animate-pulse-glow">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                        {reportData.totalReadings.toLocaleString()}
                      </div>
                      <p className="text-xs text-primary/70 font-medium">
                        📅 Collected over {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card hover-lift border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10 glow-secondary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-secondary-glow">🌬️ Average AQI</CardTitle>
                      <div className="p-2 rounded-lg bg-secondary/20 animate-pulse-glow">
                        <TrendingUp className="h-4 w-4 text-secondary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold bg-gradient-to-r from-secondary to-secondary-glow bg-clip-text text-transparent">
                        {reportData.averageAqi?.toFixed(1) || 'N/A'}
                      </div>
                      <p className="text-xs text-secondary/70 font-medium">
                        Air Quality Index Score
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card hover-lift border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-warning-glow">⚠️ Peak Pollution</CardTitle>
                      <div className="p-2 rounded-lg bg-warning/20 animate-pulse-glow">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold bg-gradient-to-r from-warning to-warning-glow bg-clip-text text-transparent">
                        {reportData.peakPollution?.value?.toFixed(2) || 'N/A'}
                      </div>
                      <p className="text-xs text-warning/70 font-medium">
                        {reportData.peakPollution?.sensorType} ({reportData.peakPollution?.unit})
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card hover-lift border-danger/20 bg-gradient-to-br from-danger/5 to-danger/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-danger-glow">🚨 Alerts Generated</CardTitle>
                      <div className="p-2 rounded-lg bg-danger/20 animate-pulse-glow">
                        <AlertTriangle className="h-4 w-4 text-danger" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold bg-gradient-to-r from-danger to-danger-glow bg-clip-text text-transparent">
                        {reportData.alertCount}
                      </div>
                      <p className="text-xs text-danger/70 font-medium">
                        Air Quality Violations
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Insights */}
                {reportData.activityInsights && (
                  <ActivityInsights activityInsights={reportData.activityInsights} />
                )}

                {/* External Comparison */}
                {reportData.externalComparison && (
                  <ExternalComparison 
                    externalComparison={reportData.externalComparison}
                    indoorPM25={reportData.sensorBreakdown.find(s => s.sensorType === 'pm25')?.average}
                  />
                )}

                {/* AI Summary */}
                {aiSummary && (
                  <Card className="glass-card hover-lift border-primary/20 shadow-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        AI-Generated Report Summary
                      </CardTitle>
                      <CardDescription>
                        Intelligent analysis of your air quality data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {aiSummary}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}