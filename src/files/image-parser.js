/**
 * Image Parser
 * 
 * Extracts dimensions and DPI from PNG and JPEG images.
 * Calculates physical dimensions from pixel dimensions + DPI.
 */

const DEFAULT_DPI = 300; // Print industry standard fallback

/**
 * Parse an image file and extract dimensions.
 * 
 * @param {File} file - The image file.
 * @returns {Promise<object>} Parsed file info.
 */
export async function parseImage(file) {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  
  // Load image to get pixel dimensions
  const img = await loadImage(file);
  const pixelWidth = img.naturalWidth;
  const pixelHeight = img.naturalHeight;
  
  // Try to extract DPI from metadata
  let dpi = null;
  let dpiWarning = null;
  
  const ext = file.name.split('.').pop().toLowerCase();
  
  if (ext === 'jpg' || ext === 'jpeg') {
    dpi = extractJpegDpi(data);
  } else if (ext === 'png') {
    dpi = extractPngDpi(data);
  }
  
  if (!dpi) {
    dpi = DEFAULT_DPI;
    dpiWarning = `No DPI metadata found. Assuming ${DEFAULT_DPI} DPI (print standard). Physical dimensions may not be accurate.`;
  }
  
  // Calculate physical dimensions in points
  // points = (pixels / dpi) * 72
  const widthPt = (pixelWidth / dpi) * 72;
  const heightPt = (pixelHeight / dpi) * 72;
  
  return {
    type: ext === 'jpg' ? 'jpeg' : ext,
    filename: file.name,
    data,
    widthPt,
    heightPt,
    pixelWidth,
    pixelHeight,
    dpi,
    dpiWarning,
    pageCount: 1,
    orientation: pixelWidth >= pixelHeight ? 'Landscape' : 'Portrait',
    resolution: `${pixelWidth} × ${pixelHeight} px (${dpi} DPI)`,
  };
}

/**
 * Load an image file and return an HTMLImageElement.
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read the uploaded image file.'));
    };
    img.src = url;
  });
}

/**
 * Extract DPI from JPEG EXIF data.
 * Looks for XResolution and YResolution in the EXIF IFD.
 * 
 * @param {Uint8Array} data
 * @returns {number|null} DPI or null if not found.
 */
function extractJpegDpi(data) {
  // Look for JFIF APP0 marker
  if (data[0] !== 0xFF || data[1] !== 0xD8) return null;
  
  let offset = 2;
  while (offset < data.length - 1) {
    if (data[offset] !== 0xFF) break;
    
    const marker = data[offset + 1];
    
    // APP0 (JFIF)
    if (marker === 0xE0) {
      const segLen = (data[offset + 2] << 8) | data[offset + 3];
      // Check for JFIF header
      if (data[offset + 4] === 0x4A && data[offset + 5] === 0x46 &&
          data[offset + 6] === 0x49 && data[offset + 7] === 0x46) {
        const densityUnit = data[offset + 11];
        const xDensity = (data[offset + 12] << 8) | data[offset + 13];
        const yDensity = (data[offset + 14] << 8) | data[offset + 15];
        
        if (densityUnit === 1 && xDensity > 0) {
          // DPI (dots per inch)
          return xDensity;
        } else if (densityUnit === 2 && xDensity > 0) {
          // Dots per centimeter, convert to DPI
          return Math.round(xDensity * 2.54);
        }
      }
      offset += 2 + segLen;
    } else if (marker === 0xE1) {
      // APP1 (EXIF)
      const segLen = (data[offset + 2] << 8) | data[offset + 3];
      const dpi = parseExifForDpi(data, offset + 4, segLen - 2);
      if (dpi) return dpi;
      offset += 2 + segLen;
    } else if (marker >= 0xE0 && marker <= 0xEF) {
      // Other APP markers, skip
      const segLen = (data[offset + 2] << 8) | data[offset + 3];
      offset += 2 + segLen;
    } else if (marker === 0xDA) {
      // Start of scan, stop looking
      break;
    } else {
      // Other marker
      if (offset + 3 < data.length) {
        const segLen = (data[offset + 2] << 8) | data[offset + 3];
        offset += 2 + segLen;
      } else {
        break;
      }
    }
  }
  
  return null;
}

