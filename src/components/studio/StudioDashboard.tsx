"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMyBooks, useDeleteBook } from "@/hooks/useMyBooks";
import NewBookModal from "./NewBookModal";
import type { AuthoredBook } from "@/types/colouring";

export default function StudioDashboard({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: books = [], isLoading } = useMyBooks(userId);
  const deleteBook = useDeleteBook();
  const [showNewModal, setShowNewModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-orange-50 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#ff6b6b]">Studio</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage your colouring books</p>
        </div>
        <Link
          href="/library"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Library
        </Link>
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
              className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#ff6b6b] hover:bg-orange-50/50 transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-[#ff6b6b]/10 flex items-center justify-center text-3xl text-gray-300 group-hover:text-[#ff6b6b] transition-colors">
                +
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-[#ff6b6b] transition-colors">
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete book?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This permanently deletes the book and all its pages. Cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
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
    <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col">
      {/* Cover */}
      <div
        className="flex-1 bg-orange-50 flex items-center justify-center cursor-pointer overflow-hidden"
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
      <div className="bg-white px-3 py-2.5 cursor-pointer shrink-0" onClick={onEdit}>
        <p className="text-xs font-semibold text-gray-800 truncate">{book.title}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-400">
            {book.pageCount === 1 ? "1 page" : `${book.pageCount} pages`}
          </span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              book.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
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
