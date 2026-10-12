import {
  BackgroundType,
  ShadowIntensity,
  AspectRatioPreset,
  BackgroundPreset,
} from '@/types/studio';
import { drawRoundedRect } from '../utils/canvasHelpers';
import { BACKGROUND_PRESETS } from '../constants';

export interface MockupDimensionsParams {
  imgW: number;
  imgH: number;
  frameType: 'macos' | 'browser' | 'none';
  canvasPadding: number;
  aspectRatio: AspectRatioPreset;
}

export interface MockupDimensionsResult {
  innerW: number;
  innerH: number;
  finalCanvasW: number;
  finalCanvasH: number;
  offsetX: number;
  offsetY: number;
  topBarHeight: number;
}

export function calculateMockupDimensions({
  imgW,
  imgH,
  frameType,
  canvasPadding,
  aspectRatio,
}: MockupDimensionsParams): MockupDimensionsResult {
  const topBarHeight = frameType === 'macos' || frameType === 'browser' ? 44 : 0;
  const innerW = imgW;
  const innerH = imgH + topBarHeight;

  const padding = canvasPadding;
  const minCanvasW = innerW + padding * 2;
  const minCanvasH = innerH + padding * 2;

  let targetRatio: number | null = null;
  if (aspectRatio === '16:9') targetRatio = 16 / 9;
  else if (aspectRatio === '4:3') targetRatio = 4 / 3;
  else if (aspectRatio === '1:1') targetRatio = 1;
  else if (aspectRatio === '3:4') targetRatio = 3 / 4;
  else if (aspectRatio === '9:16') targetRatio = 9 / 16;

  let finalCanvasW = minCanvasW;
  let finalCanvasH = minCanvasH;

  if (targetRatio !== null) {
    const currentRatio = minCanvasW / minCanvasH;
    if (currentRatio > targetRatio) {
      finalCanvasW = minCanvasW;
      finalCanvasH = Math.round(minCanvasW / targetRatio);
    } else {
      finalCanvasH = minCanvasH;
      finalCanvasW = Math.round(minCanvasH * targetRatio);
    }
  }

  const offsetX = Math.round((finalCanvasW - innerW) / 2);
  const offsetY = Math.round((finalCanvasH - innerH) / 2);

  return {
    innerW,
    innerH,
    finalCanvasW,
    finalCanvasH,
    offsetX,
    offsetY,
    topBarHeight,
  };
}

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  backgroundType: BackgroundType,
  backgroundPresetId: string,
  customSolidColor: string,
  presets: BackgroundPreset[] = BACKGROUND_PRESETS
): void {
  if (backgroundType === 'transparent') {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    return;
  }

  if (backgroundType === 'solid') {
    ctx.fillStyle = customSolidColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    return;
  }

  // Gradient background
  const preset = presets.find((p) => p.id === backgroundPresetId) || presets[0] || BACKGROUND_PRESETS[0];
  const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  const stops = preset.stops || ['#6366f1', '#a855f7'];

  if (stops.length === 2) {
    grad.addColorStop(0, stops[0]);
    grad.addColorStop(1, stops[1]);
  } else if (stops.length === 3) {
    grad.addColorStop(0, stops[0]);
    grad.addColorStop(0.5, stops[1]);
    grad.addColorStop(1, stops[2]);
  } else {
    grad.addColorStop(0, stops[0]);
    grad.addColorStop(1, stops[stops.length - 1]);
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

export function renderDropShadow(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  innerW: number,
  innerH: number,
  canvasPadding: number,
  shadowIntensity: ShadowIntensity,
  cornerRadius: number
): void {
  if (canvasPadding <= 0 || shadowIntensity === 'none') return;

  ctx.save();
  let shadowBlur = 24;
  let shadowOffsetY = 12;
  let shadowColor = 'rgba(0, 0, 0, 0.35)';

  if (shadowIntensity === 'soft') {
    shadowBlur = 20;
    shadowOffsetY = 8;
    shadowColor = 'rgba(0, 0, 0, 0.3)';
  } else if (shadowIntensity === 'medium') {
    shadowBlur = 40;
    shadowOffsetY = 16;
    shadowColor = 'rgba(0, 0, 0, 0.5)';
  } else if (shadowIntensity === 'heavy') {
    shadowBlur = 64;
    shadowOffsetY = 24;
    shadowColor = 'rgba(0, 0, 0, 0.7)';
  }

  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = shadowOffsetY;

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  drawRoundedRect(ctx, offsetX, offsetY, innerW, innerH, cornerRadius);
  ctx.fill();
  ctx.restore();
}

export function renderMockupWindow(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  offsetX: number,
  offsetY: number,
  innerW: number,
  innerH: number,
  imgH: number,
  topBarHeight: number,
  frameType: 'macos' | 'browser' | 'none',
  browserUrl: string,
  cornerRadius: number
): void {
  // Clip mockup window with rounded corners
  ctx.save();
  ctx.beginPath();
  drawRoundedRect(ctx, offsetX, offsetY, innerW, innerH, cornerRadius);
  ctx.clip();

  // Draw Mockup Window Header
  if (frameType === 'macos' || frameType === 'browser') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(offsetX, offsetY, innerW, topBarHeight);

    // macOS 3 dots
    const dotY = offsetY + topBarHeight / 2;
    ctx.fillStyle = '#ff5f56';
    ctx.beginPath();
    ctx.arc(offsetX + 20, dotY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffbd2e';
    ctx.beginPath();
    ctx.arc(offsetX + 38, dotY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#27c93f';
    ctx.beginPath();
    ctx.arc(offsetX + 56, dotY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Browser Address bar
    if (frameType === 'browser') {
      const pillW = Math.min(innerW - 160, 420);
      const pillX = offsetX + innerW / 2 - pillW / 2;
      ctx.fillStyle = '#0f172a';
      drawRoundedRect(ctx, pillX, offsetY + 8, pillW, 28, 6);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(browserUrl, offsetX + innerW / 2, offsetY + 26);
    }
  }

  // Draw Main Image
  ctx.drawImage(img, offsetX, offsetY + topBarHeight, innerW, imgH);

  // Restore clipping so annotations can be drawn cleanly without truncation
  ctx.restore();
}