/**
 * Parse EXIF data to find DPI.
 * @param {Uint8Array} data
 * @param {number} start
 * @param {number} length
 * @returns {number|null}
 */
function parseExifForDpi(data, start, length) {
  // Check for "Exif\0\0"
  if (data[start] !== 0x45 || data[start + 1] !== 0x78 ||
      data[start + 2] !== 0x69 || data[start + 3] !== 0x66) {
    return null;
  }
  
  const tiffStart = start + 6;
  const isLittleEndian = data[tiffStart] === 0x49 && data[tiffStart + 1] === 0x49;
  
  const readUint16 = (offset) => {
    if (isLittleEndian) {
      return data[tiffStart + offset] | (data[tiffStart + offset + 1] << 8);
    }
    return (data[tiffStart + offset] << 8) | data[tiffStart + offset + 1];
  };
  
  const readUint32 = (offset) => {
    if (isLittleEndian) {
      return data[tiffStart + offset] |
        (data[tiffStart + offset + 1] << 8) |
        (data[tiffStart + offset + 2] << 16) |
        (data[tiffStart + offset + 3] << 24);
    }
    return (data[tiffStart + offset] << 24) |
      (data[tiffStart + offset + 1] << 16) |
      (data[tiffStart + offset + 2] << 8) |
      data[tiffStart + offset + 3];
  };
  
  // Read IFD0
  const ifdOffset = readUint32(4);
  const numEntries = readUint16(ifdOffset);
  
  let xRes = null;
  let resUnit = 2; // Default DPI
  
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = readUint16(entryOffset);
    
    if (tag === 0x011A) {
      // XResolution (RATIONAL)
      const valueOffset = readUint32(entryOffset + 8);
      const num = readUint32(valueOffset);
      const den = readUint32(valueOffset + 4);
      if (den > 0) xRes = num / den;
    } else if (tag === 0x0128) {
      // ResolutionUnit
      resUnit = readUint16(entryOffset + 8);
    }
  }
  
  if (xRes) {
    if (resUnit === 2) return Math.round(xRes); // DPI
    if (resUnit === 3) return Math.round(xRes * 2.54); // DPC to DPI
  }
  
  return null;
}

/**
 * Extract DPI from PNG pHYs chunk.
 * 
 * @param {Uint8Array} data
 * @returns {number|null} DPI or null if not found.
 */
function extractPngDpi(data) {
  // PNG signature check
  if (data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4E || data[3] !== 0x47) {
    return null;
  }
  
  let offset = 8; // Skip PNG signature
  
  while (offset < data.length - 12) {
    const chunkLength = (data[offset] << 24) | (data[offset + 1] << 16) |
                        (data[offset + 2] << 8) | data[offset + 3];
    const chunkType = String.fromCharCode(
      data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7]
    );
    
    if (chunkType === 'pHYs') {
      const dataStart = offset + 8;
      const pixelsPerUnitX = (data[dataStart] << 24) | (data[dataStart + 1] << 16) |
                             (data[dataStart + 2] << 8) | data[dataStart + 3];
      const unitSpecifier = data[dataStart + 8];
      
      if (unitSpecifier === 1 && pixelsPerUnitX > 0) {
        // Pixels per meter, convert to DPI
        return Math.round(pixelsPerUnitX / 39.3701);
      }
    }
    
    if (chunkType === 'IDAT' || chunkType === 'IEND') break;
    
    offset += 12 + chunkLength; // 4 (length) + 4 (type) + data + 4 (CRC)
  }
  
  return null;
}
