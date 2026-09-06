/**
 * Main Application Controller
 * 
 * Wires UI events to core modules, orchestrates the entire workflow.
 */

import { createJob, calculateJobLayout, getJobSummary } from './core/job-model.js';
import { toPoints, fromPoints, formatValue, formatDimensions, UNIT_SHORT } from './core/units.js';
import { PAPER_PRESETS, getPaperDimensions, ORIENTATIONS } from './core/paper-sizes.js';
import { calculateTrimFromArtwork, validateBleed, validateTrim } from './core/bleed-trim.js';
import { validateOrderNumber, validateDimensionMatch, validateArtworkFits, validateFile } from './core/validation.js';
import { DUPLEX_MODES } from './core/duplex-engine.js';
import { parseFile } from './files/file-parser.js';
import { createPreviewRenderer } from './preview/preview-renderer.js';
import { generateAllPDFs } from './pdf/pdf-generator.js';
import { downloadPDF, downloadAllAsZip } from './download/download-manager.js';
import { initNotifications, showNotification, clearNotifications } from './ui/notifications.js';

// ============================================================
// Application State
// ============================================================
let job = createJob();
let frontFileInfo = null;
let backFileInfo = null;
let generatedPDFs = null;
let previewRenderer = null;
let currentUnit = 'mm';

// ============================================================
// DOM References
// ============================================================
const $ = (id) => document.getElementById(id);

const elements = {
  // Order
  orderNumber: $('orderNumber'),
  // Upload
  frontUpload: $('frontUpload'),
  backUpload: $('backUpload'),
  frontFileInput: $('frontFileInput'),
  backFileInput: $('backFileInput'),
  frontFileName: $('frontFileName'),
  frontFileDims: $('frontFileDims'),
  backFileName: $('backFileName'),
  backFileDims: $('backFileDims'),
  dimensionMatch: $('dimensionMatch'),
  dimensionWarning: $('dimensionWarning'),
  dimensionWarningText: $('dimensionWarningText'),
  // File info
  cardFileinfo: $('card-fileinfo'),
  frontInfoGrid: $('frontInfoGrid'),
  backInfoGrid: $('backInfoGrid'),
  // Settings
  unitSelect: $('unitSelect'),
  artworkWidth: $('artworkWidth'),
  artworkHeight: $('artworkHeight'),
  bleedInput: $('bleedInput'),
  trimModeAuto: $('trimModeAuto'),
  trimModeManual: $('trimModeManual'),
  trimWidth: $('trimWidth'),
  trimHeight: $('trimHeight'),
  // Paper
  paperSelect: $('paperSelect'),
  customPaperGroup: $('customPaperGroup'),
  customPaperWidth: $('customPaperWidth'),
  customPaperHeight: $('customPaperHeight'),
  orientationSelect: $('orientationSelect'),
  marginInput: $('marginInput'),
  gapInput: $('gapInput'),
  duplexSelect: $('duplexSelect'),
  // Layout & Results
  cardResultsPlaceholder: $('card-results-placeholder'),
  cardLayout: $('card-layout'),
  layoutResult: $('layoutResult'),
  // Summary
  cardSummary: $('card-summary'),
  jobSummary: $('jobSummary'),
  // Generate
  generateBtn: $('generateBtn'),
  // Downloads
  cardDownloads: $('card-downloads'),
  dlFront: $('dlFront'),
  dlBack: $('dlBack'),
  dlFrontCut: $('dlFrontCut'),
  dlBackCut: $('dlBackCut'),
  dlAll: $('dlAll'),
  // Preview
  previewTabs: $('previewTabs'),
  previewCanvas: $('previewCanvas'),
  previewEmpty: $('previewEmpty'),
  previewWrapper: $('previewWrapper'),
  zoomIn: $('zoomIn'),
  zoomOut: $('zoomOut'),
  zoomFit: $('zoomFit'),
  zoom100: $('zoom100'),
  // Notifications
  notifications: $('notifications'),
};

