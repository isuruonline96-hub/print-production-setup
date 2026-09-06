# Infive Print Setup — Implementation Documentation

## 1. Project Overview

Infive Print Setup is a browser-based print imposition and cut file generator for printing shops. It takes front and back artwork files, arranges them optimally on a paper sheet, and generates four PDF files: front layout, back layout, front cutting guide, and back cutting guide.

The application runs entirely in the browser. No artwork is ever sent to a server.

---

## 2. Features

- Upload Front and Back artwork (PDF, PNG, JPG)
- Automatic artwork dimension detection
- Configurable bleed, trim size, paper, margin, and gap
- Auto/manual trim calculation
- Paper presets: A5, A4, A3, SRA4, SRA3, Custom
- Portrait, Landscape, and Auto orientation
- Automatic maximum-copy calculation
- Front/Back positional alignment for duplex printing
- Duplex modes: Flip on Long Edge, Flip on Short Edge
- Optimized vector cut-line generation
- Live canvas preview with 4 views (Front, Back, Front Cut, Back Cut)
- Zoom controls (In, Out, Fit, 100%)
- Generates 4 separate PDFs per job
- Individual downloads + Download All as ZIP
- Artwork is never resized (always 100% scale)
- Validation and error messages
- Order number in every PDF

---

## 3. Technology Stack

| Technology | Purpose |
|------------|---------|
| Vite | Development server and production builder |
| Vanilla JavaScript (ES Modules) | Application logic, no framework |
| pdf-lib | Read PDF dimensions, embed PDF pages, create output PDFs, draw vector cut lines |
| JSZip | Bundle all 4 PDFs into a single ZIP file |
| file-saver | Trigger browser file downloads |
| HTML5 Canvas | Live preview rendering |
| CSS Custom Properties | Dark theme design system |
| Google Fonts (Inter, JetBrains Mono) | Typography |

---

## 4. Folder Structure

```
infive-print-setup/
├── index.html                  # Main HTML page
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration
├── README.md                   # Quick start guide
├── implementation.md           # This file
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
│   │   ├── cut-line-engine.js  # Cut-line path generation
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
│   │   └── label-renderer.js   # Draws order number labels
│   │
│   ├── preview/                # Canvas preview
│   │   ├── preview-renderer.js # Main preview renderer
│   │   └── canvas-utils.js     # Canvas coordinate/zoom utilities
│   │
│   ├── download/               # File downloads
│   │   └── download-manager.js # Individual + ZIP downloads
│   │
│   ├── ui/                     # UI components
│   │   └── notifications.js    # Warning/error/success messages
│   │
│   └── styles/
│       └── main.css            # Complete stylesheet
│
└── dist/                       # Production build output
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
- jszip (ZIP file creation)
- file-saver (file downloads)

---

## 6. How to Run

**Development mode:**
```bash
npm run dev
```
Opens at http://localhost:3000

**Production build:**
```bash
npm run build
```
Creates optimized files in the `dist/` folder.

---

## 7. How to Upload Front/Back

1. Click the **FRONT** upload area or drag-and-drop a file onto it
2. Click the **BACK** upload area or drag-and-drop a file onto it
3. Both areas accept: PDF, PNG, JPG/JPEG
4. After upload, the application shows:
   - Filename
   - Detected dimensions
   - Whether Front/Back match

**Important:** Both front and back files are required to generate PDFs.

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
- Trim: 3.75 - 0.236 × 2.25 - 0.236 = 3.514 × 2.014 inches

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

Columns = floor((Available Width + Gap) / (Artwork Width + Gap))
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

## 17. PDF Generation

The application uses **pdf-lib** to create PDFs:

1. **Front PDF:** Creates a new PDF with the exact paper size, embeds front artwork at all positions, draws cut lines on top, adds order number label.

2. **Back PDF:** Same process with back artwork at duplex-transformed positions.

3. **Front Cut PDF:** Creates a new PDF with exact paper size, draws ONLY cut lines. No artwork, no images, no design content.

4. **Back Cut PDF:** Same as front cut but with back-side cut line positions.

**Important:** PDF pages are created at the exact selected paper size. An A3 job creates a 297 × 420 mm PDF page. No scaling occurs during export.

---

## 18. File Naming

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

## 19. Download Workflow

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

## 20. Testing

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
9. Order number appears in top-left corner

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

## 21. Known Limitations

1. **SVG not supported** — SVG dimension detection is unreliable in browsers. SVG support may be added in a future version.
2. **Multi-page PDFs** — Only the first page of a multi-page PDF is used.
3. **Image DPI fallback** — If an image has no DPI metadata, the application assumes 300 DPI and shows a warning.
4. **No server-side processing** — Everything runs in the browser, which limits file size handling.
5. **Cut line style** — Currently only black solid lines. Future versions will support CutContour, spot colors, etc.
6. **Encrypted PDFs** — Password-protected PDFs may not load correctly.

---

## 22. Future Improvements

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
