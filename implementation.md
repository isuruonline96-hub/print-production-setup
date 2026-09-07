# Infive Print Setup — Implementation Documentation

## 1. Project Overview

Infive Print Setup is a browser-based print imposition and cut file generator for printing shops. It takes front and/or back artwork files, arranges them optimally on a paper sheet, and generates four PDF files: front layout, back layout, front cutting guide, and back cutting guide.

The application runs entirely in the browser. No artwork is ever sent to a server.

---

## 2. Features

- Upload Front and/or Back artwork (PDF, PNG, JPG) — **either side is optional**
- Automatic artwork dimension detection
- Configurable bleed, trim size, paper, margin, and gap
- Auto/manual trim calculation
- Paper presets: A5, A4, A3, SRA4, SRA3, Custom
- Portrait, Landscape, and Auto orientation
- Automatic maximum-copy calculation
- Front/Back positional alignment for duplex printing
- Duplex modes: Flip on Long Edge, Flip on Short Edge
- Optimized vector cut-line generation (edge-to-edge connected grid lines)
- Live canvas preview with 4 views (Front, Back, Front Cut, Back Cut)
- **Real-time order number preview** — label updates on every keystroke
- Zoom controls (In, Out, Fit, 100%)
- Generates 4 separate PDFs per job
- Individual downloads + Download All as ZIP
- Artwork is never resized (always 100% scale)
- Validation and error messages
- Order number label with white knockout background (readable over cut lines)
- **Cut lines render behind artwork** in Front/Back PDFs; artwork on top
- Hosted on GitHub Pages (auto-deployed via GitHub Actions)

---

## 3. Technology Stack

| Technology | Purpose |
|------------|---------|
| Vite | Development server and production builder |
| Vanilla JavaScript (ES Modules) | Application logic, no framework |
| pdf-lib | Read PDF dimensions, embed PDF pages, create output PDFs, draw vector cut lines |
| pdfjs-dist | Rasterize uploaded PDF pages for canvas preview |
| JSZip | Bundle all 4 PDFs into a single ZIP file |
| file-saver | Trigger browser file downloads |
| HTML5 Canvas | Live preview rendering |
| CSS Custom Properties | Dark theme design system |
| Google Fonts (Inter, JetBrains Mono) | Typography |
| GitHub Actions | Automated build and deploy to GitHub Pages |

---

## 4. Folder Structure

```
infive-print-setup/
├── index.html                  # Main HTML page
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration (base: './' for GitHub Pages)
├── README.md                   # Quick start guide
├── implementation.md           # This file
├── .gitignore                  # Git ignore rules
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions → GitHub Pages auto-deploy
│
├── src/
│   ├── main.js                 # Application entry point & controller
│   │
│   ├── core/                   # Pure calculation modules
│   │   ├── units.js            # Unit conversion (mm, cm, in, pt)
│   │   ├── paper-sizes.js      # Paper presets (A4, A3, SRA3, etc.)
│   │   ├── job-model.js        # Central Job model (single source of truth)
│   │   ├── bleed-trim.js       # Bleed and trim calculations
│   │   ├── layout-engine.js    # Imposition algorithm (max copies)
│   │   ├── duplex-engine.js    # Duplex coordinate transformations
│   │   ├── cut-line-engine.js  # Cut-line path generation (edge-to-edge grid)
│   │   └── validation.js       # Input validation
│   │
│   ├── files/                  # File processing
│   │   ├── file-parser.js      # Unified file parser entry
│   │   ├── pdf-parser.js       # PDF dimension extraction
│   │   └── image-parser.js     # Image dimension & DPI extraction
│   │
│   ├── pdf/                    # PDF output generation
│   │   ├── pdf-generator.js    # Master generator (creates all 4 PDFs)
│   │   ├── artwork-embedder.js # Embeds PDF pages or images at positions
│   │   ├── cut-line-renderer.js# Draws vector cut lines in PDF
│   │   └── label-renderer.js   # Draws order number labels with white knockout
│   │
│   ├── preview/                # Canvas preview
│   │   ├── preview-renderer.js # Main preview renderer (4 views)
│   │   ├── canvas-utils.js     # Canvas coordinate/zoom utilities + label drawing
│   │   └── artwork-preview.js  # Rasterizes uploaded PDF/image for canvas display
│   │
│   ├── download/               # File downloads
│   │   └── download-manager.js # Individual + ZIP downloads
│   │
│   ├── ui/                     # UI components
│   │   └── notifications.js    # Warning/error/success messages
│   │
│   └── styles/
│       └── main.css            # Complete stylesheet (3-column grid layout)
│
└── dist/                       # Production build output (auto-generated)
```