// ============================================================
// Initialization
// ============================================================
function init() {
  initNotifications(elements.notifications);
  previewRenderer = createPreviewRenderer(elements.previewCanvas);
  
  bindEvents();
  updateUnitSuffixes();
  updatePaperFromPreset();
}

// ============================================================
// Event Binding
// ============================================================
function bindEvents() {
  // Upload clicks
  elements.frontUpload.addEventListener('click', () => elements.frontFileInput.click());
  elements.backUpload.addEventListener('click', () => elements.backFileInput.click());
  
  // File inputs
  elements.frontFileInput.addEventListener('change', (e) => handleFileUpload(e, 'front'));
  elements.backFileInput.addEventListener('change', (e) => handleFileUpload(e, 'back'));
  
  // Drag & drop
  setupDragDrop(elements.frontUpload, elements.frontFileInput, 'front');
  setupDragDrop(elements.backUpload, elements.backFileInput, 'back');
  
  // Unit change
  elements.unitSelect.addEventListener('change', handleUnitChange);
  
  // Bleed change
  elements.bleedInput.addEventListener('input', handleSettingsChange);
  
  // Trim mode
  elements.trimModeAuto.addEventListener('click', () => setTrimMode('auto'));
  elements.trimModeManual.addEventListener('click', () => setTrimMode('manual'));
  elements.trimWidth.addEventListener('input', handleSettingsChange);
  elements.trimHeight.addEventListener('input', handleSettingsChange);
  
  // Paper
  elements.paperSelect.addEventListener('change', handlePaperChange);
  elements.customPaperWidth.addEventListener('input', handleSettingsChange);
  elements.customPaperHeight.addEventListener('input', handleSettingsChange);
  elements.orientationSelect.addEventListener('change', handleSettingsChange);
  
  // Margin, gap, duplex
  elements.marginInput.addEventListener('input', handleSettingsChange);
  elements.gapInput.addEventListener('input', handleSettingsChange);
  elements.duplexSelect.addEventListener('change', handleSettingsChange);
  
  // Generate
  elements.generateBtn.addEventListener('click', handleGenerate);
  
  // Preview tabs
  elements.previewTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.preview-tab');
    if (!tab) return;
    document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    previewRenderer.setView(tab.dataset.view);
  });
  
  // Zoom controls
  elements.zoomIn.addEventListener('click', () => previewRenderer.zoomIn());
  elements.zoomOut.addEventListener('click', () => previewRenderer.zoomOut());
  elements.zoomFit.addEventListener('click', () => previewRenderer.fitToCanvas());
  elements.zoom100.addEventListener('click', () => previewRenderer.zoom100());
  
  // Downloads
  elements.dlFront.addEventListener('click', () => {
    if (generatedPDFs) downloadPDF(generatedPDFs.front.data, generatedPDFs.front.filename);
  });
  elements.dlBack.addEventListener('click', () => {
    if (generatedPDFs) downloadPDF(generatedPDFs.back.data, generatedPDFs.back.filename);
  });
  elements.dlFrontCut.addEventListener('click', () => {
    if (generatedPDFs) downloadPDF(generatedPDFs.frontCut.data, generatedPDFs.frontCut.filename);
  });
  elements.dlBackCut.addEventListener('click', () => {
    if (generatedPDFs) downloadPDF(generatedPDFs.backCut.data, generatedPDFs.backCut.filename);
  });
  elements.dlAll.addEventListener('click', () => {
    if (generatedPDFs) downloadAllAsZip(generatedPDFs, job.orderNumber);
  });
}

// ============================================================
// Drag & Drop
// ============================================================
function setupDragDrop(dropArea, fileInput, side) {
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'var(--accent)';
    dropArea.style.background = 'var(--accent-glow)';
  });
  
  dropArea.addEventListener('dragleave', () => {
    dropArea.style.borderColor = '';
    dropArea.style.background = '';
  });
  
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = '';
    dropArea.style.background = '';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Create a synthetic event-like object
      handleFileUpload({ target: { files } }, side);
    }
  });
}

