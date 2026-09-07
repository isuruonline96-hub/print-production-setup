/**
 * Preview Renderer
 * 
 * Renders the same Job model used for PDF generation onto an HTML5 canvas.
 * Uses the exact same coordinate system and positions as the PDF generator.
 * 
 * Six views: Front, Back, Front Foil, Back Foil, Front Cut, Back Cut.
 * Foil views use amber/gold color scheme to distinguish from normal artwork.
 */

import { createCanvasManager } from './canvas-utils.js';
import { getArtworkPreviewElement } from './artwork-preview.js';

/**
 * Create a preview renderer bound to a canvas element.
 * 
 * @param {HTMLCanvasElement} canvas
 * @returns {object} Preview renderer.
 */
export function createPreviewRenderer(canvas) {
  const manager = createCanvasManager(canvas);
  let currentJob = null;
  let currentView = 'front'; // 'front', 'back', 'frontFoil', 'backFoil', 'frontCut', 'backCut'
  let frontElement = null;
  let backElement = null;
  let frontFoilElement = null;
  let backFoilElement = null;
  let loadRequestId = 0;

  async function loadArtworks(job) {
    const reqId = ++loadRequestId;
    if (!job) {
      frontElement = null;
      backElement = null;
      frontFoilElement = null;
      backFoilElement = null;
      return;
    }

    const pFront     = job.frontFile     ? getArtworkPreviewElement(job.frontFile)     : Promise.resolve(null);
    const pBack      = job.backFile      ? getArtworkPreviewElement(job.backFile)      : Promise.resolve(null);
    const pFrontFoil = job.frontFoilFile ? getArtworkPreviewElement(job.frontFoilFile) : Promise.resolve(null);
    const pBackFoil  = job.backFoilFile  ? getArtworkPreviewElement(job.backFoilFile)  : Promise.resolve(null);

    const [fe, be, ffe, bfe] = await Promise.all([pFront, pBack, pFrontFoil, pBackFoil]);
    if (reqId === loadRequestId) {
      frontElement     = fe;
      backElement      = be;
      frontFoilElement = ffe;
      backFoilElement  = bfe;
      renderer.render();
    }
  }
  
  const renderer = {
    /**
     * Set the current job and trigger a redraw.
     */
    setJob(job) {
      currentJob = job;
      if (job && job.layout) {
        manager.setPaper(job.paperWidthPt, job.paperHeightPt);
        manager.resize();
        manager.fitToCanvas();
        this.render();
        loadArtworks(job);
      } else {
        frontElement = null;
        backElement = null;
        frontFoilElement = null;
        backFoilElement = null;
        this.render();
      }
    },
    
    /**
     * Set the current view tab.
     */
    setView(view) {
      currentView = view;
      this.render();
    },
    
    /**
     * Zoom controls.
     */
    zoomIn()      { manager.zoomIn();       this.render(); },
    zoomOut()     { manager.zoomOut();      this.render(); },
    fitToCanvas() { manager.fitToCanvas();  this.render(); },
    zoom100()     { manager.zoom100();      this.render(); },
    
    /**
     * Handle canvas resize.
     */
    resize() {
      manager.resize();
      if (currentJob && currentJob.layout) {
        manager.fitToCanvas();
        this.render();
      }
    },
    
    /**
     * Render the current view.
     */
    render() {
      if (!currentJob || !currentJob.layout) {
        manager.clear();
        return;
      }
      
      manager.clear();
      manager.beginDraw();
      
      switch (currentView) {
        case 'front':     this._renderFront();     break;
        case 'back':      this._renderBack();      break;
        case 'frontFoil': this._renderFrontFoil(); break;
        case 'backFoil':  this._renderBackFoil();  break;
        case 'frontCut':  this._renderFrontCut();  break;
        case 'backCut':   this._renderBackCut();   break;
      }
      
      manager.endDraw();
    },
    
    /**
     * Render Front view: paper + margin + artwork + cut lines + label.
     */
    _renderFront() {
      const job = currentJob;
      const layout = job.layout;
      
      // Paper
      manager.drawPaper();
      
      // Non-printable margin
      manager.drawMarginBoundary(job.marginPt);
      
      // Artwork copies (with real uploaded image / PDF page if available)
      manager.drawArtworkImages(
        layout.positions,
        layout.artworkPlacementWidth,
        layout.artworkPlacementHeight,
        frontElement,
        job.artworkWidthPt,
        job.artworkHeightPt,
        job.artworkRotated,
        'rgba(66, 133, 244, 0.15)',
        'rgba(66, 133, 244, 0.3)',
      );
      
      // Cut lines
      if (job.cutLines) {
        manager.drawCutLines(job.cutLines, '#e53935', 0.75);
      }
      
      // Label
      manager.drawLabel(`${job.orderNumber} FRONT`, job.marginPt);
    },
    
    /**
     * Render Back view: paper + margin + artwork + cut lines + label.
     */
    _renderBack() {
      const job = currentJob;
      
      manager.drawPaper();
      manager.drawMarginBoundary(job.marginPt);
      
      // Back positions (duplex-transformed with real uploaded back artwork)
      if (job.backPositions) {
        manager.drawArtworkImages(
          job.backPositions,
          job.layout.artworkPlacementWidth,
          job.layout.artworkPlacementHeight,
          backElement,
          job.backArtworkWidthPt || job.artworkWidthPt,
          job.backArtworkHeightPt || job.artworkHeightPt,
          job.artworkRotated,
          'rgba(76, 175, 80, 0.15)',
          'rgba(76, 175, 80, 0.3)',
        );
      }
      
      if (job.backCutLines) {
        manager.drawCutLines(job.backCutLines, '#e53935', 0.75);
      }
      
      manager.drawLabel(`${job.orderNumber} BACK`, job.marginPt);
    },

    /**
     * Render Front Foil view: paper + margin + foil artwork + cut lines + label.
     * Uses amber/gold color scheme to distinguish from normal artwork views.
     */
    _renderFrontFoil() {
      const job = currentJob;
      const layout = job.layout;

      manager.drawPaper();
      manager.drawMarginBoundary(job.marginPt);

      // Foil artwork copies (amber placeholder when no foil file)
      manager.drawArtworkImages(
        layout.positions,
        layout.artworkPlacementWidth,
        layout.artworkPlacementHeight,
        frontFoilElement,
        job.artworkWidthPt,
        job.artworkHeightPt,
        job.artworkRotated,
        'rgba(245, 158, 11, 0.15)',
        'rgba(245, 158, 11, 0.4)',
      );

      // Cut lines (for registration reference)
      if (job.cutLines) {
        manager.drawCutLines(job.cutLines, '#e53935', 0.75);
      }

      manager.drawLabel(`${job.orderNumber} FRONT FOIL`, job.marginPt);
    },

    /**
     * Render Back Foil view: paper + margin + foil artwork + cut lines + label.
     */
    _renderBackFoil() {
      const job = currentJob;

      manager.drawPaper();
      manager.drawMarginBoundary(job.marginPt);

      if (job.backPositions) {
        manager.drawArtworkImages(
          job.backPositions,
          job.layout.artworkPlacementWidth,
          job.layout.artworkPlacementHeight,
          backFoilElement,
          job.backArtworkWidthPt || job.artworkWidthPt,
          job.backArtworkHeightPt || job.artworkHeightPt,
          job.artworkRotated,
          'rgba(245, 158, 11, 0.15)',
          'rgba(245, 158, 11, 0.4)',
        );
      }

      if (job.backCutLines) {
        manager.drawCutLines(job.backCutLines, '#e53935', 0.75);
      }

      manager.drawLabel(`${job.orderNumber} BACK FOIL`, job.marginPt);
    },
    
    /**
     * Render Front Cut view: paper + cut grid ONLY.
     */
    _renderFrontCut() {
      const job = currentJob;
      
      manager.drawPaper();
      
      if (job.cutLines) {
        manager.drawCutLines(job.cutLines, '#000000', 0.5);
      }
      
      manager.drawLabel(`${job.orderNumber} FRONT CUT`, job.marginPt);
    },
    
    /**
     * Render Back Cut view: paper + cut grid ONLY.
     */
    _renderBackCut() {
      const job = currentJob;
      
      manager.drawPaper();
      
      if (job.backCutLines) {
        manager.drawCutLines(job.backCutLines, '#000000', 0.5);
      }
      
      manager.drawLabel(`${job.orderNumber} BACK CUT`, job.marginPt);
    },
  };
  
  // Set up resize observer
  const resizeObserver = new ResizeObserver(() => {
    renderer.resize();
  });
  resizeObserver.observe(canvas.parentElement || canvas);
  
  return renderer;
}
