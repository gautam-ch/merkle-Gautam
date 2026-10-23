# Orders Explorer

An internal tool for browsing ~50,000 order records with a custom virtualized grid and filter builder.

## How to run

```bash
# Node 24 required
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

To build for production:

```bash
pnpm build
pnpm preview
```

## Screenshots

> **Main screen — with data**

![Main screen](design/screenshot-main.png)

> **Empty state — filter matches zero rows**

![Empty state](design/screenshot-empty.png)

---

## Dependencies

Every runtime dependency added beyond the Vite template:

| Package | Why |
|---------|-----|
| `react-router-dom` | URL state sync — filter, sort, pinned column and selection survive refresh and tab copy |
| `zustand` | Lightweight global store for grid/filter state without Redux boilerplate |
| `date-fns` | Parses all 4 `createdAt` formats (ISO-TZ, ISO-no-TZ, epoch-seconds, DD/MM/YYYY) reliably |
| `lucide-react` | Icon pack — sort arrows, close chips, pin icon, export button |
| `clsx` | Conditional className utility for clean component variants |
| `tailwindcss` | Utility-first CSS for layout and spacing |
| `@radix-ui/*` | Accessible headless primitives used by Shadcn components |

> No table, grid, virtualization, or query-builder library was used. The grid and filter builder are written from scratch.

---

## Data loading

`orders.json` (~17 MB) lives in `public/` and is loaded with `fetch('/orders.json')` at runtime — not bundled by Vite.

**Why:** Importing a 17 MB JSON as a static module forces Vite to bundle it into the JS chunk, which blocks the browser on parse before the app can even render. Serving from `public/` allows async fetch and browser caching on repeat visits.

All parsing and normalization runs inside a **Web Worker** (`src/workers/data.worker.ts`). This keeps JSON.parse (which takes ~1–2 s for 17 MB) off the main thread so the UI stays responsive during load.

After the worker posts back the normalized array, it is stored once in Zustand. Filtering and sorting are derived with `useMemo` — the source array is never mutated.

---

## The 200-rows question

**Choice: export only the rows that are both selected AND currently visible after filtering.**

If 200 rows are selected and a filter hides 180 of them, the export contains **20 rows**.

**Why:** The filter is the user's intent. If they narrowed down the view, they almost certainly want to work with what they can see. Exporting hidden rows would be surprising and hard to predict. The selection count shown on screen always reflects the current filter, so it always matches the CSV exactly.

---

## Design changes

_Updated as the build progresses. See `design/` for the original wireframes._

---

## Known issues

_Updated honestly as the build progresses._