// ============================================================
// File Upload Handler
// ============================================================
async function handleFileUpload(e, side) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file type
  const validation = validateFile(file);
  if (!validation.valid) {
    showNotification(validation.error, 'error');
    return;
  }
  
  try {
    const fileInfo = await parseFile(file);
    
    if (side === 'front') {
      frontFileInfo = fileInfo;
      job.frontFile = fileInfo;
      job.artworkWidthPt = fileInfo.widthPt;
      job.artworkHeightPt = fileInfo.heightPt;
      job.frontFileInfo = fileInfo;
      
      // Update UI
      elements.frontUpload.classList.add('has-file');
      elements.frontFileName.textContent = fileInfo.filename;
      elements.frontFileDims.textContent = formatDimensions(fileInfo.widthPt, fileInfo.heightPt, currentUnit);
      elements.frontUpload.querySelector('.upload-icon').textContent = '✅';
    } else {
      backFileInfo = fileInfo;
      job.backFile = fileInfo;
      job.backArtworkWidthPt = fileInfo.widthPt;
      job.backArtworkHeightPt = fileInfo.heightPt;
      job.backFileInfo = fileInfo;
      
      elements.backUpload.classList.add('has-file');
      elements.backFileName.textContent = fileInfo.filename;
      elements.backFileDims.textContent = formatDimensions(fileInfo.widthPt, fileInfo.heightPt, currentUnit);
      elements.backUpload.querySelector('.upload-icon').textContent = '✅';
    }
    
    // DPI warning
    if (fileInfo.dpiWarning) {
      showNotification(fileInfo.dpiWarning, 'warning', 8000);
    }
    
    showNotification(`${side === 'front' ? 'Front' : 'Back'} artwork loaded: ${fileInfo.filename}`, 'success', 3000);
    
    // Check dimension match if both files uploaded
    checkDimensionMatch();
    updateFileInfoPanel();
    updateArtworkDisplay();
    recalculateLayout();
    
  } catch (err) {
    showNotification(err.message || 'Unable to read the uploaded file.', 'error');
  }
}

// ============================================================
// Dimension Match Check
// ============================================================
function checkDimensionMatch() {
  if (!frontFileInfo || !backFileInfo) {
    elements.dimensionMatch.classList.add('hidden');
    elements.dimensionWarning.classList.add('hidden');
    return;
  }
  
  const result = validateDimensionMatch(
    frontFileInfo.widthPt, frontFileInfo.heightPt,
    backFileInfo.widthPt, backFileInfo.heightPt
  );
  
  elements.dimensionMatch.classList.remove('hidden');
  
  if (result.match) {
    elements.dimensionMatch.innerHTML = '<span class="match-badge match-yes">✓ Front/Back Match: YES</span>';
    elements.dimensionWarning.classList.add('hidden');
    job.dimensionMismatch = false;
  } else {
    elements.dimensionMatch.innerHTML = '<span class="match-badge match-no">⚠ Front/Back Match: NO</span>';
    elements.dimensionWarning.classList.remove('hidden');
    elements.dimensionWarningText.textContent = result.warning;
    job.dimensionMismatch = true;
    job.dimensionMismatchWarning = result.warning;
  }
}

// ============================================================
// File Info Panel
// ============================================================
function updateFileInfoPanel() {
  if (!frontFileInfo && !backFileInfo) {
    elements.cardFileinfo.classList.add('hidden');
    return;
  }
  
  elements.cardFileinfo.classList.remove('hidden');
  
  if (frontFileInfo) {
    elements.frontInfoGrid.innerHTML = buildFileInfoHTML(frontFileInfo);
  } else {
    elements.frontInfoGrid.innerHTML = '<span class="info-label">Not uploaded</span>';
  }
  
  if (backFileInfo) {
    elements.backInfoGrid.innerHTML = buildFileInfoHTML(backFileInfo);
  } else {
    elements.backInfoGrid.innerHTML = '<span class="info-label">Not uploaded</span>';
  }
}