---

## 5. Installation

```bash
cd "Infive Print Setup"
npm install
```

This installs:
- vite (development server)
- pdf-lib (PDF processing)
- pdfjs-dist (PDF preview rasterization)
- jszip (ZIP file creation)
- file-saver (file downloads)

---

## 6. How to Run

**Development mode:**
```bash
npm run dev
```
Opens at http://localhost:3000 (or next available port)

**Production build:**
```bash
npm run build
```
Creates optimized files in the `dist/` folder.

---

## 7. How to Upload Front/Back Artwork

1. Click the **FRONT** upload area or drag-and-drop a file onto it
2. Click the **BACK** upload area or drag-and-drop a file onto it
3. Both areas accept: PDF, PNG, JPG/JPEG
4. After upload, the application shows:
   - Filename
   - Detected dimensions
   - Whether Front/Back dimensions match (only shown when both are uploaded)

> **Either Front or Back can be left empty.** If only one side is uploaded, the other side's PDF will contain cut lines on a blank white page. This supports single-sided jobs or jobs where one side is printed separately.

**Artwork dimension source for layout:**
- If Front is uploaded → Front dimensions are used for layout calculation
- If only Back is uploaded → Back dimensions are used for layout calculation
- If both are uploaded → Front is always the primary size reference

---

## 8. How Units Work

The application uses **PDF points** internally (1 point = 1/72 inch = 0.3528 mm).

The user selects a **display unit** from the dropdown:
- Millimeters (mm)
- Centimeters (cm)
- Inches (in)
- Points (pt)

Changing the display unit converts all visible values but does NOT change any actual dimensions. It only changes how numbers are displayed and entered.

**Conversion factors:**
- 1 inch = 72 points
- 1 inch = 25.4 mm
- 1 inch = 2.54 cm

---

## 9. How Bleed Works

Bleed is the extra area around the artwork that extends beyond the final trim/cut line. It ensures there are no white edges after cutting.

**Default:** 3 mm per side

When the artwork includes bleed, the trim size is:
```
Trim Width  = Artwork Width  - (2 × Bleed)
Trim Height = Artwork Height - (2 × Bleed)
```

**Example:**
- Artwork: 3.75 × 2.25 inches
- Bleed: 3 mm (≈ 0.118 inches)
- Trim: (3.75 − 0.236) × (2.25 − 0.236) = 3.514 × 2.014 inches

The user can change the bleed value. Setting bleed to 0 means the artwork has no extra bleed area.

---

## 10. How Trim Size Works

Trim size is the **final cut size** of each individual piece after cutting.

**Two modes:**

1. **Auto** (default): The application calculates trim size from artwork minus bleed.
2. **Manual**: The user enters the exact trim dimensions.

**Important:** Cut lines are ALWAYS drawn at the trim size, never at the artwork/bleed size.

---

## 11. How Paper Size Works

The application provides these presets:

| Paper | Width × Height (mm) |
|-------|---------------------|
| A5 | 148 × 210 |
| A4 | 210 × 297 |
| A3 | 297 × 420 |
| SRA4 | 225 × 320 |
| SRA3 | 320 × 450 |
| Custom | User-defined |

For **Custom**, the user enters width and height in the selected unit.

---

## 12. Non-Printable Margin

The non-printable margin is the area around the paper edge where most printers cannot print.

**Default:** 5 mm on all four sides

```
Printable Width  = Paper Width  - (2 × Margin)
Printable Height = Paper Height - (2 × Margin)
```

**Example:**
- A3: 297 × 420 mm
- Margin: 5 mm
- Printable area: 287 × 410 mm

Artwork is never placed outside the printable area.

---

## 13. Maximum Copy Calculation

The application calculates how many copies fit on the paper:

```
Available Width  = Paper Width  - (2 × Margin)
Available Height = Paper Height - (2 × Margin)

Columns = floor((Available Width  + Gap) / (Artwork Width  + Gap))
Rows    = floor((Available Height + Gap) / (Artwork Height + Gap))

Total Copies = Columns × Rows
```

The application tests **all four combinations** of paper orientation and artwork rotation to find the arrangement that produces the most copies:
- Paper portrait + artwork normal
- Paper portrait + artwork rotated 90°
- Paper landscape + artwork normal
- Paper landscape + artwork rotated 90°

When **Auto** orientation is selected, the best combination is automatically chosen.

