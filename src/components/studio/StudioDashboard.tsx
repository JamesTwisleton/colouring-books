"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMyBooks, useDeleteBook } from "@/hooks/useMyBooks";
import NewBookModal from "./NewBookModal";
import type { AuthoredBook } from "@/types/colouring";
import LogoutButton from "@/components/ui/LogoutButton";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function StudioDashboard({ userId }: { userId: string }) {
  const { theme, toggle: toggleTheme } = useTheme();
  const router = useRouter();
  const { data: books = [], isLoading } = useMyBooks(userId);
  const deleteBook = useDeleteBook();
  const [showNewModal, setShowNewModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-orange-50 dark:border-gray-800 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#ff6b6b]">Studio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Create and manage your colouring books</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/library"
            className="px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Library
          </Link>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <LogoutButton
            title="Log out"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors text-sm"
          >
            ↪
          </LogoutButton>
        </div>
      </div>

      {/* Book grid */}
      <div className="flex-1 overflow-y-auto p-5 pb-safe-min-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-400 text-sm">Loading your books…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* New book card */}
            <button
              onClick={() => setShowNewModal(true)}
              className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-[#ff6b6b] hover:bg-orange-50/50 dark:hover:bg-[#ff6b6b]/5 transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-[#ff6b6b]/10 flex items-center justify-center text-3xl text-gray-300 dark:text-gray-600 group-hover:text-[#ff6b6b] transition-colors">
                +
              </div>
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500 group-hover:text-[#ff6b6b] transition-colors">
                New book
              </span>
            </button>

            {books.map((book) => (
              <BookTile
                key={book.id}
                book={book}
                onEdit={() => router.push(`/studio/${book.id}`)}
                onDelete={() => setConfirmDelete(book.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showNewModal && (
        <NewBookModal
          userId={userId}
          onClose={() => setShowNewModal(false)}
          onCreate={(id) => {
            setShowNewModal(false);
            router.push(`/studio/${id}`);
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Delete book?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This permanently deletes the book and all its pages. Cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteBook.mutateAsync(confirmDelete);
                  setConfirmDelete(null);
                }}
                disabled={deleteBook.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60"
              >
                {deleteBook.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookTile({
  book,
  onEdit,
  onDelete,
}: {
  book: AuthoredBook;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col">
      {/* Cover */}
      <div
        className="flex-1 bg-orange-50 dark:bg-gray-800 flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={onEdit}
      >
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl opacity-20">📖</span>
        )}
      </div>

      {/* Info bar */}
      <div className="bg-white dark:bg-gray-900 px-3 py-2.5 cursor-pointer shrink-0" onClick={onEdit}>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{book.title}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {book.pageCount === 1 ? "1 page" : `${book.pageCount} pages`}
          </span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              book.status === "published"
                ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}
          >
            {book.status === "published" ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      {/* Delete (visible on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[10px] shadow-sm"
        title="Delete book"
      >
        ✕
      </button>
    </div>
  );
}