function buildFileInfoHTML(info) {
  const w = fromPoints(info.widthPt, currentUnit);
  const h = fromPoints(info.heightPt, currentUnit);
  
  return `
    <span class="info-label">File</span>
    <span class="info-value">${info.filename}</span>
    <span class="info-label">Width</span>
    <span class="info-value">${formatValue(w, currentUnit)} ${UNIT_SHORT[currentUnit]}</span>
    <span class="info-label">Height</span>
    <span class="info-value">${formatValue(h, currentUnit)} ${UNIT_SHORT[currentUnit]}</span>
    <span class="info-label">Pages</span>
    <span class="info-value">${info.pageCount}</span>
    <span class="info-label">Resolution</span>
    <span class="info-value">${info.resolution}</span>
    <span class="info-label">Orientation</span>
    <span class="info-value">${info.orientation}</span>
  `;
}

// ============================================================
// Artwork Display
// ============================================================
function updateArtworkDisplay() {
  if (!frontFileInfo) {
    elements.artworkWidth.value = '';
    elements.artworkHeight.value = '';
    return;
  }
  
  const w = fromPoints(job.artworkWidthPt, currentUnit);
  const h = fromPoints(job.artworkHeightPt, currentUnit);
  elements.artworkWidth.value = formatValue(w, currentUnit);
  elements.artworkHeight.value = formatValue(h, currentUnit);
}

// ============================================================
// Unit Change
// ============================================================
function handleUnitChange() {
  const oldUnit = currentUnit;
  currentUnit = elements.unitSelect.value;
  job.displayUnit = currentUnit;
  
  // Convert displayed bleed value
  const bleedOld = parseFloat(elements.bleedInput.value) || 0;
  const bleedPt = toPoints(bleedOld, oldUnit);
  elements.bleedInput.value = formatValue(fromPoints(bleedPt, currentUnit), currentUnit);
  
  // Convert margin
  const marginOld = parseFloat(elements.marginInput.value) || 0;
  const marginPt = toPoints(marginOld, oldUnit);
  elements.marginInput.value = formatValue(fromPoints(marginPt, currentUnit), currentUnit);
  
  // Convert gap
  const gapOld = parseFloat(elements.gapInput.value) || 0;
  const gapPt = toPoints(gapOld, oldUnit);
  elements.gapInput.value = formatValue(fromPoints(gapPt, currentUnit), currentUnit);
  
  // Convert custom paper dims
  if (elements.paperSelect.value === 'custom') {
    const cpwOld = parseFloat(elements.customPaperWidth.value) || 0;
    const cphOld = parseFloat(elements.customPaperHeight.value) || 0;
    const cpwPt = toPoints(cpwOld, oldUnit);
    const cphPt = toPoints(cphOld, oldUnit);
    elements.customPaperWidth.value = formatValue(fromPoints(cpwPt, currentUnit), currentUnit);
    elements.customPaperHeight.value = formatValue(fromPoints(cphPt, currentUnit), currentUnit);
  }
  
  // Convert trim (if manual)
  if (job.trimMode === 'manual') {
    const twOld = parseFloat(elements.trimWidth.value) || 0;
    const thOld = parseFloat(elements.trimHeight.value) || 0;
    const twPt = toPoints(twOld, oldUnit);
    const thPt = toPoints(thOld, oldUnit);
    elements.trimWidth.value = formatValue(fromPoints(twPt, currentUnit), currentUnit);
    elements.trimHeight.value = formatValue(fromPoints(thPt, currentUnit), currentUnit);
  }
  
  updateUnitSuffixes();
  updateArtworkDisplay();
  updateFileInfoPanel();
  
  // Update file dimension displays
  if (frontFileInfo) {
    elements.frontFileDims.textContent = formatDimensions(frontFileInfo.widthPt, frontFileInfo.heightPt, currentUnit);
  }
  if (backFileInfo) {
    elements.backFileDims.textContent = formatDimensions(backFileInfo.widthPt, backFileInfo.heightPt, currentUnit);
  }
  
  recalculateLayout();
}

function updateUnitSuffixes() {
  const unit = UNIT_SHORT[currentUnit];
  document.querySelectorAll('[id$="Unit"]').forEach(el => {
    if (el.tagName !== 'SELECT') {
      el.textContent = unit;
    }
  });
}

