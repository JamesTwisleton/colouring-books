-- ============================================================
-- Colouring Books — migration 002: Studio / book authoring
-- ============================================================
-- Run this in the Supabase SQL Editor (same as migration 001).
-- ============================================================

-- ─── Books: author ownership + visibility ────────────────────
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS author_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status     text    NOT NULL DEFAULT 'draft';
-- status values: 'draft' | 'published'

-- ─── Pages: per-page unlock threshold + optional title ───────
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS completion_threshold float NOT NULL DEFAULT 0.6,
  ADD COLUMN IF NOT EXISTS page_title           text;

-- Mark the existing placeholder book as public + published so it
-- remains visible in the Library after the new RLS policies apply.
UPDATE public.books
SET is_public = true, status = 'published'
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- ─── Books RLS — replace blanket read with role-aware policies ─

DROP POLICY IF EXISTS "books: authenticated read" ON public.books;

-- Any authenticated user can see public, published books
CREATE POLICY "books: public read"
  ON public.books FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_public = true
    AND status = 'published'
  );

-- Authors see ALL their own books (drafts included)
CREATE POLICY "books: author read own"
  ON public.books FOR SELECT
  USING (auth.uid() = author_id);

-- Authors can create, edit, delete their own books
CREATE POLICY "books: author insert"
  ON public.books FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "books: author update"
  ON public.books FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "books: author delete"
  ON public.books FOR DELETE
  USING (auth.uid() = author_id);

-- ─── Pages RLS — replace blanket read with role-aware policies ─

DROP POLICY IF EXISTS "pages: authenticated read" ON public.pages;

-- Pages are readable when their parent book is readable:
--   • public published books  OR
--   • the user is the book's author
CREATE POLICY "pages: readable with book"
  ON public.pages FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_id
        AND (
          (b.is_public = true AND b.status = 'published')
          OR b.author_id = auth.uid()
        )
    )
  );

-- Authors can insert, update, delete pages within their own books
CREATE POLICY "pages: author insert"
  ON public.pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_id AND b.author_id = auth.uid()
    )
  );

CREATE POLICY "pages: author update"
  ON public.pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_id AND b.author_id = auth.uid()
    )
  );

CREATE POLICY "pages: author delete"
  ON public.pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_id AND b.author_id = auth.uid()
    )
  );

-- ─── Storage bucket for author-uploaded assets ───────────────
-- Path convention: {userId}/{bookId}/cover.{ext}
--                  {userId}/{bookId}/pages/{pageId}/outline.{ext}
--                  {userId}/{bookId}/pages/{pageId}/elements.json

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-assets',
  'book-assets',
  false,
  10485760,  -- 10 MB per file
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'application/json']
)
ON CONFLICT DO NOTHING;

-- Users may only write to paths that start with their own user ID
CREATE POLICY "book-assets: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'book-assets'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "book-assets: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'book-assets'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "book-assets: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'book-assets'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Any authenticated user can read assets (images, JSON)
CREATE POLICY "book-assets: authenticated read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'book-assets'
    AND auth.uid() IS NOT NULL
  );

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_books_author_id      ON public.books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_status_public  ON public.books(status, is_public);
