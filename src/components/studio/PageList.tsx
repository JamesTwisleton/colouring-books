"use client";

import { useRouter } from "next/navigation";
import { useCreatePage, useDeletePage, useReorderPages } from "@/hooks/useBookPages";
import type { StudioPage } from "@/types/colouring";

export default function PageList({
  bookId,
  pages,
}: {
  bookId: string;
  pages: StudioPage[];
}) {
  const router = useRouter();
  const createPage = useCreatePage();
  const deletePage = useDeletePage();
  const reorderPages = useReorderPages();

  async function handleMove(index: number, dir: -1 | 1) {
    const newOrder = [...pages];
    const target = index + dir;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    await reorderPages.mutateAsync({ bookId, orderedIds: newOrder.map((p) => p.id) });
  }

  async function handleDelete(pageId: string) {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    await deletePage.mutateAsync({ pageId, bookId });
  }

  async function handleAdd() {
    const page = await createPage.mutateAsync(bookId);
    router.push(`/studio/${bookId}/pages/${page.id}`);
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">Pages</h2>
        <span className="text-xs text-gray-400">
          {pages.length} {pages.length === 1 ? "page" : "pages"}
        </span>
      </div>

      {pages.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-2">
          <span className="text-3xl opacity-25">📄</span>
          <p className="text-sm text-gray-400 text-center">
            No pages yet. Add one to get started.
          </p>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {pages.map((page, i) => (
          <div
            key={page.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-colors group"
          >
            {/* Thumbnail */}
            <div
              className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 cursor-pointer"
              onClick={() => router.push(`/studio/${bookId}/pages/${page.id}`)}
            >
              {page.outlineUrl ? (
                <img
                  src={page.outlineUrl}
                  alt={`Page ${page.pageNumber}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200 text-xl">
                  +
                </div>
              )}
            </div>

            {/* Info */}
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => router.push(`/studio/${bookId}/pages/${page.id}`)}
            >
              <p className="text-sm font-medium text-gray-700 truncate">
                {page.pageTitle || `Page ${page.pageNumber}`}
              </p>
              <p className="text-xs text-gray-400">
                {page.outlineUrl
                  ? `${Math.round(page.completionThreshold * 100)}% threshold`
                  : "No illustration — tap to edit"}
              </p>
            </div>

            {/* Reorder + delete */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => handleMove(i, -1)}
                disabled={i === 0 || reorderPages.isPending}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-20 text-sm"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => handleMove(i, 1)}
                disabled={i === pages.length - 1 || reorderPages.isPending}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-20 text-sm"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => handleDelete(page.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 text-xs"
                title="Delete page"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAdd}
        disabled={createPage.isPending}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#ff6b6b] hover:text-[#ff6b6b] text-sm font-medium text-gray-400 transition-colors disabled:opacity-50"
      >
        {createPage.isPending ? "Adding…" : "+ Add page"}
      </button>
    </div>
  );
}
