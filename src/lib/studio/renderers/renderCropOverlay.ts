import { drawRoundedRect } from '../utils/canvasHelpers';

export function renderCropOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  cropRect: { x: number; y: number; w: number; h: number } | null,
  offsetX: number,
  offsetY: number,
  topBarHeight: number
): void {
  if (!cropRect) return;

  const imgCanvasX = offsetX;
  const imgCanvasY = offsetY + topBarHeight;
  const cx = imgCanvasX + cropRect.x;
  const cy = imgCanvasY + cropRect.y;
  const cw = cropRect.w;
  const ch = cropRect.h;

  ctx.save();
  // Outer dark overlay
  ctx.fillStyle = 'rgba(10, 15, 28, 0.72)';
  ctx.fillRect(0, 0, canvasWidth, Math.max(0, cy));
  ctx.fillRect(0, cy + ch, canvasWidth, Math.max(0, canvasHeight - (cy + ch)));
  ctx.fillRect(0, cy, Math.max(0, cx), ch);
  ctx.fillRect(cx + cw, cy, Math.max(0, canvasWidth - (cx + cw)), ch);

  // Crop frame glowing border
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx, cy, cw, ch);

  // Rule of Thirds grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx + cw / 3, cy);
  ctx.lineTo(cx + cw / 3, cy + ch);
  ctx.moveTo(cx + (cw * 2) / 3, cy);
  ctx.lineTo(cx + (cw * 2) / 3, cy + ch);
  ctx.moveTo(cx, cy + ch / 3);
  ctx.lineTo(cx + cw, cy + ch / 3);
  ctx.moveTo(cx, cy + (ch * 2) / 3);
  ctx.lineTo(cx + cw, cy + (ch * 2) / 3);
  ctx.stroke();
  ctx.setLineDash([]);

  // 8 Grip handles
  const handleSize = 10;
  const handles = [
    { x: cx, y: cy },
    { x: cx + cw, y: cy },
    { x: cx + cw, y: cy + ch },
    { x: cx, y: cy + ch },
    { x: cx + cw / 2, y: cy },
    { x: cx + cw / 2, y: cy + ch },
    { x: cx, y: cy + ch / 2 },
    { x: cx + cw, y: cy + ch / 2 },
  ];
  ctx.fillStyle = '#0284c7';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  handles.forEach((h) => {
    ctx.beginPath();
    drawRoundedRect(ctx, h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize, 2);
    ctx.fill();
    ctx.stroke();
  });

  // Dimensions badge
  const badgeText = `${Math.round(cw)} × ${Math.round(ch)} px`;
  ctx.font = 'bold 12px Inter, sans-serif';
  const textW = ctx.measureText(badgeText).width;
  const badgeX = Math.max(cx + 8, cx + (cw - textW) / 2 - 8);
  const badgeY = cy > 36 ? cy - 28 : cy + 8;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawRoundedRect(ctx, badgeX, badgeY, textW + 16, 22, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX + 8, badgeY + 11);

  ctx.restore();
}
