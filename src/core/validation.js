/**
 * Input Validation Module
 * 
 * Validates all user inputs and job configuration.
 */

/**
 * Validate order number.
 * Rules:
 * - Cannot be empty
 * - Only letters, numbers, hyphens, underscores
 * - No characters invalid in filenames
 * 
 * @param {string} orderNumber
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateOrderNumber(orderNumber) {
  if (!orderNumber || orderNumber.trim().length === 0) {
    return { valid: false, error: 'Order number cannot be empty.' };
  }

  const trimmed = orderNumber.trim();
  const validPattern = /^[A-Za-z0-9\-_]+$/;

  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Order number can only contain letters, numbers, hyphens (-) and underscores (_).',
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate that front and back artwork dimensions match.
 * 
 * @param {number} frontWidthPt
 * @param {number} frontHeightPt
 * @param {number} backWidthPt
 * @param {number} backHeightPt
 * @param {number} tolerancePt - Tolerance in points (default ~0.5pt ≈ 0.18mm)
 * @returns {{ match: boolean, warning: string|null }}
 */
export function validateDimensionMatch(frontWidthPt, frontHeightPt, backWidthPt, backHeightPt, tolerancePt = 0.5) {
  const widthDiff = Math.abs(frontWidthPt - backWidthPt);
  const heightDiff = Math.abs(frontHeightPt - backHeightPt);

  if (widthDiff > tolerancePt || heightDiff > tolerancePt) {
    return {
      match: false,
      warning: 'Front and Back artwork dimensions are different.',
    };
  }

  return { match: true, warning: null };
}

/**
 * Validate that artwork fits on the paper.
 * 
 * @param {number} artworkWidthPt
 * @param {number} artworkHeightPt
 * @param {number} paperWidthPt
 * @param {number} paperHeightPt
 * @param {number} marginPt
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateArtworkFits(artworkWidthPt, artworkHeightPt, paperWidthPt, paperHeightPt, marginPt) {
  const availW = paperWidthPt - (2 * marginPt);
  const availH = paperHeightPt - (2 * marginPt);

  // Check both orientations
  const fitsNormal = artworkWidthPt <= availW + 0.01 && artworkHeightPt <= availH + 0.01;
  const fitsRotated = artworkHeightPt <= availW + 0.01 && artworkWidthPt <= availH + 0.01;

  if (!fitsNormal && !fitsRotated) {
    return {
      valid: false,
      error: 'Artwork is too large to fit on the selected paper with the current settings.',
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate a numeric input value.
 * 
 * @param {number} value
 * @param {string} fieldName
 * @param {{ min?: number, max?: number }} options
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateNumeric(value, fieldName, options = {}) {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${fieldName} must be a valid number.` };
  }
  if (options.min !== undefined && value < options.min) {
    return { valid: false, error: `${fieldName} cannot be less than ${options.min}.` };
  }
  if (options.max !== undefined && value > options.max) {
    return { valid: false, error: `${fieldName} cannot be greater than ${options.max}.` };
  }
  return { valid: true, error: null };
}

/**
 * Validate an uploaded file.
 * 
 * @param {File} file
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const allowedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];

  const ext = file.name.split('.').pop().toLowerCase();
  const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];

  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format: .${ext}. Supported formats: PDF, PNG, JPG.`,
    };
  }

  return { valid: true, error: null };
}
