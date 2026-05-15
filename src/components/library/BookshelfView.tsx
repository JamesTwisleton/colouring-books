"use client";

import { useState } from "react";
import Link from "next/link";
import { useLibrary } from "@/hooks/useLibrary";
import { useChildren } from "@/hooks/useChildren";
import { cacheBookAssets } from "@/lib/idb/assetCache";
import BookCard from "./BookCard";
import ChildProfileSelector from "@/components/children/ChildProfileSelector";
import LogoutButton from "@/components/ui/LogoutButton";
import { useTheme } from "@/components/ui/ThemeProvider";

interface BookshelfViewProps {
  parentId: string;
}

const ACTIVE_CHILD_KEY = "cb:activeChildId";

export default function BookshelfView({ parentId }: BookshelfViewProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const [activeChildId, setActiveChildId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_CHILD_KEY);
  });
  // null = not yet overridden by the user; derive from data instead
  const [showProfilesOverride, setShowProfilesOverride] = useState<boolean | null>(null);

  const { data: books = [], isLoading, isError } = useLibrary(parentId);
  const { data: children = [] } = useChildren(parentId);

  const activeChild = children.find((c) => c.id === activeChildId) ?? null;

  // Auto-show when children load but none is selected; user can toggle to override
  const showProfiles = showProfilesOverride ?? (!activeChildId && children.length > 0);

  function handleSelectChild(childId: string) {
    setActiveChildId(childId);
    localStorage.setItem(ACTIVE_CHILD_KEY, childId);
    setShowProfilesOverride(false);
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-orange-50 dark:border-gray-800 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#ff6b6b]">My Books</h1>
          {activeChild && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Colouring as{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {activeChild.name}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            ✏️ Studio
          </Link>

          {/* Child switcher */}
          <button
            onClick={() => setShowProfilesOverride(!showProfiles)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
          >
            {activeChild ? (
              <>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: activeChild.avatarColour }}
                >
                  {activeChild.name[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                  {activeChild.name}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Choose child
              </span>
            )}
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-50 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Log out */}
          <LogoutButton
            title="Log out"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors text-sm leading-none"
          >
            ↪
          </LogoutButton>
        </div>
      </div>

      {/* Profile selector dropdown */}
      {showProfiles && (
        <div className="border-b border-orange-50 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <ChildProfileSelector
            parentId={parentId}
            activeChildId={activeChildId}
            onSelect={handleSelectChild}
          />
        </div>
      )}

      {/* Book shelf */}
      <div className="flex-1 overflow-y-auto p-6 pb-safe-min-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-gray-400 text-sm">Loading your library…</div>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-16">
            <div className="text-red-400 text-sm text-center max-w-xs">
              Couldn&apos;t load your library. Check your connection.
            </div>
          </div>
        )}

        {!isLoading && !isError && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
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
