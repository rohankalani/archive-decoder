import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GeneralReportData } from '@/hooks/useGeneralReportData';
import { format } from 'date-fns';

interface ReportDownloadButtonProps {
  startDate: Date;
  endDate: Date;
  data: GeneralReportData | null;
}

export const ReportDownloadButton = ({
  startDate,
  endDate,
  data,
}: ReportDownloadButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const downloadPDF = async () => {
    if (!data) return;

    setIsGenerating(true);
    try {
      const element = document.getElementById('report-content');
      if (!element) {
        throw new Error('Report content not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `air-quality-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.pdf`
      );

      toast({
        title: 'PDF Downloaded',
        description: 'Report has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to generate PDF report.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCSV = () => {
    if (!data) return;

    try {
      const csvRows = [];
      
      // Header
      csvRows.push(['Air Quality Report']);
      csvRows.push([`Period: ${format(startDate, 'PPP')} - ${format(endDate, 'PPP')}`]);
      csvRows.push([]);

      // Summary Metrics
      csvRows.push(['Summary Metrics']);
      csvRows.push(['Metric', 'Value']);
      csvRows.push(['Average AQI', data.summary.averageAqi]);
      csvRows.push(['Total Alerts', data.summary.totalAlerts]);
      csvRows.push(['Performance Score', `${data.summary.performanceScore}%`]);
      csvRows.push(['Devices Monitored', data.summary.devicesMonitored]);
      csvRows.push([]);

      // Buildings
      csvRows.push(['Building Metrics']);
      csvRows.push(['Building', 'Status', 'Avg AQI', 'Alerts']);
      data.buildings.forEach((building) => {
        csvRows.push([
          building.name,
          building.status,
          building.averageAqi,
          building.totalAlerts,
        ]);
      });
      csvRows.push([]);

      // Dominant Pollutants
      csvRows.push(['Dominant Pollutants']);
      csvRows.push(['Pollutant', 'Count']);
      data.dominantPollutants.forEach((pollutant) => {
        csvRows.push([pollutant.name, pollutant.count]);
      });

      const csvContent = csvRows.map((row) => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `air-quality-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'CSV Downloaded',
        description: 'Report has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to generate CSV report.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={!data || isGenerating}>
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Download Report'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadCSV}>
          <Table className="h-4 w-4 mr-2" />
          Download as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
