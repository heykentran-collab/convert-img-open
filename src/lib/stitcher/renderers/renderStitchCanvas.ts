/**
 * Pure Canvas Rendering Engine for Volticen Stitcher
 * Renders layers, backgrounds, selection bounding boxes, and transform handles
 */

import { StitcherLayer, CanvasConfig, SnapLine, TransformHandle } from '@/types/stitcher';

// Cache loaded HTMLImageElements by layer id & src to avoid reloading on every render tick
const imageElementCache = new Map<string, HTMLImageElement>();

export function setCachedImage(id: string, img: HTMLImageElement): void {
  imageElementCache.set(id, img);
}

export function removeCachedImage(id: string): void {
  imageElementCache.delete(id);
}

export function getCachedImage(
  id: string,
  src: string,
  onImageReady?: () => void
): HTMLImageElement | null {
  const cached = imageElementCache.get(id);
  if (cached && (cached.src === src || cached.currentSrc === src)) {
    if (cached.complete && cached.naturalWidth > 0) {
      return cached;
    }
    if (onImageReady) {
      cached.addEventListener('load', onImageReady, { once: true });
    }
    return null;
  }

  const img = new Image();
  // IMPORTANT: Only apply crossOrigin anonymous to remote HTTP/HTTPS URLs.
  // Setting crossOrigin anonymous on blob: or data: URLs causes browsers (Chrome, Edge, Safari)
  // to reject the request with CORS/ERR_FAILED, breaking local image loading!
  if (src.startsWith('http://') || src.startsWith('https://')) {
    img.crossOrigin = 'anonymous';
  }
  if (onImageReady) {
    img.addEventListener('load', onImageReady, { once: true });
  }
  img.src = src;
  imageElementCache.set(id, img);
  return null;
}

/**
 * Preloads all layer images into cache so they render immediately
 */
