'use client';

import { useState, useCallback } from 'react';
import { CanvasConfig, CanvasPreset, StitcherLayer } from '@/types/stitcher';
import { ECOMMERCE_PRESETS } from '@/lib/constants/ecommerce-presets';

export const CANVAS_PRESET_DIMS: Record<string, { w: number; h: number; label: string }> = {
  '16:9': { w: 1920, h: 1080, label: '16:9 (Full HD 1920×1080)' },
  '1:1': { w: 1080, h: 1080, label: '1:1 (Vuông 1080×1080)' },
  'shopee-main': { w: 1000, h: 1000, label: 'Shopee (1000×1000)' },
  'tiktok-fashion': { w: 900, h: 1200, label: 'TikTok Shop (900×1200 - 3:4)' },
  'lazada-main': { w: 1000, h: 1000, label: 'Lazada (1000×1000)' },
  'amazon-hero': { w: 2000, h: 2000, label: 'Amazon Super Zoom (2000×2000)' },
  'shopify-product': { w: 1080, h: 1080, label: 'Shopify / Web (1080×1080)' },
  '3:4': { w: 1200, h: 1600, label: '3:4 (Dọc thời trang 1200×1600)' },
  '4:3': { w: 1600, h: 1200, label: '4:3 (Tiêu chuẩn 1600×1200)' },
  '9:16': { w: 1080, h: 1920, label: '9:16 (Story / Reels 1080×1920)' },
  'facebook-post': { w: 1200, h: 630, label: 'Feature Image / Facebook (1200×630)' },
  'blog-feature': { w: 1200, h: 630, label: 'Blog Feature Image (1200×630)' },
  'web-thumbnail': { w: 720, h: 720, label: 'Thumbnail vuông (720×720)' },
  'facebook-cover': { w: 1640, h: 624, label: 'Facebook Cover (1640×624)' },
  'youtube-thumb': { w: 1280, h: 720, label: 'YouTube Thumbnail (1280×720)' },
};

/**
 * Canva-style proportional re-fit:
 * When image size changes (e.g. 1920x1080 -> 1200x600), scale and adjust
 * all layers so they stay completely inside the new canvas boundaries.
 */
export function fitLayersInsideNewBounds(
  layers: StitcherLayer[],
  oldW: number,
  oldH: number,
  newW: number,
  newH: number
): StitcherLayer[] {
  if (layers.length === 0 || oldW <= 0 || oldH <= 0 || (oldW === newW && oldH === newH)) {
    return layers;
  }

  const scaleX = newW / oldW;
  const scaleY = newH / oldH;
  const uniformScale = Math.min(scaleX, scaleY);

  return layers.map((layer) => {
    let w = Math.round(layer.width * uniformScale);
    let h = Math.round(layer.height * uniformScale);
    const aspect = layer.aspectRatio || (layer.naturalWidth && layer.naturalHeight ? layer.naturalWidth / layer.naturalHeight : 1);

    if (w > newW) {
      w = newW;
      h = Math.round(w / aspect);
    }
    if (h > newH) {
      h = newH;
      w = Math.round(h * aspect);
    }

    let x = Math.round(layer.x * scaleX);
    let y = Math.round(layer.y * scaleY);

    if (x + w > newW) x = Math.max(0, newW - w);
    if (y + h > newH) y = Math.max(0, newH - h);

    return {
      ...layer,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.max(20, w),
      height: Math.max(20, h),
    };
  });
}

export function useStitcherCanvas(options?: { initialConfig?: CanvasConfig }) {
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>(
    options?.initialConfig || {
      width: 1920,
      height: 1080,
      preset: '16:9',
      backgroundType: 'color',
      backgroundColor: '#090d16',
      backgroundGradient: 'midnight',
      padding: 32,
      borderWidth: 0,
      borderColor: '#ffffff',
      borderRadius: 0,
    }
  );

  const [zoomScale, setZoomScale] = useState<number>(0.65);

  const applyPreset = useCallback(
    (
      preset: CanvasPreset,
      currentLayers?: StitcherLayer[],
      onLayersUpdate?: (layers: StitcherLayer[]) => void
    ) => {
      const oldW = canvasConfig.width;
      const oldH = canvasConfig.height;

      if (preset === 'auto' && currentLayers && currentLayers.length > 0) {
        const visible = currentLayers.filter((l) => l.isVisible);
        if (visible.length === 0) return;

        const minX = Math.min(...visible.map((l) => l.x));
        const minY = Math.min(...visible.map((l) => l.y));
        const maxX = Math.max(...visible.map((l) => l.x + l.width));
        const maxY = Math.max(...visible.map((l) => l.y + l.height));

        const fitW = Math.max(10, Math.round(maxX - minX));
        const fitH = Math.max(10, Math.round(maxY - minY));

        // Shift all layers tightly to (0, 0) so no extra padding/gap on top, bottom, left or right
        if (onLayersUpdate && (minX !== 0 || minY !== 0)) {
          const shifted = currentLayers.map((l) => ({
            ...l,
            x: Math.round(l.x - minX),
            y: Math.round(l.y - minY),
          }));
          onLayersUpdate(shifted);
        }

        setCanvasConfig((prev) => ({
          ...prev,
          preset: 'auto',
          width: fitW,
          height: fitH,
        }));
        return;
      }

      // Check predefined map first
      let dim: { w: number; h: number } | null = null;
      if (preset in CANVAS_PRESET_DIMS) {
        dim = CANVAS_PRESET_DIMS[preset];
      } else {
        const found = ECOMMERCE_PRESETS.find((p) => p.id === preset);
        if (found) {
          dim = { w: found.width, h: found.height };
        }
      }

      if (dim) {
        if (currentLayers && currentLayers.length > 0 && onLayersUpdate) {
          const fitted = fitLayersInsideNewBounds(currentLayers, oldW, oldH, dim.w, dim.h);
          onLayersUpdate(fitted);
        }
        setCanvasConfig((prev) => ({
          ...prev,
          preset,
          width: dim.w,
          height: dim.h,
        }));
      } else {
        setCanvasConfig((prev) => ({ ...prev, preset }));
      }
    },
    [canvasConfig.width, canvasConfig.height]
  );

  const setCustomDimensions = useCallback(
    (
      newW: number,
      newH: number,
      currentLayers?: StitcherLayer[],
      onLayersUpdate?: (layers: StitcherLayer[]) => void
    ) => {
      if (newW <= 0 || newH <= 0) return;
      const oldW = canvasConfig.width;
      const oldH = canvasConfig.height;

      if (currentLayers && currentLayers.length > 0 && onLayersUpdate) {
        const fitted = fitLayersInsideNewBounds(currentLayers, oldW, oldH, newW, newH);
        onLayersUpdate(fitted);
      }

      setCanvasConfig((prev) => ({
        ...prev,
        preset: 'custom',
        width: newW,
        height: newH,
      }));
    },
    [canvasConfig.width, canvasConfig.height]
  );

  const updateCanvasConfig = useCallback((updates: Partial<CanvasConfig>) => {
    setCanvasConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleStepZoom = useCallback((delta: number) => {
    setZoomScale((prev) => {
      let next = Math.round((prev + delta) * 100) / 100;
      if (next < 0.1) next = 0.1;
      if (next > 2.5) next = 2.5;
      return next;
    });
  }, []);

  return {
    canvasConfig,
    setCanvasConfig,
    updateCanvasConfig,
    applyPreset,
    setCustomDimensions,
    zoomScale,
    setZoomScale,
    handleStepZoom,
  };
}
