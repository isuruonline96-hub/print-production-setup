/**
 * Artwork Embedder
 * 
 * Embeds PDF pages or raster images into output PDF pages at exact positions.
 * NEVER scales artwork — always places at original physical dimensions.
 */

import { PDFDocument } from 'pdf-lib';

/**
 * Embed artwork into a PDF page at specified positions.
 * 
 * @param {PDFDocument} outputDoc - The output PDF document.
 * @param {object} outputPage - The output PDF page.
 * @param {object} fileInfo - Parsed file info (from file-parser).
 * @param {Array<{x: number, y: number}>} positions - Placement positions (top-left origin).
 * @param {number} artworkWidth - Artwork placement width in points.
 * @param {number} artworkHeight - Artwork placement height in points.
 * @param {number} paperHeightPt - Paper height for coordinate conversion.
 * @param {boolean} artworkRotated - Whether artwork should be rotated 90°.
 */
export async function embedArtwork(
  outputDoc, outputPage, fileInfo, positions,
  artworkWidth, artworkHeight, paperHeightPt, artworkRotated
) {
  if (fileInfo.type === 'pdf') {
    await embedPdfArtwork(outputDoc, outputPage, fileInfo, positions,
      artworkWidth, artworkHeight, paperHeightPt, artworkRotated);
  } else if (fileInfo.type === 'jpeg' || fileInfo.type === 'jpg') {
    await embedJpegArtwork(outputDoc, outputPage, fileInfo, positions,
      artworkWidth, artworkHeight, paperHeightPt, artworkRotated);
  } else if (fileInfo.type === 'png') {
    await embedPngArtwork(outputDoc, outputPage, fileInfo, positions,
      artworkWidth, artworkHeight, paperHeightPt, artworkRotated);
  }
}

/**
 * Embed PDF pages as artwork.
 */
async function embedPdfArtwork(
  outputDoc, outputPage, fileInfo, positions,
  artworkWidth, artworkHeight, paperHeightPt, artworkRotated
) {
  // Load the source PDF
  const srcDoc = await PDFDocument.load(fileInfo.data, { ignoreEncryption: true });
  
  // Embed the first page
  const [embeddedPage] = await outputDoc.embedPdf(srcDoc, [0]);
  
  for (const pos of positions) {
    // Convert from top-left origin to PDF bottom-left origin
    const pdfX = pos.x;
    const pdfY = paperHeightPt - pos.y - artworkHeight;
    
    if (artworkRotated) {
      // Draw rotated: translate to position, rotate 90°, draw
      outputPage.drawPage(embeddedPage, {
        x: pdfX + artworkWidth,
        y: pdfY,
        width: fileInfo.widthPt,
        height: fileInfo.heightPt,
        rotate: { type: 'degrees', angle: 90 },
      });
    } else {
      outputPage.drawPage(embeddedPage, {
        x: pdfX,
        y: pdfY,
        width: artworkWidth,
        height: artworkHeight,
      });
    }
  }
}

/**
 * Embed JPEG images as artwork.
 */
async function embedJpegArtwork(
  outputDoc, outputPage, fileInfo, positions,
  artworkWidth, artworkHeight, paperHeightPt, artworkRotated
) {
  const image = await outputDoc.embedJpg(fileInfo.data);
  
  for (const pos of positions) {
    const pdfX = pos.x;
    const pdfY = paperHeightPt - pos.y - artworkHeight;
    
    if (artworkRotated) {
      outputPage.drawImage(image, {
        x: pdfX + artworkWidth,
        y: pdfY,
        width: fileInfo.widthPt,
        height: fileInfo.heightPt,
        rotate: { type: 'degrees', angle: 90 },
      });
    } else {
      outputPage.drawImage(image, {
        x: pdfX,
        y: pdfY,
        width: artworkWidth,
        height: artworkHeight,
      });
    }
  }
}

/**
 * Embed PNG images as artwork.
 */
async function embedPngArtwork(
  outputDoc, outputPage, fileInfo, positions,
  artworkWidth, artworkHeight, paperHeightPt, artworkRotated
) {
  const image = await outputDoc.embedPng(fileInfo.data);
  
  for (const pos of positions) {
    const pdfX = pos.x;
    const pdfY = paperHeightPt - pos.y - artworkHeight;
    
    if (artworkRotated) {
      outputPage.drawImage(image, {
        x: pdfX + artworkWidth,
        y: pdfY,
        width: fileInfo.widthPt,
        height: fileInfo.heightPt,
        rotate: { type: 'degrees', angle: 90 },
      });
    } else {
      outputPage.drawImage(image, {
        x: pdfX,
        y: pdfY,
        width: artworkWidth,
        height: artworkHeight,
      });
    }
  }
}
