// In-house Mathematical Gemini Watermark Detection & Reverse Alpha Blending Engine
// 100% Native TypeScript implementation — zero external libraries, zero remote APIs

import { getGeminiTemplate } from "./geminiAlphaMaps.ts";

export interface GeminiDetectionResult {
  found: boolean;
  x: number;
  y: number;
  size: number;
  variant?: string;
  confidence: number;
  source: string;
}

export interface GeminiRemovalOptions {
  sensitivity?: number;
  alphaGain?: number;
  forceRemoval?: boolean;
  forcePosition?: { x: number; y: number; size: number };
}

export interface GeminiRemovalResult {
  cleanedData: Uint8ClampedArray;
  detected: boolean;
  detection: GeminiDetectionResult;
  maskPixels: number;
}

interface SeedConfig {
  size: number;
  mr: number;
  mb: number;
  variant: string;
}

/**
 * Returns prioritized catalog seeds based on image resolution.
 */
function getSeedsForDimensions(w: number, h: number): SeedConfig[] {
  const maxDim = Math.max(w, h);

  if (maxDim >= 1700) {
    // 2K / 4K resolutions (2048x2048, 2400x1792, 2816x1536)
    return [
      { size: 96, mr: 192, mb: 192, variant: "96-20260520" }, // Modern 2K large margin
      { size: 96, mr: 64, mb: 64, variant: "96" },           // Legacy standard 2K
      { size: 48, mr: 96, mb: 96, variant: "48" },
      { size: 48, mr: 89, mb: 89, variant: "48" },           // 2752x1536 JPEG anchor
      { size: 96, mr: 96, mb: 96, variant: "96" },
      { size: 48, mr: 32, mb: 32, variant: "48" },
      { size: 36, mr: 96, mb: 96, variant: "36-v2" },
    ];
  }

  if (maxDim >= 700) {
    // 1K resolutions (1024x1024, 896x1200)
    return [
      { size: 48, mr: 96, mb: 96, variant: "48" },           // 1K large margin
      { size: 48, mr: 32, mb: 32, variant: "48" },           // 1K standard
      { size: 96, mr: 64, mb: 64, variant: "96" },           // Legacy 1K
      { size: 48, mr: 64, mb: 64, variant: "48" },
      { size: 36, mr: 96, mb: 96, variant: "36-v2" },
      { size: 96, mr: 192, mb: 192, variant: "96-20260520" },
    ];
  }

  // Small previews
  return [
    { size: 36, mr: 96, mb: 96, variant: "36-v2" },
    { size: 48, mr: 32, mb: 32, variant: "48" },
    { size: 48, mr: 64, mb: 64, variant: "48" },
  ];
}

/**
 * Computes 3x3 Sobel gradient magnitude on a square patch.
 */
function computeSobelGradient(patch: Float32Array, sz: number): Float32Array {
  const grad = new Float32Array(sz * sz);
  for (let r = 1; r < sz - 1; r++) {
    for (let c = 1; c < sz - 1; c++) {
      const g00 = patch[(r - 1) * sz + (c - 1)] ?? 0;
      const g01 = patch[(r - 1) * sz + c] ?? 0;
      const g02 = patch[(r - 1) * sz + (c + 1)] ?? 0;
      const g10 = patch[r * sz + (c - 1)] ?? 0;
      const g12 = patch[r * sz + (c + 1)] ?? 0;
      const g20 = patch[(r + 1) * sz + (c - 1)] ?? 0;
      const g21 = patch[(r + 1) * sz + c] ?? 0;
      const g22 = patch[(r + 1) * sz + (c + 1)] ?? 0;

      const gx = g02 + 2 * g12 + g22 - (g00 + 2 * g10 + g20);
      const gy = g20 + 2 * g21 + g22 - (g00 + 2 * g01 + g02);
      grad[r * sz + c] = Math.hypot(gx, gy);
    }
  }
  return grad;
}

/**
 * Computes Normalized Cross-Correlation (NCC) between two gradient maps.
 */
function computeNCC(gradA: Float32Array, gradB: Float32Array, len: number): number {
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < len; i++) {
    meanA += gradA[i] ?? 0;
    meanB += gradB[i] ?? 0;
  }
  meanA /= len;
  meanB /= len;

  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < len; i++) {
    const da = (gradA[i] ?? 0) - meanA;
    const db = (gradB[i] ?? 0) - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den > 1e-6 ? num / den : 0;
}

/**
 * High-precision Gemini watermark detector using gradient NCC matching.
 */
