import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ExportButtonProps {
  reportTitle: string;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
}

export function ExportButton({ reportTitle, onExportPDF, onExportCSV }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      if (onExportPDF) {
        onExportPDF();
      } else {
        // Default PDF export
        const pdf = new jsPDF();
        pdf.setFontSize(20);
        pdf.text(reportTitle, 20, 20);
        pdf.setFontSize(12);
        pdf.text('Report generated on: ' + new Date().toLocaleDateString(), 20, 30);
        pdf.text('Export the content of your report here.', 20, 40);
        pdf.save(`${reportTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      }
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCSVExport = () => {
    setIsExporting(true);
    try {
      if (onExportCSV) {
        onExportCSV();
      } else {
        // Default CSV export
        const csvContent = `${reportTitle}\nGenerated on: ${new Date().toLocaleDateString()}\n\nData would be exported here`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('CSV export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background z-50">
        <DropdownMenuItem onClick={handlePDFExport}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCSVExport}>
          <Table className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
