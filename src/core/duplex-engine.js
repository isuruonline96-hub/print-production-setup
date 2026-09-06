/**
 * Duplex Engine
 * 
 * Transforms Back artwork positions for proper duplex (double-sided) alignment.
 * The Front positions are used as the source; Back positions are derived from them.
 * 
 * Two modes:
 * - Flip on Long Edge: The sheet flips along the longer dimension.
 * - Flip on Short Edge: The sheet flips along the shorter dimension.
 */

/**
 * Duplex mode constants.
 */
export const DUPLEX_MODES = {
  LONG_EDGE: 'long-edge',
  SHORT_EDGE: 'short-edge',
};

/**
 * Transform front positions to back positions for duplex printing.
 * 
 * When a sheet is flipped for back-side printing, the coordinate system
 * mirrors along the flip axis.
 * 
 * @param {Array<{x: number, y: number, row: number, col: number}>} frontPositions
 * @param {number} artworkWidth - Artwork placement width in points.
 * @param {number} artworkHeight - Artwork placement height in points.
 * @param {number} paperWidthPt - Paper width in points.
 * @param {number} paperHeightPt - Paper height in points.
 * @param {string} duplexMode - 'long-edge' or 'short-edge'.
 * @returns {Array<{x: number, y: number, row: number, col: number}>}
 */
export function transformBackPositions(
  frontPositions,
  artworkWidth,
  artworkHeight,
  paperWidthPt,
  paperHeightPt,
  duplexMode,
) {
  return frontPositions.map((pos) => {
    let backX, backY;

    if (duplexMode === DUPLEX_MODES.LONG_EDGE) {
      // Flip on long edge: mirror along the horizontal center
      // The long edge is the larger dimension
      if (paperWidthPt >= paperHeightPt) {
        // Landscape: long edge is horizontal (width), flip vertically
        backX = pos.x;
        backY = paperHeightPt - pos.y - artworkHeight;
      } else {
        // Portrait: long edge is vertical (height), flip horizontally
        backX = paperWidthPt - pos.x - artworkWidth;
        backY = pos.y;
      }
    } else {
      // Flip on short edge: mirror along the vertical center
      if (paperWidthPt >= paperHeightPt) {
        // Landscape: short edge is vertical (height), flip horizontally
        backX = paperWidthPt - pos.x - artworkWidth;
        backY = pos.y;
      } else {
        // Portrait: short edge is horizontal (width), flip vertically
        backX = pos.x;
        backY = paperHeightPt - pos.y - artworkHeight;
      }
    }

    return {
      x: backX,
      y: backY,
      row: pos.row,
      col: pos.col,
    };
  });
}

/**
 * Get default duplex mode based on paper orientation.
 * 
 * @param {number} paperWidthPt
 * @param {number} paperHeightPt
 * @returns {string}
 */
export function getDefaultDuplexMode(paperWidthPt, paperHeightPt) {
  // Long edge flip is most common for standard duplex printing
  return DUPLEX_MODES.LONG_EDGE;
}
