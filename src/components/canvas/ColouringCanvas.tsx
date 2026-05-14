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

// Full palette for tablet+ (scrollable row)
const PALETTE = [
  // Neutrals
  "#1a1a1a", "#555555", "#999999", "#cccccc", "#FFFFFF",
  // Reds & pinks
  "#E74C3C", "#FF6B6B", "#FF8FAB", "#E91E8C", "#C2185B",
  // Oranges & yellows
  "#E67E22", "#FF9800", "#FFD54F", "#F1C40F", "#FFF176",
  // Greens
  "#27AE60", "#66BB6A", "#A5D6A7", "#26C6DA", "#00ACC1",
  // Blues & purples
  "#2980B9", "#42A5F5", "#90CAF9", "#8E44AD", "#CE93D8",
  // Browns & skin tones
  "#795548", "#BCAAA4", "#FFCCBC", "#FFB74D",
];

// 20-colour curated subset for the mobile 2×10 grid — all visible at once, no scroll
const MOBILE_PALETTE = [
  "#1a1a1a", "#777777", "#E74C3C", "#E67E22", "#F1C40F",
  "#27AE60", "#1ABC9C", "#2980B9", "#8E44AD", "#E91E8C",
  "#FFFFFF", "#CCCCCC", "#FF6B6B", "#FFB74D", "#FFF176",
  "#A5D6A7", "#90CAF9", "#CE93D8", "#795548", "#FFCCBC",
];

const BRUSH_SIZES = [4, 8, 14, 22, 32];

const NEXT_PAGE_THRESHOLD = 0.6;

function FillRing({ pct }: { pct: number }) {
  const r = 17;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct, 100);
  const dash = (filled / 100) * circ;
  return (
    <div className="flex flex-col items-center justify-center shrink-0 w-14">
      <svg width="42" height="42" viewBox="0 0 42 42">
        {/* Track */}
        <circle cx="21" cy="21" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
        {/* Fill arc — starts at top (offset by ¼ circumference) */}
        <circle
          cx="21" cy="21" r={r}
          fill="none"
          stroke={pct >= 100 ? "#27AE60" : "#ff6b6b"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          style={{ transition: "stroke-dasharray 0.4s ease, stroke 0.4s ease" }}
        />
        <text x="21" y="25" textAnchor="middle" fontSize="9" fontWeight="700" fill="#374151">
          {filled}%
        </text>
      </svg>
      <span className="text-[10px] text-gray-400 leading-none mt-0.5">coloured</span>
    </div>
  );
}

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

  const [brushColour, setBrushColour] = useState(PALETTE[5]); // red as default
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

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 canvas-container overflow-hidden"
        style={{ touchAction: "none", userSelect: "none" }}
      />

      {/* ─── Toolbar ───────────────────────────────────────────────────────
           Mobile  (<sm): 2×10 colour grid (all colours visible, no scroll)
                          + brush sizes + fill ring below.
           Tablet+ (≥sm): single row — palette scrolls, brush + ring to right.
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white shrink-0 pb-safe-min-2">

        {/* ── Mobile layout ── */}
        <div className="sm:hidden">
          {/* 2×10 grid — all 20 colours visible simultaneously */}
          <div className="grid grid-cols-10 gap-1.5 px-3 pt-2.5 pb-1">
            {MOBILE_PALETTE.map((colour) => (
              <button
                key={colour}
                title={colour}
                onClick={() => setBrushColour(colour)}
                style={{
                  backgroundColor: colour,
                  border:
                    brushColour === colour
                      ? "3px solid #374151"
                      : colour === "#FFFFFF"
                      ? "2px solid #d1d5db"
                      : "2px solid transparent",
                }}
                className="w-full aspect-square rounded-full transition-transform active:scale-90"
              />
            ))}
          </div>

          {/* Brush sizes + fill ring */}
          <div className="flex items-center gap-3 px-3 pb-2">
            <div className="flex items-center gap-2 flex-1">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  title={`${size}px`}
                  onClick={() => setBrushWidth(size)}
                  style={{
                    width: Math.max(12, size * 0.7),
                    height: Math.max(12, size * 0.7),
                    backgroundColor: brushWidth === size ? brushColour : "#9ca3af",
                    border: brushWidth === size ? "2px solid #374151" : "none",
                    flexShrink: 0,
                  }}
                  className="rounded-full transition-transform active:scale-90"
                />
              ))}
            </div>
            <div className="w-px h-8 bg-gray-200 shrink-0" />
            <FillRing pct={fillPct} />
          </div>
        </div>

        {/* ── Tablet+ layout ── */}
        <div className="hidden sm:flex sm:items-center sm:gap-3 sm:px-4 sm:py-2">
          {/* Scrollable full palette */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 py-0.5">
            {PALETTE.map((colour) => (
              <button
                key={colour}
                title={colour}
                onClick={() => setBrushColour(colour)}
                style={{
                  backgroundColor: colour,
                  border:
                    brushColour === colour
                      ? "3px solid #374151"
                      : colour === "#FFFFFF"
                      ? "2px solid #d1d5db"
                      : "2px solid transparent",
                  flexShrink: 0,
                }}
                className="w-8 h-8 rounded-full transition-transform active:scale-90"
              />
            ))}
          </div>

          <div className="w-px h-8 bg-gray-200 shrink-0" />

          {/* Brush sizes + ring */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  title={`${size}px`}
                  onClick={() => setBrushWidth(size)}
                  style={{
                    width: Math.max(12, size * 0.7),
                    height: Math.max(12, size * 0.7),
                    backgroundColor: brushWidth === size ? brushColour : "#9ca3af",
                    border: brushWidth === size ? "2px solid #374151" : "none",
                    flexShrink: 0,
                  }}
                  className="rounded-full transition-transform active:scale-90"
                />
              ))}
            </div>
            <div className="w-px h-8 bg-gray-200 shrink-0" />
            <FillRing pct={fillPct} />
          </div>
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
                onClick={() => router.push(`/colouring/${bookId}/${nextPageId}`)}
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
