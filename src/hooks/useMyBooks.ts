import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { AuthoredBook } from "@/types/colouring";

function mapBook(b: Record<string, unknown>): AuthoredBook {
  const pages = Array.isArray(b.pages) ? b.pages : [];
  return {
    id: b.id as string,
    title: b.title as string,
    description: (b.description as string | null) ?? null,
    coverImageUrl: (b.cover_image_url as string | null) ?? null,
    isPublic: (b.is_public as boolean) ?? false,
    status: ((b.status as string) ?? "draft") as "draft" | "published",
    authorId: (b.author_id as string) ?? "",
    pageCount: (b.page_count as number) ?? 0,
    createdAt: b.created_at as string,
    pages: pages.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      bookId: p.book_id as string,
      pageNumber: p.page_number as number,
      outlineUrl: (p.outline_url as string) ?? "",
      animatableElementsUrl: (p.animatable_elements_url as string) ?? "",
      completionThreshold: (p.completion_threshold as number) ?? 0.6,
      pageTitle: (p.page_title as string | null) ?? null,
    })),
  };
}

export function useMyBooks(userId: string | undefined) {
  return useQuery({
    queryKey: ["myBooks", userId],
    queryFn: async (): Promise<AuthoredBook[]> => {
      if (!userId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("books")
        .select(
          "id, title, description, cover_image_url, is_public, status, author_id, page_count, created_at, pages(id, book_id, page_number, outline_url)"
        )
        .eq("author_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map((b) => mapBook(b as Record<string, unknown>));
    },
    enabled: !!userId,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      title,
      description,
      isPublic,
    }: {
      userId: string;
      title: string;
      description?: string;
      isPublic: boolean;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("books")
        .insert({
          title,
          description: description ?? null,
          author_id: userId,
          is_public: isPublic,
          status: "draft",
          page_count: 0,
          price_digital_cents: 0,
          price_physical_cents: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookId,
      title,
      description,
      coverImageUrl,
      isPublic,
      status,
    }: {
      bookId: string;
      title?: string;
      description?: string | null;
      coverImageUrl?: string | null;
      isPublic?: boolean;
      status?: "draft" | "published";
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("books")
        .update({
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(coverImageUrl !== undefined && { cover_image_url: coverImageUrl }),
          ...(isPublic !== undefined && { is_public: isPublic }),
          ...(status !== undefined && { status }),
        })
        .eq("id", bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("books").delete().eq("id", bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}
