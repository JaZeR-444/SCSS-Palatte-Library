/* ------------------------------------------------------------------ *
 * Screenshot color extraction (client-only — uses canvas).           *
 *                                                                    *
 * Downscales the image, buckets pixels into a coarse color grid, and *
 * returns the most common, visually-distinct colors. Screenshots     *
 * yield colors only — type/shape/elevation can't be read from pixels.*
 * ------------------------------------------------------------------ */

function toHex(n: number): string {
  return Math.min(255, Math.max(0, Math.round(n)))
    .toString(16)
    .padStart(2, "0");
}

function dist(
  a: [number, number, number],
  b: [number, number, number],
): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2,
  );
}

/**
 * Extract up to `max` dominant colors from an image file. Resolves to
 * frequency-ranked, deduped #rrggbb strings.
 */
export async function extractImageColors(
  file: File,
  max = 8,
): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const size = 96; // downscale for speed
    const scale = Math.min(1, size / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    // Bucket into 4 bits/channel (4096 buckets), accumulate averages.
    const buckets = new Map<
      number,
      { r: number; g: number; b: number; n: number }
    >();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 128) continue; // skip transparent
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
      cur.r += r;
      cur.g += g;
      cur.b += b;
      cur.n += 1;
      buckets.set(key, cur);
    }

    const ranked = [...buckets.values()]
      .sort((x, y) => y.n - x.n)
      .map(
        (c) => [c.r / c.n, c.g / c.n, c.b / c.n] as [number, number, number],
      );

    const picked: [number, number, number][] = [];
    for (const c of ranked) {
      if (picked.length >= max) break;
      if (picked.some((p) => dist(p, c) < 32)) continue; // dedupe near-identical
      picked.push(c);
    }

    return picked.map(([r, g, b]) =>
      `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase(),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}
