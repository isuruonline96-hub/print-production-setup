/**
 * Master PDF Generator
 * 
 * Creates all 4 PDF files from the Job model:
 * 1. {ORDER}-front.pdf     — Cut lines (behind) + Front artwork (on top)
 * 2. {ORDER}-back.pdf      — Cut lines (behind) + Back artwork (on top)
 * 3. {ORDER}-front-cut.pdf — Front cut lines ONLY (no artwork)
 * 4. {ORDER}-back-cut.pdf  — Back cut lines ONLY (no artwork)
 *
 * Layer order for print PDFs: cut lines are drawn FIRST so artwork covers them.
 * The cut file PDFs contain cut lines only and are sent separately to the cutter.
 */

import { PDFDocument } from 'pdf-lib';
import { embedArtwork } from './artwork-embedder.js';
import { drawCutLines } from './cut-line-renderer.js';
import { drawLabel } from './label-renderer.js';

/**
 * Generate all 4 PDFs for a job.
 * 
 * @param {object} job - The complete job model.
 * @returns {Promise<object>} Object with front, back, frontCut, backCut as Uint8Arrays.
 */
export async function generateAllPDFs(job) {
  const [front, back, frontCut, backCut] = await Promise.all([
    generateFrontPDF(job),
    generateBackPDF(job),
    generateFrontCutPDF(job),
    generateBackCutPDF(job),
  ]);

  return {
    front: { data: front, filename: `${job.orderNumber}-front.pdf` },
    back: { data: back, filename: `${job.orderNumber}-back.pdf` },
    frontCut: { data: frontCut, filename: `${job.orderNumber}-front-cut.pdf` },
    backCut: { data: backCut, filename: `${job.orderNumber}-back-cut.pdf` },
  };
}

/**
 * Generate Front PDF — cut lines BEHIND artwork (artwork is optional).
 * If no front artwork is uploaded the page contains cut lines only.
 */
export async function generateFrontPDF(job) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([job.paperWidthPt, job.paperHeightPt]);

  // Draw cut lines FIRST so they appear behind the artwork
  drawCutLines(page, job.cutLines, job.paperHeightPt);

  // Embed front artwork on top (only if a file was uploaded)
  if (job.frontFile) {
    await embedArtwork(
      doc, page, job.frontFile,
      job.layout.positions,
      job.layout.artworkPlacementWidth,
      job.layout.artworkPlacementHeight,
      job.paperHeightPt,
      job.artworkRotated,
    );
  }

  // Draw label (always on top)
  await drawLabel(doc, page, job.orderNumber, 'FRONT', job.paperHeightPt, job.marginPt);

  return await doc.save();
}

/**
 * Generate Back PDF — cut lines BEHIND artwork (artwork is optional).
 * If no back artwork is uploaded the page contains cut lines only.
 */
export async function generateBackPDF(job) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([job.paperWidthPt, job.paperHeightPt]);

  // Draw back cut lines FIRST so they appear behind the artwork
  drawCutLines(page, job.backCutLines, job.paperHeightPt);

  // Embed back artwork on top (only if a file was uploaded)
  if (job.backFile) {
    await embedArtwork(
      doc, page, job.backFile,
      job.backPositions,
      job.layout.artworkPlacementWidth,
      job.layout.artworkPlacementHeight,
      job.paperHeightPt,
      job.artworkRotated,
    );
  }

  // Draw label (always on top)
  await drawLabel(doc, page, job.orderNumber, 'BACK', job.paperHeightPt, job.marginPt);

  return await doc.save();
}

/**
 * Generate Front Cut PDF — cut lines ONLY, NO artwork.
 */
export async function generateFrontCutPDF(job) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([job.paperWidthPt, job.paperHeightPt]);

  // Draw ONLY cut lines — no artwork
  drawCutLines(page, job.cutLines, job.paperHeightPt);

  // Draw label
  await drawLabel(doc, page, job.orderNumber, 'FRONT CUT', job.paperHeightPt, job.marginPt);

  return await doc.save();
}

/**
 * Generate Back Cut PDF — cut lines ONLY, NO artwork.
 */
export async function generateBackCutPDF(job) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([job.paperWidthPt, job.paperHeightPt]);

  // Draw ONLY cut lines — no artwork
  drawCutLines(page, job.backCutLines, job.paperHeightPt);

  // Draw label
  await drawLabel(doc, page, job.orderNumber, 'BACK CUT', job.paperHeightPt, job.marginPt);

  return await doc.save();
}
