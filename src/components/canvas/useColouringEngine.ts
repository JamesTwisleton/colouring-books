"use client";

import { useEffect, useRef } from "react";
import type { AnimatableElementsConfig } from "@/types/colouring";
import {
  catmullRomToBezier,
  mirrorPoint,
  type Point,
} from "@/lib/pixi/catmullRom";
import {
  estimateFillPercentage,
  COMPLETION_THRESHOLD,
} from "@/lib/pixi/completionDetector";
import type { Application as PixiApplication } from "pixi.js";

interface PointerPoint extends Point {
  pressure: number;
}

export interface UseColouringEngineOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  outlineUrl: string;
  animatableElementsUrl: string;
  initialColouredImageUrl?: string;
  brushColour: string; // CSS hex e.g. "#FF6B6B"
  brushWidth: number; // base width in logical px
  brushOpacity: number; // 0–1
  onSave?: (blob: Blob, fillPercentage: number) => void;
  onComplete?: (fillPercentage: number) => void;
  onFillUpdate?: (fill: number) => void; // 0–1, called after every stroke
}

function hexToPixi(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function getCanvasPoint(
  e: PointerEvent,
  canvas: HTMLCanvasElement,
  logicalW: number,
  logicalH: number
): PointerPoint {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) * logicalW) / rect.width,
    y: ((e.clientY - rect.top) * logicalH) / rect.height,
    pressure: Math.max(0.05, Math.min(1, e.pressure > 0 ? e.pressure : 0.5)),
  };
}

