import { useState, useCallback } from 'react';
import {
  CropRatio,
  StudioTool,
  StepBadge,
  ArrowAnnotation,
  BoxAnnotation,
  BlurAnnotation,
  TextAnnotation,
  SpotlightAnnotation,
} from '@/types/studio';

export interface UseStudioCropProps {
  imageSrc: string | null;
  stepBadges: StepBadge[];
  setStepBadges: (badges: StepBadge[]) => void;
  texts: TextAnnotation[];
  setTexts: (texts: TextAnnotation[]) => void;
  boxes: BoxAnnotation[];
  setBoxes: (boxes: BoxAnnotation[]) => void;
  blurs: BlurAnnotation[];
  setBlurs: (blurs: BlurAnnotation[]) => void;
  spotlights: SpotlightAnnotation[];
  setSpotlights: (spotlights: SpotlightAnnotation[]) => void;
  arrows: ArrowAnnotation[];
  setArrows: (arrows: ArrowAnnotation[]) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setActiveTool: (tool: StudioTool) => void;
  saveImageSnapshot: (actionName: string, prevSrc: string, nextSrc: string, layers: any) => void;
  updateImageSrc: (src: string) => void;
  persistActiveImage: (src: string | Blob, customKey?: string) => void;
}

export function useStudioCrop({
  imageSrc,
  stepBadges,
  setStepBadges,
  texts,
  setTexts,
  boxes,
  setBoxes,
  blurs,
  setBlurs,
  spotlights,
  setSpotlights,
  arrows,
  setArrows,
  setSelectedAnnotationId,
  setActiveTool,
  saveImageSnapshot,
  updateImageSrc,
  persistActiveImage,
}: UseStudioCropProps) {
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [cropRatio, setCropRatio] = useState<CropRatio>('free');
  const [cropDrag, setCropDrag] = useState<{
    mode: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | 'create';
    startMouse: { x: number; y: number };
    startRect: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const getCropRatioValue = (ratio: CropRatio): number | null => {
    if (ratio === '16:9') return 16 / 9;
    if (ratio === '4:3') return 4 / 3;
    if (ratio === '1:1') return 1;
    if (ratio === '3:4') return 3 / 4;
    if (ratio === '9:16') return 9 / 16;
    if (ratio === '1200:630') return 1200 / 630;
    return null;
  };

  const initDefaultCrop = useCallback((ratio: CropRatio = cropRatio) => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const W = img.naturalWidth || 1280;
      const H = img.naturalHeight || 720;
      const ratioVal = getCropRatioValue(ratio);
      let cropW = Math.round(W * 0.85);
      let cropH = Math.round(H * 0.85);

      if (ratioVal) {
        if (W / H >= ratioVal) {
          cropH = Math.round(H * 0.82);
          cropW = Math.round(cropH * ratioVal);
        } else {
          cropW = Math.round(W * 0.82);
          cropH = Math.round(cropW / ratioVal);
        }
      }

      const cropX = Math.max(0, Math.round((W - cropW) / 2));
      const cropY = Math.max(0, Math.round((H - cropH) / 2));
      setCropRect({ x: cropX, y: cropY, w: cropW, h: cropH });
    };
  }, [cropRatio, imageSrc]);

  const handleApplyCrop = () => {
    if (!cropRect || !imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const offscreen = document.createElement('canvas');
      offscreen.width = cropRect.w;
      offscreen.height = cropRect.h;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;
      offCtx.drawImage(
        img,
        cropRect.x,
        cropRect.y,
        cropRect.w,
        cropRect.h,
        0,
        0,
        cropRect.w,
        cropRect.h
      );
      const nextImg = offscreen.toDataURL('image/png');

      const cropX = cropRect.x;
      const cropY = cropRect.y;

      const nextSteps = stepBadges
        .map((s) => ({ ...s, x: s.x - cropX, y: s.y - cropY }))
        .filter((s) => s.x >= -10 && s.x <= cropRect.w + 10 && s.y >= -10 && s.y <= cropRect.h + 10);
      const nextTexts = texts
        .map((t) => ({ ...t, x: t.x - cropX, y: t.y - cropY }))
        .filter((t) => t.x >= -30 && t.x <= cropRect.w + 30 && t.y >= -10 && t.y <= cropRect.h + 10);
      const nextBoxes = boxes
        .map((b) => ({ ...b, x: b.x - cropX, y: b.y - cropY }))
        .filter((b) => b.x + b.w >= 0 && b.x <= cropRect.w && b.y + b.h >= 0 && b.y <= cropRect.h);
      const nextBlurs = blurs
        .map((b) => ({ ...b, x: b.x - cropX, y: b.y - cropY }))
        .filter((b) => b.x + b.w >= 0 && b.x <= cropRect.w && b.y + b.h >= 0 && b.y <= cropRect.h);
      const nextSpotlights = spotlights
        .map((sp) => ({ ...sp, x: sp.x - cropX, y: sp.y - cropY }))
        .filter((sp) => sp.x + sp.w >= 0 && sp.x <= cropRect.w && sp.y + sp.h >= 0 && sp.y <= cropRect.h);
      const nextArrows = arrows
        .map((a) => ({
          ...a,
          startX: a.startX - cropX,
          startY: a.startY - cropY,
          endX: a.endX - cropX,
          endY: a.endY - cropY,
        }))
        .filter(
          (a) =>
            (a.startX >= 0 && a.startX <= cropRect.w) ||
            (a.endX >= 0 && a.endX <= cropRect.w)
        );

      saveImageSnapshot('Cắt ảnh (Crop)', imageSrc, nextImg, {
        stepBadges: nextSteps,
        arrows: nextArrows,
        boxes: nextBoxes,
        blurs: nextBlurs,
        texts: nextTexts,
        spotlights: nextSpotlights,
      });

      offscreen.width = 0;
      offscreen.height = 0;

      updateImageSrc(nextImg);
      persistActiveImage(nextImg);
      setStepBadges(nextSteps);
      setTexts(nextTexts);
      setBoxes(nextBoxes);
      setBlurs(nextBlurs);
      setSpotlights(nextSpotlights);
      setArrows(nextArrows);
      setSelectedAnnotationId(null);
      setCropRect(null);
      setActiveTool('select');
    };
  };

  return {
    cropRect,
    setCropRect,
    cropRatio,
    setCropRatio,
    cropDrag,
    setCropDrag,
    initDefaultCrop,
    handleApplyCrop,
    getCropRatioValue,
  };
}
