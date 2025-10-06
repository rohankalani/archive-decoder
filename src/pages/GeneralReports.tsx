import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { SummaryMetricsCards } from '@/components/reports/SummaryMetricsCards';
import { DominantPollutantPieChart } from '@/components/reports/DominantPollutantPieChart';
import { CO2AnalysisDashboard } from '@/components/reports/CO2AnalysisDashboard';
import { BuildingComparisonGrid } from '@/components/reports/BuildingComparisonGrid';
import { ClassroomHeatMap } from '@/components/reports/ClassroomHeatMap';
import { ReportDownloadButton } from '@/components/reports/ReportDownloadButton';
import { useGeneralReportData } from '@/hooks/useGeneralReportData';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function GeneralReports() {
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data, isLoading, error } = useGeneralReportData({
    startDate,
    endDate,
  });

  const handlePeriodChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <Layout title="General Air Quality Reports">
      <div className="space-y-6">
        {/* Header Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Air Quality Analysis Report</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comprehensive overview of air quality metrics and trends
                  </p>
                </div>
              </div>
              <ReportDownloadButton
                startDate={startDate}
                endDate={endDate}
                data={data}
              />
            </div>
          </CardHeader>
          <CardContent>
            <PeriodSelector onPeriodChange={handlePeriodChange} />
          </CardContent>
        </Card>

        {/* Loading & Error States */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <ErrorDisplay
            message="Failed to load report data"
            error={error}
          />
        )}

        {/* Report Content */}
        {!isLoading && !error && data && (
          <div id="report-content" className="space-y-6">
            {/* Summary Metrics */}
            <SummaryMetricsCards metrics={data.summary} />

            {/* Building Comparison */}
            <BuildingComparisonGrid buildings={data.buildings} />

            {/* Classroom Heat Map */}
            <ClassroomHeatMap heatMapData={data.classroomHeatMap} />

            {/* CO2 Analysis */}
            <CO2AnalysisDashboard analysis={data.co2Analysis} />

            {/* Dominant Pollutants */}
            <DominantPollutantPieChart pollutants={data.dominantPollutants} />
          </div>
        )}
      </div>
    </Layout>
  );
}
