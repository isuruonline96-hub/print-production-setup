/**
 * Cut-Line Renderer for PDF
 * 
 * Draws vector cut lines onto a PDF page using pdf-lib drawing operators.
 * Lines are thin technical lines suitable for cutting guides.
 */

import { rgb } from 'pdf-lib';

/**
 * Default cut-line style.
 * Structured for future extension (spot color, CutContour, etc.)
 */
export const CUT_LINE_STYLES = {
  standard: {
    color: rgb(0, 0, 0),        // Black
    lineWidth: 0.25,             // 0.25pt thin technical line
    dashArray: [],               // Solid line
    opacity: 1,
  },
  // Future: CutContour, crease, kiss-cut, die-cut, perforation
};

/**
 * Draw cut lines onto a PDF page.
 * 
 * @param {object} page - pdf-lib page object.
 * @param {Array<{x1: number, y1: number, x2: number, y2: number}>} cutLines - Line segments (top-left origin).
 * @param {number} paperHeightPt - Paper height for Y-axis conversion.
 * @param {object} style - Line style (default: CUT_LINE_STYLES.standard).
 */
export function drawCutLines(page, cutLines, paperHeightPt, style = CUT_LINE_STYLES.standard) {
  for (const line of cutLines) {
    // Convert from top-left origin to PDF bottom-left origin
    const y1 = paperHeightPt - line.y1;
    const y2 = paperHeightPt - line.y2;
    
    page.drawLine({
      start: { x: line.x1, y: y1 },
      end: { x: line.x2, y: y2 },
      thickness: style.lineWidth,
      color: style.color,
      opacity: style.opacity,
      dashArray: style.dashArray.length > 0 ? style.dashArray : undefined,
    });
  }
}

/**
 * Draw paper boundary rectangle (optional technical reference).
 * 
 * @param {object} page
 * @param {number} paperWidthPt
 * @param {number} paperHeightPt
 */
export function drawPaperBoundary(page, paperWidthPt, paperHeightPt) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: paperWidthPt,
    height: paperHeightPt,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
    opacity: 0,
  });
}
