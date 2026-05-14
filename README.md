# Coloring Books — Phygital Kids Coloring Platform

A Progressive Web App for iPad and tablet that bridges digital colouring with physical Print-on-Demand books. Children colour bespoke illustrations using a high-fidelity freehand brush; when a page is complete the artwork animates as a reward. Parents can purchase printed editions of their child's unique colouring through a Stripe → Gelato pipeline.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Architecture](#architecture)
   - [Canvas Engine (PixiJS)](#canvas-engine-pixijs)
   - [Auth & Data (Supabase)](#auth--data-supabase)
   - [Offline-First Storage](#offline-first-storage)
   - [Commerce Pipeline](#commerce-pipeline)
6. [Database Schema](#database-schema)
7. [Supabase Edge Functions](#supabase-edge-functions)
8. [PWA & Tablet Optimisations](#pwa--tablet-optimisations)
9. [CI/CD](#cicd)
10. [Deployment](#deployment)
11. [Development Notes & Gotchas](#development-notes--gotchas)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 16 (App Router) |
| Rendering engine | PixiJS v8 (WebGL/WebGPU) |
| Animation | GSAP 3 |
| Styling | Tailwind CSS v4 |
| Backend / Auth | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Data fetching | TanStack Query v5 |
| Offline cache | idb-keyval (IndexedDB) |
| Payments | Stripe Checkout |
| Print-on-Demand | Gelato API v4 |
| PWA plugin | @ducanh2912/next-pwa v10 |
| CI/CD | GitHub Actions → Vercel |

---

## Project Structure

```
.
├── .github/workflows/deploy.yml   # CI: type-check → lint → Vercel deploy
├── .env.example                   # All required environment variables
├── next.config.ts                 # Next.js + next-pwa configuration
├── public/
│   ├── manifest.json              # PWA manifest (standalone, landscape)
│   ├── icons/                     # icon-192.png, icon-512.png
│   └── assets/placeholder/        # Dev placeholder: outline.png + animatable_elements.json
├── src/
│   ├── proxy.ts                   # Auth middleware (Next.js 16 — replaces middleware.ts)
│   ├── app/
│   │   ├── layout.tsx             # Root layout: Nunito font, PWA meta, AddToHomeScreenModal
│   │   ├── page.tsx               # Redirects → /library or /login
│   │   ├── globals.css            # Base styles, canvas touch handling, tablet media queries
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/                 # Session-guarded layout
│   │   │   ├── layout.tsx         # Auth check + QueryClientProvider
│   │   │   ├── library/page.tsx
│   │   │   └── coloring/[bookId]/[pageId]/page.tsx
│   │   └── api/auth/callback/route.ts  # Supabase PKCE exchange
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── CanvasWrapper.tsx      # "use client" shell for ssr:false dynamic import
│   │   │   ├── ColoringCanvas.tsx     # Palette, brush toolbar, completion overlay
│   │   │   └── useColoringEngine.ts   # PixiJS 4-layer engine, pointer events, GSAP
│   │   ├── library/
│   │   │   ├── BookshelfView.tsx      # Horizontal scroll bookshelf
│   │   │   └── BookCard.tsx           # Book tile with colour/download/print CTAs
│   │   ├── children/
│   │   │   └── ChildProfileSelector.tsx  # Avatar selector + add-child modal
│   │   └── ui/
│   │       ├── Providers.tsx          # TanStack Query provider + IndexedDB persister
│   │       └── AddToHomeScreenModal.tsx  # iOS Safari A2HS onboarding
│   ├── hooks/
│   │   ├── useLibrary.ts             # Fetch parent's purchased books
│   │   ├── useChildren.ts            # CRUD child profiles
│   │   └── useSavedPage.ts           # Read/write per-child coloring state
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # createBrowserClient factory
│   │   │   └── server.ts             # createServerClient (async cookies)
│   │   ├── pixi/
│   │   │   ├── catmullRom.ts         # Catmull-Rom → cubic Bézier conversion
│   │   │   └── completionDetector.ts # Alpha-channel fill percentage sampler
│   │   ├── idb/
│   │   │   └── assetCache.ts         # IndexedDB asset blob store
│   │   └── query/
│   │       └── queryClient.ts        # Singleton QueryClient + localStorage persister
│   └── types/
│       ├── database.ts               # Hand-authored Supabase Database interface
│       └── coloring.ts               # Domain types: AnimatableElement, PageConfig, etc.
└── supabase/
    ├── migrations/001_initial_schema.sql
    └── functions/
        ├── create-checkout-session/index.ts
        └── stripe-webhook/index.ts
```

---

## Getting Started

### Prerequisites

- Node.js 22
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (test mode is fine)
- A [Gelato](https://gelato.com) account (required only for physical print orders)
- [Vercel CLI](https://vercel.com/docs/cli) (required for CI/CD; optional for local dev)

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/coloring-books.git
cd coloring-books
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in every value — see Environment Variables below
```

### 3. Apply the database schema

```bash
npx supabase login
npx supabase link --project-ref <your-project-id>
npx supabase db push
```

This runs `supabase/migrations/001_initial_schema.sql`, which creates all tables, RLS policies, indexes, and seeds one placeholder book for development.

### 4. Deploy Edge Functions

```bash
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
```

Set the required secrets on the functions:

```bash
npx supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  GELATO_API_KEY=... \
  GELATO_BOOK_SKU=photobook_softcover_a4_portrait \
  NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 5. Configure the Stripe webhook

In the [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks), add an endpoint:

```
https://<supabase-project>.supabase.co/functions/v1/stripe-webhook
```

Enable the event: `checkout.session.completed`

Copy the signing secret into your Supabase secrets as `STRIPE_WEBHOOK_SECRET`.

### 6. Run the development server

```bash
npm run dev
# → http://localhost:3000
```

> The `--webpack` flag is included automatically in the `dev` script (see [Development Notes](#development-notes--gotchas)).

---

## Environment Variables

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (keep secret) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys (keep secret) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → signing secret |
| `GELATO_API_KEY` | Gelato Dashboard → Account → API |
| `GELATO_BOOK_SKU` | Gelato product catalog (default: `photobook_softcover_a4_portrait`) |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (e.g. `https://yourapp.vercel.app`) |

Variables prefixed `NEXT_PUBLIC_` are exposed to the browser. All others are server-only and must **never** be committed.

---

## Architecture

### Canvas Engine (PixiJS)

The colouring experience lives in `src/components/canvas/`. PixiJS v8 must not be server-rendered; every import is inside an async `useEffect` IIFE and the component is loaded via `dynamic(..., { ssr: false })`.

#### Four-layer stage

| Z-Index | Layer | Purpose |
|---|---|---|
| 1 | Background | Solid white `PIXI.Graphics` fill |
| 2 | Drawing | `PIXI.Sprite` backed by a `RenderTexture` — accumulates strokes |
| 3 | Outline | Transparent PNG of the illustration outline |
| 4 | Animation | Transient GSAP-driven indicator sprites for the completion effect |

#### Stroke accumulation (memory-safe)

A single `PIXI.Graphics` object (`drawGfx`) is used as a "brush" — it is **never** added to the stage. After each stroke segment is drawn into `drawGfx`, it is composited into the `RenderTexture` via:

```ts
app.renderer.render({ container: drawGfx, target: drawRT, clear: false });
drawGfx.clear();
```

This keeps memory constant regardless of how many strokes the child makes.

#### Catmull-Rom spline smoothing (`src/lib/pixi/catmullRom.ts`)

Raw pointer coordinates are passed through a Catmull-Rom → cubic Bézier conversion before being drawn. This eliminates the jagged appearance of fast strokes. The function `catmullRomToBezier(p0, p1, p2, p3)` returns `{ start, cp1, cp2, end }` which maps directly to `Graphics.bezierCurveTo()`.

The engine buffers the last 4 pointer positions. One segment is lagged (drawn P1→P2 once P3 arrives) so every interior segment has accurate tangents. `flushBuffer()` handles the tail segments on `pointerup`, synthesising phantom endpoints via `mirrorPoint()`.

#### Pressure sensitivity

```ts
const easedPressure = Math.pow(rawPressure, 0.7);  // compress the range
const lineWidth = baseBrushWidth * (0.3 + easedPressure * 0.7);
```

Works with Apple Pencil, Android Stylus, and falls back to `0.5` for mouse/finger.

#### Completion detection (`src/lib/pixi/completionDetector.ts`)

On every `pointerup`, `renderer.extract.pixels({ target: drawSprite })` returns a `Uint8ClampedArray`. Every 4th pixel's alpha channel is sampled. When non-transparent pixels exceed 85% of the total sample, `onComplete` fires and the GSAP animation sequence begins.

Supported animation types: `wagTail`, `bounce`, `float`, `spin`, `pulse`.

#### Auto-save

The drawing layer is serialised to a PNG blob every 30 seconds via `renderer.extract.base64({ target: drawSprite })`. The blob is passed to `onSave(blob, fillPercentage)`, which stores it in IndexedDB and queues an async sync to Supabase Storage.

---

### Auth & Data (Supabase)

Authentication uses `@supabase/ssr` throughout.

| File | Role |
|---|---|
| `src/lib/supabase/client.ts` | `createBrowserClient()` factory — called inside event handlers only, never at module scope |
| `src/lib/supabase/server.ts` | Async `createServerClient()` using `await cookies()` from `next/headers` |
| `src/proxy.ts` | Next.js 16 auth middleware — refreshes the session cookie on every request, redirects unauthenticated users to `/login` |

When a new user signs up, a database trigger (`handle_new_user`) automatically inserts a row into `public.profiles`.

**Auth model:** A parent creates one Supabase account. Child profiles (`public.children`) are sub-records owned by the parent. All colouring progress is isolated per child.

---

### Offline-First Storage

#### TanStack Query (`src/lib/query/queryClient.ts`)

Library and child data is cached via `createSyncStoragePersister` to `localStorage` key `"cb-query-cache"`. The cache is hydrated on page load, so the library is available even with no network.

#### IndexedDB asset cache (`src/lib/idb/assetCache.ts`)

| Function | Description |
|---|---|
| `cacheBookAssets(pages)` | Downloads outline PNGs and animatable JSON blobs into IndexedDB |
| `getCachedAsset(url)` | Returns an `Object URL` from IndexedDB, or `null` on miss |
| `saveColoredPage(childId, pageId, blob)` | Persists the drawing PNG locally |
| `loadColoredPage(childId, pageId)` | Retrieves the PNG blob; used to restore progress on re-open |

When the canvas loads, it checks `loadColoredPage` first. If a blob exists it is rendered into the `RenderTexture` before the child can draw. The async Supabase sync happens in the background.

---

### Commerce Pipeline

```
Parent clicks "Print"
        │
        ▼
POST /functions/v1/create-checkout-session
  { bookId, type: "physical", childId }
        │
        ▼
Stripe Checkout (shipping address collected)
        │
        ▼  checkout.session.completed webhook
POST /functions/v1/stripe-webhook
        │
        ├─ type === "digital" → upsert user_libraries
        │
        └─ type === "physical"
              │
              ├─ Fetch child's colored_image_url rows from user_saved_pages
              └─ POST https://order.gelatoapis.com/v4/orders
```

The Stripe `payment_intent.metadata` carries `{ bookId, parentId, type, childId? }`. This is verified server-side inside the webhook before any DB or Gelato operations are performed.

---

## Database Schema

Six tables with Row-Level Security enabled on all of them.

```sql
profiles          (id, email, created_at)
  └── 1:1 with auth.users via trigger

children          (id, parent_id→profiles, name, avatar_color, created_at)

books             (id, title, description, cover_image_url,
                   price_digital_cents, price_physical_cents,
                   page_count, created_at)

pages             (id, book_id→books, page_number,
                   outline_url, animatable_elements_url, created_at)

user_libraries    (id, parent_id→profiles, book_id→books, purchased_at)
  UNIQUE (parent_id, book_id)

user_saved_pages  (id, child_id→children, page_id→pages,
                   colored_image_url, fill_percentage,
                   completed_at, updated_at)
  UNIQUE (child_id, page_id)
```

**RLS summary:**
- `profiles` / `children` / `user_libraries`: only accessible by `auth.uid() = parent_id`
- `books` / `pages`: readable by any authenticated user (the catalogue is public)
- `user_saved_pages`: accessible if `auth.uid()` owns the row's `child_id`

The migration also seeds one placeholder book (`Cockapoo's Big Adventure`) pointing to the local placeholder assets.

---

## Supabase Edge Functions

Both functions are Deno-based and live in `supabase/functions/`.

### `create-checkout-session`

Creates a Stripe Checkout session for a digital or physical purchase.

**Request body:**
```json
{ "bookId": "uuid", "type": "digital|physical", "childId": "uuid (physical only)" }
```

**Response:**
```json
{ "url": "https://checkout.stripe.com/..." }
```

The function authenticates the caller via the `Authorization: Bearer <jwt>` header, fetches book pricing from the database, and embeds `{ bookId, parentId, type, childId? }` in `payment_intent_data.metadata`. Physical orders additionally request a shipping address in the Stripe session.

### `stripe-webhook`

Verifies the `stripe-signature` header before processing. Only handles `checkout.session.completed`.

- **Digital:** upserts a row into `user_libraries` with `onConflict: "parent_id,book_id"` (idempotent)
- **Physical:** fetches all `user_saved_pages` for the child, builds a Gelato order with `colored_image_url` entries as file attachments, and POSTs to `https://order.gelatoapis.com/v4/orders`

---

## PWA & Tablet Optimisations

### manifest.json

```json
{
  "display": "standalone",
  "orientation": "landscape",
  "theme_color": "#FF6B6B",
  "background_color": "#fff9f0"
}
```

### CSS (`src/app/globals.css`)

| Rule | Purpose |
|---|---|
| `html, body { overflow: hidden; overscroll-behavior: none }` | Prevents bounce/scroll outside the drawing canvas |
| `.canvas-container { touch-action: none }` | Routes all pointer events to PixiJS; prevents Safari zoom/scroll during drawing |
| `@media (display-mode: standalone) { height: 100dvh }` | Fills the full viewport when running as an installed PWA |
| `@media (min-width: 768px) and (orientation: portrait)` | Soft landscape rotation reminder via `body::before` |
| `env(safe-area-inset-left/right)` | Padding for notched iPads in landscape |

### iOS "Add to Home Screen" modal

`src/components/ui/AddToHomeScreenModal.tsx` detects iOS Safari non-standalone mode and shows step-by-step installation instructions 2 seconds after first load. Dismissal is persisted in `localStorage["cb:a2hs-dismissed"]`.

---

## CI/CD

`.github/workflows/deploy.yml` runs on every push to `main` and on PRs targeting `main`.

| Step | Command |
|---|---|
| Install | `npm ci` |
| Type check | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Build | `vercel build --prod` |
| Deploy | `vercel deploy --prebuilt --prod` |

PRs get a Vercel preview deployment (without `--prod`).

**Required GitHub secrets:**

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Personal access token from vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after running `vercel link` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` after running `vercel link` |

Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, etc.) are pulled from Vercel during the `vercel pull` step — configure them once in the Vercel dashboard rather than as GitHub secrets.

---

## Deployment

### First-time Vercel setup

```bash
npm install -g vercel
vercel login
vercel link          # creates .vercel/project.json
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... repeat for all variables in .env.example
```

### Vercel project settings

- **Framework preset:** Next.js
- **Build command:** `npm run build` (invokes `next build --webpack`)
- **Install command:** `npm ci`

---

## Development Notes & Gotchas

### `--webpack` flag is required

`@ducanh2912/next-pwa` injects webpack plugins. Next.js 16 defaults to Turbopack, which is incompatible. Both `dev` and `build` scripts include `--webpack`.

### `src/proxy.ts` not `src/middleware.ts`

Next.js 16 renamed the middleware file convention. Auth session refresh and route guards live in `src/proxy.ts` and export `async function proxy(...)`. Having both files causes a build error.

### PixiJS SSR avoidance

All PixiJS imports are dynamic (`await import("pixi.js")` inside `useEffect`). The `ColoringCanvas` component is wrapped by `CanvasWrapper.tsx`, which is a `"use client"` file — this is the only place that `dynamic(..., { ssr: false })` is legal under Next.js 16.

### Supabase browser client instantiation

`createBrowserClient()` must be called **inside** event handlers (e.g. `handleLogin`), not at component top-level. Calling it at module scope causes a server-side pre-render error because the env vars are not available during SSR.

### `supabase/` excluded from TypeScript

Deno Edge Functions use URL-based imports (`https://deno.land/...`) that the Node.js TypeScript compiler cannot resolve. The `supabase/` directory is excluded in `tsconfig.json`.

### Async PixiJS init cancellation guard

The PixiJS application is initialised inside an `async` IIFE. A `cancelled` boolean flag is set by the `useEffect` cleanup function. Every `await` inside the IIFE checks `if (cancelled) return` to prevent operating on an unmounted component.

### RenderTexture stroke accumulation

`drawGfx` (the Graphics brush object) is **never added to the stage**. After each stroke is drawn into it, it is composited into `drawRT` with `clear: false`, then cleared. Accumulating Graphics objects on stage causes memory to grow unboundedly — this pattern keeps the heap constant.
