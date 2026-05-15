import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { StudioPage } from "@/types/colouring";

function mapPage(p: Record<string, unknown>): StudioPage {
  return {
    id: p.id as string,
    bookId: p.book_id as string,
    pageNumber: p.page_number as number,
    outlineUrl: (p.outline_url as string) ?? "",
    animatableElementsUrl: (p.animatable_elements_url as string) ?? "",
    completionThreshold: (p.completion_threshold as number) ?? 0.6,
    pageTitle: (p.page_title as string | null) ?? null,
  };
}

export function useBookPages(bookId: string | undefined) {
  return useQuery({
    queryKey: ["bookPages", bookId],
    queryFn: async (): Promise<StudioPage[]> => {
      if (!bookId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pages")
        .select(
          "id, book_id, page_number, outline_url, animatable_elements_url, completion_threshold, page_title"
        )
        .eq("book_id", bookId)
        .order("page_number", { ascending: true });

      if (error) throw error;
      return (data ?? []).map((p) => mapPage(p as Record<string, unknown>));
    },
    enabled: !!bookId,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookId: string) => {
      const supabase = createClient();

      // Auto-assign the next page number
      const { data: existing } = await supabase
        .from("pages")
        .select("page_number")
        .eq("book_id", bookId)
        .order("page_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextNum = ((existing?.page_number as number | undefined) ?? 0) + 1;

      const { data, error } = await supabase
        .from("pages")
        .insert({
          book_id: bookId,
          page_number: nextNum,
          outline_url: "",
          animatable_elements_url: "",
          completion_threshold: 0.6,
        })
        .select()
        .single();

      if (error) throw error;

      // Keep book.page_count in sync
      await supabase
        .from("books")
        .update({ page_count: nextNum })
        .eq("id", bookId);

      return data;
    },
    onSuccess: (_, bookId) => {
      queryClient.invalidateQueries({ queryKey: ["bookPages", bookId] });
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pageId,
      bookId,
      outlineUrl,
      animatableElementsUrl,
      completionThreshold,
      pageTitle,
    }: {
      pageId: string;
      bookId: string;
      outlineUrl?: string;
      animatableElementsUrl?: string;
      completionThreshold?: number;
      pageTitle?: string | null;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("pages")
        .update({
          ...(outlineUrl !== undefined && { outline_url: outlineUrl }),
          ...(animatableElementsUrl !== undefined && { animatable_elements_url: animatableElementsUrl }),
          ...(completionThreshold !== undefined && { completion_threshold: completionThreshold }),
          ...(pageTitle !== undefined && { page_title: pageTitle }),
        })
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ["bookPages", bookId] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, bookId }: { pageId: string; bookId: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("pages").delete().eq("id", pageId);
      if (error) throw error;

      // Renumber remaining pages and update page_count
      const { data: remaining } = await supabase
        .from("pages")
        .select("id")
        .eq("book_id", bookId)
        .order("page_number", { ascending: true });

      if (remaining) {
        await Promise.all(
          remaining.map((p, i) =>
            supabase.from("pages").update({ page_number: i + 1 }).eq("id", p.id)
          )
        );
        await supabase
          .from("books")
          .update({ page_count: remaining.length })
          .eq("id", bookId);
      }
    },
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ["bookPages", bookId] });
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
    },
  });
}

export function useReorderPages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookId,
      orderedIds,
    }: {
      bookId: string;
      orderedIds: string[];
    }) => {
      const supabase = createClient();
      await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from("pages").update({ page_number: i + 1 }).eq("id", id)
        )
      );
    },
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ["bookPages", bookId] });
    },
  });
}
