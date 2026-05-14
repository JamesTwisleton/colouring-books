"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useColouringEngine } from "./useColouringEngine";

interface ColouringCanvasProps {
  outlineUrl: string;
  animatableElementsUrl: string;
  bookId: string;
  pageId: string;
  initialColouredImageUrl?: string;
  onSave?: (blob: Blob, fillPercentage: number) => void;
  prevPageId?: string;
  nextPageId?: string;
  pageNumber: number;
  totalPages: number;
}

const PALETTE = [
  "#2C3E50",
  "#E74C3C",
  "#E67E22",
  "#F1C40F",
  "#27AE60",
  "#2980B9",
  "#8E44AD",
  "#E91E8C",
  "#795548",
  "#FFFFFF",
];

const BRUSH_SIZES = [4, 8, 14, 22, 32];

// Percentage of canvas that must be coloured before the next page unlocks
const NEXT_PAGE_THRESHOLD = 0.6;

export default function ColouringCanvas({
  outlineUrl,
  animatableElementsUrl,
  bookId,
  pageId,
  initialColouredImageUrl,
  onSave,
  prevPageId,
  nextPageId,
  pageNumber,
  totalPages,
}: ColouringCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [brushColour, setBrushColour] = useState(PALETTE[0]);
  const [brushWidth, setBrushWidth] = useState(BRUSH_SIZES[1]);
  const [brushOpacity] = useState(1.0);
  const [completed, setCompleted] = useState(false);
  const [fill, setFill] = useState(0); // 0–1

  const fillPct = Math.round(fill * 100);
  const canGoNext = !!nextPageId && fill >= NEXT_PAGE_THRESHOLD;

  useColouringEngine({
    containerRef,
    outlineUrl,
    animatableElementsUrl,
    initialColouredImageUrl,
    brushColour,
    brushWidth,
    brushOpacity,
    onSave,
    onComplete: () => setCompleted(true),
    onFillUpdate: setFill,
  });

  // silence unused warning — pageId is in the URL but the engine doesn't need it
  void pageId;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white relative">

      {/* ─── Top nav bar ─── */}
      <div className="h-12 border-b border-gray-100 bg-white flex items-center justify-between px-4 shrink-0 z-10">
        <Link
          href="/library"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Library
        </Link>

        <span className="text-sm font-medium text-gray-600">
          Page {pageNumber} of {totalPages}
        </span>

        <div className="flex items-center gap-2">
          {prevPageId && (
            <button
              onClick={() => router.push(`/colouring/${bookId}/${prevPageId}`)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Prev
            </button>
          )}
          {nextPageId && (
            <button
              onClick={() => router.push(`/colouring/${bookId}/${nextPageId}`)}
              disabled={!canGoNext}
              title={
                canGoNext
                  ? "Go to next page"
                  : `Colour ${Math.round(NEXT_PAGE_THRESHOLD * 100)}% of this page to unlock the next one (${fillPct}% so far)`
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                canGoNext
                  ? "bg-[#ff6b6b] text-white hover:bg-[#e04f4f]"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Fill progress bar — shows while next page is locked */}
      {nextPageId && fill < NEXT_PAGE_THRESHOLD && (
        <div className="h-1 bg-gray-100 shrink-0">
          <div
            className="h-full bg-[#ff6b6b] transition-all duration-500"
            style={{ width: `${(fill / NEXT_PAGE_THRESHOLD) * 100}%` }}
          />
        </div>
      )}

      {/* Canvas area — touch-action:none prevents scroll/zoom during drawing */}
      <div
        ref={containerRef}
        className="flex-1 canvas-container overflow-hidden"
        style={{ touchAction: "none", userSelect: "none" }}
      />

      {/* ─── Brush toolbar ─── */}
      <div className="h-16 border-t border-gray-100 bg-white flex items-center gap-4 px-5 shrink-0">
        <div className="flex items-center gap-1.5">
          {PALETTE.map((colour) => (
            <button
              key={colour}
              title={colour}
              style={{
                backgroundColor: colour,
                border:
                  brushColour === colour
                    ? "3px solid #374151"
                    : colour === "#FFFFFF"
                    ? "2px solid #d1d5db"
                    : "2px solid transparent",
              }}
              className="w-7 h-7 rounded-full transition-transform active:scale-90"
              onClick={() => setBrushColour(colour)}
            />
          ))}
        </div>

        <div className="w-px h-8 bg-gray-200 shrink-0" />

        <div className="flex items-center gap-2">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              title={`${size}px`}
              style={{
                width: Math.max(10, size * 0.6),
                height: Math.max(10, size * 0.6),
                backgroundColor: brushWidth === size ? brushColour : "#9ca3af",
                border: brushWidth === size ? "2px solid #374151" : "none",
              }}
              className="rounded-full transition-transform active:scale-90 shrink-0"
              onClick={() => setBrushWidth(size)}
            />
          ))}
        </div>
      </div>

      {/* Completion overlay */}
      {completed && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
          style={{ zIndex: 20 }}
        >
          <div className="bg-white rounded-3xl shadow-xl px-10 py-8 text-center pointer-events-auto max-w-sm">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-[#ff6b6b] mb-1">
              Amazing work!
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              You&apos;ve coloured this whole page!
            </p>
            {nextPageId && (
              <button
                onClick={() =>
                  router.push(`/colouring/${bookId}/${nextPageId}`)
                }
                className="px-6 py-2.5 bg-[#ff6b6b] text-white rounded-xl text-sm font-semibold hover:bg-[#e04f4f] transition-colors"
              >
                Next page →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
