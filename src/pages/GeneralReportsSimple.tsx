import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export function GeneralReportsSimple() {
  return (
    <Layout title="General Air Quality Reports">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Air Quality Analysis Report</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Comprehensive overview of air quality metrics and trends
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Report components loading...</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
