import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageEditor from "@/components/studio/PageEditor";

interface Props {
  params: Promise<{ bookId: string; pageId: string }>;
}

export default async function PageEditorPage({ params }: Props) {
  const { bookId, pageId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify book ownership
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .eq("author_id", user!.id)
    .maybeSingle();

  if (!book) notFound();

  // Verify page belongs to this book
  const { data: page } = await supabase
    .from("pages")
    .select("id, completion_threshold, page_title")
    .eq("id", pageId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (!page) notFound();

  return (
    <PageEditor
      bookId={bookId}
      pageId={pageId}
      userId={user!.id}
      initialThreshold={(page as Record<string, unknown>).completion_threshold as number ?? 0.6}
      initialPageTitle={(page as Record<string, unknown>).page_title as string | null ?? null}
    />
  );
}
