# Studio Implementation Plan

## What this adds

A `/studio` section where any logged-in user can compose and publish their own colouring books — uploading illustrations, defining animated elements visually, setting per-page colouring thresholds, and controlling public/private visibility.

---

## Manual step required before implementation can run

### Run migration 002 in the Supabase SQL Editor

Open Supabase → SQL Editor → paste the entire contents of `supabase/migrations/002_studio.sql` and run it.

This migration:
- Adds `author_id`, `is_public`, `status` columns to `books`
- Adds `completion_threshold` and `page_title` columns to `pages`
- Replaces the old blanket-read RLS policies with author-aware ones
- Creates the `book-assets` Storage bucket with RLS policies baked in
- Marks the existing placeholder book as published/public so it keeps appearing

---

## Routes

| Route | What it shows |
|---|---|
| `/studio` | Dashboard: user's own books (draft + published) |
| `/studio/[bookId]` | Book editor: metadata panel + page list |
| `/studio/[bookId]/pages/[pageId]` | Page editor: upload, regions, threshold |

A **"Studio"** button in the Library header takes authors there.

---

## Files to create

### Database & storage
```
supabase/migrations/002_studio.sql          ← already written
```

### Routes (server components, auth-gated by existing (app) layout)
```
src/app/(app)/studio/page.tsx
src/app/(app)/studio/[bookId]/page.tsx
src/app/(app)/studio/[bookId]/pages/[pageId]/page.tsx
```

### Components
```
src/components/studio/StudioDashboard.tsx        — grid of user's books + "New book" CTA
src/components/studio/NewBookModal.tsx           — inline modal: title, cover, visibility
src/components/studio/BookEditor.tsx             — two-panel: metadata left, page list right
src/components/studio/PageList.tsx               — ordered page thumbnails, add/remove/reorder
src/components/studio/PageEditor.tsx             — three-panel page composition view
src/components/studio/IllustrationUploader.tsx   — drag/drop upload → Supabase Storage
src/components/studio/ElementRegionEditor.tsx    — canvas overlay: draw bboxes, assign animations
src/components/studio/PageSettingsPanel.tsx      — threshold slider, page title input
```

### Hooks
```
src/hooks/useMyBooks.ts          — CRUD for user's authored books
src/hooks/useBookPages.ts        — fetch + mutate pages within a book
```

### Utilities
```
src/lib/storage/bookAssets.ts    — typed wrappers around Supabase Storage upload/URL
```

---

## Files to modify

| File | Change |
|---|---|
| `src/hooks/useLibrary.ts` | Filter to `is_public = true AND status = 'published'` (RLS enforces it, but query should be explicit) |
| `src/components/library/BookshelfView.tsx` | Add "Studio →" button in header |

---

## Component detail

### StudioDashboard
- Grid of `BookCard`-style tiles, each showing title, cover, status badge (Draft / Published), page count
- Primary "Create a book" button — opens `NewBookModal`
- Clicking a book card navigates to `/studio/[bookId]`

### NewBookModal
- Title (required), description (optional)
- Cover image upload (optional at creation — can add later)
- Public / Private toggle (defaults private)
- On submit: `INSERT INTO books` → redirect to `/studio/[bookId]`

### BookEditor (two-panel)
**Left — page list (`PageList`)**
- Vertical list of pages with thumbnail + page number
- Up/down arrow buttons to reorder (updates `page_number` in batch)
- Trash button with confirmation popover to delete
- "+ Add page" footer button — creates blank page row, navigates to its page editor

**Right — metadata panel**
- Editable: title, description, cover image (upload)
- Public / Private toggle
- Save draft button
- Publish button (disabled if no pages have an `outline_url`)
- "Preview book" link → opens `/colouring/[bookId]/[firstPageId]` in new tab

### PageEditor (three-panel)
**Left — IllustrationUploader**
- Large drop zone or click-to-browse
- Accepts PNG, SVG, JPG/WEBP (max 10 MB)
- On upload: sends to Supabase Storage at `{userId}/{bookId}/pages/{pageId}/outline.{ext}`, updates `pages.outline_url`
- Shows preview once uploaded; "Replace" button to swap

