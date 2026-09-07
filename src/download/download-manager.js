/**
 * Download Manager
 * 
 * Handles individual PDF downloads and ZIP bundle creation.
 * Supports both Normal mode (4 PDFs) and Foil mode (6 PDFs).
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
 * Download all PDFs as a ZIP file.
 * Automatically includes foil PDFs if present in the pdfs object.
 * 
 * @param {object} pdfs - Object with front, back, [frontFoil, backFoil], frontCut, backCut.
 * @param {string} orderNumber - The order number for the ZIP filename.
 */
export async function downloadAllAsZip(pdfs, orderNumber) {
  const zip = new JSZip();
  
  zip.file(pdfs.front.filename,    pdfs.front.data);
  zip.file(pdfs.back.filename,     pdfs.back.data);

  // Foil PDFs (only present in Foil Print mode)
  if (pdfs.frontFoil) zip.file(pdfs.frontFoil.filename, pdfs.frontFoil.data);
  if (pdfs.backFoil)  zip.file(pdfs.backFoil.filename,  pdfs.backFoil.data);

  zip.file(pdfs.frontCut.filename, pdfs.frontCut.data);
  zip.file(pdfs.backCut.filename,  pdfs.backCut.data);
  
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${orderNumber}-print-files.zip`);
}
