/**
 * Download Manager
 * 
 * Handles individual PDF downloads and ZIP bundle creation.
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Download a single PDF file.
 * 
 * @param {Uint8Array} data - The PDF data.
 * @param {string} filename - The filename.
 */
export function downloadPDF(data, filename) {
  const blob = new Blob([data], { type: 'application/pdf' });
  saveAs(blob, filename);
}

/**
 * Download all 4 PDFs as a ZIP file.
 * 
 * @param {object} pdfs - Object with front, back, frontCut, backCut.
 * @param {string} orderNumber - The order number for the ZIP filename.
 */
export async function downloadAllAsZip(pdfs, orderNumber) {
  const zip = new JSZip();
  
  zip.file(pdfs.front.filename, pdfs.front.data);
  zip.file(pdfs.back.filename, pdfs.back.data);
  zip.file(pdfs.frontCut.filename, pdfs.frontCut.data);
  zip.file(pdfs.backCut.filename, pdfs.backCut.data);
  
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${orderNumber}-print-files.zip`);
}
