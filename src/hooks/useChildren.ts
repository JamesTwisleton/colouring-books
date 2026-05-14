import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ChildProfile } from "@/types/coloring";

function rowToChildProfile(row: {
  id: string;
  parent_id: string;
  name: string;
  avatar_color: string;
  created_at: string;
}): ChildProfile {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
  };
}

export function useChildren(parentId: string | undefined) {
  return useQuery({
    queryKey: ["children", parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("parent_id", parentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToChildProfile);
    },
    enabled: !!parentId,
  });
}

export function useAddChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parentId,
      name,
      avatarColor,
    }: {
      parentId: string;
      name: string;
      avatarColor: string;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("children")
        .insert({ parent_id: parentId, name, avatar_color: avatarColor })
        .select()
        .single();
      if (error) throw error;
      return rowToChildProfile(data);
    },
    onSuccess: (_, { parentId }) => {
      qc.invalidateQueries({ queryKey: ["children", parentId] });
    },
  });
}

export function useDeleteChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      childId,
      parentId,
    }: {
      childId: string;
      parentId: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("children")
        .delete()
        .eq("id", childId);
      if (error) throw error;
      return { childId, parentId };
    },
    onSuccess: ({ parentId }) => {
      qc.invalidateQueries({ queryKey: ["children", parentId] });
    },
  });
}
