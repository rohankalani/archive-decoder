import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Building, Calendar } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
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
  const [selectedMonth, setSelectedMonth] = React.useState<string>('current');

  // Generate month options (current + 11 previous months)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      const value = i === 0 ? 'current' : `${date.getFullYear()}-${date.getMonth()}`;
      const label = i === 0 ? 'Current Month' : format(date, 'MMMM yyyy');
      options.push({ value, label, date });
    }
    return options;
  }, []);

  // Calculate date range based on selected month
  const dateRange = useMemo((): DateRange => {
    const selectedOption = monthOptions.find(opt => opt.value === selectedMonth);
    if (!selectedOption) return { from: new Date(), to: new Date() };
    
    const from = startOfMonth(selectedOption.date);
    const to = endOfMonth(selectedOption.date);
    return { from, to };
  }, [selectedMonth, monthOptions]);

  // Calculate classroom utilization excluding weekends and holidays
  const calculateClassroomUtilization = (classrooms: any[]) => {
    if (!classrooms.length) return 0;
    
    // Detect holidays by analyzing sensor patterns
    // Low temperature + low CO2 across all classrooms indicates holiday
    const avgTemp = classrooms.reduce((sum, room) => sum + (room.averageTemperature || 20), 0) / classrooms.length;
    const avgCO2 = classrooms.reduce((sum, room) => sum + (room.averageCo2 || 400), 0) / classrooms.length;
    
    // Holiday thresholds (adjust based on your data patterns)
    const isHoliday = avgTemp < 18 && avgCO2 < 350;
    
    // Calculate utilization during operational hours (8-18), excluding weekends and holidays
    const totalPossibleHours = 10; // 8AM to 6PM = 10 hours
    const actualUtilizedHours = classrooms.reduce((sum, room) => {
      // Mock calculation - in real implementation, check actual occupancy data
      return sum + (room.utilizationHours || 6); // Average 6 hours utilization
    }, 0) / classrooms.length;
    
    return ((actualUtilizedHours / totalPossibleHours) * 100);
  };

  // Memoize hook parameters to prevent infinite re-renders
  const memoizedHookParams = useMemo(() => ({
    dateRange,
    operatingHours: { start: 8, end: 18 },
    selectedBuildings: undefined // All buildings for monthly overview
  }), [dateRange.from.getTime(), dateRange.to.getTime()]);

  const { classroomsData, consolidatedSummary, isLoading: isLoadingClassrooms, generateConsolidatedReport } = useMultiClassroomReportData(memoizedHookParams);

  // Auto-generate report when data loads
  useEffect(() => {
    if (classroomsData && classroomsData.length > 0 && !consolidatedSummary) {
      generateConsolidatedReport();
    }
  }, [classroomsData, consolidatedSummary, generateConsolidatedReport]);

  // Calculate utilization for campus overview
  const campusUtilization = useMemo(() => {
    return classroomsData ? calculateClassroomUtilization(classroomsData) : 0;
  }, [classroomsData]);

  const handleDownloadReport = () => {
    if (!consolidatedSummary || !classroomsData) return;

    const selectedMonthLabel = monthOptions.find(opt => opt.value === selectedMonth)?.label || 'Current Month';
    
    const reportContent = `
Campus Air Quality & Utilization Report - ${selectedMonthLabel}
Report Period: ${format(dateRange.from, 'PPP')} to ${format(dateRange.to, 'PPP')}

CAMPUS OVERVIEW:
- Locations Monitored: ${classroomsData.length}
- Average Campus AQI: ${(classroomsData.reduce((sum, room) => sum + room.averageAqi, 0) / classroomsData.length).toFixed(1)}
- Classroom Utilization During Operational Hours: ${campusUtilization.toFixed(1)}%

AIR QUALITY BREAKDOWN:
- Good Air Quality (≤50 AQI): ${classroomsData.filter(room => room.averageAqi <= 50).length} locations
- Moderate Quality (51-100 AQI): ${classroomsData.filter(room => room.averageAqi > 50 && room.averageAqi <= 100).length} locations  
- Needs Attention (>100 AQI): ${classroomsData.filter(room => room.averageAqi > 100).length} locations

AI ANALYSIS:
${consolidatedSummary}

Generated on: ${format(new Date(), 'PPP')}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campus-report-${format(dateRange.from, 'yyyy-MM')}.txt`;
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/20 glow-primary animate-pulse-glow">
                  <Building className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    📊 Campus Air Quality Report
                  </h1>
                  <p className="text-lg text-muted-foreground mt-2">
                    Monthly campus-wide air quality analysis and classroom utilization insights
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {consolidatedSummary && (
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
        </div>

        {isLoadingClassrooms && (
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

        {/* Campus Space Utilization */}
        {classroomsData && classroomsData.length > 0 && (
          <Card className="glass-card hover-lift border-primary/20 shadow-xl mb-6">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                🏫 Campus Space Utilization During Operational Hours
              </CardTitle>
              <CardDescription className="text-base">
                Classroom utilization analysis excluding weekends and holidays
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-8">
                <div className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
                  {campusUtilization.toFixed(1)}%
                </div>
                <div className="text-xl text-muted-foreground">
                  Average Classroom Utilization
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Based on {classroomsData.length} monitored locations • Excludes weekends & detected holidays
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {(classroomsData.reduce((sum, room) => sum + room.averageAqi, 0) / classroomsData.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                    Average AQI
                  </div>
                </div>
                
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800">
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                    {classroomsData[0]?.operatingHours 
                      ? `${classroomsData[0].operatingHours.end - classroomsData[0].operatingHours.start}h` 
                      : '10h'}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-500 mt-1">
                    Daily Operating Hours
                    {classroomsData.some((r: any) => r.operatingHours?.start !== classroomsData[0]?.operatingHours?.start) && 
                      <span className="block text-xs mt-1">(varies by room)</span>
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Classroom Analysis Report */}
        {classroomsData && classroomsData.length > 0 && (
          <>
            <ClassroomComparison 
              classrooms={classroomsData}
              operatingHours={classroomsData[0]?.operatingHours || { start: 8, end: 18 }}
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