/**
 * Cut-Line Engine
 * 
 * Generates optimized vector cut-line paths from layout positions and trim dimensions.
 * Cut lines are at TRIM size, not artwork/bleed size.
 * 
 * Outputs an array of line segments { x1, y1, x2, y2 } that can be rendered
 * to both canvas (preview) and PDF (output).
 */

/**
 * Generate cut-line segments for all copies in a layout.
 * 
 * Cut lines are drawn at trim boundaries and extend continuously
 * across the entire paper from edge to edge (guillotine cutting grid):
 * - Horizontal cut lines: single continuous lines from x = 0 to x = paperWidth
 * - Vertical cut lines: single continuous lines from y = 0 to y = paperHeight
 * 
 * @param {Array<{x: number, y: number}>} positions - Artwork placement positions (top-left corner).
 * @param {number} artworkWidth - Artwork placement width in points.
 * @param {number} artworkHeight - Artwork placement height in points.
 * @param {number} trimWidth - Trim width in points.
 * @param {number} trimHeight - Trim height in points.
 * @param {number} bleedPt - Bleed per side in points.
 * @param {number} rows - Number of rows.
 * @param {number} columns - Number of columns.
 * @param {number} [paperWidth=0] - Paper width in points.
 * @param {number} [paperHeight=0] - Paper height in points.
 * @returns {Array<{x1: number, y1: number, x2: number, y2: number}>}
 */
export function generateCutLines(
  positions,
  artworkWidth,
  artworkHeight,
  trimWidth,
  trimHeight,
  bleedPt,
  rows,
  columns,
  paperWidth = 0,
  paperHeight = 0,
) {
  if (!positions || positions.length === 0) {
    return [];
  }

  // Calculate the bleed offset from artwork edge to trim edge
  const bleedX = (artworkWidth - trimWidth) / 2;
  const bleedY = (artworkHeight - trimHeight) / 2;

  // Determine effective paper bounds
  let pw = paperWidth;
  let ph = paperHeight;

  if (pw <= 0) {
    pw = Math.max(...positions.map(p => p.x + artworkWidth));
  }
  if (ph <= 0) {
    ph = Math.max(...positions.map(p => p.y + artworkHeight));
  }

  // Collect all horizontal (Y) and vertical (X) cut coordinates
  const rawY = [];
  const rawX = [];

  for (const pos of positions) {
    const topTrimY = pos.y + bleedY;
    const bottomTrimY = pos.y + bleedY + trimHeight;
    const leftTrimX = pos.x + bleedX;
    const rightTrimX = pos.x + bleedX + trimWidth;

    rawY.push(topTrimY);
    rawY.push(bottomTrimY);
    rawX.push(leftTrimX);
    rawX.push(rightTrimX);
  }

  // Deduplicate coordinates within tolerance (0.05 pt)
  const deduplicateCoords = (coords, tolerance = 0.05) => {
    const sorted = [...coords].sort((a, b) => a - b);
    const unique = [];
    for (const c of sorted) {
      if (unique.length === 0 || Math.abs(c - unique[unique.length - 1]) > tolerance) {
        unique.push(c);
      }
    }
    return unique;
  };

  const uniqueY = deduplicateCoords(rawY);
  const uniqueX = deduplicateCoords(rawX);

  const lines = [];

  // Single horizontal lines from left edge (0) to right edge (paperWidth)
  for (const y of uniqueY) {
    lines.push({
      x1: 0,
      y1: y,
      x2: pw,
      y2: y,
    });
  }

  // Single vertical lines from top edge (0) to bottom edge (paperHeight)
  for (const x of uniqueX) {
    lines.push({
      x1: x,
      y1: 0,
      x2: x,
      y2: ph,
    });
  }

  return lines;
}

/**
 * Generate simple (non-optimized) cut lines — one rectangle per copy.
 * Used as a reliable fallback.
 * 
 * @param {Array<{x: number, y: number}>} positions
 * @param {number} artworkWidth
 * @param {number} artworkHeight
 * @param {number} trimWidth
 * @param {number} trimHeight
 * @returns {Array<{x1: number, y1: number, x2: number, y2: number}>}
 */
export function generateSimpleCutLines(positions, artworkWidth, artworkHeight, trimWidth, trimHeight) {
  const lines = [];
  const bleedX = (artworkWidth - trimWidth) / 2;
  const bleedY = (artworkHeight - trimHeight) / 2;

  for (const pos of positions) {
    const x = pos.x + bleedX;
    const y = pos.y + bleedY;

    // Top
    lines.push({ x1: x, y1: y, x2: x + trimWidth, y2: y });
    // Bottom
    lines.push({ x1: x, y1: y + trimHeight, x2: x + trimWidth, y2: y + trimHeight });
    // Left
    lines.push({ x1: x, y1: y, x2: x, y2: y + trimHeight });
    // Right
    lines.push({ x1: x + trimWidth, y1: y, x2: x + trimWidth, y2: y + trimHeight });
  }

  return lines;
}