export function preloadLayerImages(layers: StitcherLayer[], onReady?: () => void): void {
  if (layers.length === 0) {
    if (onReady) onReady();
    return;
  }

  let pending = 0;
  for (const layer of layers) {
    const cached = imageElementCache.get(layer.id);
    if (!cached || (cached.src !== layer.src && cached.currentSrc !== layer.src) || !cached.complete || cached.naturalWidth === 0) {
      pending++;
      const img = new Image();
      if (layer.src.startsWith('http://') || layer.src.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      const handleDone = () => {
        pending--;
        if (pending <= 0 && onReady) onReady();
      };
      img.addEventListener('load', handleDone, { once: true });
      img.addEventListener('error', handleDone, { once: true });
      img.src = layer.src;
      imageElementCache.set(layer.id, img);
    }
  }

  if (pending === 0 && onReady) {
    onReady();
  }
}

export function clearImageCache(): void {
  imageElementCache.clear();
}


/**
 * Draws the canvas background (transparent pattern, solid color, or gradient)
 */
export function drawCanvasBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: CanvasConfig,
  isExporting: boolean = false
): void {
  ctx.save();

  if (config.backgroundType === 'transparent') {
    ctx.clearRect(0, 0, width, height);

    // Only draw the checkerboard pattern on interactive editor canvas, NEVER when exporting!
    if (!isExporting) {
      const size = 16;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0f172a';
      for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
          if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
            ctx.fillRect(x, y, size, size);
          }
        }
      }
    }
  } else if (config.backgroundType === 'gradient') {
    // Parse simple gradient or default to slate dark
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (config.backgroundGradient === 'midnight') {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
    } else if (config.backgroundGradient === 'sunset') {
      grad.addColorStop(0, '#431407');
      grad.addColorStop(1, '#1e1b4b');
    } else if (config.backgroundGradient === 'emerald') {
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(1, '#0f172a');
    } else {
      grad.addColorStop(0, '#111827');
      grad.addColorStop(1, '#030712');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = config.backgroundColor || '#0b0f19';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

/**
 * Helper to draw a rounded rectangle path cross-browser
 */
export function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
  if (radius <= 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

/**
 * Draws an inside border around the canvas (supporting canvas rounded corners)
 */
export function drawCanvasBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: CanvasConfig
): void {
  const bw = config.borderWidth || 0;
  if (bw <= 0) return;

  const r = config.borderRadius || 0;

  ctx.save();
  ctx.strokeStyle = config.borderColor || '#ffffff';
  ctx.lineWidth = bw;
  ctx.beginPath();
  if (r > 0) {
    const innerR = Math.max(0, r - bw / 2);
    drawRoundedRectPath(ctx, bw / 2, bw / 2, Math.max(0, width - bw), Math.max(0, height - bw), innerR);
  } else {
    ctx.rect(bw / 2, bw / 2, Math.max(0, width - bw), Math.max(0, height - bw));
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders all visible layers in sorted z-index order
 */
export function renderLayers(
  ctx: CanvasRenderingContext2D,
  layers: StitcherLayer[],
  options: {
    selectedLayerId: string | null;
    isExporting?: boolean;
    snapLines?: SnapLine[];
    onImageReady?: () => void;
    zoomScale?: number;
  }
): void {
  const sortedLayers = [...layers]
    .filter((l) => l.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sortedLayers) {
    const img = getCachedImage(layer.id, layer.src, options.onImageReady);
    if (!img || !img.complete || img.naturalWidth === 0) continue;

    ctx.save();
    ctx.globalAlpha = layer.opacity ?? 1;

    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;

    // Apply rotation around layer center
    ctx.translate(centerX, centerY);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }
    ctx.translate(-centerX, -centerY);

    // Drop shadow
    if (layer.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
    }

    // Rounded corners clipping
    const radius = layer.cornerRadius || 0;
    if (radius > 0) {
      ctx.beginPath();
      ctx.roundRect(layer.x, layer.y, layer.width, layer.height, radius);
      ctx.clip();
    }

    ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
    ctx.restore();
  }

  // Draw Selection Bounding Box & Handles (interactive only, not when exporting)
  if (!options.isExporting && options.selectedLayerId) {
    const selected = layers.find((l) => l.id === options.selectedLayerId);
    if (selected && selected.isVisible) {
      drawSelectionBox(ctx, selected, options.zoomScale ?? 1);
    }
  }

  // Draw Snap Guidelines
  if (!options.isExporting && options.snapLines && options.snapLines.length > 0) {
    drawSnapLines(ctx, options.snapLines);
  }
}

/**
 * Draws active selection outline, bounding box, 8 resize handles and 1 rotation handle
 * Scales inversely with zoomScale so handles and lines remain sharp, visible and touchable on screen
 */
export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  layer: StitcherLayer,
  zoomScale: number = 1
): void {
  ctx.save();
  const centerX = layer.x + layer.width / 2;
  const centerY = layer.y + layer.height / 2;

  ctx.translate(centerX, centerY);
  if (layer.rotation) {
    ctx.rotate((layer.rotation * Math.PI) / 180);
  }
  ctx.translate(-centerX, -centerY);

  const scale = Math.max(0.08, zoomScale);
  const lineWidth = Math.max(1.5, Math.round(2 / scale));
  const handleSize = Math.max(8, Math.round(11 / scale));
  const dashSize = Math.max(3, Math.round(4 / scale));

  // Outline
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([dashSize, dashSize]);
  ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
  ctx.setLineDash([]);

  // Handles: 4 corners + 4 edges
  const handles: { h: TransformHandle; x: number; y: number }[] = [
    { h: 'nw', x: layer.x, y: layer.y },
    { h: 'ne', x: layer.x + layer.width, y: layer.y },
    { h: 'se', x: layer.x + layer.width, y: layer.y + layer.height },
    { h: 'sw', x: layer.x, y: layer.y + layer.height },
    { h: 'n', x: layer.x + layer.width / 2, y: layer.y },
    { h: 's', x: layer.x + layer.width / 2, y: layer.y + layer.height },
    { h: 'w', x: layer.x, y: layer.y + layer.height / 2 },
    { h: 'e', x: layer.x + layer.width, y: layer.y + layer.height / 2 },
  ];

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = Math.max(1.5, Math.round(2 / scale));

  for (const pt of handles) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, handleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Rotation Handle (top lollipop)
  const rotDist = Math.max(22, Math.round(26 / scale));
  const rotX = layer.x + layer.width / 2;
  const rotY = layer.y - rotDist;

  ctx.beginPath();
  ctx.moveTo(layer.x + layer.width / 2, layer.y);
  ctx.lineTo(rotX, rotY);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(rotX, rotY, Math.max(5, Math.round(6 / scale)), 0, Math.PI * 2);
  ctx.fillStyle = '#60a5fa';
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws magnetic snap alignment guide lines
 */
function drawSnapLines(ctx: CanvasRenderingContext2D, snapLines: SnapLine[]): void {
  ctx.save();
  ctx.strokeStyle = '#06b6d4'; // Cyan
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  for (const line of snapLines) {
    ctx.beginPath();
    if (line.type === 'x') {
      ctx.moveTo(line.pos, 0);
      ctx.lineTo(line.pos, ctx.canvas.height);
    } else {
      ctx.moveTo(0, line.pos);
      ctx.lineTo(ctx.canvas.width, line.pos);
    }
    ctx.stroke();
  }

  ctx.restore();
}
