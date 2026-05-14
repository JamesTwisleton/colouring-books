"use client";

import { useRef, useState } from "react";
import { useColouringEngine } from "./useColouringEngine";

interface ColouringCanvasProps {
  outlineUrl: string;
  animatableElementsUrl: string;
  bookId: string;
  pageId: string;
  initialColouredImageUrl?: string;
  onSave?: (blob: Blob, fillPercentage: number) => void;
}

// Curated palette suited for a kids' colouring book
const PALETTE = [
  "#2C3E50", // near-black
  "#E74C3C", // red
  "#E67E22", // orange
  "#F1C40F", // yellow
  "#27AE60", // green
  "#2980B9", // blue
  "#8E44AD", // purple
  "#E91E8C", // pink
  "#795548", // brown
  "#FFFFFF", // white (eraser-style)
];

const BRUSH_SIZES = [4, 8, 14, 22, 32];

export default function ColouringCanvas({
  outlineUrl,
  animatableElementsUrl,
  initialColouredImageUrl,
  onSave,
}: ColouringCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [brushColour, setBrushColour] = useState(PALETTE[0]);
  const [brushWidth, setBrushWidth] = useState(BRUSH_SIZES[1]);
  const [brushOpacity] = useState(1.0);
  const [completed, setCompleted] = useState(false);

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
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Canvas area — touch-action:none prevents scroll/zoom during drawing */}
      <div
        ref={containerRef}
        className="flex-1 canvas-container overflow-hidden"
        style={{ touchAction: "none", userSelect: "none" }}
      />

      {/* ─── Brush toolbar (bottom strip, landscape-optimised) ─── */}
      <div className="h-16 border-t border-gray-100 bg-white flex items-center gap-4 px-5 shrink-0">
        {/* Colour palette */}
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

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 shrink-0" />

        {/* Brush sizes */}
        <div className="flex items-center gap-2">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              title={`${size}px`}
              style={{
                width: Math.max(10, size * 0.6),
                height: Math.max(10, size * 0.6),
                backgroundColor:
                  brushWidth === size ? brushColour : "#9ca3af",
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="bg-white rounded-3xl shadow-xl px-10 py-8 text-center pointer-events-auto max-w-sm">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-[#ff6b6b] mb-1">
              Amazing work!
            </h2>
            <p className="text-gray-500 text-sm">
              You&apos;ve coloured this whole page!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
