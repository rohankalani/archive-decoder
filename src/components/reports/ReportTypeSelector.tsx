import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, BarChart3 } from 'lucide-react';

export function ReportTypeSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentTab = location.pathname.includes('/reports/advanced') ? 'advanced' : 'general';

  return (
    <Tabs value={currentTab} onValueChange={(value) => navigate(`/reports/${value}`)}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="general" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          General Reports
        </TabsTrigger>
        <TabsTrigger value="advanced" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Advanced Analysis
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
