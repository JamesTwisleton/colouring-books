"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useBookPages, useUpdatePage } from "@/hooks/useBookPages";
import IllustrationUploader from "./IllustrationUploader";
import ElementRegionEditor from "./ElementRegionEditor";
import PageSettingsPanel from "./PageSettingsPanel";

interface PageEditorProps {
  bookId: string;
  pageId: string;
  userId: string;
  initialThreshold: number;
  initialPageTitle: string | null;
}

export default function PageEditor({
  bookId,
  pageId,
  userId,
  initialThreshold,
  initialPageTitle,
}: PageEditorProps) {
  const { data: pages = [] } = useBookPages(bookId);
  const page = pages.find((p) => p.id === pageId);
  const updatePage = useUpdatePage();

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Initial values from server props — no useEffect needed
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
      setTimeout(() => setSaveStatus("idle"), 2000);
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
    const newTitle =
      changes.pageTitle !== undefined ? changes.pageTitle : pageTitle;

    setSettings({ threshold: newThreshold, pageTitle: newTitle });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save({ completionThreshold: newThreshold, pageTitle: newTitle });
    }, 700);
  }

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading page…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-gray-100 bg-white flex items-center justify-between px-4 shrink-0">
        <Link
          href={`/studio/${bookId}`}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Book editor
        </Link>
        <span className="text-sm font-medium text-gray-600">
          {page.pageTitle || `Page ${page.pageNumber}`}
        </span>
        <div className="min-w-[72px] text-right">
          {saveStatus === "saving" && (
            <span className="text-xs text-gray-400">Saving…</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-green-500">Saved ✓</span>
          )}
        </div>
      </div>

      {/* Three panels */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden lg:flex lg:flex-row">
        {/* Panel 1 — Illustration */}
        <div className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Illustration</h3>
          <IllustrationUploader
            userId={userId}
            bookId={bookId}
            pageId={pageId}
            currentUrl={page.outlineUrl || undefined}
            onUploaded={(url) => save({ outlineUrl: url })}
          />
        </div>

        {/* Panel 2 — Animated elements */}
        <div className="flex-1 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Animated elements</h3>
          <ElementRegionEditor
            userId={userId}
            bookId={bookId}
            pageId={pageId}
            illustrationUrl={page.outlineUrl || undefined}
            currentElementsUrl={page.animatableElementsUrl || undefined}
            onSaved={(url) => save({ animatableElementsUrl: url })}
          />
        </div>

        {/* Panel 3 — Settings */}
        <div className="lg:w-72 shrink-0 overflow-y-auto p-5">
          <PageSettingsPanel
            completionThreshold={threshold}
            pageTitle={pageTitle}
            onChange={handleSettingsChange}
          />
        </div>
      </div>
    </div>
  );
}
