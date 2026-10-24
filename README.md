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

Every runtime dependency added beyond the Vite React template:

| Package | Why |
|---------|-----|
| `lucide-react` | Lightweight icon pack for sorting indicators, pin toggles, filter controls, and action buttons |
| `clsx` | Utility for constructing conditional className strings |
| `class-variance-authority` | Type-safe styling variants for UI components (badges, buttons, sheet) |
| `radix-ui` | Accessible headless primitives for the slide-in order details drawer |

> **Zero Phantom Dependencies:** URL synchronization is implemented using native `window.history` and `URLSearchParams` (`useUrlState.ts`). Date parsing across all 4 formats uses a custom zero-dependency parser (`normalize.ts`). State management is handled with standard React hooks (`useState`, `useMemo`, `useCallback`). No table, grid, virtualization, or query-builder library was used.

---

## Data loading

`orders.json` (~17 MB) lives in `public/` and is loaded with `fetch('/orders.json')` at runtime — not bundled by Vite.

**Why:** Importing a 17 MB JSON as a static module forces Vite to bundle it into the JS chunk, which blocks the browser on parse before the app can even render. Serving from `public/` allows async fetch and browser caching on repeat visits.

All parsing and normalization runs inside a **Web Worker** (`src/workers/data.worker.ts`). This keeps JSON.parse (which takes ~1–2 s for 17 MB) off the main thread so the UI stays responsive during load.

After the worker posts back the normalized array, it is held once in React state (`useOrders`) and cached in IndexedDB. Filtering and sorting are derived with `useMemo` — the source array is never mutated.

---

## The 200-rows question

**Choice: export only the rows that are both selected AND currently visible after filtering.**

If 200 rows are selected and a filter hides 180 of them, the export contains **20 rows**.

**Why:** The filter is the user's intent. If they narrowed down the view, they almost certainly want to work with what they can see. Exporting hidden rows would be surprising and hard to predict. The selection count shown on screen always reflects the current filter, so it always matches the CSV exactly.

---

## Design changes

1. **Integrated Filter Chips above Grid:** While the sidebar query builder acts as the primary rule builder, adding dynamic chips above the grid gives users instant visibility into all active conditions with 1-click removal.
2. **In-Header Quick Filters:** Directly below each column header, quick search inputs were implemented to complement the sidebar query builder for rapid single-column filtering without modal interactions.
3. **Slideout Detail Drawer:** Chosen over an inline expandable row to keep virtual scroll math strictly constant ($40\text{px}$ O(1) row height) without dynamic height recalculations.
4. **IndexedDB Transparent Caching:** Added local persistence so subsequent app reloads are instant without re-downloading and re-parsing the 17 MB file.

---

## Known issues

1. **Private Browsing Mode:** IndexedDB caching gracefully degrades to in-memory Web Worker processing if storage quotas or third-party storage are restricted.
2. **Very Rapid Trackpad Flinging:** When flicking the scroll wheel at extreme velocity across 50,000 rows, a microsecond frame delay can occur before the overscan buffer fills; mitigated by setting overscan to 5 rows and using CSS transforms.
