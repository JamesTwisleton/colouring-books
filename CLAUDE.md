# Project Specification: "Phygital" Kids Coloring Book Platform

## 1. Project Overview
A Progressive Web App (PWA) designed primarily for iPad/Tablet form factors that bridges digital coloring with physical Print-on-Demand (POD) products. The platform allows children to color bespoke illustrations using a high-fidelity freehand digital brush. Upon completing a page, components of the illustration animate as a reward. Parents can manage a digital library of these books and purchase physical, printed versions of their child's uniquely colored books.

The goal is to provide a highly optimized, native-feeling tablet experience in the browser, capable of offline play, with an automated pipeline from a Next.js frontend to a Stripe/Gelato POD backend.

## 2. Tech Stack Definition
*   **Frontend Framework:** Next.js (App Router) - PWA configured via `next-pwa` or custom manifest/service workers.
*   **Graphics & Rendering Engine:** PixiJS v8 (WebGL/WebGPU) for performant canvas manipulation.
*   **Animation Engine:** GSAP for declarative component animations upon page completion.
*   **Backend & Authentication:** Supabase (PostgreSQL, Auth, Edge Functions, Storage).
*   **State Management & Data Fetching:** TanStack Query (React Query) with IndexedDB for offline library caching.
*   **Payments & Commerce:** Stripe Checkout.
*   **Print-on-Demand API:** Gelato Node.js SDK.
*   **CI/CD:** GitHub Actions deploying to Vercel.

## 3. Core Mechanics & Technical Requirements

### 3.1. The Canvas Engine (PixiJS)
The coloring experience must remain performant (steady 60 FPS) on mid-tier tablets, mitigating memory bloat from freehand strokes.
*   **Layering Strategy:** 
    *   *Top Layer (Z-Index 3):* The Illustration Outline (Transparent PNG).
    *   *Middle Layer (Z-Index 2):* The user's drawing layer. This must utilize a `RenderTexture` to flatten strokes rather than storing thousands of individual graphic objects.
    *   *Bottom Layer (Z-Index 1):* Background color/texture.
*   **Input Handling:** 
    *   Utilize standard `PointerEvent` API to support Apple Pencil, Android Stylus, and touch. 
    *   Extract `pointerType`, `pressure`, and `tilt`. 
    *   Implement **Catmull-Rom spline interpolation** between pointer coordinates to ensure rapid brush strokes curve smoothly rather than appearing jagged.
*   **Palm Rejection:** The canvas wrapper must strictly implement CSS `touch-action: none` to prevent browser scrolling/zooming during drawing.

### 3.2. Asset Pipeline & Animation
The architecture must support a specific pipeline for custom illustrations.
*   **Asset Structure:** Each coloring page will be delivered as a JSON configuration pointing to Supabase Storage URLs for:
    *   `outline_mask.png`
    *   `animatable_elements.json` (coordinates and slice data for GSAP targeting)
*   **Sample Context:** The initial proof-of-concept will utilize a bespoke book design featuring a blonde cockapoo character navigating car travel. The platform must easily ingest this specific aesthetic without generic vector styling.
*   **Completion Detection:** A low-resolution off-screen canvas evaluates the alpha channel of the colored `RenderTexture`. Once a >85% fill threshold is met, trigger the GSAP timeline to animate specific sprites within the PixiJS container (e.g., the dog's tail wags, or background elements bounce).

### 3.3. Offline Library & Storage
*   Users authenticate via Supabase. Purchased book manifests are fetched and cached using TanStack Query.
*   When a user downloads a book, assets (images, JSON) are stored locally in IndexedDB.
*   The child's coloring state (the `RenderTexture` output) is saved locally and periodically synced to Supabase Storage as a flattened PNG to persist across sessions and devices.

### 3.4. Commerce & Print Pipeline
*   **Digital Unlocks:** Users can purchase new digital books. This updates a Supabase `user_libraries` table.
*   **Physical Orders:** 
    1.  User initiates a "Print Book" flow.
    2.  Frontend compiles the child's flattened colored PNGs and the static outlines.
    3.  Edge Function creates a Stripe Checkout session.
    4.  Upon `checkout.session.completed` webhook receipt, a Supabase Edge Function formats the payload and POSTs to the Gelato API to initiate physical printing and shipping.

## 4. Implementation Phases for OpenClaw / AI Agent

### Phase 1: Scaffolding & CI/CD
*   Initialize Next.js App Router project.
*   Configure Tailwind CSS.
*   Set up `manifest.json` for PWA capabilities (`display: standalone`, `orientation: landscape`).
*   Create `.github/workflows/deploy.yml` for automated Vercel deployments.
*   Initialize Supabase project and integrate `@supabase/ssr` for auth.

### Phase 2: Canvas Proof of Concept (PixiJS)
*   Create a reusable `<ColoringCanvas />` component.
*   Initialize PixiJS application, setting up the 3-layer architecture.
*   Implement pointer event listeners and the Catmull-Rom spline logic onto a `RenderTexture`.
*   Establish the off-screen alpha-channel checking logic to detect completion.
*   Mock a completion event that triggers a basic GSAP rotation on a loaded sprite.

### Phase 3: Data Schema & Library Management
*   Define Supabase schemas: `books`, `pages`, `user_libraries`, `user_saved_pages`.
*   Implement TanStack Query to fetch the user's library.
*   Build the UI for the "Library" (bookshelf view).
*   Implement IndexedDB caching logic for offline asset retrieval.

### Phase 4: The "Phygital" Commerce Bridge
*   Set up Stripe product configurations for physical books.
*   Build the Supabase Edge Function to generate Stripe Checkout URLs.
*   Build the Stripe Webhook handler.
*   Integrate the Gelato Node SDK within the webhook handler to dispatch the order automatically upon successful payment.

### Phase 5: Polish & Device Optimization
*   Implement robust tablet-specific media queries.
*   Fine-tune brush pressure sensitivity.
*   Build an onboarding modal instructing iOS Safari users how to "Add to Home Screen" for the fullscreen experience.