---

## 14. Front/Back Alignment

For double-sided (duplex) printing, Front and Back must be perfectly aligned.

The application calculates ONE layout and applies the SAME positions to both sides. The Back positions are then transformed based on the duplex mode (see section 15).

**Key principle:** The application never independently optimizes Front and Back.

---

## 15. Duplex Handling

When a sheet is flipped for back-side printing, the coordinates must be mirrored.

**Flip on Long Edge:**
- The sheet flips along its longer dimension
- Portrait: coordinates mirror horizontally (left ↔ right)
- Landscape: coordinates mirror vertically (top ↔ bottom)

**Flip on Short Edge:**
- The sheet flips along its shorter dimension
- Portrait: coordinates mirror vertically (top ↔ bottom)
- Landscape: coordinates mirror horizontally (left ↔ right)

The duplex engine is a separate module (`duplex-engine.js`) that takes front positions and returns back positions after the appropriate transformation. It never changes the physical dimensions of the artwork.

---

## 16. Cut-Line Generation

Cut lines mark where each copy should be cut after printing.

**Rules:**
1. Cut lines are at **trim size**, not artwork/bleed size
2. Cut lines are **connected grid lines printing till paper edges** (guillotine cutting grid)
3. Horizontal cut lines are **single lines from left to right paper edge** (`x = 0` to `x = paperWidth`)
4. Vertical cut lines are **single lines from top to bottom paper edge** (`y = 0` to `y = paperHeight`)
5. Cut lines are **vector** (not rasterized)
6. Line width: 0.25 pt (thin technical line)
7. Line color: black (PDF export) / red (preview overlays)

**Future support planned for:**
- Spot color layers
- CutContour (for flatbed cutters)
- Registration color
- Crease lines
- Kiss cut
- Die cut
- Perforation

---

## 17. PDF Generation — Layer Order

The application uses **pdf-lib** to create PDFs. The drawing order matters because elements drawn earlier appear behind elements drawn later.

### Front PDF & Back PDF (artwork + cut lines)

| Draw Order | Layer | Notes |
|---|---|---|
| 1st | Cut lines | Drawn first — behind artwork |
| 2nd | Artwork | Drawn on top of cut lines |
| 3rd | Label (order number) | Always on top; has white knockout background |

This ensures the artwork cleanly covers cut lines in the printable area, matching real-world print expectations.

### Front Cut PDF & Back Cut PDF (cut lines only)

| Draw Order | Layer | Notes |
|---|---|---|
| 1st | Cut lines | Only layer — no artwork |
| 2nd | Label (order number) | With white knockout background |

**Important:** PDF pages are created at the exact selected paper size. An A3 job creates a 297 × 420 mm PDF page. No scaling occurs during export.

---

## 18. Order Number Label

The order number label is printed on every PDF for job identification.

**Behaviour:**
- **Live preview:** Updates in real-time as the user types in the Order Number field — no need to click generate first
- **Position:** Inside the printable area, just inside the top-left margin boundary — outside the artwork grid but NOT at the raw paper edge
- **White knockout background:** A solid white rectangle is drawn behind the label text so that any cut line passing through that position is hidden behind the white box, making the text always clearly readable after printing
- **Font:** Helvetica 5pt (PDF) / bold system sans-serif scaled for legibility (canvas)

**Label text format:**
```
{ORDER_NUMBER}  {SIDE}
```
Examples: `BC-2026-00125  FRONT`, `BC-2026-00125  BACK CUT`

---

## 19. File Naming

All files follow this pattern:

```
{ORDER_NUMBER}-front.pdf
{ORDER_NUMBER}-back.pdf
{ORDER_NUMBER}-front-cut.pdf
{ORDER_NUMBER}-back-cut.pdf
```

Example with order `BC-2026-00125`:
```
BC-2026-00125-front.pdf
BC-2026-00125-back.pdf
BC-2026-00125-front-cut.pdf
BC-2026-00125-back-cut.pdf
```

The ZIP file is named: `{ORDER_NUMBER}-print-files.zip`

---

## 20. Download Workflow

After generating PDFs:

1. Four individual download buttons appear:
   - Download Front PDF
   - Download Back PDF
   - Download Front Cut PDF
   - Download Back Cut PDF
2. A "Download All (ZIP)" button bundles all four into one ZIP file
3. Each button can be clicked independently
4. Files download immediately to the browser's download folder

---

## 21. GitHub Pages Deployment

The application is hosted for free on **GitHub Pages** and auto-deploys on every push to `main`.