// ============================================================
// Trim Mode
// ============================================================
function setTrimMode(mode) {
  job.trimMode = mode;
  
  elements.trimModeAuto.classList.toggle('active', mode === 'auto');
  elements.trimModeManual.classList.toggle('active', mode === 'manual');
  
  elements.trimWidth.readOnly = mode === 'auto';
  elements.trimHeight.readOnly = mode === 'auto';
  
  if (mode === 'auto') {
    recalculateLayout();
  }
}

// ============================================================
// Paper Change
// ============================================================
function handlePaperChange() {
  const preset = elements.paperSelect.value;
  
  if (preset === 'custom') {
    elements.customPaperGroup.classList.remove('hidden');
  } else {
    elements.customPaperGroup.classList.add('hidden');
    updatePaperFromPreset();
  }
  
  handleSettingsChange();
}

function updatePaperFromPreset() {
  const preset = elements.paperSelect.value;
  if (preset !== 'custom' && PAPER_PRESETS[preset]) {
    const paper = PAPER_PRESETS[preset];
    job.paperWidthPt = toPoints(paper.widthMm, 'mm');
    job.paperHeightPt = toPoints(paper.heightMm, 'mm');
    job.paperPreset = preset;
  }
}

// ============================================================
// Settings Change Handler
// ============================================================
function handleSettingsChange() {
  readAllSettings();
  recalculateLayout();
}

function readAllSettings() {
  // Bleed
  const bleedVal = parseFloat(elements.bleedInput.value) || 0;
  job.bleedPt = toPoints(bleedVal, currentUnit);
  
  // Trim (manual)
  if (job.trimMode === 'manual') {
    const tw = parseFloat(elements.trimWidth.value) || 0;
    const th = parseFloat(elements.trimHeight.value) || 0;
    job.trimWidthPt = toPoints(tw, currentUnit);
    job.trimHeightPt = toPoints(th, currentUnit);
  }
  
  // Paper
  const paperPreset = elements.paperSelect.value;
  if (paperPreset === 'custom') {
    const cpw = parseFloat(elements.customPaperWidth.value) || 0;
    const cph = parseFloat(elements.customPaperHeight.value) || 0;
    job.paperWidthPt = toPoints(cpw, currentUnit);
    job.paperHeightPt = toPoints(cph, currentUnit);
    job.paperPreset = 'custom';
  } else {
    updatePaperFromPreset();
  }
  
  // Orientation
  job.paperOrientation = elements.orientationSelect.value;
  
  // Margin
  const marginVal = parseFloat(elements.marginInput.value) || 0;
  job.marginPt = toPoints(marginVal, currentUnit);
  
  // Gap
  const gapVal = parseFloat(elements.gapInput.value) || 0;
  job.gapPt = toPoints(gapVal, currentUnit);
  
  // Duplex
  job.duplexMode = elements.duplexSelect.value;
  
  // Order number
  job.orderNumber = elements.orderNumber.value.trim();
}

// ============================================================
// Layout Recalculation
// ============================================================
function recalculateLayout() {
  if (!frontFileInfo) {
    hideLayoutResults();
    return;
  }
  
  // Read current settings
  readAllSettings();
  
  // Validate bleed
  const bleedValidation = validateBleed(job.bleedPt);
  if (!bleedValidation.valid) {
    showNotification(bleedValidation.errors.join(' '), 'error', 5000);
    hideLayoutResults();
    return;
  }
  
  // Calculate job layout
  calculateJobLayout(job);
  
  if (!job.layout) {
    // Check why it failed
    const fitCheck = validateArtworkFits(
      job.artworkWidthPt, job.artworkHeightPt,
      job.paperWidthPt, job.paperHeightPt, job.marginPt
    );
    if (!fitCheck.valid) {
      showLayoutError(fitCheck.error);
    } else {
      showLayoutError('Unable to fit artwork on paper with current settings.');
    }
    hideLayoutResults();
    return;
  }
  
  // Update trim display
  const trimW = fromPoints(job.trimWidthPt, currentUnit);
  const trimH = fromPoints(job.trimHeightPt, currentUnit);
  elements.trimWidth.value = formatValue(trimW, currentUnit);
  elements.trimHeight.value = formatValue(trimH, currentUnit);
  
  // Validate trim
  const trimValidation = validateTrim(
    job.artworkWidthPt, job.artworkHeightPt,
    job.trimWidthPt, job.trimHeightPt
  );
  if (!trimValidation.valid) {
    showLayoutError(trimValidation.errors.join(' '));
    hideLayoutResults();
    return;
  }
  
  // Show layout results
  showLayoutResults();
  updateJobSummary();
  updatePreview();
  updateGenerateButton();
}

