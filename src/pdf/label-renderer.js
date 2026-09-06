/**
 * Label Renderer for PDF
 * 
 * Draws the order number and side identifier at the top-left corner
 * of the PDF page, in the non-printable margin area.
 * 
 * This text is for technical/job identification only.
 * It MUST NOT interfere with artwork positioning.
 */

import { rgb, StandardFonts } from 'pdf-lib';

/**
 * Draw order number label on a PDF page.
 * 
 * @param {PDFDocument} doc - The PDF document.
 * @param {object} page - The PDF page.
 * @param {string} orderNumber - The order number.
 * @param {string} side - 'FRONT' or 'BACK'.
 * @param {number} paperHeightPt - Paper height in points.
 * @param {number} marginPt - Non-printable margin in points.
 */
export async function drawLabel(doc, page, orderNumber, side, paperHeightPt, marginPt) {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 6;
  const text = `${orderNumber} ${side}`;
  
  // Position in the top-left non-printable margin area
  // X: small offset from left edge
  // Y: near the top of the page (in PDF coords, top = paperHeight)
  const x = 2;
  const y = paperHeightPt - fontSize - 1; // 1pt from top
  
  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0.3, 0.3, 0.3), // Dark gray to be visible but not intrusive
  });
}
