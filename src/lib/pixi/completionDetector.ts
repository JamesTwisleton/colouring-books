/**
 * Estimates what percentage of the canvas has been colored by sampling
 * the alpha channel of the drawing layer.
 *
 * Called on `pointerup` (not every frame) to avoid GPU readback overhead.
 *
 * @param pixels - RGBA pixel data from renderer.extract.pixels()
 * @param sampleStep - Skip every N pixels for performance (default 4 = 1/16 samples)
 * @returns Fill ratio from 0 to 1
 */
export function estimateFillPercentage(
  pixels: Uint8ClampedArray,
  sampleStep = 4
): number {
  let colored = 0;
  let total = 0;

  // Pixel data is packed RGBA — alpha is at index [i*4 + 3]
  for (let i = 0; i < pixels.length; i += 4 * sampleStep) {
    const alpha = pixels[i + 3];
    if (alpha > 20) colored++;
    total++;
  }

  return total > 0 ? colored / total : 0;
}

/** Threshold above which a page is considered "completed" */
export const COMPLETION_THRESHOLD = 0.85;