export function useColouringEngine({
  containerRef,
  outlineUrl,
  animatableElementsUrl,
  initialColouredImageUrl,
  brushColour,
  brushWidth,
  brushOpacity,
  onSave,
  onComplete,
  onFillUpdate,
}: UseColouringEngineOptions) {
  const brushColourRef = useRef(brushColour);
  const brushWidthRef = useRef(brushWidth);
  const brushOpacityRef = useRef(brushOpacity);

  useEffect(() => {
    brushColourRef.current = brushColour;
  }, [brushColour]);
  useEffect(() => {
    brushWidthRef.current = brushWidth;
  }, [brushWidth]);
  useEffect(() => {
    brushOpacityRef.current = brushOpacity;
  }, [brushOpacity]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mutable cleanup state — written inside async init, read by sync cleanup
    let pixiApp: PixiApplication | null = null;
    let saveInterval: ReturnType<typeof setInterval>;
    let cancelled = false;
    let registeredCanvas: HTMLCanvasElement | null = null;
    let pointerHandlers: {
      down: (e: PointerEvent) => void;
      move: (e: PointerEvent) => void;
      up: (e: PointerEvent) => void;
      cancel: (e: PointerEvent) => void;
    } | null = null;

    (async () => {
      const {
        Application,
        Assets,
        Graphics,
        RenderTexture,
        Sprite,
        Container: PixiContainer,
      } = await import("pixi.js");
      const gsap = (await import("gsap")).default;

      if (cancelled || !containerRef.current) return;

      // ── 1. App init ──────────────────────────────────────────────────────────
      const app = new Application();
      await app.init({
        resizeTo: container,
        background: "#ffffff",
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (cancelled || !containerRef.current) {
        app.destroy();
        return;
      }

      pixiApp = app;
      const canvas = app.canvas as HTMLCanvasElement;
      registeredCanvas = canvas;
      container.appendChild(canvas);
      app.stage.sortableChildren = true;

      const W = app.screen.width;
      const H = app.screen.height;

      // ── 2. Layers ────────────────────────────────────────────────────────────
      const bgGfx = new Graphics().rect(0, 0, W, H).fill({ color: 0xffffff });
      bgGfx.zIndex = 1;
      app.stage.addChild(bgGfx);

      const drawRT = RenderTexture.create({ width: W, height: H });
      const drawSprite = new Sprite(drawRT);
      drawSprite.zIndex = 2;
      app.stage.addChild(drawSprite);

      const drawGfx = new Graphics(); // NOT added to stage — used as a "brush"

      const outlineLayer = new PixiContainer();
      outlineLayer.zIndex = 3;
      app.stage.addChild(outlineLayer);

      const animLayer = new PixiContainer();
      animLayer.zIndex = 4;
      app.stage.addChild(animLayer);

      // ── 3. Load assets ───────────────────────────────────────────────────────
      try {
        const tex = await Assets.load(outlineUrl);
        if (!cancelled) {
          const s = new Sprite(tex);
          const scale = Math.min(W / tex.width, H / tex.height);
          s.scale.set(scale);
          s.x = (W - tex.width * scale) / 2;
          s.y = (H - tex.height * scale) / 2;
          outlineLayer.addChild(s);
        }
      } catch {
        /* outline unavailable */
      }

      if (initialColouredImageUrl) {
        try {
          const tex = await Assets.load(initialColouredImageUrl);
          if (!cancelled) {
            const s = new Sprite(tex);
            s.width = W;
            s.height = H;
            app.renderer.render({ container: s, target: drawRT, clear: false });
          }
        } catch {
          /* no saved state */
        }
      }

      let animConfig: AnimatableElementsConfig | null = null;
      try {
        const resp = await fetch(animatableElementsUrl);
        animConfig = await resp.json();
      } catch {
        /* anim config unavailable */
      }

      if (cancelled) return;

      // ── 4. Drawing helpers ───────────────────────────────────────────────────
      function drawSegment(
        p0: Point,
        p1: PointerPoint,
        p2: PointerPoint,
        p3: Point
      ) {
        const colour = hexToPixi(brushColourRef.current);
        const alpha = brushOpacityRef.current;
        const pressure = Math.pow(p1.pressure, 0.7);
        const width = brushWidthRef.current * (0.3 + pressure * 0.7);
        const seg = catmullRomToBezier(p0, p1, p2, p3);

        drawGfx.clear();
        drawGfx
          .moveTo(seg.start.x, seg.start.y)
          .bezierCurveTo(
            seg.cp1.x,
            seg.cp1.y,
            seg.cp2.x,
            seg.cp2.y,
            seg.end.x,
            seg.end.y
          )
          .stroke({ color: colour, alpha, width, cap: "round", join: "round" });

        app.renderer.render({ container: drawGfx, target: drawRT, clear: false });
      }

      function drawDot(p: PointerPoint) {
        const colour = hexToPixi(brushColourRef.current);
        const alpha = brushOpacityRef.current;
        const r =
          (brushWidthRef.current * (0.3 + Math.pow(p.pressure, 0.7) * 0.7)) /
          2;
        drawGfx.clear();
        drawGfx.circle(p.x, p.y, r).fill({ color: colour, alpha });
        app.renderer.render({ container: drawGfx, target: drawRT, clear: false });
      }

      function flushBuffer(buf: PointerPoint[]) {
        const n = buf.length;
        if (n === 0) return;
        if (n === 1) { drawDot(buf[0]); return; }
        if (n === 2) {
          drawGfx.clear();
          const colour = hexToPixi(brushColourRef.current);
          const alpha = brushOpacityRef.current;
          const w = brushWidthRef.current * (0.3 + Math.pow(buf[0].pressure, 0.7) * 0.7);
          drawGfx.moveTo(buf[0].x, buf[0].y).lineTo(buf[1].x, buf[1].y)
            .stroke({ color: colour, alpha, width: w, cap: "round" });
          app.renderer.render({ container: drawGfx, target: drawRT, clear: false });
          return;
        }
        const syntheticEnd = mirrorPoint(buf[n - 1], buf[n - 2]);
        for (let i = Math.max(0, n - 3); i < n - 1; i++) {
          const p0 = i > 0 ? buf[i - 1] : mirrorPoint(buf[0], buf[1]);
          drawSegment(p0, buf[i], buf[i + 1], i + 2 < n ? buf[i + 2] : syntheticEnd);
        }
      }

      // ── 5. Completion ────────────────────────────────────────────────────────
      let completionFired = false;

      function checkCompletion() {
        if (cancelled) return;
        try {
          const { pixels } = app.renderer.extract.pixels({ target: drawSprite });
          const fill = estimateFillPercentage(pixels);
          onFillUpdate?.(fill);
          if (!completionFired && fill >= COMPLETION_THRESHOLD) {
            completionFired = true;
            triggerCompletionAnimation(fill);
          }
        } catch { /* ignore */ }
      }

      function triggerCompletionAnimation(fill: number) {
        if (!animConfig) { onComplete?.(fill); return; }
        const sx = W / animConfig.canvasWidth;
        const sy = H / animConfig.canvasHeight;

        animConfig.elements.forEach((el) => {
          const indicator = new Graphics()
            .rect(0, 0, el.w * sx, el.h * sy)
            .fill({ color: 0xffd700, alpha: 0.65 });
          const cx = el.x * sx + (el.w * sx) / 2;
          const cy = el.y * sy + (el.h * sy) / 2;
          indicator.x = cx - (el.w * sx) / 2;
          indicator.y = cy - (el.h * sy) / 2;
          indicator.pivot.set((el.w * sx) / 2, (el.h * sy) / 2);
          indicator.x = cx;
          indicator.y = cy;
          animLayer.addChild(indicator);

          const remove = () => animLayer.removeChild(indicator);
          switch (el.animation) {
            case "wagTail":
              gsap.to(indicator, { rotation: 0.35, duration: 0.18, yoyo: true, repeat: 14, ease: "sine.inOut", onComplete: remove });
              break;
            case "bounce":
              gsap.to(indicator, { y: indicator.y - 28, duration: 0.28, yoyo: true, repeat: 8, ease: "power2.out", onComplete: remove });
              break;
            case "float":
              gsap.to(indicator, { y: indicator.y - 18, duration: 1.1, yoyo: true, repeat: 4, ease: "sine.inOut", onComplete: remove });
              break;
            case "spin":
              gsap.to(indicator, { rotation: Math.PI * 4, duration: 1.5, ease: "power1.inOut", onComplete: remove });
              break;
            case "pulse":
              gsap.to(indicator.scale, { x: 1.4, y: 1.4, duration: 0.3, yoyo: true, repeat: 6, ease: "sine.inOut", onComplete: remove });
              break;
          }
        });
        onComplete?.(fill);
      }

      // ── 6. Auto-save ─────────────────────────────────────────────────────────
      async function saveDrawing() {
        if (!onSave || cancelled) return;
        try {
          const { pixels } = app.renderer.extract.pixels({ target: drawSprite });
          const fill = estimateFillPercentage(pixels);
          const base64 = await app.renderer.extract.base64({ target: drawSprite, format: "png" });
          const blob = await (await fetch(base64)).blob();
          onSave(blob, fill);
        } catch { /* ignore */ }
      }

      if (onSave) saveInterval = setInterval(saveDrawing, 30_000);

      // ── 7. Pointer events ────────────────────────────────────────────────────
      const strokeBuffer: PointerPoint[] = [];
      let drawing = false;

      const down = (e: PointerEvent) => {
        if (!e.isPrimary) return;
        canvas.setPointerCapture(e.pointerId);
        drawing = true;
        strokeBuffer.length = 0;
        strokeBuffer.push(getCanvasPoint(e, canvas, W, H));
      };

      const move = (e: PointerEvent) => {
        if (!drawing || !e.isPrimary) return;
        strokeBuffer.push(getCanvasPoint(e, canvas, W, H));
        const n = strokeBuffer.length;
        if (n >= 4) {
          drawSegment(strokeBuffer[n - 4], strokeBuffer[n - 3], strokeBuffer[n - 2], strokeBuffer[n - 1]);
        } else if (n === 3) {
          drawSegment(mirrorPoint(strokeBuffer[0], strokeBuffer[1]), strokeBuffer[0], strokeBuffer[1], strokeBuffer[2]);
        }
      };

      const up = (e: PointerEvent) => {
        if (!drawing || !e.isPrimary) return;
        drawing = false;
        strokeBuffer.push(getCanvasPoint(e, canvas, W, H));
        flushBuffer(strokeBuffer);
        strokeBuffer.length = 0;
        checkCompletion();
      };

      const cancel = () => {
        if (!drawing) return;
        drawing = false;
        flushBuffer(strokeBuffer);
        strokeBuffer.length = 0;
      };

      pointerHandlers = { down, move, up, cancel };
      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", cancel);
    })();

    // Sync cleanup — runs whether or not async init has completed
    return () => {
      cancelled = true;
      clearInterval(saveInterval);
      if (pointerHandlers && registeredCanvas) {
        registeredCanvas.removeEventListener("pointerdown", pointerHandlers.down);
        registeredCanvas.removeEventListener("pointermove", pointerHandlers.move);
        registeredCanvas.removeEventListener("pointerup", pointerHandlers.up);
        registeredCanvas.removeEventListener("pointercancel", pointerHandlers.cancel);
      }
      if (pixiApp) {
        const canvasEl = pixiApp.canvas as HTMLCanvasElement;
        pixiApp.destroy();
        canvasEl.parentNode?.removeChild(canvasEl);
        pixiApp = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
