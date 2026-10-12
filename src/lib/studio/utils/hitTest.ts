import { HistoryAction } from '@/types/studio';

export type CropHandle = 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';

/**
 * Searches reverse history for annotation at inner coordinates
 */
export function findAnnotationAtCoords(
  coords: { x: number; y: number },
  history: HistoryAction[]
): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const action = history[i];
    if (!('item' in action)) continue;

    if (action.type === 'step') {
      const s = action.item;
      if (Math.hypot(coords.x - s.x, coords.y - s.y) <= 22) {
        return s.id;
      }
    } else if (action.type === 'text') {
      const t = action.item;
      const textW = Math.max(40, t.text.length * (t.fontSize * 0.65) + 16);
      const textH = t.fontSize + 12;
      if (
        coords.x >= t.x - 8 &&
        coords.x <= t.x + textW &&
        coords.y >= t.y - textH &&
        coords.y <= t.y + 12
      ) {
        return t.id;
      }
    } else if (action.type === 'box') {
      const b = action.item;
      if (
        coords.x >= b.x - 6 &&
        coords.x <= b.x + b.w + 6 &&
        coords.y >= b.y - 6 &&
        coords.y <= b.y + b.h + 6
      ) {
        return b.id;
      }
    } else if (action.type === 'blur') {
      const bl = action.item;
      if (
        coords.x >= bl.x &&
        coords.x <= bl.x + bl.w &&
        coords.y >= bl.y &&
        coords.y <= bl.y + bl.h
      ) {
        return bl.id;
      }
    } else if (action.type === 'spotlight') {
      const sp = action.item;
      if (
        coords.x >= sp.x &&
        coords.x <= sp.x + sp.w &&
        coords.y >= sp.y &&
        coords.y <= sp.y + sp.h
      ) {
        return sp.id;
      }
    } else if (action.type === 'arrow') {
      const a = action.item;
      if (
        Math.hypot(coords.x - a.startX, coords.y - a.startY) <= 18 ||
        Math.hypot(coords.x - a.endX, coords.y - a.endY) <= 18
      ) {
        return a.id;
      }
      const numSamples = 10;
      for (let s = 1; s < numSamples; s++) {
        const t = s / numSamples;
        let px: number, py: number;
        if (a.isCurved) {
          const dx = a.endX - a.startX;
          const dy = a.endY - a.startY;
          const dist = Math.hypot(dx, dy);
          const mx = (a.startX + a.endX) / 2;
          const my = (a.startY + a.endY) / 2;
          const offset = dist * 0.22;
          const cx = mx - (dy / (dist || 1)) * offset;
          const cy = my + (dx / (dist || 1)) * offset;
          px = (1 - t) * (1 - t) * a.startX + 2 * (1 - t) * t * cx + t * t * a.endX;
          py = (1 - t) * (1 - t) * a.startY + 2 * (1 - t) * t * cy + t * t * a.endY;
        } else {
          px = a.startX + t * (a.endX - a.startX);
          py = a.startY + t * (a.endY - a.startY);
        }
        if (Math.hypot(coords.x - px, coords.y - py) <= 15) {
          return a.id;
        }
      }
    }
  }
  return null;
}

/**
 * Checks which resize handle of cropRect is under the cursor
 */
export function getCropHandleAt(
  px: number,
  py: number,
  cropRect: { x: number; y: number; w: number; h: number } | null,
  topBarHeight: number = 0
): CropHandle | null {
  if (!cropRect) return null;
  const imgX = px;
  const imgY = py - topBarHeight;

  const { x, y, w, h } = cropRect;
  const threshold = 14;

  if (Math.hypot(imgX - x, imgY - y) <= threshold) return 'nw';
  if (Math.hypot(imgX - (x + w), imgY - y) <= threshold) return 'ne';
  if (Math.hypot(imgX - (x + w), imgY - (y + h)) <= threshold) return 'se';
  if (Math.hypot(imgX - x, imgY - (y + h)) <= threshold) return 'sw';

  if (Math.hypot(imgX - (x + w / 2), imgY - y) <= threshold) return 'n';
  if (Math.hypot(imgX - (x + w / 2), imgY - (y + h)) <= threshold) return 's';
  if (Math.hypot(imgX - x, imgY - (y + h / 2)) <= threshold) return 'w';
  if (Math.hypot(imgX - (x + w), imgY - (y + h / 2)) <= threshold) return 'e';

  if (imgX >= x && imgX <= x + w && imgY >= y && imgY <= y + h) {
    return 'move';
  }

  return null;
}
