# Infive Print Setup

**Professional Print Imposition & Cut File Generator**

A browser-based tool that generates print-ready layout PDFs and cutting guide files for double-sided (duplex) printing jobs.

---

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Run

```bash
npm run dev
```

### 3. Open

Go to **http://localhost:3000** in your web browser (Chrome or Firefox recommended).

### 4. Use

1. **Enter an Order Number** (e.g. `BC-2026-00125`)
2. **Upload Front artwork** — click the Front upload area and select a PDF, PNG, or JPG file
3. **Upload Back artwork** — click the Back upload area and select a PDF, PNG, or JPG file
4. **Verify artwork dimensions** — the application detects the sizes automatically
5. **Set Bleed** — default is 3 mm (change if needed)
6. **Set Paper** — choose A4, A3, SRA3, or any paper size
7. **Click "Generate PDFs"**
8. **Download your files** — 4 separate PDFs + a ZIP of all

---

## What It Generates

For every job, the application creates **4 PDF files**:

| File | Contains |
|------|----------|
| `{ORDER}-front.pdf` | Front artwork copies + cut lines |
| `{ORDER}-back.pdf` | Back artwork copies + cut lines |
| `{ORDER}-front-cut.pdf` | Cut lines ONLY (no artwork) |
| `{ORDER}-back-cut.pdf` | Cut lines ONLY (no artwork) |

---

## Key Features

- **Automatic dimension detection** from PDF, PNG, and JPG files
- **Never resizes artwork** — always places at 100% original size
- **Maximum copy calculation** — automatically finds the best layout
- **Front/Back alignment** — identical positions for duplex printing
- **Duplex support** — Flip on Long Edge or Short Edge
- **Paper presets** — A3, A4, A5, SRA3, SRA4, Custom
- **Auto orientation** — tests all orientations to maximize copies
- **Vector cut lines** — thin, precise cutting guides
- **Live preview** — see your layout before generating
- **100% client-side** — no artwork is uploaded to any server

---

## Supported Artwork Formats

- **PDF** — dimensions read from page MediaBox (vector preserved)
- **PNG** — physical size from pHYs DPI metadata
- **JPG/JPEG** — physical size from EXIF/JFIF DPI metadata

---

## Technology

- **Vite** — build tool and dev server
- **pdf-lib** — PDF reading, writing, and page embedding
- **JSZip** — ZIP file creation for "Download All"
- **Vanilla JavaScript** — no framework required

---

## Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder. Serve it with any static file server.