// ============================================================
// Layout Display
// ============================================================
function showLayoutResults() {
  const layout = job.layout;
  if (elements.cardResultsPlaceholder) {
    elements.cardResultsPlaceholder.classList.add('hidden');
  }
  elements.cardLayout.classList.remove('hidden');
  
  elements.layoutResult.innerHTML = `
    <div class="layout-stat">
      <div class="layout-stat-value">${layout.copies}</div>
      <div class="layout-stat-label">Total Copies</div>
    </div>
    <div class="layout-stat">
      <div class="layout-stat-value">${layout.columns} × ${layout.rows}</div>
      <div class="layout-stat-label">Columns × Rows</div>
    </div>
    <div class="layout-stat">
      <div class="layout-stat-value">${layout.paperUsage.toFixed(1)}%</div>
      <div class="layout-stat-label">Paper Usage</div>
    </div>
    <div class="layout-stat">
      <div class="layout-stat-value">${layout.paperOrientation === 'landscape' ? '↔' : '↕'}</div>
      <div class="layout-stat-label">${layout.paperOrientation.charAt(0).toUpperCase() + layout.paperOrientation.slice(1)}</div>
    </div>
    <div class="layout-stat">
      <div class="layout-stat-value">${layout.artworkRotated ? '↻' : '—'}</div>
      <div class="layout-stat-label">${layout.artworkRotated ? 'Rotated' : 'Normal'}</div>
    </div>
    <div class="layout-stat">
      <div class="layout-stat-value">${formatValue(fromPoints(layout.wasteArea, currentUnit), currentUnit)}</div>
      <div class="layout-stat-label">Waste (${UNIT_SHORT[currentUnit]}²)</div>
    </div>
  `;
}

function hideLayoutResults() {
  if (elements.cardResultsPlaceholder) {
    elements.cardResultsPlaceholder.classList.remove('hidden');
  }
  elements.cardLayout.classList.add('hidden');
  elements.cardSummary.classList.add('hidden');
  elements.previewEmpty.classList.remove('hidden');
  previewRenderer.setJob(null);
}

function showLayoutError(message) {
  if (elements.cardResultsPlaceholder) {
    elements.cardResultsPlaceholder.classList.add('hidden');
  }
  elements.cardLayout.classList.remove('hidden');
  elements.layoutResult.innerHTML = `
    <div style="grid-column: 1/-1; color: var(--error); font-size: 0.85rem; text-align: center; padding: 10px;">
      ❌ ${message}
    </div>
  `;
}

