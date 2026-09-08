/**
 * Paper Size Presets
 * 
 * All dimensions stored in millimeters, converted to points when needed.
 */

import { toPoints } from './units.js';

/**
 * Paper size definitions (width × height in mm, portrait orientation).
 */
export const PAPER_PRESETS = {
  A5: { name: 'A5', widthMm: 148, heightMm: 210 },
  A4: { name: 'A4', widthMm: 210, heightMm: 297 },
  A3: { name: 'A3', widthMm: 297, heightMm: 420 },
  SRA4: { name: 'SRA4', widthMm: 225, heightMm: 320 },
  SRA3: { name: 'SRA3', widthMm: 315, heightMm: 457 },
};

/**
 * Orientation options.
 */
export const ORIENTATIONS = {
  AUTO: 'auto',
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
};

/**
 * Get paper dimensions in PDF points.
 * @param {string} presetName - Preset key (e.g., 'A3').
 * @param {string} orientation - 'portrait', 'landscape', or 'auto'.
 * @returns {{ widthPt: number, heightPt: number, name: string }} Paper dimensions in points.
 */
export function getPaperDimensions(presetName, orientation = 'portrait') {
  const preset = PAPER_PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown paper preset: ${presetName}`);
  }

  let widthPt = toPoints(preset.widthMm, 'mm');
  let heightPt = toPoints(preset.heightMm, 'mm');

  if (orientation === 'landscape') {
    [widthPt, heightPt] = [heightPt, widthPt];
  }

  return { widthPt, heightPt, name: preset.name };
}

/**
 * Get the list of available paper preset names.
 * @returns {string[]}
 */
export function getPaperPresetNames() {
  return Object.keys(PAPER_PRESETS);
}

/**
 * Get paper display info for a preset.
 * @param {string} presetName 
 * @returns {{ name: string, widthMm: number, heightMm: number }}
 */
export function getPaperInfo(presetName) {
  return PAPER_PRESETS[presetName] || null;
}
