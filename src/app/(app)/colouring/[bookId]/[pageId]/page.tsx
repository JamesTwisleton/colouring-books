import { notFound } from "next/navigation";
import CanvasWrapper from "@/components/canvas/CanvasWrapper";

interface PageProps {
  params: Promise<{ bookId: string; pageId: string }>;
}

export default async function ColouringPage({ params }: PageProps) {
  const { bookId, pageId } = await params;

  if (!bookId || !pageId) notFound();

  // Phase 3: fetch real page config from Supabase.
  // For now, placeholder assets exercise the canvas engine.
  const pageConfig = {
    outlineUrl: "/assets/placeholder/outline.png",
    animatableElementsUrl: "/assets/placeholder/animatable_elements.json",
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CanvasWrapper
        outlineUrl={pageConfig.outlineUrl}
        animatableElementsUrl={pageConfig.animatableElementsUrl}
        bookId={bookId}
        pageId={pageId}
      />
    </div>
  );
}
