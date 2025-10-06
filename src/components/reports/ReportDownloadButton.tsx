import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface ReportDownloadButtonProps {
  reportData: any;
  period: string;
}

export function ReportDownloadButton({ reportData, period }: ReportDownloadButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handlePDFDownload = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Cover Page
      pdf.setFontSize(24);
      pdf.text('Air Quality Report', pageWidth / 2, 40, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(period, pageWidth / 2, 60, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 80, { align: 'center' });

      // Executive Summary
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.text('Executive Summary', 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Average Campus AQI: ${reportData?.summary?.avgAqi?.toFixed(0) || 'N/A'}`, 20, 40);
      pdf.text(`Performance Score: ${reportData?.summary?.buildingPerformanceScore?.toFixed(0) || 'N/A'}/100`, 20, 50);
      pdf.text(`Total Alerts: ${Object.values(reportData?.summary?.totalAlerts || {}).reduce((a: number, b: any) => a + b, 0)}`, 20, 60);

      // Building Comparison
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.text('Building Comparison', 20, 20);
      let yPos = 40;
      reportData?.buildingMetrics?.forEach((building: any, idx: number) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.setFontSize(12);
        pdf.text(`${idx + 1}. ${building.buildingName}`, 20, yPos);
        pdf.text(`   AQI: ${building.avgAqi.toFixed(0)} | Status: ${building.status}`, 20, yPos + 7);
        pdf.text(`   Dominant: ${building.dominantPollutant} | Alerts: ${building.alertCount}`, 20, yPos + 14);
        yPos += 25;
      });

      // Save PDF
      pdf.save(`air-quality-report-${period.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGenerating(false);
    }
  };

  const handleCSVDownload = () => {
    try {
      const csvData = [
        ['Building Name', 'Average AQI', 'Status', 'Dominant Pollutant', 'Alert Count', 'Classrooms'],
        ...reportData?.buildingMetrics?.map((b: any) => [
          b.buildingName,
          b.avgAqi.toFixed(0),
          b.status,
          b.dominantPollutant,
          b.alertCount,
          b.classroomCount
        ]) || []
      ];

      const csv = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `air-quality-data-${period.toLowerCase().replace(/\s+/g, '-')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV data exported successfully');
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Failed to export CSV data');
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handlePDFDownload} disabled={generating}>
        <Download className="w-4 h-4 mr-2" />
        {generating ? 'Generating...' : 'Download PDF'}
      </Button>
      <Button onClick={handleCSVDownload} variant="outline">
        <FileText className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}
