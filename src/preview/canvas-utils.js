/**
 * Canvas Utilities for Preview
 * 
 * Handles coordinate transforms, zoom/pan, and common drawing operations.
 */

/**
 * Create a canvas manager for a given canvas element.
 * 
 * @param {HTMLCanvasElement} canvas
 * @returns {object} Canvas manager.
 */
export function createCanvasManager(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let paperWidthPt = 0;
  let paperHeightPt = 0;
  
  // For high-DPI displays
  const dpr = window.devicePixelRatio || 1;
  
  return {
    /**
     * Set the paper dimensions for this canvas.
     */
    setPaper(widthPt, heightPt) {
      paperWidthPt = widthPt;
      paperHeightPt = heightPt;
    },
    
    /**
     * Fit the entire paper to the canvas with padding.
     */
    fitToCanvas(padding = 20) {
      const canvasW = canvas.clientWidth - padding * 2;
      const canvasH = canvas.clientHeight - padding * 2;
      
      const scaleX = canvasW / paperWidthPt;
      const scaleY = canvasH / paperHeightPt;
      scale = Math.min(scaleX, scaleY);
      
      // Center the paper
      offsetX = (canvas.clientWidth - paperWidthPt * scale) / 2;
      offsetY = (canvas.clientHeight - paperHeightPt * scale) / 2;
    },
    
    /**
     * Set zoom to specific level.
     */
    setZoom(newScale) {
      // Zoom centered on canvas center
      const centerX = canvas.clientWidth / 2;
      const centerY = canvas.clientHeight / 2;
      
      // Point in paper coordinates at center
      const paperX = (centerX - offsetX) / scale;
      const paperY = (centerY - offsetY) / scale;
      
      scale = newScale;
      
      // Recalculate offset to keep same paper point at center
      offsetX = centerX - paperX * scale;
      offsetY = centerY - paperY * scale;
    },
    
    /**
     * Zoom in by factor.
     */
    zoomIn() {
      this.setZoom(scale * 1.25);
    },
    
    /**
     * Zoom out by factor.
     */
    zoomOut() {
      this.setZoom(scale / 1.25);
    },
    
    /**
     * Set zoom to show actual size (1 CSS pixel = 1 point, approximately).
     */
    zoom100() {
      // At 96 DPI screen, 1pt ≈ 96/72 ≈ 1.333 CSS pixels
      this.setZoom(96 / 72);
      // Center
      offsetX = (canvas.clientWidth - paperWidthPt * scale) / 2;
      offsetY = (canvas.clientHeight - paperHeightPt * scale) / 2;
    },
    
    /**
     * Resize canvas to match its container, accounting for DPI.
     */
    resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    
    /**
     * Clear the canvas.
     */
    clear() {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    },
    
    /**
     * Begin drawing with the current transform.
     */
    beginDraw() {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
    },
    
    /**
     * End drawing.
     */
    endDraw() {
      ctx.restore();
    },
    
    /**
     * Draw a paper rectangle.
     */
    drawPaper() {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1 / scale;
      ctx.fillRect(0, 0, paperWidthPt, paperHeightPt);
      ctx.strokeRect(0, 0, paperWidthPt, paperHeightPt);
    },
    
    /**
     * Draw the non-printable margin boundary.
     */
    drawMarginBoundary(marginPt) {
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.lineWidth = 0.5 / scale;
      ctx.setLineDash([3 / scale, 3 / scale]);
      ctx.strokeRect(
        marginPt, marginPt,
        paperWidthPt - 2 * marginPt,
        paperHeightPt - 2 * marginPt
      );
      ctx.setLineDash([]);
    },
    
    /**
     * Draw artwork rectangles at positions.
     */
    drawArtworkRects(positions, artWidth, artHeight, fillColor = 'rgba(66, 133, 244, 0.15)', strokeColor = 'rgba(66, 133, 244, 0.4)') {
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.5 / scale;
      
      for (const pos of positions) {
        ctx.fillRect(pos.x, pos.y, artWidth, artHeight);
        ctx.strokeRect(pos.x, pos.y, artWidth, artHeight);
      }
    },

    /**
     * Draw artwork images or canvases at positions.
     * Renders the actual uploaded artwork element or falls back to placeholder rects.
     */
    drawArtworkImages(
      positions,
      artPlacementWidth,
      artPlacementHeight,
      artworkElement,
      originalWidthPt,
      originalHeightPt,
      artworkRotated = false,
      fillColor = 'rgba(66, 133, 244, 0.15)',
      strokeColor = 'rgba(66, 133, 244, 0.4)'
    ) {
      if (artworkElement) {
        for (const pos of positions) {
          if (artworkRotated) {
            ctx.save();
            ctx.translate(pos.x + artPlacementWidth, pos.y);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(artworkElement, 0, 0, originalWidthPt, originalHeightPt);
            ctx.restore();
          } else {
            ctx.drawImage(artworkElement, pos.x, pos.y, artPlacementWidth, artPlacementHeight);
          }
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.lineWidth = 0.5 / scale;
          ctx.strokeRect(pos.x, pos.y, artPlacementWidth, artPlacementHeight);
        }
      } else {
        this.drawArtworkRects(positions, artPlacementWidth, artPlacementHeight, fillColor, strokeColor);
      }
    },
    
    /**
     * Draw cut lines.
     */
    drawCutLines(cutLines, color = '#000000', lineWidth = 0.5) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth / scale;
      
      ctx.beginPath();
      for (const line of cutLines) {
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
      }
      ctx.stroke();
    },
    
    /**
     * Draw a label text inside the printable area.
     * A white background rect is drawn first so the label is always
     * readable even when a cut line passes through it.
     *
     * @param {string} text
     * @param {number} marginPt - Non-printable margin in points.
     */
    drawLabel(text, marginPt = 0) {
      const safeMargin = Math.max(marginPt, 4);
      const fontSize = Math.max(6, 10 / scale);
      ctx.font = `bold ${fontSize}px sans-serif`;

      const x = safeMargin + 2;
      const y = safeMargin + 2;
      const padding = 2;
      const textWidth = ctx.measureText(text).width;

      // White knockout rect so cut lines behind the label don't bleed through
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(
        x - padding,
        y,
        textWidth + padding * 2,
        fontSize + padding * 2
      );

      // Label text
      ctx.fillStyle = 'rgba(40, 40, 40, 0.95)';
      ctx.fillText(text, x, y + fontSize + padding - 1);
    },
    
    /**
     * Get the current scale.
     */
    getScale() {
      return scale;
    },
    
    getContext() {
      return ctx;
    },
  };
}
