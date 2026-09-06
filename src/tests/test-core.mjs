/**
 * Core Logic Test — Business Card Test Case
 * 
 * Verifies the layout engine, cut-line engine, and unit conversions
 * using the business card test from the requirements.
 * 
 * Run with: node --experimental-vm-modules src/tests/test-core.mjs
 * (or via Vite: import and run in browser console)
 */

import { toPoints, fromPoints, convert, formatDimensions } from '../core/units.js';
import { PAPER_PRESETS, getPaperDimensions } from '../core/paper-sizes.js';
import { calculateTrimFromArtwork, validateTrim, validateBleed } from '../core/bleed-trim.js';
import { calculateLayout } from '../core/layout-engine.js';
import { generateCutLines } from '../core/cut-line-engine.js';
import { transformBackPositions, DUPLEX_MODES } from '../core/duplex-engine.js';
import { validateOrderNumber, validateDimensionMatch, validateArtworkFits } from '../core/validation.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

function assertApprox(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${message} (expected ~${expected}, got ${actual})`);
}

// ============================================================
console.log('\n=== UNIT CONVERSION TESTS ===');

// 1 inch = 72 points
assertApprox(toPoints(1, 'in'), 72, 0.001, '1 inch = 72 points');

// 1 inch = 25.4 mm
assertApprox(convert(1, 'in', 'mm'), 25.4, 0.001, '1 inch = 25.4 mm');

// 25.4 mm = 1 inch
assertApprox(convert(25.4, 'mm', 'in'), 1, 0.001, '25.4 mm = 1 inch');

// Round-trip: mm -> pt -> mm
const mmVal = 100;
const ptVal = toPoints(mmVal, 'mm');
assertApprox(fromPoints(ptVal, 'mm'), mmVal, 0.001, 'Round-trip mm->pt->mm');

// 1 cm = 10 mm
assertApprox(convert(1, 'cm', 'mm'), 10, 0.001, '1 cm = 10 mm');

// ============================================================
console.log('\n=== BLEED/TRIM TESTS ===');

// Business card: 3.75 x 2.25 in, 3mm bleed
const artW = toPoints(3.75, 'in');
const artH = toPoints(2.25, 'in');
const bleed = toPoints(3, 'mm');

const { trimWidthPt, trimHeightPt } = calculateTrimFromArtwork(artW, artH, bleed);

// Expected trim: ~3.514 x 2.014 in (subtract 2*3mm from each)
const expectedTrimW = artW - 2 * bleed;
const expectedTrimH = artH - 2 * bleed;
assertApprox(trimWidthPt, expectedTrimW, 0.01, 'Trim width calculated correctly');
assertApprox(trimHeightPt, expectedTrimH, 0.01, 'Trim height calculated correctly');

// Trim should be positive
const trimVal = validateTrim(artW, artH, trimWidthPt, trimHeightPt);
assert(trimVal.valid, 'Trim validation passes for valid trim');

// Trim > artwork should fail
const badTrim = validateTrim(artW, artH, artW + 10, artH);
assert(!badTrim.valid, 'Trim validation fails when trim > artwork');

// Bleed validation
assert(validateBleed(bleed).valid, 'Valid bleed passes');
assert(!validateBleed(-1).valid, 'Negative bleed fails');

// ============================================================
console.log('\n=== PAPER TESTS ===');

assert(PAPER_PRESETS.A3.widthMm === 297, 'A3 width = 297mm');
assert(PAPER_PRESETS.A3.heightMm === 420, 'A3 height = 420mm');
assert(PAPER_PRESETS.A4.widthMm === 210, 'A4 width = 210mm');

const a3 = getPaperDimensions('A3', 'portrait');
assertApprox(a3.widthPt, toPoints(297, 'mm'), 0.01, 'A3 width in points');
assertApprox(a3.heightPt, toPoints(420, 'mm'), 0.01, 'A3 height in points');

// ============================================================
console.log('\n=== LAYOUT ENGINE TESTS ===');

const margin = toPoints(5, 'mm');
const gap = 0;

const layout = calculateLayout({
  artworkWidthPt: artW,
  artworkHeightPt: artH,
  paperWidthPt: toPoints(297, 'mm'),
  paperHeightPt: toPoints(420, 'mm'),
  marginPt: margin,
  gapPt: gap,
});

assert(layout !== null, 'Layout calculated successfully');
assert(layout.copies > 0, `Copies: ${layout.copies}`);
assert(layout.rows > 0, `Rows: ${layout.rows}`);
assert(layout.columns > 0, `Columns: ${layout.columns}`);
assert(layout.copies === layout.rows * layout.columns, 'Copies = rows × columns');
assert(layout.positions.length === layout.copies, 'Positions count matches copies');
assert(layout.paperUsage > 0, `Paper usage: ${layout.paperUsage.toFixed(1)}%`);

console.log(`  Layout: ${layout.columns}×${layout.rows} = ${layout.copies} copies`);
console.log(`  Paper orientation: ${layout.paperOrientation}`);
console.log(`  Artwork rotated: ${layout.artworkRotated}`);

// Verify positions are within printable area
for (const pos of layout.positions) {
  const withinX = pos.x >= margin - 0.01 && (pos.x + layout.artworkPlacementWidth) <= (layout.paperWidthPt - margin + 0.01);
  const withinY = pos.y >= margin - 0.01 && (pos.y + layout.artworkPlacementHeight) <= (layout.paperHeightPt - margin + 0.01);
  assert(withinX && withinY, `Position (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) within printable area`);
}

// ============================================================
console.log('\n=== CUT LINE TESTS ===');

const cutLines = generateCutLines(
  layout.positions,
  layout.artworkPlacementWidth,
  layout.artworkPlacementHeight,
  layout.artworkRotated ? trimHeightPt : trimWidthPt,
  layout.artworkRotated ? trimWidthPt : trimHeightPt,
  bleed,
  layout.rows,
  layout.columns,
  layout.paperWidthPt,
  layout.paperHeightPt,
);

assert(cutLines.length > 0, `Cut lines generated: ${cutLines.length} lines`);

// All cut lines should span paper edges
let horizontalLines = 0;
let verticalLines = 0;

for (const line of cutLines) {
  assert(
    typeof line.x1 === 'number' && typeof line.y1 === 'number' &&
    typeof line.x2 === 'number' && typeof line.y2 === 'number',
    'Cut line has valid coordinates'
  );

  const isHorizontal = Math.abs(line.y1 - line.y2) < 0.001;
  const isVertical = Math.abs(line.x1 - line.x2) < 0.001;

  assert(isHorizontal || isVertical, 'Cut line is straight horizontal or vertical');

  if (isHorizontal) {
    horizontalLines++;
    assert(line.x1 === 0, 'Horizontal cut line starts at left paper edge (x=0)');
    assert(Math.abs(line.x2 - layout.paperWidthPt) < 0.01, 'Horizontal cut line ends at right paper edge (x=paperWidth)');
  }

  if (isVertical) {
    verticalLines++;
    assert(line.y1 === 0, 'Vertical cut line starts at top paper edge (y=0)');
    assert(Math.abs(line.y2 - layout.paperHeightPt) < 0.01, 'Vertical cut line ends at bottom paper edge (y=paperHeight)');
  }
}

assert(horizontalLines > 0, `Has horizontal cut lines (${horizontalLines})`);
assert(verticalLines > 0, `Has vertical cut lines (${verticalLines})`);

// ============================================================
console.log('\n=== DUPLEX TESTS ===');

const backPositions = transformBackPositions(
  layout.positions,
  layout.artworkPlacementWidth,
  layout.artworkPlacementHeight,
  layout.paperWidthPt,
  layout.paperHeightPt,
  DUPLEX_MODES.LONG_EDGE,
);

assert(backPositions.length === layout.positions.length, 'Back positions count matches front');

// Back positions should be different from front (unless perfectly centered)
let anyDifferent = false;
for (let i = 0; i < layout.positions.length; i++) {
  if (Math.abs(backPositions[i].x - layout.positions[i].x) > 0.01 ||
      Math.abs(backPositions[i].y - layout.positions[i].y) > 0.01) {
    anyDifferent = true;
    break;
  }
}
// It's expected that most duplex transforms produce different positions
console.log(`  Back positions differ from front: ${anyDifferent}`);

// ============================================================
console.log('\n=== VALIDATION TESTS ===');

// Order number
assert(validateOrderNumber('BC-2026-00125').valid, 'Valid order number');
assert(validateOrderNumber('TEST_001').valid, 'Order with underscore');
assert(!validateOrderNumber('').valid, 'Empty order number rejected');
assert(!validateOrderNumber('test<>file').valid, 'Invalid chars rejected');

// Dimension match
const match = validateDimensionMatch(artW, artH, artW, artH);
assert(match.match, 'Same dimensions match');

const noMatch = validateDimensionMatch(artW, artH, artW + 10, artH);
assert(!noMatch.match, 'Different dimensions do not match');

// Artwork fits
const fits = validateArtworkFits(artW, artH, toPoints(297, 'mm'), toPoints(420, 'mm'), margin);
assert(fits.valid, 'Business card fits on A3');

const noFit = validateArtworkFits(toPoints(300, 'mm'), toPoints(430, 'mm'), toPoints(297, 'mm'), toPoints(420, 'mm'), margin);
assert(!noFit.valid, 'Oversized artwork rejected');

// ============================================================
console.log('\n=== RESULTS ===');
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(failed === 0 ? '\n  🎉 ALL TESTS PASSED!' : '\n  ⚠️ SOME TESTS FAILED!');
