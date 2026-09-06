/**
 * Central Job Model — Single Source of Truth
 * 
 * All layout calculations, preview rendering, and PDF generation
 * consume this same data structure.
 */

import { toPoints, fromPoints } from './units.js';
import { calculateTrimFromArtwork } from './bleed-trim.js';
import { calculateLayout, calculateLayoutWithOrientation } from './layout-engine.js';
import { generateCutLines } from './cut-line-engine.js';
import { transformBackPositions, getDefaultDuplexMode, DUPLEX_MODES } from './duplex-engine.js';
import { ORIENTATIONS } from './paper-sizes.js';

/**
 * Create a new empty job.
 * @returns {object} Job model.
 */
export function createJob() {
  return {
    // User inputs
    orderNumber: '',
    
    // Front/Back file data
    frontFile: null,       // { name, type, data: Uint8Array, originalFile: File }
    backFile: null,
    
    // Detected artwork dimensions (in points)
    artworkWidthPt: 0,
    artworkHeightPt: 0,
    
    // Back artwork dimensions (may differ)
    backArtworkWidthPt: 0,
    backArtworkHeightPt: 0,
    
    // File info
    frontFileInfo: null,   // { filename, width, height, unit, pageCount, resolution, orientation }
    backFileInfo: null,
    
    // Configuration
    displayUnit: 'mm',
    bleedPt: toPoints(3, 'mm'),  // Default 3mm
    
    // Trim mode: 'auto' or 'manual'
    trimMode: 'auto',
    trimWidthPt: 0,
    trimHeightPt: 0,
    
    // Paper
    paperPreset: 'A3',
    paperWidthPt: 0,
    paperHeightPt: 0,
    paperOrientation: ORIENTATIONS.AUTO,
    
    // Layout settings
    marginPt: toPoints(5, 'mm'),  // Default 5mm
    gapPt: 0,                     // Default 0mm
    
    // Duplex
    duplexMode: DUPLEX_MODES.LONG_EDGE,
    
    // Calculated layout result
    layout: null,
    
    // Cut lines
    cutLines: null,
    
    // Back positions (after duplex transformation)
    backPositions: null,
    backCutLines: null,
    
    // Status
    dimensionMismatch: false,
    dimensionMismatchWarning: null,
    
    // Artwork scale (always 100%)
    artworkScale: 100,
  };
}

/**
 * Calculate the full layout for a job.
 * Updates the job in place with layout results.
 * 
 * @param {object} job - The job model.
 * @returns {object} Updated job model.
 */
export function calculateJobLayout(job) {
  // Calculate trim size
  if (job.trimMode === 'auto') {
    const { trimWidthPt, trimHeightPt } = calculateTrimFromArtwork(
      job.artworkWidthPt, job.artworkHeightPt, job.bleedPt
    );
    job.trimWidthPt = trimWidthPt;
    job.trimHeightPt = trimHeightPt;
  }

  // Calculate layout based on orientation mode
  let layout;
  if (job.paperOrientation === ORIENTATIONS.AUTO) {
    layout = calculateLayout({
      artworkWidthPt: job.artworkWidthPt,
      artworkHeightPt: job.artworkHeightPt,
      paperWidthPt: job.paperWidthPt,
      paperHeightPt: job.paperHeightPt,
      marginPt: job.marginPt,
      gapPt: job.gapPt,
    });
  } else {
    layout = calculateLayoutWithOrientation({
      artworkWidthPt: job.artworkWidthPt,
      artworkHeightPt: job.artworkHeightPt,
      paperWidthPt: job.paperWidthPt,
      paperHeightPt: job.paperHeightPt,
      marginPt: job.marginPt,
      gapPt: job.gapPt,
      paperOrientation: job.paperOrientation,
    });
  }

  if (!layout) {
    job.layout = null;
    job.cutLines = null;
    job.backPositions = null;
    job.backCutLines = null;
    return job;
  }

  // Update paper dimensions from layout (may have been swapped for orientation)
  job.layout = layout;
  job.paperWidthPt = layout.paperWidthPt;
  job.paperHeightPt = layout.paperHeightPt;

  // Generate front cut lines
  job.cutLines = generateCutLines(
    layout.positions,
    layout.artworkPlacementWidth,
    layout.artworkPlacementHeight,
    job.artworkRotated ? job.trimHeightPt : job.trimWidthPt,
    job.artworkRotated ? job.trimWidthPt : job.trimHeightPt,
    job.bleedPt,
    layout.rows,
    layout.columns,
    layout.paperWidthPt,
    layout.paperHeightPt,
  );

  // Calculate back positions using duplex engine
  job.backPositions = transformBackPositions(
    layout.positions,
    layout.artworkPlacementWidth,
    layout.artworkPlacementHeight,
    layout.paperWidthPt,
    layout.paperHeightPt,
    job.duplexMode,
  );

  // Generate back cut lines
  job.backCutLines = generateCutLines(
    job.backPositions,
    layout.artworkPlacementWidth,
    layout.artworkPlacementHeight,
    job.artworkRotated ? job.trimHeightPt : job.trimWidthPt,
    job.artworkRotated ? job.trimWidthPt : job.trimHeightPt,
    job.bleedPt,
    layout.rows,
    layout.columns,
    layout.paperWidthPt,
    layout.paperHeightPt,
  );

  // Store rotated flag
  job.artworkRotated = layout.artworkRotated;

  return job;
}

/**
 * Get a snapshot of the job for display purposes.
 * @param {object} job
 * @param {string} unit - Display unit.
 * @returns {object} Display-friendly summary.
 */
export function getJobSummary(job, unit) {
  if (!job.layout) return null;

  return {
    orderNumber: job.orderNumber,
    artworkWidth: fromPoints(job.artworkWidthPt, unit),
    artworkHeight: fromPoints(job.artworkHeightPt, unit),
    trimWidth: fromPoints(job.trimWidthPt, unit),
    trimHeight: fromPoints(job.trimHeightPt, unit),
    bleed: fromPoints(job.bleedPt, unit),
    paperWidth: fromPoints(job.paperWidthPt, unit),
    paperHeight: fromPoints(job.paperHeightPt, unit),
    margin: fromPoints(job.marginPt, unit),
    gap: fromPoints(job.gapPt, unit),
    rows: job.layout.rows,
    columns: job.layout.columns,
    copies: job.layout.copies,
    paperUsage: job.layout.paperUsage,
    wasteArea: fromPoints(job.layout.wasteArea, unit),
    orientation: job.layout.paperOrientation,
    artworkRotated: job.layout.artworkRotated,
    artworkScale: job.artworkScale,
    duplexMode: job.duplexMode,
    unit,
  };
}
