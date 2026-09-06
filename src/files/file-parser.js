/**
 * Unified File Parser
 * 
 * Accepts any supported file and delegates to the appropriate format-specific parser.
 * Returns a consistent file info structure.
 */

import { parsePDF } from './pdf-parser.js';
import { parseImage } from './image-parser.js';

/**
 * Parse an uploaded file and extract its metadata and dimensions.
 * 
 * @param {File} file - The uploaded file.
 * @returns {Promise<object>} Parsed file info with fields:
 *   - type: 'pdf' | 'png' | 'jpeg'
 *   - filename: string
 *   - data: Uint8Array
 *   - widthPt: number (in PDF points)
 *   - heightPt: number (in PDF points)
 *   - pixelWidth: number|null
 *   - pixelHeight: number|null
 *   - dpi: number|null
 *   - dpiWarning: string|null
 *   - pageCount: number
 *   - orientation: string
 *   - resolution: string
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return await parsePDF(file);
    
    case 'png':
    case 'jpg':
    case 'jpeg':
      return await parseImage(file);
    
    default:
      throw new Error(`Unsupported file format: .${ext}. Supported formats: PDF, PNG, JPG.`);
  }
}
