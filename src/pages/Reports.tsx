import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { BarChart3, Building2, School, TrendingUp, FileText, Sparkles } from 'lucide-react';

const ReportsComponent = React.memo(function ReportsComponent() {
  const navigate = useNavigate();

  const reportTypes = [
    {
      title: 'Summary Report',
      description: 'Overview of air quality metrics and key performance indicators',
      icon: BarChart3,
      path: '/reports/summary',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Buildings Report',
      description: 'Air quality comparison and analysis across all buildings',
      icon: Building2,
      path: '/reports/buildings',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Classrooms Report',
      description: 'Visual heatmap of AQI levels across all classrooms',
      icon: School,
      path: '/reports/classrooms',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Analysis Report',
      description: 'CO2 trends and pollutant analysis with detailed insights',
      icon: TrendingUp,
      path: '/reports/analysis',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'AI Reports',
      description: 'AI-powered campus-wide analysis and utilization insights',
      icon: Sparkles,
      path: '/reports/general',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ];

  return (
    <Layout title="Reports">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Air Quality Reports</h1>
          <p className="text-muted-foreground mt-2">
            Choose a report type to view detailed air quality analytics
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card 
                key={report.path} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(report.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${report.bgColor}`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <CardTitle>{report.title}</CardTitle>
                  </div>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    View Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Features</CardTitle>
            <CardDescription>What you can do with our reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Export Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Download reports as PDF or CSV for sharing and archiving
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Custom Date Ranges</p>
                  <p className="text-sm text-muted-foreground">
                    Select specific time periods for detailed analysis
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Visual Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Interactive charts and graphs for better insights
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">AI-Powered Insights</p>
                  <p className="text-sm text-muted-foreground">
                    Get intelligent recommendations based on your data
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
});

ReportsComponent.displayName = 'Reports';

export default ReportsComponent;