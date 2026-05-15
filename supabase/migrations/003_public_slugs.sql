-- ============================================================
-- Colouring Books — migration 003: public slugs + anon access
-- ============================================================
-- Run in Supabase SQL Editor.
-- ============================================================

-- ─── Add slug to books ───────────────────────────────────────
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS slug text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_books_slug ON public.books(slug);

-- Set slug for the existing placeholder book
UPDATE public.books
SET slug = 'cockapoos-big-adventure'
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- ─── Allow unauthenticated (anon) access to public books ─────
-- Public books and their pages are readable without signing in.
-- This powers the /book/[slug] shareable route.

CREATE POLICY "books: anon public read"
  ON public.books FOR SELECT
  TO anon
  USING (is_public = true AND status = 'published');

CREATE POLICY "pages: anon public book read"
  ON public.pages FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_id
        AND b.is_public = true
        AND b.status = 'published'
    )
  );
