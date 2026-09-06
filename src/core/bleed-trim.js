/**
 * Bleed and Trim Calculator
 * 
 * Calculates trim dimensions from artwork dimensions and bleed,
 * and validates trim/bleed relationships.
 */

import { toPoints, fromPoints } from './units.js';

/**
 * Default bleed in mm.
 */
export const DEFAULT_BLEED_MM = 3;

/**
 * Calculate trim size from artwork dimensions and bleed.
 * 
 * Trim Width  = Artwork Width  - (2 × Bleed)
 * Trim Height = Artwork Height - (2 × Bleed)
 * 
 * @param {number} artworkWidthPt - Artwork width in points.
 * @param {number} artworkHeightPt - Artwork height in points.
 * @param {number} bleedPt - Bleed amount per side in points.
 * @returns {{ trimWidthPt: number, trimHeightPt: number }}
 */
export function calculateTrimFromArtwork(artworkWidthPt, artworkHeightPt, bleedPt) {
  const trimWidthPt = artworkWidthPt - (2 * bleedPt);
  const trimHeightPt = artworkHeightPt - (2 * bleedPt);
  return { trimWidthPt, trimHeightPt };
}

/**
 * Validate that trim dimensions are valid relative to artwork.
 * 
 * @param {number} artworkWidthPt - Artwork width in points.
 * @param {number} artworkHeightPt - Artwork height in points.
 * @param {number} trimWidthPt - Trim width in points.
 * @param {number} trimHeightPt - Trim height in points.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTrim(artworkWidthPt, artworkHeightPt, trimWidthPt, trimHeightPt) {
  const errors = [];

  if (trimWidthPt <= 0) {
    errors.push('Trim width must be greater than zero.');
  }
  if (trimHeightPt <= 0) {
    errors.push('Trim height must be greater than zero.');
  }
  if (trimWidthPt > artworkWidthPt + 0.01) {
    errors.push('Trim width cannot be larger than the artwork width.');
  }
  if (trimHeightPt > artworkHeightPt + 0.01) {
    errors.push('Trim height cannot be larger than the artwork height.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate that bleed is a non-negative value.
 * 
 * @param {number} bleedPt - Bleed in points.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBleed(bleedPt) {
  const errors = [];
  if (bleedPt < 0) {
    errors.push('Bleed value cannot be negative.');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Calculate the bleed amount per side from artwork and trim.
 * 
 * @param {number} artworkWidthPt - Artwork width in points.
 * @param {number} trimWidthPt - Trim width in points.
 * @returns {number} Horizontal bleed per side in points.
 */
export function calculateBleedFromDimensions(artworkWidthPt, trimWidthPt) {
  return (artworkWidthPt - trimWidthPt) / 2;
}
