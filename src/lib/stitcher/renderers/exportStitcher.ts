/**
 * High-resolution Offscreen Exporter for Volticen Stitcher
 * Generates WebP, PNG, and JPEG outputs cleanly without UI selection overlays
 */

import { StitcherLayer, CanvasConfig } from '@/types/stitcher';
import {
  drawCanvasBackground,
  drawCanvasBorder,
  drawRoundedRectPath,
  renderLayers,
} from './renderStitchCanvas';

export interface ExportOptions {
  format: 'image/webp' | 'image/png' | 'image/jpeg';
  quality: number; // 0.1 - 1.0
  fileName?: string;
}

/**
 * Renders full-resolution canvas and converts to Blob
 */
export async function exportStitchedCanvasToBlob(
  layers: StitcherLayer[],
  canvasConfig: CanvasConfig,
  options: ExportOptions = { format: 'image/webp', quality: 0.92 }
): Promise<Blob | null> {
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.max(10, Math.round(canvasConfig.width));
  offscreen.height = Math.max(10, Math.round(canvasConfig.height));

  const ctx = offscreen.getContext('2d');
  if (!ctx) return null;

  // Clear entire offscreen canvas to transparent
  ctx.clearRect(0, 0, offscreen.width, offscreen.height);

  const r = canvasConfig.borderRadius || 0;
  if (r > 0) {
    ctx.save();
    ctx.beginPath();
    drawRoundedRectPath(ctx, 0, 0, offscreen.width, offscreen.height, r);
    ctx.clip();
  }

  // 1. Draw canvas background (isExporting = true ensures transparent background has NO checkerboard)
  drawCanvasBackground(ctx, offscreen.width, offscreen.height, canvasConfig, true);

  // 2. Render all visible layers in full quality (no selection handles, no snap lines)
  renderLayers(ctx, layers, {
    selectedLayerId: null,
    isExporting: true,
  });

  if (r > 0) {
    ctx.restore();
  }

  // 3. Draw canvas border
  drawCanvasBorder(ctx, offscreen.width, offscreen.height, canvasConfig);

  // 4. Ultimate Precision Mask: If canvas is rounded, trim away any pixels outside the rounded boundary
  // using destination-in compositing to guarantee 100% clean transparent corners without any residual white fringes
  if (r > 0 && options.format !== 'image/jpeg') {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    drawRoundedRectPath(ctx, 0, 0, offscreen.width, offscreen.height, r);
    ctx.fill();
    ctx.restore();
  }

  return new Promise((resolve) => {
    offscreen.toBlob(
      (blob) => resolve(blob),
      options.format,
      options.quality
    );
  });
}

/**
 * Direct file download trigger in browser
 */
export function downloadStitchedBlob(blob: Blob, fileName: string = 'stitched-artwork.webp'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
