import { WatermarkConfig } from '@/types/studio';
import { drawRoundedRect } from '../utils/canvasHelpers';

export function renderWatermark(
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  offsetX: number,
  offsetY: number,
  innerW: number,
  innerH: number,
  topBarHeight: number,
  logoImg?: HTMLImageElement | null,
  scale: number = 1
): void {
  if (!config.enabled) return;

  const contentX = offsetX;
  const contentY = offsetY + topBarHeight;
  const contentW = innerW;
  const contentH = innerH - topBarHeight;

  if (contentW <= 0 || contentH <= 0) return;

  ctx.save();

  // 1. Clip strictly to the inner image content boundary
  ctx.beginPath();
  ctx.rect(contentX, contentY, contentW, contentH);
  ctx.clip();

  const isImage = config.type === 'image' && logoImg && logoImg.complete && logoImg.naturalWidth > 0;
  const opacity = Math.max(0.05, Math.min(1, config.opacity ?? 0.7));
  const fontSize = Math.max(10, Math.round((config.size || 18) * (scale || 1)));

  // =========================================================================
  // CASE A: TILE PATTERN (Lặp chéo 45 độ toàn ảnh)
  // =========================================================================
  if (config.position === 'tile-pattern') {
    ctx.globalAlpha = opacity * 0.75; // subtle for pattern

    const textToDraw = (config.text || '© Volticen').trim();
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    const metrics = ctx.measureText(textToDraw);
    const itemW = isImage ? fontSize * 3 : metrics.width;
    const itemH = isImage ? fontSize * 1.5 : fontSize;

    const stepX = Math.max(160, itemW + 100);
    const stepY = Math.max(90, itemH + 80);

    const centerX = contentX + contentW / 2;
    const centerY = contentY + contentH / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((-30 * Math.PI) / 180); // 30 degree angle

    const diag = Math.hypot(contentW, contentH) * 1.2;
    const startX = -diag;
    const endX = diag;
    const startY = -diag;
    const endY = diag;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let y = startY; y < endY; y += stepY) {
      for (let x = startX; x < endX; x += stepX) {
        if (isImage && logoImg) {
          ctx.drawImage(logoImg, x - itemW / 2, y - itemH / 2, itemW, itemH);
        } else {
          // Drop shadow for pattern readability
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillText(textToDraw, x + 1, y + 1);

          ctx.fillStyle = config.color || '#ffffff';
          ctx.fillText(textToDraw, x, y);
        }
      }
    }

    ctx.restore();
    return;
  }

  // =========================================================================
  // CASE B: ANCHOR POSITIONS (9 vị trí căn góc hoặc chính giữa)
  // =========================================================================
  ctx.globalAlpha = opacity;

  let boxW = 0;
  let boxH = 0;
  const padding = Math.max(8, Math.round(20 * (scale || 1))); // Margin from edge of inner image

  const pillPadX = Math.max(6, Math.round(14 * (scale || 1)));
  const pillPadY = Math.max(4, Math.round(8 * (scale || 1)));

  let logoW = 0;
  let logoH = 0;

  if (isImage && logoImg) {
    logoH = Math.max(12, Math.round((config.size || 36) * (scale || 1)));
    const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
    logoW = logoH * aspect;

    if (config.style === 'pill') {
      boxW = logoW + pillPadX * 2;
      boxH = logoH + pillPadY * 2;
    } else {
      boxW = logoW;
      boxH = logoH;
    }
  } else {
    const textToDraw = (config.text || '© Volticen').trim();
    if (!textToDraw) {
      ctx.restore();
      return;
    }

    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    const metrics = ctx.measureText(textToDraw);
    const textW = metrics.width;
    const textH = fontSize * 1.2;

    if (config.style === 'pill') {
      boxW = textW + pillPadX * 2;
      boxH = textH + pillPadY * 2;
    } else {
      boxW = textW;
      boxH = textH;
    }
  }

  // Compute (targetX, targetY) within content bounds
  let targetX = contentX + contentW - boxW - padding; // Default bottom-right
  let targetY = contentY + contentH - boxH - padding;

  const pos = config.position;
  // Horizontal
  if (pos === 'top-left' || pos === 'center-left' || pos === 'bottom-left') {
    targetX = contentX + padding;
  } else if (pos === 'top-center' || pos === 'center' || pos === 'bottom-center') {
    targetX = contentX + Math.round((contentW - boxW) / 2);
  } else {
    // right
    targetX = contentX + contentW - boxW - padding;
  }

  // Vertical
  if (pos === 'top-left' || pos === 'top-center' || pos === 'top-right') {
    targetY = contentY + padding;
  } else if (pos === 'center-left' || pos === 'center' || pos === 'center-right') {
    targetY = contentY + Math.round((contentH - boxH) / 2);
  } else {
    // bottom
    targetY = contentY + contentH - boxH - padding;
  }

  // Clamp within content
  targetX = Math.max(contentX + 8, Math.min(targetX, contentX + contentW - boxW - 8));
  targetY = Math.max(contentY + 8, Math.min(targetY, contentY + contentH - boxH - 8));

  // Render Based on Style
  if (config.style === 'pill') {
    // Frosted Dark Pill Background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.beginPath();
    drawRoundedRect(ctx, targetX, targetY, boxW, boxH, 8);
    ctx.fill();

    // Subtle outline border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (isImage && logoImg) {
      ctx.drawImage(logoImg, targetX + pillPadX, targetY + pillPadY, logoW, logoH);
    } else {
      ctx.fillStyle = config.color || '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.text, targetX + pillPadX, targetY + boxH / 2);
    }
  } else if (config.style === 'shadow') {
    if (isImage && logoImg) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.drawImage(logoImg, targetX, targetY, logoW, logoH);
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = config.color || '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.text, targetX, targetY + boxH / 2);
    }
  } else if (config.style === 'outline') {
    if (isImage && logoImg) {
      ctx.drawImage(logoImg, targetX, targetY, logoW, logoH);
    } else {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Contrasting stroke outline
      ctx.strokeStyle = config.color?.toLowerCase() === '#ffffff' ? '#000000' : '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.strokeText(config.text, targetX, targetY + boxH / 2);

      // Core fill
      ctx.fillStyle = config.color || '#ffffff';
      ctx.fillText(config.text, targetX, targetY + boxH / 2);
    }
  } else {
    // 'clean' style
    if (isImage && logoImg) {
      ctx.drawImage(logoImg, targetX, targetY, logoW, logoH);
    } else {
      ctx.fillStyle = config.color || '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.text, targetX, targetY + boxH / 2);
    }
  }

  ctx.restore();
}
