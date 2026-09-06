/**
 * Master PDF Generator
 * 
 * Creates all 4 PDF files from the Job model:
 * 1. {ORDER}-front.pdf — Front artwork + cut lines
 * 2. {ORDER}-back.pdf — Back artwork + cut lines
 * 3. {ORDER}-front-cut.pdf — Front cut lines ONLY
 * 4. {ORDER}-back-cut.pdf — Back cut lines ONLY
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
 * Generate Front PDF — artwork + cut lines.
 */
export async function generateFrontPDF(job) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([job.paperWidthPt, job.paperHeightPt]);

  // Embed front artwork at all positions
  await embedArtwork(
    doc, page, job.frontFile,
    job.layout.positions,
    job.layout.artworkPlacementWidth,
    job.layout.artworkPlacementHeight,
    job.paperHeightPt,
    job.artworkRotated,
  );

  // Draw cut lines on top of artwork
  drawCutLines(page, job.cutLines, job.paperHeightPt);

  // Draw label
  await drawLabel(doc, page, job.orderNumber, 'FRONT', job.paperHeightPt, job.marginPt);

  return await doc.save();
}

/**
 * Generate Back PDF — artwork + cut lines.
 */
export async function generateBackPDF(job) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([job.paperWidthPt, job.paperHeightPt]);

  // Embed back artwork at duplex-transformed positions
  await embedArtwork(
    doc, page, job.backFile,
    job.backPositions,
    job.layout.artworkPlacementWidth,
    job.layout.artworkPlacementHeight,
    job.paperHeightPt,
    job.artworkRotated,
  );

  // Draw back cut lines
  drawCutLines(page, job.backCutLines, job.paperHeightPt);

  // Draw label
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
