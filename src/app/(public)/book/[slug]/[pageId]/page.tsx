import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CanvasWrapper from "@/components/canvas/CanvasWrapper";

interface Props {
  params: Promise<{ slug: string; pageId: string }>;
}

export default async function PublicCanvasPage({ params }: Props) {
  const { slug, pageId } = await params;
  const supabase = await createClient();

  // Fetch book by slug — anon RLS policy allows this for public published books
  const { data: book } = await supabase
    .from("books")
    .select("id, title, page_count")
    .eq("slug", slug)
    .eq("is_public", true)
    .eq("status", "published")
    .maybeSingle();

  if (!book) notFound();

  // Fetch all pages for navigation
  const { data: pages } = await supabase
    .from("pages")
    .select("id, page_number, outline_url, animatable_elements_url, completion_threshold")
    .eq("book_id", book.id)
    .order("page_number", { ascending: true });

  if (!pages?.length) notFound();

  const pageIndex = pages.findIndex((p) => p.id === pageId);
  if (pageIndex === -1) notFound();

  const currentPage = pages[pageIndex];
  const prevPage = pageIndex > 0 ? pages[pageIndex - 1] : null;
  const nextPage = pageIndex < pages.length - 1 ? pages[pageIndex + 1] : null;

  // Check auth — doesn't redirect if not logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CanvasWrapper
        outlineUrl={currentPage.outline_url}
        animatableElementsUrl={currentPage.animatable_elements_url}
        bookId={book.id}
        pageId={pageId}
        prevPageId={prevPage?.id}
        nextPageId={nextPage?.id}
        pageNumber={currentPage.page_number}
        totalPages={pages.length}
        completionThreshold={
          (currentPage as Record<string, unknown>).completion_threshold as number ?? 0.6
        }
        pageBasePath={`/book/${slug}`}
        backHref="/"
        backLabel="Home"
        shareUrl={`/book/${slug}/${pageId}`}
        isAnonymous={!user}
      />
    </div>
  );
}
