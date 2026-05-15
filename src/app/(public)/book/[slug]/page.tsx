import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicBookPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("slug", slug)
    .eq("is_public", true)
    .eq("status", "published")
    .maybeSingle();

  if (!book) notFound();

  const { data: pages } = await supabase
    .from("pages")
    .select("id")
    .eq("book_id", book.id)
    .order("page_number", { ascending: true })
    .limit(1);

  const firstPage = pages?.[0];
  if (!firstPage) notFound();

  redirect(`/book/${slug}/${firstPage.id}`);
}
