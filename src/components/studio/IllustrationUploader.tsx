"use client";

import { useRef, useState } from "react";
import { uploadIllustration } from "@/lib/storage/bookAssets";
import DrawingCanvas from "./DrawingCanvas";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

interface IllustrationUploaderProps {
  userId: string;
  bookId: string;
  pageId: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
}

export default function IllustrationUploader({
  userId,
  bookId,
  pageId,
  currentUrl,
  onUploaded,
}: IllustrationUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "draw">("upload");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a PNG, SVG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File too large — maximum is 10 MB.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadIllustration(userId, bookId, pageId, file);
      onUploaded(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-medium">
        {(["upload", "draw"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 transition-colors capitalize ${
              tab === t
                ? "bg-[#ff6b6b] text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t === "upload" ? "⬆ Upload" : "✏️ Draw"}
          </button>
        ))}
      </div>

      {tab === "upload" ? (
        <>
          <div
            className={`relative border-2 border-dashed rounded-2xl transition-colors ${
              dragging
                ? "border-[#ff6b6b] bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            } ${currentUrl ? "p-2" : "p-8"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            {currentUrl ? (
              <div className="relative">
                <img
                  src={currentUrl}
                  alt="Illustration preview"
                  className="w-full rounded-xl object-contain max-h-72 bg-gray-50"
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1.5 bg-white/90 hover:bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 shadow-sm transition-colors"
                >
                  Replace
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="text-4xl">🖼️</div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Drop your illustration here
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    PNG, SVG, JPEG or WebP — max 10 MB
                  </p>
                </div>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Browse files
                </button>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                <p className="text-sm text-gray-500">Uploading…</p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Tip: use a PNG with a white or transparent background so children colour between the lines.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </>
      ) : (
        <DrawingCanvas
          userId={userId}
          bookId={bookId}
          pageId={pageId}
          existingUrl={currentUrl}
          onSaved={(url) => {
            onUploaded(url);
            setTab("upload"); // Switch back to preview after save
          }}
        />
      )}
    </div>
  );
}
