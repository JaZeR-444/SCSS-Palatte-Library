"use client";

/* ------------------------------------------------------------------ *
 * Interactive image color picker.                                     *
 *                                                                    *
 * Renders an uploaded image and lets the user eyedrop exact pixels    *
 * (with a zoom loupe) or one-click auto-detected dominant colors.     *
 * Picks accumulate in a tray; "Apply" hands the list back to the      *
 * parent. Sampling is fully client-side — nothing is uploaded.        *
 * ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import { Check, Plus, X, Pipette, Loader2 } from "lucide-react";
import { extractImageColors } from "@/utils/image-colors";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";

const MAX_COLORS = 35;
const LOUPE_SIZE = 96; // rendered px
const LOUPE_ZOOM = 8; // magnification factor

function toHex(n: number): string {
  return Math.min(255, Math.max(0, Math.round(n)))
    .toString(16)
    .padStart(2, "0");
}

type Hover = { x: number; y: number; hex: string | null } | null;

export function ImageColorPicker({
  file,
  onApply,
  onCancel,
}: {
  file: File;
  onApply: (hexes: string[]) => void;
  onCancel: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [detected, setDetected] = useState<string[]>([]);
  const [tray, setTray] = useState<string[]>([]);
  const [hover, setHover] = useState<Hover>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Backing canvas (offscreen, full sampling resolution) + its pixel buffer.
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgDataRef = useRef<{
    data: Uint8ClampedArray;
    w: number;
    h: number;
  } | null>(null);
  const loupeRef = useRef<HTMLCanvasElement | null>(null);

  // Load image → object URL for display + backing canvas for sampling.
  useEffect(() => {
    // Guards against stale async handlers from a prior run (StrictMode
    // double-invoke, or a fast file swap) mutating state after cleanup —
    // notably the revoked-URL onerror that would otherwise flag a false error.
    let cancelled = false;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setLoading(true);
    setError(null);
    setTray([]);
    setHover(null);

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const cap = 1400; // bound memory on huge images
      const scale = Math.min(1, cap / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        setError("Couldn't read that image.");
        setLoading(false);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      bgCanvasRef.current = canvas;
      try {
        const { data } = ctx.getImageData(0, 0, w, h);
        imgDataRef.current = { data, w, h };
      } catch {
        setError("Couldn't read pixels from that image.");
      }
      setLoading(false);
    };
    img.onerror = () => {
      if (cancelled) return;
      setError("Couldn't read that image.");
      setLoading(false);
    };
    img.src = url;

    // Auto-detected dominant colors (reuses the shared extractor).
    extractImageColors(file, 8)
      .then((c) => {
        if (!cancelled) setDetected(c);
      })
      .catch(() => {
        if (!cancelled) setDetected([]);
      });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const sampleAt = (nx: number, ny: number): string | null => {
    const d = imgDataRef.current;
    if (!d) return null;
    const px = Math.min(d.w - 1, Math.max(0, Math.round(nx * (d.w - 1))));
    const py = Math.min(d.h - 1, Math.max(0, Math.round(ny * (d.h - 1))));
    const i = (py * d.w + px) * 4;
    if (d.data[i + 3] < 8) return null; // transparent pixel
    return `#${toHex(d.data[i])}${toHex(d.data[i + 1])}${toHex(
      d.data[i + 2],
    )}`.toUpperCase();
  };

  const drawLoupe = (nx: number, ny: number) => {
    const bg = bgCanvasRef.current;
    const lc = loupeRef.current;
    if (!bg || !lc) return;
    const ctx = lc.getContext("2d");
    if (!ctx) return;
    const srcW = LOUPE_SIZE / LOUPE_ZOOM;
    const cx = nx * bg.width;
    const cy = ny * bg.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, LOUPE_SIZE, LOUPE_SIZE);
    ctx.drawImage(
      bg,
      cx - srcW / 2,
      cy - srcW / 2,
      srcW,
      srcW,
      0,
      0,
      LOUPE_SIZE,
      LOUPE_SIZE,
    );
    // Center cell crosshair marks the exact sampled pixel.
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      LOUPE_SIZE / 2 - LOUPE_ZOOM / 2,
      LOUPE_SIZE / 2 - LOUPE_ZOOM / 2,
      LOUPE_ZOOM,
      LOUPE_ZOOM,
    );
  };

  const coords = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      nx: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      ny: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (loading || error) return;
    const { nx, ny, x, y } = coords(e);
    setHover({ x, y, hex: sampleAt(nx, ny) });
    drawLoupe(nx, ny);
  };

  const addColor = (hex: string) => {
    setTray((prev) => {
      if (prev.length >= MAX_COLORS) {
        showToast(`A palette can hold at most ${MAX_COLORS} colors.`);
        return prev;
      }
      playSound("click");
      return [...prev, hex];
    });
  };

  const onPick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (loading || error) return;
    const { nx, ny } = coords(e);
    const hex = sampleAt(nx, ny);
    if (hex) addColor(hex);
  };

  const removeAt = (i: number) => {
    playSound("click");
    setTray((prev) => prev.filter((_, idx) => idx !== i));
  };

  const apply = () => {
    if (!tray.length) return;
    playSound("success");
    onApply(tray);
  };

  const trayFull = tray.length >= MAX_COLORS;

  return (
    <div className="rounded-[2rem] border border-indigo-100 dark:border-indigo-950/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Pipette className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
            Pick colors from image
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-full bg-white/70 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-300 transition-all cursor-pointer"
          aria-label="Close image picker"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-4 items-start">
        {/* Image + loupe */}
        <div className="relative">
          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 py-16 text-xs font-bold text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading image…
            </div>
          )}
          {error && !loading && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-16 text-center text-xs font-bold text-red-500">
              {error}
            </div>
          )}
          {src && !error && (
            <div
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
              onClick={onPick}
              className="relative block cursor-crosshair select-none overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 leading-[0]"
              title="Click to sample a color"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Source for color extraction"
                draggable={false}
                className="block w-full h-auto max-h-[340px] object-contain bg-[repeating-conic-gradient(#e5e7eb_0_25%,transparent_0_50%)] bg-[length:16px_16px]"
              />

              {hover && !loading && (
                <div
                  className="pointer-events-none absolute z-10 flex flex-col items-center gap-1"
                  style={{
                    left: hover.x,
                    top: hover.y,
                    transform: "translate(-50%, calc(-100% - 16px))",
                  }}
                >
                  <canvas
                    ref={loupeRef}
                    width={LOUPE_SIZE}
                    height={LOUPE_SIZE}
                    style={{ width: LOUPE_SIZE, height: LOUPE_SIZE }}
                    className="rounded-full border-2 border-white shadow-xl ring-1 ring-black/10"
                  />
                  <span className="rounded-md bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shadow">
                    {hover.hex ?? "—"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suggestions + tray */}
        <div className="space-y-4">
          {/* Auto-detected */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                Detected colors
              </span>
              {detected.length > 0 && (
                <button
                  type="button"
                  onClick={() => detected.forEach(addColor)}
                  disabled={trayFull}
                  className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 disabled:opacity-40 cursor-pointer"
                >
                  Add all
                </button>
              )}
            </div>
            {detected.length ? (
              <div className="flex flex-wrap gap-1.5">
                {detected.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => addColor(hex)}
                    disabled={trayFull}
                    title={`Add ${hex}`}
                    className="group relative h-8 w-8 rounded-lg border border-black/10 shadow-sm transition-transform hover:scale-110 disabled:opacity-40 cursor-pointer"
                    style={{ backgroundColor: hex }}
                    aria-label={`Add color ${hex}`}
                  >
                    <Plus className="absolute inset-0 m-auto h-3.5 w-3.5 text-white opacity-0 drop-shadow group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] italic text-gray-400">
                {loading ? "Analyzing…" : "No dominant colors found."}
              </p>
            )}
          </div>

          {/* Tray */}
          <div>
            <span className="mb-2 block text-[9px] font-black uppercase tracking-widest text-gray-400">
              Selected ({tray.length})
            </span>
            {tray.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tray.map((hex, i) => (
                  <button
                    key={`${hex}-${i}`}
                    type="button"
                    onClick={() => removeAt(i)}
                    title={`Remove ${hex}`}
                    className="group relative h-8 w-8 rounded-lg border border-black/10 shadow-sm transition-transform hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: hex }}
                    aria-label={`Remove color ${hex}`}
                  >
                    <X className="absolute inset-0 m-auto h-3.5 w-3.5 text-white opacity-0 drop-shadow group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] italic text-gray-400">
                Click the image or a detected color to add it here.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={apply}
            disabled={!tray.length}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            Apply {tray.length || ""} to palette
          </button>
        </div>
      </div>
    </div>
  );
}
