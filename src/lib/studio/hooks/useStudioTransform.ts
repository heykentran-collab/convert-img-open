import {
  StepBadge,
  ArrowAnnotation,
  BoxAnnotation,
  BlurAnnotation,
  TextAnnotation,
  SpotlightAnnotation,
} from '@/types/studio';

export interface UseStudioTransformProps {
  imageSrc: string | null;
  frameType: string;
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
  saveImageSnapshot: (actionName: string, prevSrc: string, nextSrc: string, layers: any) => void;
  updateImageSrc: (src: string) => void;
  persistActiveImage: (src: string | Blob, customKey?: string) => void;
}

export function useStudioTransform({
  imageSrc,
  frameType,
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
  saveImageSnapshot,
  updateImageSrc,
  persistActiveImage,
}: UseStudioTransformProps) {
  const handleRotate90 = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const oldW = img.naturalWidth || 1280;
      const oldH = img.naturalHeight || 720;
      const offscreen = document.createElement('canvas');
      offscreen.width = oldH;
      offscreen.height = oldW;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.translate(oldH / 2, oldW / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -oldW / 2, -oldH / 2);
      ctx.restore();
      const nextImg = offscreen.toDataURL('image/png');

      const topBar = frameType === 'macos' || frameType === 'browser' ? 44 : 0;
      const nextSteps = stepBadges.map((s) => {
        const imgY = s.y - topBar;
        return { ...s, x: Math.round(oldH - imgY), y: Math.round(topBar + s.x) };
      });
      const nextTexts = texts.map((t) => {
        const imgY = t.y - topBar;
        return { ...t, x: Math.round(oldH - imgY), y: Math.round(topBar + t.x) };
      });
      const nextBoxes = boxes.map((b) => {
        const imgY = b.y - topBar;
        return { ...b, x: Math.round(oldH - (imgY + b.h)), y: Math.round(topBar + b.x), w: b.h, h: b.w };
      });
      const nextBlurs = blurs.map((b) => {
        const imgY = b.y - topBar;
        return { ...b, x: Math.round(oldH - (imgY + b.h)), y: Math.round(topBar + b.x), w: b.h, h: b.w };
      });
      const nextSpotlights = spotlights.map((sp) => {
        const imgY = sp.y - topBar;
        return { ...sp, x: Math.round(oldH - (imgY + sp.h)), y: Math.round(topBar + sp.x), w: sp.h, h: sp.w };
      });
      const nextArrows = arrows.map((a) => {
        const sImgY = a.startY - topBar;
        const eImgY = a.endY - topBar;
        return {
          ...a,
          startX: Math.round(oldH - sImgY),
          startY: Math.round(topBar + a.startX),
          endX: Math.round(oldH - eImgY),
          endY: Math.round(topBar + a.endX),
        };
      });

      saveImageSnapshot('Xoay ảnh 90°', imageSrc, nextImg, {
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
    };
  };

  const handleFlipHorizontal = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const w = img.naturalWidth || 1280;
      const h = img.naturalHeight || 720;
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      const nextImg = offscreen.toDataURL('image/png');

      const nextSteps = stepBadges.map((s) => ({ ...s, x: Math.round(w - s.x) }));
      const nextTexts = texts.map((t) => ({ ...t, x: Math.round(w - t.x) }));
      const nextBoxes = boxes.map((b) => ({ ...b, x: Math.round(w - (b.x + b.w)) }));
      const nextBlurs = blurs.map((b) => ({ ...b, x: Math.round(w - (b.x + b.w)) }));
      const nextSpotlights = spotlights.map((sp) => ({ ...sp, x: Math.round(w - (sp.x + sp.w)) }));
      const nextArrows = arrows.map((a) => ({
        ...a,
        startX: Math.round(w - a.startX),
        endX: Math.round(w - a.endX),
      }));

      saveImageSnapshot('Lật ngang ảnh', imageSrc, nextImg, {
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
    };
  };

  const handleFlipVertical = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const w = img.naturalWidth || 1280;
      const h = img.naturalHeight || 720;
      const topBar = frameType === 'macos' || frameType === 'browser' ? 44 : 0;
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.translate(0, h);
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      const nextImg = offscreen.toDataURL('image/png');

      const nextSteps = stepBadges.map((s) => {
        const imgY = s.y - topBar;
        return { ...s, y: Math.round(topBar + (h - imgY)) };
      });
      const nextTexts = texts.map((t) => {
        const imgY = t.y - topBar;
        return { ...t, y: Math.round(topBar + (h - imgY)) };
      });
      const nextBoxes = boxes.map((b) => {
        const imgY = b.y - topBar;
        return { ...b, y: Math.round(topBar + (h - (imgY + b.h))) };
      });
      const nextBlurs = blurs.map((b) => {
        const imgY = b.y - topBar;
        return { ...b, y: Math.round(topBar + (h - (imgY + b.h))) };
      });
      const nextSpotlights = spotlights.map((sp) => {
        const imgY = sp.y - topBar;
        return { ...sp, y: Math.round(topBar + (h - (imgY + sp.h))) };
      });
      const nextArrows = arrows.map((a) => {
        const sImgY = a.startY - topBar;
        const eImgY = a.endY - topBar;
        return {
          ...a,
          startY: Math.round(topBar + (h - sImgY)),
          endY: Math.round(topBar + (h - eImgY)),
        };
      });

      saveImageSnapshot('Lật dọc ảnh', imageSrc, nextImg, {
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
    };
  };

  return {
    handleRotate90,
    handleFlipHorizontal,
    handleFlipVertical,
  };
}
