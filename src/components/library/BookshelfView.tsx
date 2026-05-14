"use client";

import { useState, useEffect } from "react";
import { useLibrary } from "@/hooks/useLibrary";
import { useChildren } from "@/hooks/useChildren";
import { cacheBookAssets } from "@/lib/idb/assetCache";
import BookCard from "./BookCard";
import ChildProfileSelector from "@/components/children/ChildProfileSelector";

interface BookshelfViewProps {
  parentId: string;
}

const ACTIVE_CHILD_KEY = "cb:activeChildId";

export default function BookshelfView({ parentId }: BookshelfViewProps) {
  const [activeChildId, setActiveChildId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_CHILD_KEY);
  });
  const [showProfiles, setShowProfiles] = useState(false);

  const { data: books = [], isLoading, isError } = useLibrary(parentId);
  const { data: children = [] } = useChildren(parentId);

  const activeChild = children.find((c) => c.id === activeChildId) ?? null;

  function handleSelectChild(childId: string) {
    setActiveChildId(childId);
    localStorage.setItem(ACTIVE_CHILD_KEY, childId);
    setShowProfiles(false);
  }

  async function handleDownload(bookId: string) {
    const book = books.find((b) => b.id === bookId);
    if (!book?.pages) return;
    try {
      await cacheBookAssets(book.pages);
      alert("Book saved for offline use!");
    } catch {
      alert("Download failed. Please check your connection.");
    }
  }

  // Auto-show profile selector when no child is active and profiles exist
  useEffect(() => {
    if (!activeChildId && children.length > 0) {
      setShowProfiles(true);
    }
  }, [activeChildId, children.length]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-orange-50">
        <div>
          <h1 className="text-2xl font-bold text-[#ff6b6b]">📚 My Books</h1>
          {activeChild && (
            <p className="text-sm text-gray-500 mt-0.5">
              Colouring as{" "}
              <span className="font-semibold text-gray-700">
                {activeChild.name}
              </span>
            </p>
          )}
        </div>

        {/* Child switcher */}
        <button
          onClick={() => setShowProfiles(!showProfiles)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
        >
          {activeChild ? (
            <>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: activeChild.avatarColour }}
              >
                {activeChild.name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {activeChild.name}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-gray-500">
              Choose child
            </span>
          )}
        </button>
      </div>

      {/* Profile selector dropdown */}
      {showProfiles && (
        <div className="border-b border-orange-50 bg-white shadow-sm">
          <ChildProfileSelector
            parentId={parentId}
            activeChildId={activeChildId}
            onSelect={handleSelectChild}
          />
        </div>
      )}

      {/* Book shelf */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-400 text-sm">Loading your library…</div>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center h-40">
            <div className="text-red-400 text-sm">
              Couldn&apos;t load your library. Check your connection.
            </div>
          </div>
        )}

        {!isLoading && !isError && books.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="text-4xl">🎨</div>
            <p className="text-gray-500 text-sm text-center max-w-xs">
              Your library is empty. Books will appear here once they&apos;re added.
            </p>
          </div>
        )}

        {books.length > 0 && (
          <div className="scroll-container flex gap-5 pb-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                activeChildId={activeChildId}
                onDownload={() => handleDownload(book.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