export function detectGeminiWatermark(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  options: GeminiRemovalOptions = {}
): GeminiDetectionResult {
  const minConf = Math.max(0.12, 0.40 - ((options.sensitivity ?? 55) / 100) * 0.28);
  const seeds = getSeedsForDimensions(width, height);

  // Focus strictly on the bottom-right corner where watermarks are located (max 420x420 px)
  const roiSize = Math.min(Math.min(width, height), 420);
  const roiX0 = width - roiSize;
  const roiY0 = height - roiSize;

  // Extract grayscale luminance only for the compact corner ROI (fast O(roiSize^2), < 5ms)
  const roiGray = new Float32Array(roiSize * roiSize);
  for (let ry = 0; ry < roiSize; ry++) {
    const rowOffset = (roiY0 + ry) * width + roiX0;
    for (let rx = 0; rx < roiSize; rx++) {
      const idx = (rowOffset + rx) * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      roiGray[ry * roiSize + rx] = (r * 0.299 + g * 0.587 + b * 0.114) / 255.0;
    }
  }

  let bestMatch: GeminiDetectionResult | null = null;

  // Pass 1: Test catalog seeds at exact known anchor points
  for (const seed of seeds) {
    const x = width - seed.mr - seed.size;
    const y = height - seed.mb - seed.size;
    if (x < 0 || y < 0 || x + seed.size > width || y + seed.size > height) continue;

    const tpl = getGeminiTemplate(seed.variant);
    if (!tpl) continue;

    const rx = x - roiX0;
    const ry = y - roiY0;
    if (rx < 0 || ry < 0 || rx + seed.size > roiSize || ry + seed.size > roiSize) continue;

    // Extract seed patch
    const patch = new Float32Array(seed.size * seed.size);
    for (let pr = 0; pr < seed.size; pr++) {
      for (let pc = 0; pc < seed.size; pc++) {
        patch[pr * seed.size + pc] = roiGray[(ry + pr) * roiSize + (rx + pc)] ?? 0;
      }
    }

    const pGrad = computeSobelGradient(patch, seed.size);
    const score = computeNCC(pGrad, tpl.grad, seed.size * seed.size);

    if (bestMatch === null || score > bestMatch.confidence) {
      bestMatch = {
        found: score >= minConf,
        x,
        y,
        size: seed.size,
        variant: seed.variant,
        confidence: score,
        source: "catalog",
      };
    }
  }

  // Pass 2: If a candidate has potential signal, refine with micro-jitter (fast, < 2ms)
  if (bestMatch !== null && bestMatch.confidence >= minConf) {
    let refinedX = bestMatch.x;
    let refinedY = bestMatch.y;
    let maxScore = bestMatch.confidence;
    const tpl = getGeminiTemplate(bestMatch.variant || "96");

    if (tpl) {
      const sz = bestMatch.size;
      for (let dy = -6; dy <= 6; dy += 2) {
        for (let dx = -6; dx <= 6; dx += 2) {
          if (dx === 0 && dy === 0) continue;
          const testX = bestMatch.x + dx;
          const testY = bestMatch.y + dy;
          const rx = testX - roiX0;
          const ry = testY - roiY0;
          if (rx < 0 || ry < 0 || rx + sz > roiSize || ry + sz > roiSize) continue;

          const patch = new Float32Array(sz * sz);
          for (let pr = 0; pr < sz; pr++) {
            for (let pc = 0; pc < sz; pc++) {
              patch[pr * sz + pc] = roiGray[(ry + pr) * roiSize + (rx + pc)] ?? 0;
            }
          }
          const pGrad = computeSobelGradient(patch, sz);
          const score = computeNCC(pGrad, tpl.grad, sz * sz);
          if (score > maxScore) {
            maxScore = score;
            refinedX = testX;
            refinedY = testY;
          }
        }
      }
    }

    bestMatch.x = refinedX;
    bestMatch.y = refinedY;
    bestMatch.confidence = maxScore;
    return bestMatch;
  }

  // If no catalog seed matches, the image does not have a Gemini watermark.
  // Return immediately to avoid freezing the browser UI (< 10ms total).
  const fallbackSeed = seeds[0] ?? { size: 48, mr: 32, mb: 32, variant: "48" };
  const fallbackX = Math.max(0, width - fallbackSeed.mr - fallbackSeed.size);
  const fallbackY = Math.max(0, height - fallbackSeed.mb - fallbackSeed.size);

  return {
    found: false,
    x: fallbackX,
    y: fallbackY,
    size: fallbackSeed.size,
    variant: fallbackSeed.variant,
    confidence: bestMatch ? bestMatch.confidence : 0,
    source: "none",
  };
}

