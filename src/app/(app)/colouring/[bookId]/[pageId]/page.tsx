import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CanvasWrapper from "@/components/canvas/CanvasWrapper";

interface PageProps {
  params: Promise<{ bookId: string; pageId: string }>;
}

export default async function ColouringPage({ params }: PageProps) {
  const { bookId, pageId } = await params;
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, page_number, outline_url, animatable_elements_url, completion_threshold")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });

  if (!pages || pages.length === 0) notFound();

  const currentIndex = pages.findIndex((p) => p.id === pageId);
  if (currentIndex === -1) notFound();

  const currentPage = pages[currentIndex];
  const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CanvasWrapper
        outlineUrl={currentPage.outline_url}
        animatableElementsUrl={currentPage.animatable_elements_url}
        bookId={bookId}
        pageId={pageId}
        prevPageId={prevPage?.id}
        nextPageId={nextPage?.id}
        pageNumber={currentPage.page_number}
        totalPages={pages.length}
        completionThreshold={(currentPage as Record<string, unknown>).completion_threshold as number ?? 0.6}
      />
    </div>
  );
}
