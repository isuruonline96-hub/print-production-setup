/**
 * Label Renderer for PDF
 *
 * Draws the order number + side identifier inside the top margin area,
 * with a white background rectangle behind the text so that any cut line
 * passing through the label position is knocked out and the text remains
 * fully readable after printing.
 */

import { rgb, StandardFonts } from 'pdf-lib';

/**
 * Draw order number label on a PDF page.
 *
 * @param {PDFDocument} doc        - The PDF document.
 * @param {object}      page       - The PDF page.
 * @param {string}      orderNumber - The order number.
 * @param {string}      side        - 'FRONT', 'BACK', etc.
 * @param {number}      paperHeightPt - Paper height in points.
 * @param {number}      marginPt    - Non-printable margin in points.
 */
export async function drawLabel(doc, page, orderNumber, side, paperHeightPt, marginPt) {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 5;
  const padding = 2;        // pt of whitespace around the text
  const text = `${orderNumber}  ${side}`;
  
  // At least 4pt from the paper edge so the label is always inside the printable area
  const safeMargin = Math.max(marginPt, 4);

  // Approximate text width (Helvetica metrics: ~0.56× fontSize per char on average)
  const approxTextWidth = text.length * fontSize * 0.56;

  // X / Y origin (PDF coords: y=0 is bottom of page)
  const x = safeMargin + 2;
  const y = paperHeightPt - safeMargin - fontSize - padding * 2;

  // ── White knockout rectangle ────────────────────────────────────────────
  // Drawn after cut lines (caller's responsibility) so it covers any line
  // that would otherwise run through the label.
  page.drawRectangle({
    x: x - padding,
    y: y - padding,
    width:  approxTextWidth + padding * 2,
    height: fontSize + padding * 2,
    color: rgb(1, 1, 1),        // solid white
    opacity: 1,
  });

  // ── Label text ──────────────────────────────────────────────────────────
  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
}

