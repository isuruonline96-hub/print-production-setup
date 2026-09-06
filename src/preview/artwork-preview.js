/**
 * Artwork Preview Helper
 * 
 * Converts uploaded artwork files (PNG, JPG, PDF) into renderable
 * canvas/image elements so they can be drawn onto the layout preview canvas.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Cache rendered artwork elements to avoid re-rendering on every zoom/pan/redraw.
 * Key: fileInfo object or identifier
 */
const previewCache = new WeakMap();

/**
 * Get or create a renderable preview element (HTMLImageElement or HTMLCanvasElement)
 * for an uploaded artwork file.
 * 
 * @param {object} fileInfo - Parsed file info object containing .type and .data.
 * @returns {Promise<HTMLImageElement|HTMLCanvasElement|null>}
 */
export async function getArtworkPreviewElement(fileInfo) {
  if (!fileInfo || !fileInfo.data) return null;

  if (previewCache.has(fileInfo)) {
    return previewCache.get(fileInfo);
  }

  let element = null;

  try {
    if (fileInfo.type === 'png' || fileInfo.type === 'jpeg' || fileInfo.type === 'jpg') {
      element = await renderImageToElement(fileInfo);
    } else if (fileInfo.type === 'pdf') {
      element = await renderPdfToElement(fileInfo);
    }
  } catch (err) {
    console.warn('Failed to render artwork preview element:', err);
    return null;
  }

  if (element) {
    previewCache.set(fileInfo, element);
  }

  return element;
}

/**
 * Render image to an HTMLImageElement.
 */
function renderImageToElement(fileInfo) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const mimeType = fileInfo.type === 'png' ? 'image/png' : 'image/jpeg';
    const blob = new Blob([fileInfo.data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Render first page of a PDF to an offscreen HTMLCanvasElement using PDF.js.
 */
async function renderPdfToElement(fileInfo) {
  const loadingTask = pdfjsLib.getDocument({
    data: fileInfo.data.slice(),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // Use 2x scale for sharp display on preview canvas
  const scale = 2;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  const ctx = canvas.getContext('2d');
  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return canvas;
}
