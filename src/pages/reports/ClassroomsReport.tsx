import { useState, Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimplifiedReportData } from '@/hooks/useSimplifiedReportData';
import { InlineLoader } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { ExportButton } from '@/components/reports/ExportButton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { School } from 'lucide-react';

const ClassroomHeatmap = lazy(() => import('@/components/reports/ClassroomHeatmap'));

export default function ClassroomsReport() {
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
      <div className="container mx-auto p-6">
        <InlineLoader text="Loading classrooms data..." />
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

  const goodClassrooms = data.classrooms.filter(c => c.aqi <= 50).length;
  const moderateClassrooms = data.classrooms.filter(c => c.aqi > 50 && c.aqi <= 100).length;
  const sensitiveClassrooms = data.classrooms.filter(c => c.aqi > 100 && c.aqi <= 150).length;
  const unhealthyClassrooms = data.classrooms.filter(c => c.aqi > 150).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classrooms Report</h1>
          <p className="text-muted-foreground">Air quality heatmap across all classrooms</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton reportTitle="Classrooms Report" />
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
            <School className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goodClassrooms}</div>
            <p className="text-xs text-muted-foreground">Classrooms with AQI ≤ 50</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderate Quality</CardTitle>
            <School className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderateClassrooms}</div>
            <p className="text-xs text-muted-foreground">Classrooms with AQI 51-100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unhealthy Quality</CardTitle>
            <School className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unhealthyClassrooms}</div>
            <p className="text-xs text-muted-foreground">Classrooms with AQI &gt; 100</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classroom Heatmap</CardTitle>
          <CardDescription>Visual representation of AQI levels across classrooms</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<InlineLoader text="Loading heatmap..." />}>
            <ClassroomHeatmap classrooms={data.classrooms} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classrooms Overview</CardTitle>
          <CardDescription>{data.classrooms.length} total classrooms monitored</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.classrooms.map((classroom) => (
              <div key={classroom.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <School className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{classroom.name}</p>
                    <p className="text-sm text-muted-foreground">Room {classroom.roomNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">AQI {classroom.aqi}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    classroom.aqi <= 50 ? 'bg-green-500/10 text-green-500' :
                    classroom.aqi <= 100 ? 'bg-yellow-500/10 text-yellow-500' :
                    classroom.aqi <= 150 ? 'bg-orange-500/10 text-orange-500' :
                    classroom.aqi <= 200 ? 'bg-red-500/10 text-red-500' :
                    classroom.aqi <= 300 ? 'bg-purple-500/10 text-purple-500' :
                    'bg-red-900/10 text-red-900'
                  }`}>
                    {classroom.aqi <= 50 ? 'Good' : 
                     classroom.aqi <= 100 ? 'Moderate' : 
                     classroom.aqi <= 150 ? 'Sensitive' :
                     classroom.aqi <= 200 ? 'Unhealthy' :
                     classroom.aqi <= 300 ? 'Very Unhealthy' : 'Hazardous'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
