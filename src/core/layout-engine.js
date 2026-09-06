/**
 * Layout / Imposition Engine
 * 
 * Calculates the maximum number of copies that fit on a paper sheet,
 * their positions, orientation, and usage statistics.
 * 
 * Uses FULL ARTWORK (with bleed) for placement calculations.
 * Uses TRIM SIZE for cut lines.
 */

/**
 * Calculate layout for a given artwork and paper configuration.
 * 
 * @param {object} params
 * @param {number} params.artworkWidthPt - Artwork width in points (includes bleed).
 * @param {number} params.artworkHeightPt - Artwork height in points (includes bleed).
 * @param {number} params.paperWidthPt - Paper width in points.
 * @param {number} params.paperHeightPt - Paper height in points.
 * @param {number} params.marginPt - Non-printable margin in points.
 * @param {number} params.gapPt - Gap between copies in points.
 * @returns {object|null} Layout result or null if nothing fits.
 */
export function calculateLayout({
  artworkWidthPt,
  artworkHeightPt,
  paperWidthPt,
  paperHeightPt,
  marginPt,
  gapPt,
}) {
  // Try all 4 combinations: paper portrait/landscape × artwork normal/rotated
  const combinations = [];

  // Paper orientations to try
  const paperOrientations = [
    { pw: paperWidthPt, ph: paperHeightPt, paperOrientation: 'portrait' },
    { pw: paperHeightPt, ph: paperWidthPt, paperOrientation: 'landscape' },
  ];

  // Artwork orientations to try
  const artworkOrientations = [
    { aw: artworkWidthPt, ah: artworkHeightPt, artworkRotated: false },
    { aw: artworkHeightPt, ah: artworkWidthPt, artworkRotated: true },
  ];

  for (const po of paperOrientations) {
    for (const ao of artworkOrientations) {
      const result = calculateGridLayout(po.pw, po.ph, ao.aw, ao.ah, marginPt, gapPt);
      if (result) {
        combinations.push({
          ...result,
          paperWidthPt: po.pw,
          paperHeightPt: po.ph,
          paperOrientation: po.paperOrientation,
          artworkRotated: ao.artworkRotated,
          artworkPlacementWidth: ao.aw,
          artworkPlacementHeight: ao.ah,
        });
      }
    }
  }

  if (combinations.length === 0) return null;

  // Select the combination with the most copies
  combinations.sort((a, b) => {
    if (b.copies !== a.copies) return b.copies - a.copies;
    // Tie-breaker: prefer non-rotated artwork
    return (a.artworkRotated ? 1 : 0) - (b.artworkRotated ? 1 : 0);
  });

  return combinations[0];
}

/**
 * Calculate layout for a specific paper/artwork orientation.
 * 
 * @param {number} paperW - Paper width in points.
 * @param {number} paperH - Paper height in points.
 * @param {number} artW - Artwork width in points.
 * @param {number} artH - Artwork height in points.
 * @param {number} margin - Margin in points.
 * @param {number} gap - Gap between copies in points.
 * @returns {object|null}
 */
function calculateGridLayout(paperW, paperH, artW, artH, margin, gap) {
  const availW = paperW - (2 * margin);
  const availH = paperH - (2 * margin);

  if (availW < artW - 0.01 || availH < artH - 0.01) {
    return null;
  }

  // columns = floor((availW + gap) / (artW + gap))
  const columns = Math.floor((availW + gap) / (artW + gap));
  const rows = Math.floor((availH + gap) / (artH + gap));

  if (columns <= 0 || rows <= 0) return null;

  const copies = columns * rows;

  // Calculate actual used area
  const usedWidth = columns * artW + (columns - 1) * gap;
  const usedHeight = rows * artH + (rows - 1) * gap;

  // Center the grid on the printable area
  const startX = margin + (availW - usedWidth) / 2;
  const startY = margin + (availH - usedHeight) / 2;

  // Generate positions (top-left corner of each copy)
  // PDF coordinate system: origin at bottom-left, Y goes up
  // We'll use a top-left origin internally and convert during PDF generation
  const positions = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = startX + col * (artW + gap);
      const y = startY + row * (artH + gap);
      positions.push({ x, y, row, col });
    }
  }

  // Paper usage percentage
  const totalArtworkArea = copies * artW * artH;
  const paperArea = paperW * paperH;
  const paperUsage = (totalArtworkArea / paperArea) * 100;
  const wasteArea = paperArea - totalArtworkArea;

  return {
    rows,
    columns,
    copies,
    positions,
    startX,
    startY,
    usedWidth,
    usedHeight,
    paperUsage,
    wasteArea,
  };
}

/**
 * Calculate layout with a specific paper orientation (no auto).
 * 
 * @param {object} params
 * @param {number} params.artworkWidthPt
 * @param {number} params.artworkHeightPt
 * @param {number} params.paperWidthPt
 * @param {number} params.paperHeightPt
 * @param {number} params.marginPt
 * @param {number} params.gapPt
 * @param {string} params.paperOrientation - 'portrait' or 'landscape'
 * @returns {object|null}
 */
export function calculateLayoutWithOrientation({
  artworkWidthPt,
  artworkHeightPt,
  paperWidthPt,
  paperHeightPt,
  marginPt,
  gapPt,
  paperOrientation,
}) {
  let pw = paperWidthPt;
  let ph = paperHeightPt;

  if (paperOrientation === 'landscape') {
    // Ensure width > height for landscape
    if (pw < ph) [pw, ph] = [ph, pw];
  } else if (paperOrientation === 'portrait') {
    // Ensure height > width for portrait
    if (ph < pw) [pw, ph] = [ph, pw];
  }

  // Try both artwork orientations
  const normal = calculateGridLayout(pw, ph, artworkWidthPt, artworkHeightPt, marginPt, gapPt);
  const rotated = calculateGridLayout(pw, ph, artworkHeightPt, artworkWidthPt, marginPt, gapPt);

  const results = [];
  if (normal) {
    results.push({
      ...normal,
      paperWidthPt: pw,
      paperHeightPt: ph,
      paperOrientation,
      artworkRotated: false,
      artworkPlacementWidth: artworkWidthPt,
      artworkPlacementHeight: artworkHeightPt,
    });
  }
  if (rotated) {
    results.push({
      ...rotated,
      paperWidthPt: pw,
      paperHeightPt: ph,
      paperOrientation,
      artworkRotated: true,
      artworkPlacementWidth: artworkHeightPt,
      artworkPlacementHeight: artworkWidthPt,
    });
  }

  if (results.length === 0) return null;

  results.sort((a, b) => {
    if (b.copies !== a.copies) return b.copies - a.copies;
    return (a.artworkRotated ? 1 : 0) - (b.artworkRotated ? 1 : 0);
  });

  return results[0];
}