// ============================================================
// Job Summary
// ============================================================
function updateJobSummary() {
  const summary = getJobSummary(job, currentUnit);
  if (!summary) {
    elements.cardSummary.classList.add('hidden');
    return;
  }
  
  elements.cardSummary.classList.remove('hidden');
  
  const u = UNIT_SHORT[currentUnit];
  elements.jobSummary.innerHTML = `
    <div class="info-grid">
      <span class="info-label">Order Number</span>
      <span class="info-value highlight">${summary.orderNumber || '(not set)'}</span>
      <span class="info-label">Artwork</span>
      <span class="info-value">${formatValue(summary.artworkWidth, currentUnit)} × ${formatValue(summary.artworkHeight, currentUnit)} ${u}</span>
      <span class="info-label">Trim</span>
      <span class="info-value">${formatValue(summary.trimWidth, currentUnit)} × ${formatValue(summary.trimHeight, currentUnit)} ${u}</span>
      <span class="info-label">Bleed</span>
      <span class="info-value">${formatValue(summary.bleed, currentUnit)} ${u}</span>
      <span class="info-label">Paper</span>
      <span class="info-value">${formatValue(summary.paperWidth, currentUnit)} × ${formatValue(summary.paperHeight, currentUnit)} ${u}</span>
      <span class="info-label">Margin</span>
      <span class="info-value">${formatValue(summary.margin, currentUnit)} ${u}</span>
      <span class="info-label">Gap</span>
      <span class="info-value">${formatValue(summary.gap, currentUnit)} ${u}</span>
      <span class="info-label">Layout</span>
      <span class="info-value highlight">${summary.columns} × ${summary.rows}</span>
      <span class="info-label">Total Copies</span>
      <span class="info-value highlight">${summary.copies}</span>
      <span class="info-label">Orientation</span>
      <span class="info-value">${summary.orientation}</span>
      <span class="info-label">Artwork Rotated</span>
      <span class="info-value">${summary.artworkRotated ? 'Yes' : 'No'}</span>
      <span class="info-label">Duplex</span>
      <span class="info-value">${summary.duplexMode === 'long-edge' ? 'Flip on Long Edge' : 'Flip on Short Edge'}</span>
      <span class="info-label">Artwork Scale</span>
      <span class="info-value highlight">${summary.artworkScale}%</span>
    </div>
  `;
}

// ============================================================
// Preview
// ============================================================
function updatePreview() {
  if (job.layout) {
    elements.previewEmpty.classList.add('hidden');
    previewRenderer.setJob(job);
  } else {
    elements.previewEmpty.classList.remove('hidden');
    previewRenderer.setJob(null);
  }
}

// ============================================================
// Generate Button State
// ============================================================
function updateGenerateButton() {
  const hasLayout = !!job.layout;
  const hasFront = !!frontFileInfo;
  const hasBack = !!backFileInfo;
  
  elements.generateBtn.disabled = !(hasLayout && hasFront && hasBack);
}

// ============================================================
// Generate PDFs
// ============================================================
async function handleGenerate() {
  // Validate order number
  const orderVal = validateOrderNumber(elements.orderNumber.value);
  if (!orderVal.valid) {
    showNotification(orderVal.error, 'error');
    elements.orderNumber.focus();
    return;
  }
  
  job.orderNumber = elements.orderNumber.value.trim();
  
  // Validate all settings one more time
  readAllSettings();
  calculateJobLayout(job);
  
  if (!job.layout) {
    showNotification('Cannot generate PDFs: layout calculation failed.', 'error');
    return;
  }
  
  if (!job.frontFile || !job.backFile) {
    showNotification('Both Front and Back artwork files are required.', 'error');
    return;
  }
  
  // Disable button, show progress
  elements.generateBtn.disabled = true;
  elements.generateBtn.innerHTML = '<span class="spinner"></span> Generating...';
  
  try {
    generatedPDFs = await generateAllPDFs(job);
    
    showNotification('All 4 PDFs generated successfully!', 'success', 5000);
    
    // Show downloads
    elements.cardDownloads.classList.remove('hidden');
    elements.dlFront.disabled = false;
    elements.dlBack.disabled = false;
    elements.dlFrontCut.disabled = false;
    elements.dlBackCut.disabled = false;
    elements.dlAll.disabled = false;
    
    // Update button labels with filenames
    elements.dlFront.querySelector('.dl-text').textContent = generatedPDFs.front.filename;
    elements.dlBack.querySelector('.dl-text').textContent = generatedPDFs.back.filename;
    elements.dlFrontCut.querySelector('.dl-text').textContent = generatedPDFs.frontCut.filename;
    elements.dlBackCut.querySelector('.dl-text').textContent = generatedPDFs.backCut.filename;
    
  } catch (err) {
    showNotification(`PDF generation failed: ${err.message}`, 'error', 0);
    console.error('PDF generation error:', err);
  } finally {
    elements.generateBtn.disabled = false;
    elements.generateBtn.innerHTML = '⚡ Generate PDFs';
    updateGenerateButton();
  }
}

// ============================================================
// Start
// ============================================================
document.addEventListener('DOMContentLoaded', init);
