"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useBookPages, useUpdatePage } from "@/hooks/useBookPages";
import IllustrationUploader from "./IllustrationUploader";
import ElementRegionEditor from "./ElementRegionEditor";
import PageSettingsPanel from "./PageSettingsPanel";
import { useTheme } from "@/components/ui/ThemeProvider";
import LogoutButton from "@/components/ui/LogoutButton";

interface PageEditorProps {
  bookId: string;
  pageId: string;
  userId: string;
  initialThreshold: number;
  initialPageTitle: string | null;
}

// Numbered step badge
function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ff6b6b] text-white text-[10px] font-extrabold shrink-0">
      {n}
    </span>
  );
}

// Tip/info callout
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
      <span className="shrink-0 mt-0.5">💡</span>
      <span>{children}</span>
    </div>
  );
}

export default function PageEditor({
  bookId,
  pageId,
  userId,
  initialThreshold,
  initialPageTitle,
}: PageEditorProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const { data: pages = [] } = useBookPages(bookId);
  const page = pages.find((p) => p.id === pageId);
  const updatePage = useUpdatePage();

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [settings, setSettings] = useState({
    threshold: initialThreshold,
    pageTitle: initialPageTitle,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { threshold, pageTitle } = settings;

  async function save(fields: {
    outlineUrl?: string;
    animatableElementsUrl?: string;
    completionThreshold?: number;
    pageTitle?: string | null;
  }) {
    setSaveStatus("saving");
    try {
      await updatePage.mutateAsync({ pageId, bookId, ...fields });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("idle");
    }
  }

  function handleSettingsChange(changes: {
    completionThreshold?: number;
    pageTitle?: string | null;
  }) {
    const newThreshold =
      changes.completionThreshold !== undefined ? changes.completionThreshold : threshold;
    const newTitle = changes.pageTitle !== undefined ? changes.pageTitle : pageTitle;
    setSettings({ threshold: newThreshold, pageTitle: newTitle });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save({ completionThreshold: newThreshold, pageTitle: newTitle });
    }, 700);
  }

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#fff9f0] dark:bg-gray-950">
        <p className="text-gray-400 text-sm">Loading page…</p>
      </div>
    );
  }

  const hasIllustration = !!page.outlineUrl;
  const hasAnimations = !!page.animatableElementsUrl;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="h-12 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-3 px-4 shrink-0">
        <Link
          href={`/studio/${bookId}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors shrink-0"
        >
          ← Book
        </Link>

        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate text-center">
          {page.pageTitle || `Page ${page.pageNumber}`}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {/* Save indicator — always visible */}
          <span className={`text-xs font-medium transition-colors ${
            saveStatus === "saving"
              ? "text-gray-400 dark:text-gray-500"
              : saveStatus === "saved"
              ? "text-green-500"
              : "text-gray-300 dark:text-gray-600"
          }`}>
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : "All saved"}
          </span>

          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <LogoutButton
            title="Log out"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors text-sm"
          >
            ↪
          </LogoutButton>
        </div>
      </div>

      {/* ── Auto-save notice ── */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 px-4 py-2 flex items-center gap-2 shrink-0">
        <span className="text-blue-500 dark:text-blue-400 text-xs font-semibold">Auto-save is on</span>
        <span className="text-blue-400 dark:text-blue-500 text-xs">— every change saves automatically.</span>
        {hasIllustration && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-500 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            {hasAnimations ? "Illustration + animations ready" : "Illustration uploaded"}
          </span>
        )}
      </div>

      {/* ── Three panels ── */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden lg:flex lg:flex-row">

        {/* ── Panel 1: Illustration ── */}
        <div className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 overflow-y-auto bg-white dark:bg-gray-900">
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StepBadge n={1} />
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Illustration</h3>
                {hasIllustration && (
                  <span className="ml-auto text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded-full">
                    ✓ Done
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Your page artwork — children will colour on top of this.
              </p>
            </div>

            <Tip>
              Upload a PNG or SVG with black outlines on a white background, or use the{" "}
              <strong>Draw</strong> tab to sketch directly in the browser.
              The illustration is the coloring page outline — keep it clean and line-art style.
            </Tip>

            <IllustrationUploader
              userId={userId}
              bookId={bookId}
              pageId={pageId}
              currentUrl={page.outlineUrl || undefined}
              onUploaded={(url) => save({ outlineUrl: url })}
            />
          </div>
        </div>

        {/* ── Panel 2: Animated elements ── */}
        <div className="flex-1 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 overflow-y-auto bg-white dark:bg-gray-900">
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StepBadge n={2} />
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Animate</h3>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full font-medium">
                  optional
                </span>
                {hasAnimations && (
                  <span className="ml-auto text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded-full">
                    ✓ Set
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Parts that spring to life when the child finishes colouring.
              </p>
            </div>

            <Tip>
              Draw a rectangle around any element you want to animate — a character, a car, a cloud.
              Pick an animation style (bounce, spin, float…) and press{" "}
              <strong>Save animated elements</strong>. Skip this panel entirely if you don&apos;t need animations.
            </Tip>

            {!hasIllustration && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 rounded-xl px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                <span>⬆</span>
                <span>Upload your illustration in Step 1 first — it appears here as a guide.</span>
              </div>
            )}

            <ElementRegionEditor
              userId={userId}
              bookId={bookId}
              pageId={pageId}
              illustrationUrl={page.outlineUrl || undefined}
              currentElementsUrl={page.animatableElementsUrl || undefined}
              onSaved={(url) => save({ animatableElementsUrl: url })}
            />
          </div>
        </div>

        {/* ── Panel 3: Settings ── */}
        <div className="lg:w-72 shrink-0 overflow-y-auto bg-white dark:bg-gray-900">
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StepBadge n={3} />
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Settings</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Set the colouring goal — how much must be filled before the next page unlocks.
              </p>
            </div>

            <Tip>
              The colouring threshold is the core mechanic. 60–80% works well for most pages.
              Set to 0% for the last page (no gating needed).
              Changes to settings save automatically after a short pause.
            </Tip>

            <PageSettingsPanel
              completionThreshold={threshold}
              pageTitle={pageTitle}
              onChange={handleSettingsChange}
            />

            {/* Done callout */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed mb-2">
                When all pages are ready, go back to the book editor to publish.
              </p>
              <Link
                href={`/studio/${bookId}`}
                className="block w-full py-2.5 rounded-xl border-2 border-[#ff6b6b] text-[#ff6b6b] text-sm font-semibold text-center hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
              >
                ← Back to book
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
