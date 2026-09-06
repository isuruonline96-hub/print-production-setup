/**
 * PDF Parser
 * 
 * Uses pdf-lib to read uploaded PDF files and extract page dimensions.
 * Preserves the PDF bytes for later embedding into output PDFs.
 */

import { PDFDocument } from 'pdf-lib';

/**
 * Parse a PDF file and extract page dimensions.
 * 
 * @param {File} file - The PDF file.
 * @returns {Promise<object>} Parsed file info.
 */
export async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  
  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
  } catch (err) {
    throw new Error(`Unable to read the uploaded PDF file: ${err.message}`);
  }
  
  const pages = pdfDoc.getPages();
  if (pages.length === 0) {
    throw new Error('The uploaded PDF has no pages.');
  }
  
  // Get first page dimensions
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  
  // MediaBox is used for physical dimensions
  // pdf-lib getSize() returns the MediaBox dimensions in points
  
  return {
    type: 'pdf',
    filename: file.name,
    data,
    widthPt: width,
    heightPt: height,
    pixelWidth: null,
    pixelHeight: null,
    dpi: null,
    dpiWarning: null,
    pageCount: pages.length,
    orientation: width >= height ? 'Landscape' : 'Portrait',
    resolution: `${width.toFixed(1)} × ${height.toFixed(1)} pt (vector)`,
  };
}
