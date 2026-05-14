import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { BookWithPages } from "@/types/coloring";

export function useLibrary(parentId: string | undefined) {
  return useQuery({
    queryKey: ["library", parentId],
    queryFn: async (): Promise<BookWithPages[]> => {
      if (!parentId) return [];
      const supabase = createClient();

      // Fetch books the parent owns via user_libraries
      const { data, error } = await supabase
        .from("user_libraries")
        .select(`
          book_id,
          books (
            id, title, description, cover_image_url,
            price_digital_cents, price_physical_cents, page_count,
            pages (
              id, book_id, page_number, outline_url, animatable_elements_url
            )
          )
        `)
        .eq("parent_id", parentId)
        .order("purchased_at", { ascending: false });

      if (error) throw error;

      return (data ?? [])
        .map((row) => row.books)
        .filter(Boolean)
        .map((book) => ({
          id: book!.id,
          title: book!.title,
          description: book!.description,
          coverImageUrl: book!.cover_image_url,
          priceDigitalCents: book!.price_digital_cents,
          pricePhysicalCents: book!.price_physical_cents,
          pageCount: book!.page_count,
          pages: (book!.pages ?? []).map((p) => ({
            id: p.id,
            bookId: p.book_id,
            pageNumber: p.page_number,
            outlineUrl: p.outline_url,
            animatableElementsUrl: p.animatable_elements_url,
          })),
        }));
    },
    enabled: !!parentId,
  });
}
