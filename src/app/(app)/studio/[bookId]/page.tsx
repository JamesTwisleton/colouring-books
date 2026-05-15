import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookEditor from "@/components/studio/BookEditor";

interface Props {
  params: Promise<{ bookId: string }>;
}

export default async function BookEditorPage({ params }: Props) {
  const { bookId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: book } = await supabase
    .from("books")
    .select("id, title, description, cover_image_url, is_public, status, slug")
    .eq("id", bookId)
    .eq("author_id", user!.id)
    .maybeSingle();

  if (!book) notFound();

  return (
    <BookEditor
      bookId={bookId}
      userId={user!.id}
      initialTitle={book.title}
      initialDescription={book.description ?? ""}
      initialIsPublic={book.is_public}
      initialStatus={(book.status ?? "draft") as "draft" | "published"}
      initialCoverImageUrl={book.cover_image_url ?? null}
      initialSlug={(book as Record<string, unknown>).slug as string | null ?? null}
    />
  );
}