**Setup:**
- `vite.config.js` uses `base: './'` for relative asset paths
- `.github/workflows/deploy.yml` runs on every push to `main`:
  1. Checks out the repo
  2. Runs `npm install`
  3. Runs `npm run build`
  4. Publishes the `dist/` folder to the `gh-pages` branch
- GitHub Pages is configured to serve from the `gh-pages` branch

**Live URL:** `https://isuruonline96-hub.github.io/print-production-setup/`

To deploy manually:
```bash
git add -A
git commit -m "your message"
git push origin main
```
GitHub Actions handles the rest automatically within ~2 minutes.

---

## 22. Testing

### Manual Test Case — Business Card

| Setting | Value |
|---------|-------|
| Order | TEST-001 |
| Front | Any PDF at 3.75 × 2.25 in |
| Back | Any PDF at 3.75 × 2.25 in |
| Bleed | 3 mm |
| Paper | A3 |
| Margin | 5 mm |
| Gap | 0 mm |

**Verify:**
1. Both files upload and dimensions are detected
2. Artwork is not resized (100% scale badge shown)
3. Maximum copies calculated correctly
4. Front and Back positions are identical (same layout)
5. Cut lines are at trim size, not artwork size
6. 4 PDFs generated with correct filenames
7. PDF page size is exactly A3 (297 × 420 mm)
8. Cut-only PDFs contain no artwork
9. Order number label appears inside the margin, NOT at the raw paper edge
10. Order number label has a white background (not cut through by grid lines)
11. Order number in preview updates live as you type

### Single-Side Test Case
- Upload only Front artwork, leave Back empty
- Verify: layout calculates, generate button enables, Front PDF has artwork, Back PDF has cut lines only (blank white page with grid)

### Additional Test Scenarios
- Different paper sizes (A4, A5, SRA3, Custom)
- Different units (mm, cm, in, pt)
- Different bleeds (0, 1, 3, 5, custom)
- Gaps between copies (0, 1, 3, 5)
- Different artwork formats (PDF, PNG, JPG)
- Portrait, Landscape, and Auto orientation
- Front and Back same size (should show "Match: YES")
- Front and Back different size (should show warning)
- Artwork too large for paper (should show error)
- Trim larger than artwork (should show error)

---

## 23. Known Limitations

1. **SVG not supported** — SVG dimension detection is unreliable in browsers. SVG support may be added in a future version.
2. **Multi-page PDFs** — Only the first page of a multi-page PDF is used.
3. **Image DPI fallback** — If an image has no DPI metadata, the application assumes 300 DPI and shows a warning.
4. **No server-side processing** — Everything runs in the browser, which limits file size handling.
5. **Cut line style** — Currently only black solid lines. Future versions will support CutContour, spot colors, etc.
6. **Encrypted PDFs** — Password-protected PDFs may not load correctly.

---

## 24. Change Log

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-09-06 | Initial build: layout engine, duplex, PDF generation, canvas preview, 3-column UI |
| v1.1 | 2026-09-06 | Cut lines refactored to connected edge-to-edge grid lines (not discrete rectangles) |
| v1.2 | 2026-09-06 | 3-column layout: Controls ∣ Preview ∣ Results. Actual artwork rendered in preview tabs |
| v1.3 | 2026-09-06 | GitHub Pages deployment configured (Vite base path + Actions workflow) |
| v1.4 | 2026-09-06 | **Cut lines drawn behind artwork** in Front/Back PDFs (layer order swapped) |
| v1.5 | 2026-09-07 | **Optional artwork:** either Front or Back can be empty; generate enabled with one file |
| v1.6 | 2026-09-07 | **Live order number:** preview updates on every keystroke |
| v1.6 | 2026-09-07 | **Label repositioned** inside printable area (not at raw paper edge) |
| v1.6 | 2026-09-07 | **White knockout background** on label so cut lines don't obscure order number |
| v1.7 | 2026-09-07 | **Artwork remove button:** ✕ button on each upload area to clear a file without refreshing |

---

## 25. Future Improvements

1. SVG artwork support
2. Multi-page PDF handling
3. CutContour and spot color support for professional cutters
4. Step-and-repeat with variable data
5. Crease, kiss-cut, and perforation line types
6. Save/load job configurations
7. Job history and templates
8. Batch processing multiple orders
9. Custom cut-line colors and widths
10. Grip edge / gripper margin handling
11. Registration marks and color bars
12. Preflight checks (color space, resolution warnings)
13. Per-side artwork size override (different trim for front vs. back)
