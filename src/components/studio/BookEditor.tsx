"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMyBooks, useUpdateBook } from "@/hooks/useMyBooks";
import { useBookPages } from "@/hooks/useBookPages";
import { uploadCover } from "@/lib/storage/bookAssets";
import PageList from "./PageList";

export default function BookEditor({
  bookId,
  userId,
  initialTitle,
  initialDescription,
  initialIsPublic,
  initialStatus,
  initialCoverImageUrl,
}: {
  bookId: string;
  userId: string;
  initialTitle: string;
  initialDescription: string;
  initialIsPublic: boolean;
  initialStatus: "draft" | "published";
  initialCoverImageUrl: string | null;
}) {
  const { data: books = [] } = useMyBooks(userId);
  const book = books.find((b) => b.id === bookId);
  const { data: pages = [] } = useBookPages(bookId);
  const updateBook = useUpdateBook();

  // Initial values come from server props — no useEffect needed
  const [form, setForm] = useState({
    title: initialTitle,
    description: initialDescription,
    isPublic: initialIsPublic,
  });
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [currentCoverUrl, setCurrentCoverUrl] = useState(initialCoverImageUrl);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { title, description, isPublic } = form;

  async function handleSave() {
    setSaving(true);
    try {
      await updateBook.mutateAsync({ bookId, title, description: description || null, isPublic });
      setSaveMsg("Saved");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2500);
    }
  }

  async function handlePublishToggle() {
    setSaving(true);
    const newStatus = currentStatus === "published" ? "draft" : "published";
    try {
      await updateBook.mutateAsync({ bookId, title, description: description || null, isPublic, status: newStatus });
      setCurrentStatus(newStatus);
      setSaveMsg(newStatus === "published" ? "Published!" : "Moved to drafts");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2500);
    }
  }

  async function handleCoverUpload(file: File) {
    setCoverUploading(true);
    try {
      const url = await uploadCover(userId, bookId, file);
      await updateBook.mutateAsync({ bookId, coverImageUrl: url });
      setCurrentCoverUrl(url);
    } finally {
      setCoverUploading(false);
    }
  }

  const firstPageId = pages[0]?.id;
  const canPublish = pages.some((p) => p.outlineUrl);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-gray-100 bg-white flex items-center justify-between px-4 shrink-0">
        <Link
          href="/studio"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Studio
        </Link>
        <span className="text-sm font-medium text-gray-600 truncate max-w-[200px]">
          {book?.title ?? "…"}
        </span>
        {firstPageId && (
          <a
            href={`/colouring/${bookId}/${firstPageId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
          >
            Preview ↗
          </a>
        )}
        {!firstPageId && <span className="w-16" />}
      </div>

      {/* Body: pages left, metadata right */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Pages column */}
        <div className="flex-1 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-100">
          <PageList bookId={bookId} pages={pages} />
        </div>

        {/* Metadata panel */}
        <div className="w-full lg:w-80 shrink-0 overflow-y-auto bg-white">
          <div className="p-5 space-y-5">
            <h2 className="text-sm font-bold text-gray-800">Book details</h2>

            {/* Cover image */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Cover image</p>
              <div
                className="relative w-full aspect-[3/4] max-w-[140px] rounded-xl overflow-hidden bg-orange-50 border-2 border-dashed border-gray-200 hover:border-[#ff6b6b] cursor-pointer transition-colors flex items-center justify-center"
                onClick={() => coverInputRef.current?.click()}
              >
                {currentCoverUrl ? (
                  <img
                    src={currentCoverUrl!}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl opacity-20">📖</span>
                )}
                {coverUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <span className="text-xs text-gray-500">Uploading…</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 right-1.5 bg-white/90 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  {currentCoverUrl ? "Change" : "Upload"}
                </div>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCoverUpload(f);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 focus:border-[#ff6b6b] text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 focus:border-[#ff6b6b] text-sm resize-none"
              />
            </div>

            {/* Visibility */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Visibility</p>
              <div className="flex gap-2">
                {(
                  [
                    { val: false, icon: "🔒", label: "Private" },
                    { val: true, icon: "🌍", label: "Public" },
                  ] as const
                ).map(({ val, icon, label }) => (
                  <label
                    key={label}
                    className={`flex-1 flex items-center gap-1.5 p-2.5 rounded-xl border-2 cursor-pointer text-sm transition-colors ${
                      isPublic === val
                        ? "border-[#ff6b6b] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={isPublic === val}
                      onChange={() => setForm((f) => ({ ...f, isPublic: val }))}
                    />
                    {icon} {label}
                  </label>
                ))}
              </div>
            </div>

            {saveMsg && (
              <p className="text-sm text-green-600 text-center font-medium">{saveMsg}</p>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 rounded-xl border-2 border-[#ff6b6b] text-[#ff6b6b] text-sm font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save draft"}
              </button>

              <button
                onClick={handlePublishToggle}
                disabled={saving || (!canPublish && currentStatus !== "published")}
                title={
                  !canPublish && currentStatus !== "published"
                    ? "Add at least one page with an illustration first"
                    : undefined
                }
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  currentStatus === "published"
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-[#ff6b6b] text-white hover:bg-[#e04f4f]"
                }`}
              >
                {currentStatus === "published" ? "Unpublish" : "Publish book"}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              {currentStatus === "published" && isPublic
                ? "Visible in the public Library"
                : currentStatus === "published"
                ? "Published but only visible to you"
                : "Draft — not shown in Library"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