**Centre — ElementRegionEditor**
- Renders the uploaded illustration (or placeholder grid if none yet)
- Canvas overlay for drawing/editing bounding boxes
- Toolbar: **Draw** mode (click-drag to create box) / **Select** mode (click to select, drag to move, corner handles to resize)
- Selected region sidebar: name input + animation dropdown (`none | spin | float | bounce | wagTail`)
- Delete button for selected region
- "No animated elements" is fine — save an empty elements array
- On every change: serialises JSON → uploads to Storage → updates `pages.animatable_elements_url`

**Right — PageSettingsPanel**
- **Colouring threshold** slider: 0 – 100 % with live numeric label
  - "Children must colour X% of this page to unlock the next one"
  - 0 % = no gating (useful for last pages)
- **Page title** text input (optional, shows in nav bar)
- Auto-saves to Supabase on blur / slider release

### IllustrationUploader implementation notes
- Uses `<input type="file">` under a styled drop zone (`dragover` → highlight border)
- On file select: `supabase.storage.from('book-assets').upload(path, file, { upsert: true })`
- Then `supabase.storage.from('book-assets').getPublicUrl(path)` ... actually bucket is private, so use `.createSignedUrl(path, 3600)` OR switch to public bucket if illustrations are not sensitive (they aren't)
- Simplest: make `book-assets` bucket **public** for reads (so `outline_url` is a plain CDN URL the PixiJS engine can load without auth headers). Storage RLS still controls writes.

### ElementRegionEditor implementation notes
- Single `<canvas>` element, positioned absolute over an `<img>` showing the illustration
- `useRef` for canvas, `useState` for `regions: Region[]` and `mode: 'draw' | 'select'`
- `useEffect` redraws canvas (clear → draw all region rects → draw handles on selected) whenever `regions` or selection changes
- Mouse events: `onMouseDown` / `onMouseMove` / `onMouseUp` for draw mode; hit-test existing rects for select mode
- Touch support: translate `TouchEvent` coordinates to match mouse handlers
- Region type:
  ```ts
  interface Region {
    id: string;
    label: string;
    x: number; y: number; w: number; h: number;
    animation: 'none' | 'spin' | 'float' | 'bounce' | 'wagTail';
  }
  ```
- Coordinates stored as fractions of image dimensions (0–1) so they're resolution-independent

---

## Data flow summary

```
Author uploads illustration
  → Supabase Storage (book-assets/{uid}/{bookId}/pages/{pageId}/outline.png)
  → pages.outline_url = signed CDN URL

Author draws element regions
  → serialised to animatable_elements.json client-side
  → uploaded to Storage (.../elements.json)
  → pages.animatable_elements_url = signed CDN URL

Author sets threshold
  → PATCH pages SET completion_threshold = 0.75

Author publishes book
  → PATCH books SET status = 'published', is_public = true/false

Library query (useLibrary)
  → SELECT books WHERE is_public = true AND status = 'published'
  → RLS double-enforces this

Studio query (useMyBooks)
  → SELECT books WHERE author_id = me (all statuses)
```

---

## Implementation order

1. **Hooks + storage utility** (`useMyBooks`, `useBookPages`, `bookAssets.ts`)
2. **Studio dashboard** (`/studio` + `StudioDashboard` + `NewBookModal`)
3. **Book editor** (`/studio/[bookId]` + `BookEditor` + `PageList`)
4. **Illustration uploader** (`IllustrationUploader` — Storage plumbing)
5. **Element region editor** (`ElementRegionEditor` — most complex, canvas interaction)
6. **Page settings panel** (`PageSettingsPanel`)
7. **Page editor assembly** (`PageEditor` pulling the three components together)
8. **Library update** (`useLibrary` filter + "Studio →" button)

---

## What the user needs to do before this works

**Only one thing: run the SQL migration.**

Paste `supabase/migrations/002_studio.sql` into Supabase → SQL Editor → Run.

Everything else (bucket creation, RLS, schema changes) is in that file.
