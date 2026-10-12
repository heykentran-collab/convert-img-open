import {
  ArrowAnnotation,
  StepBadge,
  BoxAnnotation,
  BlurAnnotation,
  TextAnnotation,
  SpotlightAnnotation,
  StudioTool,
  HistoryAction,
} from '@/types/studio';
import { drawRoundedRect } from '../utils/canvasHelpers';

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromx: number,
  fromy: number,
  tox: number,
  toy: number,
  color: string,
  lineWidth: number,
  isCurved: boolean = false
): void {
  const headlen = 10 + lineWidth * 1.5;
  const dx = tox - fromx;
  const dy = toy - fromy;
  const dist = Math.hypot(dx, dy);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(fromx, fromy);

  if (isCurved && dist > 20) {
    const mx = (fromx + tox) / 2;
    const my = (fromy + toy) / 2;
    const offset = dist * 0.22;
    const cx = mx - (dy / dist) * offset;
    const cy = my + (dx / dist) * offset;

    ctx.quadraticCurveTo(cx, cy, tox, toy);
    ctx.stroke();

    angle = Math.atan2(toy - cy, tox - cx);
  } else {
    ctx.lineTo(tox, toy);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle - Math.PI / 6),
    toy - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    tox - headlen * Math.cos(angle + Math.PI / 6),
    toy - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

export function renderSpotlights(
  ctx: CanvasRenderingContext2D,
  spotlights: SpotlightAnnotation[],
  offsetX: number,
  offsetY: number,
  innerW: number,
  innerH: number,
  activeColor?: string
): void {
  if (spotlights.length === 0) return;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.beginPath();
  // Outer rectangle
  ctx.rect(offsetX, offsetY, innerW, innerH);
  // Cutout holes for each spotlight
  spotlights.forEach((sp) => {
    drawRoundedRect(ctx, offsetX + sp.x, offsetY + sp.y, sp.w, sp.h, 8);
  });
  ctx.fill('evenodd');

  // Draw glowing border around each spotlight hole
  spotlights.forEach((sp) => {
    ctx.save();
    ctx.strokeStyle = activeColor || '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = activeColor || '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    drawRoundedRect(ctx, offsetX + sp.x, offsetY + sp.y, sp.w, sp.h, 8);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

export function renderBlurs(
  ctx: CanvasRenderingContext2D,
  blurs: BlurAnnotation[],
  offsetX: number,
  offsetY: number
): void {
  blurs.forEach((b) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(offsetX + b.x, offsetY + b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(offsetX + b.x, offsetY + b.y, b.w, b.h);
  });
}

export function renderBoxes(
  ctx: CanvasRenderingContext2D,
  boxes: BoxAnnotation[],
  offsetX: number,
  offsetY: number
): void {
  boxes.forEach((b) => {
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.strokeWidth || 3;
    if (b.isDashed) {
      ctx.setLineDash([6, 6]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.strokeRect(offsetX + b.x, offsetY + b.y, b.w, b.h);
    ctx.setLineDash([]);
  });
}

export function renderArrows(
  ctx: CanvasRenderingContext2D,
  arrows: ArrowAnnotation[],
  offsetX: number,
  offsetY: number
): void {
  arrows.forEach((a) => {
    drawArrow(
      ctx,
      offsetX + a.startX,
      offsetY + a.startY,
      offsetX + a.endX,
      offsetY + a.endY,
      a.color,
      a.width,
      a.isCurved ?? false
    );
  });
}

export function renderStepBadges(
  ctx: CanvasRenderingContext2D,
  stepBadges: StepBadge[],
  offsetX: number,
  offsetY: number
): void {
  stepBadges.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(offsetX + s.x, offsetY + s.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(s.num), offsetX + s.x, offsetY + s.y);
  });
}

export function renderTexts(
  ctx: CanvasRenderingContext2D,
  texts: TextAnnotation[],
  offsetX: number,
  offsetY: number
): void {
  texts.forEach((t) => {
    ctx.save();
    const tx = offsetX + t.x;
    const ty = offsetY + t.y;
    const fontSize = t.fontSize || 16;
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(t.text);
    const textW = metrics.width;
    const textH = fontSize * 1.35;
    const paddingX = 12;
    const paddingY = 6;
    const pillW = textW + paddingX * 2;
    const pillH = textH + paddingY;

    if (t.hasBackdrop) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      drawRoundedRect(ctx, tx, ty - pillH / 2, pillW, pillH, 8);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(t.text, tx + paddingX, ty);
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'left';
      ctx.fillText(t.text, tx, ty);
    }
    ctx.restore();
  });
}

export function renderRubberband(
  ctx: CanvasRenderingContext2D,
  dragStart: { x: number; y: number } | null,
  dragCurrent: { x: number; y: number } | null,
  activeTool: StudioTool,
  activeColor: string,
  strokeWidth: number,
  arrowStyle: 'straight' | 'curved',
  offsetX: number,
  offsetY: number,
  boxIsDashed: boolean = false
): void {
  if (!dragStart || !dragCurrent) return;
  const dist = Math.hypot(dragCurrent.x - dragStart.x, dragCurrent.y - dragStart.y);
  if (dist <= 3) return;

  ctx.save();
  if (activeTool === 'arrow') {
    ctx.globalAlpha = 0.85;
    drawArrow(
      ctx,
      offsetX + dragStart.x,
      offsetY + dragStart.y,
      offsetX + dragCurrent.x,
      offsetY + dragCurrent.y,
      activeColor,
      strokeWidth,
      arrowStyle === 'curved'
    );
  } else if (activeTool === 'box') {
    const bx = Math.min(dragStart.x, dragCurrent.x);
    const by = Math.min(dragStart.y, dragCurrent.y);
    const bw = Math.abs(dragCurrent.x - dragStart.x);
    const bh = Math.abs(dragCurrent.y - dragStart.y);

    ctx.fillStyle = activeColor + '20';
    ctx.fillRect(offsetX + bx, offsetY + by, bw, bh);

    ctx.strokeStyle = activeColor;
    ctx.lineWidth = strokeWidth;
    if (boxIsDashed) {
      ctx.setLineDash([6, 6]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.strokeRect(offsetX + bx, offsetY + by, bw, bh);
    ctx.setLineDash([]);
  } else if (activeTool === 'blur') {
    const bx = Math.min(dragStart.x, dragCurrent.x);
    const by = Math.min(dragStart.y, dragCurrent.y);
    const bw = Math.abs(dragCurrent.x - dragStart.x);
    const bh = Math.abs(dragCurrent.y - dragStart.y);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(offsetX + bx, offsetY + by, bw, bh);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(offsetX + bx, offsetY + by, bw, bh);
  } else if (activeTool === 'spotlight') {
    const bx = Math.min(dragStart.x, dragCurrent.x);
    const by = Math.min(dragStart.y, dragCurrent.y);
    const bw = Math.abs(dragCurrent.x - dragStart.x);
    const bh = Math.abs(dragCurrent.y - dragStart.y);

    ctx.strokeStyle = activeColor || '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = activeColor || '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    drawRoundedRect(ctx, offsetX + bx, offsetY + by, bw, bh, 8);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderHighlightOutline(
  ctx: CanvasRenderingContext2D,
  highlightId: string | null,
  history: HistoryAction[],
  offsetX: number,
  offsetY: number
): void {
  if (!highlightId) return;
  const target = history.find((h) => 'item' in h && h.item.id === highlightId);
  if (!target || !('item' in target)) return;

  ctx.save();
  ctx.strokeStyle = '#38bdf8'; // Sky blue accent
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.shadowColor = '#0284c7';
  ctx.shadowBlur = 8;

  if (target.type === 'step') {
    const s = target.item;
    ctx.beginPath();
    ctx.arc(offsetX + s.x, offsetY + s.y, 20, 0, Math.PI * 2);
    ctx.stroke();
  } else if (target.type === 'text') {
    const t = target.item;
    const textW = Math.max(40, t.text.length * (t.fontSize * 0.65) + 16);
    const textH = t.fontSize + 12;
    ctx.strokeRect(offsetX + t.x - 6, offsetY + t.y - textH + 2, textW, textH);
  } else if (target.type === 'box') {
    const b = target.item;
    ctx.strokeRect(offsetX + b.x - 4, offsetY + b.y - 4, b.w + 8, b.h + 8);
  } else if (target.type === 'blur') {
    const bl = target.item;
    ctx.strokeRect(offsetX + bl.x - 4, offsetY + bl.y - 4, bl.w + 8, bl.h + 8);
  } else if (target.type === 'spotlight') {
    const sp = target.item;
    ctx.strokeRect(offsetX + sp.x - 4, offsetY + sp.y - 4, sp.w + 8, sp.h + 8);
  } else if (target.type === 'arrow') {
    const a = target.item;
    const minX = Math.min(a.startX, a.endX) - 10;
    const minY = Math.min(a.startY, a.endY) - 10;
    const w = Math.abs(a.endX - a.startX) + 20;
    const h = Math.abs(a.endY - a.startY) + 20;
    ctx.strokeRect(offsetX + minX, offsetY + minY, w, h);
  }

  ctx.restore();
}
