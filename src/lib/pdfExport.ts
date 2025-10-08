import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CaptureOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

/**
 * Captures an HTML element and converts it to a PDF
 * @param element - The HTML element to capture
 * @param options - Export options (filename, quality, scale)
 * @returns Promise that resolves when PDF is downloaded
 */
export async function captureElementToPDF(
  element: HTMLElement,
  options: CaptureOptions = {}
): Promise<void> {
  const {
    filename = `report-${new Date().toISOString().split('T')[0]}.pdf`,
    quality = 0.95,
    scale = 2, // Higher scale for better quality
  } = options;

  // Capture the element as a canvas
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  // Convert canvas to image
  const imgData = canvas.toDataURL('image/png', quality);
  
  // Calculate PDF dimensions (A4 format)
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Create PDF
  const pdf = new jsPDF({
    orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let heightLeft = imgHeight;
  let position = 0;

  // Add first page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add additional pages if content is longer than one page
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Download the PDF
  pdf.save(filename);
}
