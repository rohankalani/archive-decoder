import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Building2, School, TrendingUp, FileText } from 'lucide-react';

export function ReportNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { value: 'summary', label: 'Summary', icon: BarChart3, path: '/reports/summary' },
    { value: 'buildings', label: 'Buildings', icon: Building2, path: '/reports/buildings' },
    { value: 'classrooms', label: 'Classrooms', icon: School, path: '/reports/classrooms' },
    { value: 'analysis', label: 'Analysis', icon: TrendingUp, path: '/reports/analysis' },
    { value: 'general', label: 'General', icon: FileText, path: '/reports/general' },
  ];

  const currentTab = tabs.find(tab => location.pathname === tab.path)?.value || 'summary';

  return (
    <Tabs value={currentTab} onValueChange={(value) => {
      const tab = tabs.find(t => t.value === value);
      if (tab) navigate(tab.path);
    }}>
      <TabsList className="grid w-full grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
