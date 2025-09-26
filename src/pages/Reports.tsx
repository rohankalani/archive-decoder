import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, TrendingUp, AlertTriangle, Users, Building, Layers } from 'lucide-react';
import { format, subDays } from 'date-fns';
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

const ReportsComponent = React.memo(function ReportsComponent() {
  // Fixed to monthly reports only
  const selectedPeriod = '30d';
  const selectedDevice = 'all';
  const selectedLocation = 'all';

  const { devices } = useDevices();
  const { sites, buildings } = useLocations();
  
  // Only get isUsingMockData flag, don't subscribe to the actual mock data to prevent re-renders
  const { isUsingMockData } = useUnifiedMockData();

  // Fixed monthly date range
  const dateRange = useMemo((): DateRange => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = subDays(to, 30);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }, []);

  const { reportData, aiSummary, isLoading, isGeneratingReport, generateReport } = useReportData({
    dateRange,
    deviceId: selectedDevice === 'all' ? undefined : selectedDevice,
    locationId: selectedLocation === 'all' ? undefined : selectedLocation,
  });

  // Memoize hook parameters to prevent infinite re-renders
  const memoizedHookParams = useMemo(() => ({
    dateRange,
    operatingHours: { start: 8, end: 18 },
    selectedBuildings: undefined // All buildings for monthly overview
  }), [dateRange.from.getTime(), dateRange.to.getTime()]);

  const { classroomsData, consolidatedSummary, isLoading: isLoadingClassrooms, generateConsolidatedReport, isGeneratingReport: isGeneratingConsolidated } = useMultiClassroomReportData(memoizedHookParams);

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
                  📊 Monthly Air Quality Report
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Last 30 days campus-wide air quality analysis and insights
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
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
              <Button 
                onClick={generateConsolidatedReport} 
                disabled={isGeneratingConsolidated}
                className="bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white font-semibold px-6 py-2 rounded-xl glow-secondary hover-lift"
                size="lg"
              >
                {isGeneratingConsolidated ? (
                  <>
                    <LoadingSpinner className="w-5 h-5 mr-2" />
                    🎯 Generating Classroom Analysis...
                  </>
                ) : (
                  <>
                    <Layers className="w-5 h-5 mr-2" />
                    🏫 Generate Classroom Analysis
                  </>
                )}
              </Button>
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
          </div>
        </div>

        {(isLoading || isLoadingClassrooms) && (
          <Card className="glass-card border-primary/20">
            <CardContent className="p-12 text-center">
              <div className="animate-pulse-glow mb-6">
                <LoadingSpinner className="w-12 h-12 mx-auto text-primary" />
              </div>
              <p className="text-lg font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                🔄 Loading monthly analytics data...
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campus Overview Card */}
        {classroomsData && classroomsData.length > 0 && (
          <Card className="glass-card hover-lift border-primary/20 shadow-xl mb-6">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                🏢 Campus Air Quality Overview
              </CardTitle>
              <CardDescription className="text-base">
                Monthly performance summary for all monitored locations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {classroomsData.length}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Locations Monitored
                  </div>
                </div>
                
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                    {classroomsData.filter(room => room.averageAqi <= 50).length}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                    Good Air Quality
                  </div>
                </div>
                
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                    {classroomsData.filter(room => room.averageAqi > 50 && room.averageAqi <= 100).length}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                    Moderate Quality
                  </div>
                </div>
                
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200 dark:border-red-800">
                  <div className="text-3xl font-bold text-red-700 dark:text-red-400">
                    {classroomsData.filter(room => room.averageAqi > 100).length}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-500 mt-1">
                    Needs Attention
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-foreground">Campus Average AQI</div>
                    <div className="text-sm text-muted-foreground">Overall air quality index</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {(classroomsData.reduce((sum, room) => sum + room.averageAqi, 0) / classroomsData.length).toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {classroomsData.reduce((sum, room) => sum + room.averageAqi, 0) / classroomsData.length <= 50 
                        ? 'Good' 
                        : classroomsData.reduce((sum, room) => sum + room.averageAqi, 0) / classroomsData.length <= 100 
                        ? 'Moderate' 
                        : 'Poor'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Single Location Report */}
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
                    <AlertTriangle className="h-4 w-4 text-secondary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-secondary to-secondary-glow bg-clip-text text-transparent">
                    {reportData.averageAqi?.toFixed(1) || 'N/A'}
                  </div>
                  <p className="text-xs text-secondary/70 font-medium">
                    ⚡ Air Quality Index
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 glow-accent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-accent-glow">⚠️ Alert Count</CardTitle>
                  <div className="p-2 rounded-lg bg-accent/20 animate-pulse-glow">
                    <AlertTriangle className="h-4 w-4 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
                    {reportData.alertCount}
                  </div>
                  <p className="text-xs text-accent/70 font-medium">
                    🚨 Critical Events
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift border-tertiary/20 bg-gradient-to-br from-tertiary/5 to-tertiary/10 glow-tertiary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-tertiary-glow">🔥 Peak Event</CardTitle>
                  <div className="p-2 rounded-lg bg-tertiary/20 animate-pulse-glow">
                    <TrendingUp className="h-4 w-4 text-tertiary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-tertiary to-tertiary-glow bg-clip-text text-transparent">
                    {reportData.peakPollution?.value?.toFixed(1) || 'N/A'}
                  </div>
                  <p className="text-xs text-tertiary/70 font-medium">
                    🎯 {reportData.peakPollution?.unit || 'Peak Value'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {aiSummary && (
              <Card className="glass-card hover-lift border-primary/30 shadow-2xl mt-8 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    <div className="p-2 rounded-lg bg-primary/20 glow-primary animate-pulse-glow">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    🤖 AI Executive Summary
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

        {/* Classroom Analysis Report */}
        {classroomsData && classroomsData.length > 0 && (
          <>
            <ClassroomComparison 
              classrooms={classroomsData}
              operatingHours={{ start: 8, end: 18 }}
            />
            {consolidatedSummary && (
              <Card className="glass-card hover-lift border-primary/20 shadow-2xl">
                <CardHeader>
                  <CardTitle>🎯 Executive Consolidated Analysis</CardTitle>
                  <CardDescription>
                    AI-powered insights across all monitored classrooms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {consolidatedSummary}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
});

ReportsComponent.displayName = 'Reports';

export default ReportsComponent;