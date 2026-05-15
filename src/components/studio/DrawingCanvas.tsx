"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { uploadIllustration } from "@/lib/storage/bookAssets";

type DrawTool = "brush" | "eraser" | "text";

// Fixed canvas dimensions (portrait A5-ish, 72dpi)
const CANVAS_W = 800;
const CANVAS_H = 1060;

const PALETTE = [
  "#000000", "#333333", "#666666", "#999999",
  "#E74C3C", "#E67E22", "#F1C40F", "#27AE60",
  "#2980B9", "#8E44AD", "#E91E8C", "#795548",
];

interface DrawingCanvasProps {
  userId: string;
  bookId: string;
  pageId: string;
  existingUrl?: string;
  onSaved: (url: string) => void;
}

export default function DrawingCanvas({
  userId,
  bookId,
  pageId,
  existingUrl,
  onSaved,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawTool>("brush");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [saving, setSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Text tool overlay
  const [textAt, setTextAt] = useState<{ cx: number; cy: number; pctX: number; pctY: number } | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Drawing state in refs to avoid re-renders on every pointer move
  const isDrawingRef = useRef(false);
  const lastPtRef = useRef({ x: 0, y: 0 });

  // History (ImageData snapshots) — max 50 steps
  const historyRef = useRef<ImageData[]>([]);
  const historyIdxRef = useRef(-1);

  function getCtx() {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  const syncUndoState = useCallback(() => {
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    // Discard any forward (redo) history
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    const snap = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    historyRef.current.push(snap);
    if (historyRef.current.length > 50) historyRef.current.shift();
    historyIdxRef.current = historyRef.current.length - 1;
    syncUndoState();
  }, [syncUndoState]);

  // Initialise canvas — white background, then load existing image if any
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (existingUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
        pushHistory();
      };
      img.onerror = () => pushHistory();
      img.src = existingUrl;
    } else {
      pushHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.putImageData(historyRef.current[historyIdxRef.current], 0, 0);
    syncUndoState();
  }, [syncUndoState]);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.putImageData(historyRef.current[historyIdxRef.current], 0, 0);
    syncUndoState();
  }, [syncUndoState]);

  // Keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z / Ctrl+Y)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  // Convert a PointerEvent to canvas pixel coordinates (accounts for CSS scaling)
  function canvasXY(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  function setupStroke(ctx: CanvasRenderingContext2D) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "source-over";
    if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = size * 5;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    // Text tool: show positioned input instead of drawing
    if (tool === "text") {
      const { x, y } = canvasXY(e);
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      setTextAt({
        cx: x,
        cy: y,
        pctX: ((e.clientX - rect.left) / rect.width) * 100,
        pctY: ((e.clientY - rect.top) / rect.height) * 100,
      });
      setTimeout(() => textInputRef.current?.focus(), 30);
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = canvasXY(e);
    const ctx = getCtx();
    if (!ctx) return;

    isDrawingRef.current = true;
    lastPtRef.current = { x, y };

    // Paint a dot on initial press
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.beginPath();
    ctx.arc(x, y, (tool === "eraser" ? size * 2.5 : size / 2), 0, Math.PI * 2);
    ctx.fill();
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const { x, y } = canvasXY(e);
    const ctx = getCtx();
    if (!ctx) return;

    setupStroke(ctx);
    ctx.beginPath();
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPtRef.current = { x, y };
  }

  function onPointerUp() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    pushHistory();
  }

  function commitText(value: string) {
    setTextAt(null);
    if (!textAt || !value.trim()) return;
    const ctx = getCtx();
    if (!ctx) return;
    const fontSize = Math.max(14, size * 6);
    ctx.font = `${fontSize}px system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillText(value.trim(), textAt.cx, textAt.cy);
    pushHistory();
  }

  function handleClear() {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    pushHistory();
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
          "image/png"
        )
      );
      const file = new File([blob], "illustration.png", { type: "image/png" });
      const url = await uploadIllustration(userId, bookId, pageId, file);
      onSaved(url);
    } finally {
      setSaving(false);
    }
  }

  const cursorStyle =
    tool === "text" ? "text" : tool === "eraser" ? "cell" : "crosshair";

  return (
    <div className="flex flex-col gap-3">
      {/* ─── Toolbar ─── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(
          [
            { t: "brush" as DrawTool, icon: "✏️", label: "Brush" },
            { t: "eraser" as DrawTool, icon: "◻", label: "Eraser" },
            { t: "text" as DrawTool, icon: "T", label: "Text" },
          ] as const
        ).map(({ t, icon, label }) => (
          <button
            key={t}
            title={label}
            onClick={() => setTool(t)}
            className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tool === t
                ? "bg-[#ff6b6b] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {icon}
          </button>
        ))}

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <button
          title="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo}
          className="px-2.5 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
        >
          ↩
        </button>
        <button
          title="Redo (Ctrl+Shift+Z)"
          onClick={redo}
          disabled={!canRedo}
          className="px-2.5 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
        >
          ↪
        </button>
        <button
          title="Clear canvas"
          onClick={handleClear}
          className="px-2.5 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          ✕ Clear
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <input
          type="range"
          min={1}
          max={40}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          title={`Size: ${size}px`}
          className="w-20 accent-[#ff6b6b]"
        />
        <span className="text-xs text-gray-400 w-6 text-right">{size}</span>
      </div>

      {/* ─── Colour palette ─── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {PALETTE.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => {
              setColor(c);
              if (tool === "eraser") setTool("brush");
            }}
            style={{
              backgroundColor: c,
              border:
                color === c && tool !== "eraser"
                  ? "3px solid #374151"
                  : "2px solid transparent",
            }}
            className="w-6 h-6 rounded-full transition-transform active:scale-90 shrink-0"
          />
        ))}
        {/* Custom colour picker */}
        <label
          className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 overflow-hidden cursor-pointer relative flex items-center justify-center"
          title="Custom colour"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              if (tool === "eraser") setTool("brush");
            }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
          <span className="text-[10px] text-gray-400 select-none">+</span>
        </label>
      </div>

      {/* ─── Canvas ─── */}
      <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-white" style={{ lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ cursor: cursorStyle, touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />

        {/* Floating text input — positioned in CSS % over the canvas */}
        {textAt && (
          <input
            ref={textInputRef}
            type="text"
            placeholder="Type here…"
            className="absolute bg-transparent outline-none border-b border-dashed border-gray-500 min-w-[80px] leading-none"
            style={{
              left: `${textAt.pctX}%`,
              top: `${textAt.pctY}%`,
              color,
              fontSize: `${Math.max(10, (size / CANVAS_W) * 100 * 6)}vw`,
              transform: "translateY(-100%)",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitText(e.currentTarget.value);
              if (e.key === "Escape") setTextAt(null);
            }}
            onBlur={(e) => commitText(e.target.value)}
          />
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl bg-[#ff6b6b] text-white text-sm font-semibold hover:bg-[#e04f4f] disabled:opacity-60 transition-colors"
      >
        {saving ? "Saving illustration…" : "Save illustration"}
      </button>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        Draw outlines on the white canvas. Children will colour on top of your drawing.
      </p>
    </div>
  );
}
