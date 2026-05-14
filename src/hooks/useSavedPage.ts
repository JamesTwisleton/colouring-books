import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SavedPage } from "@/types/colouring";

function rowToSavedPage(row: {
  id: string;
  child_id: string;
  page_id: string;
  coloured_image_url: string | null;
  fill_percentage: number;
  completed_at: string | null;
  updated_at: string;
}): SavedPage {
  return {
    id: row.id,
    childId: row.child_id,
    pageId: row.page_id,
    colouredImageUrl: row.coloured_image_url,
    fillPercentage: row.fill_percentage,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

export function useSavedPage(
  childId: string | undefined,
  pageId: string | undefined
) {
  return useQuery({
    queryKey: ["saved-page", childId, pageId],
    queryFn: async (): Promise<SavedPage | null> => {
      if (!childId || !pageId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_saved_pages")
        .select("*")
        .eq("child_id", childId)
        .eq("page_id", pageId)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToSavedPage(data) : null;
    },
    enabled: !!childId && !!pageId,
  });
}

export function useUpsertSavedPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      childId,
      pageId,
      colouredImageUrl,
      fillPercentage,
    }: {
      childId: string;
      pageId: string;
      colouredImageUrl?: string;
      fillPercentage: number;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_saved_pages")
        .upsert(
          {
            child_id: childId,
            page_id: pageId,
            coloured_image_url: colouredImageUrl ?? null,
            fill_percentage: fillPercentage,
            completed_at:
              fillPercentage >= 0.85 ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "child_id,page_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return rowToSavedPage(data);
    },
    onSuccess: (result) => {
      qc.setQueryData(
        ["saved-page", result.childId, result.pageId],
        result
      );
    },
  });
}
