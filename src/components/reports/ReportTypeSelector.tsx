import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BarChart3 } from 'lucide-react';

export const ReportTypeSelector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = location.pathname.includes('/reports/general')
    ? 'general'
    : location.pathname.includes('/reports/advanced')
    ? 'advanced'
    : 'general';

  const handleTabChange = (value: string) => {
    if (value === 'general') {
      navigate('/reports/general');
    } else if (value === 'advanced') {
      navigate('/reports/advanced');
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="general" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          General Reports
        </TabsTrigger>
        <TabsTrigger value="advanced" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Advanced Reports
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
