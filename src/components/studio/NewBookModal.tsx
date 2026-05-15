"use client";

import { useState } from "react";
import { useCreateBook } from "@/hooks/useMyBooks";

interface NewBookModalProps {
  userId: string;
  onClose: () => void;
  onCreate: (bookId: string) => void;
}

export default function NewBookModal({ userId, onClose, onCreate }: NewBookModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createBook = useCreateBook();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    try {
      const book = await createBook.mutateAsync({
        userId,
        title: title.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      onCreate(book.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create book");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 pt-safe pb-safe">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">New colouring book</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-[#ff6b6b]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 focus:border-[#ff6b6b] text-sm"
              placeholder="e.g. My Ocean Adventure"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 focus:border-[#ff6b6b] text-sm resize-none"
              placeholder="A short description…"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Visibility</p>
            <div className="flex gap-3">
              {(
                [
                  { val: false, icon: "🔒", label: "Private" },
                  { val: true, icon: "🌍", label: "Public" },
                ] as const
              ).map(({ val, icon, label }) => (
                <label
                  key={label}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    isPublic === val
                      ? "border-[#ff6b6b] bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={isPublic === val}
                    onChange={() => setIsPublic(val)}
                  />
                  <span>{icon}</span>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {isPublic
                ? "Appears in the public Library once published."
                : "Only visible to you. You can change this later."}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBook.isPending || !title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#ff6b6b] text-white text-sm font-semibold disabled:opacity-60 hover:bg-[#e04f4f] transition-colors"
            >
              {createBook.isPending ? "Creating…" : "Create book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