/**
 * 100% Native Mathematical Reverse Alpha Blending Engine.
 * Mathematically recovers the exact original RGB values under the watermark.
 */
export function removeGeminiWatermark(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  options: GeminiRemovalOptions = {}
): GeminiRemovalResult {
  let det: GeminiDetectionResult;
  if (options.forcePosition) {
    det = {
      found: true,
      x: options.forcePosition.x,
      y: options.forcePosition.y,
      size: options.forcePosition.size,
      variant: options.forcePosition.size >= 96 ? "96-20260520" : "48",
      confidence: 1.0,
      source: "forced",
    };
  } else {
    det = detectGeminiWatermark(data, width, height, options);
  }

  if (!det.found && !options.forceRemoval) {
    return {
      cleanedData: data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data),
      detected: false,
      detection: det,
      maskPixels: 0,
    };
  }

  const out = new Uint8ClampedArray(data);
  const size = det.size;
  const x0 = Math.max(0, Math.min(width - size, det.x));
  const y0 = Math.max(0, Math.min(height - size, det.y));
  const variant = det.variant || (size >= 96 ? "96-20260520" : "48");

  const tpl = getGeminiTemplate(variant) || getGeminiTemplate(size >= 96 ? "96" : "48");
  if (!tpl) {
    return {
      cleanedData: out,
      detected: false,
      detection: det,
      maskPixels: 0,
    };
  }

  const alphaMap = tpl.alpha;
  const alphaGain = Math.max(0.2, Math.min(2.0, options.alphaGain ?? 1.0));

  // Determine background luminance under the watermark to detect light vs dark logo
  let bgLumSum = 0;
  let bgLumCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const a = alphaMap[r * size + c] ?? 0;
      if (a < 0.02) {
        const idx = ((y0 + r) * width + (x0 + c)) * 4;
        const lum = (out[idx]! * 0.299 + out[idx + 1]! * 0.587 + out[idx + 2]! * 0.114);
        bgLumSum += lum;
        bgLumCount++;
      }
    }
  }
  const avgBgLum = bgLumCount > 0 ? bgLumSum / bgLumCount : 128;
  const logoValue = avgBgLum > 240 && det.confidence < 0.15 ? 0.0 : 255.0;

  let maskPixels = 0;
  const edgeMask = new Uint8Array(size * size);

  // Pass 1: Mathematical Inversion (Reverse Alpha Blending)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const rawAlpha = alphaMap[r * size + c] ?? 0;
      const alpha = Math.min(0.99, rawAlpha * alphaGain);

      // Noise floor threshold
      if (alpha < 0.003) continue;

      const idx = ((y0 + r) * width + (x0 + c)) * 4;
      const oneMinusAlpha = Math.max(1e-4, 1.0 - alpha);

      for (let ch = 0; ch < 3; ch++) {
        const pixelVal = out[idx + ch]!;
        // C_original = (C_watermarked - alpha * C_logo) / (1 - alpha)
        const restored = (pixelVal - alpha * logoValue) / oneMinusAlpha;
        out[idx + ch] = Math.min(255, Math.max(0, Math.round(restored)));
      }

      maskPixels++;

      // Mark edge boundary for halo-prevention pass
      if (rawAlpha >= 0.015 && rawAlpha <= 0.085) {
        edgeMask[r * size + c] = 1;
      }
    }
  }

  // Pass 2: Edge boundary smoothing to eliminate any boundary halos or quantization steps
  const snapshot = new Uint8ClampedArray(out);
  for (let r = 1; r < size - 1; r++) {
    for (let c = 1; c < size - 1; c++) {
      if (edgeMask[r * size + c] !== 1) continue;

      const idx = ((y0 + r) * width + (x0 + c)) * 4;

      // Local 3x3 median filter for edge transition
      for (let ch = 0; ch < 3; ch++) {
        const neighbors: number[] = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nIdx = ((y0 + r + dr) * width + (x0 + c + dc)) * 4;
            neighbors.push(snapshot[nIdx + ch]!);
          }
        }
        neighbors.sort((a, b) => a - b);
        const median = neighbors[4]!;
        out[idx + ch] = Math.round(snapshot[idx + ch]! * 0.4 + median * 0.6);
      }
    }
  }

  return {
    cleanedData: out,
    detected: true,
    detection: det,
    maskPixels,
  };
}
