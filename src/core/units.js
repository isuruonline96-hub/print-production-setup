/**
 * Unit Conversion Engine
 * 
 * Internal representation: PDF Points (1 pt = 1/72 inch = 0.3528 mm)
 * All values stored internally in points, converted to display units on the fly.
 */

// Conversion factors: how many points in one unit
const POINTS_PER = {
  pt: 1,
  in: 72,
  mm: 72 / 25.4,       // 2.834645669...
  cm: 72 / 2.54,       // 28.34645669...
};

// Display names for UI
export const UNIT_LABELS = {
  mm: 'Millimeters (mm)',
  cm: 'Centimeters (cm)',
  in: 'Inches (in)',
  pt: 'Points (pt)',
};

// Short labels
export const UNIT_SHORT = {
  mm: 'mm',
  cm: 'cm',
  in: 'in',
  pt: 'pt',
};

/**
 * Available unit identifiers.
 */
export const UNITS = ['mm', 'cm', 'in', 'pt'];

/**
 * Default unit.
 */
export const DEFAULT_UNIT = 'mm';

/**
 * Convert a value from a given unit to PDF points.
 * @param {number} value - The value to convert.
 * @param {string} fromUnit - Source unit ('mm', 'cm', 'in', 'pt').
 * @returns {number} Value in PDF points.
 */
export function toPoints(value, fromUnit) {
  const factor = POINTS_PER[fromUnit];
  if (factor === undefined) {
    throw new Error(`Unknown unit: ${fromUnit}`);
  }
  return value * factor;
}

/**
 * Convert a value from PDF points to a given unit.
 * @param {number} points - The value in PDF points.
 * @param {string} toUnit - Target unit ('mm', 'cm', 'in', 'pt').
 * @returns {number} Value in the target unit.
 */
export function fromPoints(points, toUnit) {
  const factor = POINTS_PER[toUnit];
  if (factor === undefined) {
    throw new Error(`Unknown unit: ${toUnit}`);
  }
  return points / factor;
}

/**
 * Convert a value from one unit to another.
 * @param {number} value - The value to convert.
 * @param {string} fromUnit - Source unit.
 * @param {string} toUnit - Target unit.
 * @returns {number} Converted value.
 */
export function convert(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  const points = toPoints(value, fromUnit);
  return fromPoints(points, toUnit);
}

/**
 * Format a value for display with appropriate decimal places.
 * @param {number} value - The value to format.
 * @param {string} unit - The unit for context.
 * @returns {string} Formatted string.
 */
export function formatValue(value, unit) {
  switch (unit) {
    case 'mm':
      return value.toFixed(2);
    case 'cm':
      return value.toFixed(3);
    case 'in':
      return value.toFixed(4);
    case 'pt':
      return value.toFixed(2);
    default:
      return value.toFixed(2);
  }
}

/**
 * Format a dimension pair for display.
 * @param {number} widthPt - Width in points.
 * @param {number} heightPt - Height in points.
 * @param {string} unit - Display unit.
 * @returns {string} Formatted string like "210.00 × 297.00 mm"
 */
export function formatDimensions(widthPt, heightPt, unit) {
  const w = fromPoints(widthPt, unit);
  const h = fromPoints(heightPt, unit);
  return `${formatValue(w, unit)} × ${formatValue(h, unit)} ${UNIT_SHORT[unit]}`;
}
