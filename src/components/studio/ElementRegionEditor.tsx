"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { uploadElementsJson } from "@/lib/storage/bookAssets";
import type {
  AnimationType,
  AnimatableElement,
  AnimatableElementsConfig,
} from "@/types/colouring";

type RegionAnimation = AnimationType | "none";

interface Region {
  id: string;
  label: string;
  animation: RegionAnimation;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ANIMATION_OPTIONS: { value: RegionAnimation; label: string }[] = [
  { value: "none", label: "No animation" },
  { value: "spin", label: "Spin" },
  { value: "float", label: "Float up & down" },
  { value: "bounce", label: "Bounce" },
  { value: "wagTail", label: "Wag" },
  { value: "pulse", label: "Pulse" },
];

interface ElementRegionEditorProps {
  userId: string;
  bookId: string;
  pageId: string;
  illustrationUrl?: string;
  currentElementsUrl?: string;
  onSaved: (url: string) => void;
}

export default function ElementRegionEditor({
  userId,
  bookId,
  pageId,
  illustrationUrl,
  currentElementsUrl,
  onSaved,
}: ElementRegionEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"draw" | "select">("draw");
  const [saving, setSaving] = useState(false);

  // Mutable pointer state lives in a ref so pointer handlers stay stable
  const ptr = useRef({
    drawing: false,
    dragging: false,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  // Keep a ref to the current regions so the draw fn always sees them fresh
  const regionsRef = useRef(regions);
  useEffect(() => { regionsRef.current = regions; }, [regions]);

  const selectedIdRef = useRef(selectedId);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  // Load existing elements JSON
  useEffect(() => {
    if (!currentElementsUrl) return;
    fetch(currentElementsUrl)
      .then((r) => r.json())
      .then((cfg: AnimatableElementsConfig) => {
        setRegions(
          cfg.elements.map((el) => ({
            id: el.id,
            label: el.id,
            animation: el.animation,
            x: el.x,
            y: el.y,
            w: el.w,
            h: el.h,
          }))
        );
      })
      .catch(() => {});
  // Only load once, on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    const p = ptr.current;
    const curRegions = regionsRef.current;
    const curSelected = selectedIdRef.current;

    ctx.clearRect(0, 0, width, height);

    for (const region of curRegions) {
      const isSel = region.id === curSelected;
      // If dragging the selected region, show it at its dragged position
      const rx = isSel && p.dragging ? p.curX : region.x;
      const ry = isSel && p.dragging ? p.curY : region.y;

      ctx.fillStyle = isSel ? "rgba(255,107,107,0.18)" : "rgba(66,165,245,0.12)";
      ctx.strokeStyle = isSel ? "#ff6b6b" : "#42a5f5";
      ctx.lineWidth = isSel ? 2 : 1.5;
      ctx.fillRect(rx, ry, region.w, region.h);
      ctx.strokeRect(rx, ry, region.w, region.h);

      ctx.fillStyle = isSel ? "#ff6b6b" : "#42a5f5";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText(region.label || "element", rx + 5, ry + 14);
    }

    // In-progress draw rectangle
    if (p.drawing) {
      const rx = Math.min(p.startX, p.curX);
      const ry = Math.min(p.startY, p.curY);
      const rw = Math.abs(p.curX - p.startX);
      const rh = Math.abs(p.curY - p.startY);
      ctx.fillStyle = "rgba(255,107,107,0.08)";
      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.setLineDash([]);
    }
  }, []); // stable — reads everything from refs

  // Redraw whenever regions or selection change
  useEffect(() => { redraw(); }, [regions, selectedId, redraw]);

  // Sync canvas size to the rendered image (defined after redraw so the ref is stable)
  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    function syncSize() {
      if (!img || !canvas) return;
      const r = img.getBoundingClientRect();
      if (canvas.width !== r.width || canvas.height !== r.height) {
        canvas.width = r.width;
        canvas.height = r.height;
      }
      redraw();
    }

    const ro = new ResizeObserver(syncSize);
    ro.observe(img);
    img.addEventListener("load", syncSize);
    syncSize();
    return () => {
      ro.disconnect();
      img.removeEventListener("load", syncSize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [illustrationUrl]);

  function canvasXY(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hitTest(x: number, y: number) {
    return [...regionsRef.current]
      .reverse()
      .find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = canvasXY(e);
    e.currentTarget.setPointerCapture(e.pointerId);

    if (mode === "draw") {
      ptr.current = { ...ptr.current, drawing: true, startX: x, startY: y, curX: x, curY: y };
    } else {
      const hit = hitTest(x, y);
      if (hit) {
        setSelectedId(hit.id);
        selectedIdRef.current = hit.id;
        ptr.current = {
          ...ptr.current,
          dragging: true,
          curX: hit.x,
          curY: hit.y,
          offsetX: x - hit.x,
          offsetY: y - hit.y,
        };
      } else {
        setSelectedId(null);
        selectedIdRef.current = null;
      }
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = canvasXY(e);
    const p = ptr.current;

    if (mode === "draw" && p.drawing) {
      ptr.current = { ...p, curX: x, curY: y };
      redraw();
    } else if (mode === "select" && p.dragging) {
      ptr.current = { ...p, curX: x - p.offsetX, curY: y - p.offsetY };
      redraw();
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = canvasXY(e);
    const p = ptr.current;

    if (mode === "draw" && p.drawing) {
      ptr.current = { ...p, drawing: false };
      const rx = Math.min(p.startX, x);
      const ry = Math.min(p.startY, y);
      const rw = Math.abs(x - p.startX);
      const rh = Math.abs(y - p.startY);

      if (rw > 10 && rh > 10) {
        const newRegion: Region = {
          id: `element_${Date.now()}`,
          label: `element ${regionsRef.current.length + 1}`,
          animation: "bounce",
          x: rx, y: ry, w: rw, h: rh,
        };
        setRegions((prev) => [...prev, newRegion]);
        setSelectedId(newRegion.id);
        setMode("select");
      } else {
        redraw();
      }
    } else if (mode === "select" && p.dragging) {
      const finalX = p.curX;
      const finalY = p.curY;
      const sid = selectedIdRef.current;
      ptr.current = { ...p, dragging: false };
      if (sid) {
        setRegions((prev) =>
          prev.map((r) => r.id === sid ? { ...r, x: finalX, y: finalY } : r)
        );
      }
    }
  }

  const selected = regions.find((r) => r.id === selectedId);

  function updateSelected(changes: Partial<Region>) {
    setRegions((prev) =>
      prev.map((r) => r.id === selectedId ? { ...r, ...changes } : r)
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const config: AnimatableElementsConfig = {
        version: 1,
        canvasWidth: canvas?.width ?? 800,
        canvasHeight: canvas?.height ?? 600,
        elements: regions
          .filter((r) => r.animation !== "none")
          .map(
            (r): AnimatableElement => ({
              id: r.label || r.id,
              x: Math.round(r.x),
              y: Math.round(r.y),
              w: Math.round(r.w),
              h: Math.round(r.h),
              animation: r.animation as AnimationType,
            })
          ),
      };
      const url = await uploadElementsJson(userId, bookId, pageId, config);
      onSaved(url);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode("draw")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "draw"
              ? "bg-[#ff6b6b] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          ✏️ Draw
        </button>
        <button
          onClick={() => setMode("select")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "select"
              ? "bg-[#ff6b6b] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          ↖ Select
        </button>
        <span className="flex-1" />
        <span className="text-xs text-gray-400">
          {regions.length} {regions.length === 1 ? "region" : "regions"}
        </span>
      </div>

      {/* Canvas overlay on illustration */}
      <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
        {illustrationUrl ? (
          <>
            <img
              ref={imgRef}
              src={illustrationUrl}
              alt="Illustration"
              className="block w-full select-none"
              draggable={false}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{
                cursor: mode === "draw" ? "crosshair" : "default",
                touchAction: "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-36 text-sm text-gray-400">
            Upload an illustration first to mark animated regions.
          </div>
        )}
      </div>

      {/* Selected region properties */}
      {selected && (
        <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Selected region
            </p>
            <button
              onClick={() => {
                setRegions((prev) => prev.filter((r) => r.id !== selectedId));
                setSelectedId(null);
              }}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={selected.label}
              onChange={(e) => updateSelected({ label: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Animation on completion
            </label>
            <select
              value={selected.animation}
              onChange={(e) =>
                updateSelected({ animation: e.target.value as RegionAnimation })
              }
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 bg-white"
            >
              {ANIMATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Region list */}
      {regions.length > 0 && (
        <div className="space-y-1">
          {regions.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedId(r.id);
                setMode("select");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                r.id === selectedId
                  ? "bg-orange-100 text-[#ff6b6b]"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-sm border-2 shrink-0"
                style={{ borderColor: r.id === selectedId ? "#ff6b6b" : "#42a5f5" }}
              />
              <span className="flex-1 truncate">{r.label || r.id}</span>
              <span className="text-xs text-gray-400">{r.animation}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl bg-[#ff6b6b] text-white text-sm font-semibold hover:bg-[#e04f4f] disabled:opacity-60 transition-colors"
      >
        {saving ? "Saving…" : "Save animated elements"}
      </button>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        Optional — regions marked here will animate when the child finishes colouring.
        Skip this step if you don&apos;t need animations.
      </p>
    </div>
  );
}
