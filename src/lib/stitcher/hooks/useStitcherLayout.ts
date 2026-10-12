'use client';

import { useState, useCallback } from 'react';
import { StitcherLayer, CanvasConfig, GridSettings } from '@/types/stitcher';

export function useStitcherLayout() {
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    columns: 2,
    gap: 16,
    cornerRadius: 0,
    padding: 24,
    fitMode: 'contain',
    autoCanvasSize: false, // Default to strict Canva-bound dimensions
  });

  /**
   * Arranges layers into a neat horizontal strip
   */
  const arrangeHorizontalStrip = useCallback(
    (
      layers: StitcherLayer[],
      canvasConfig: CanvasConfig,
      settings: Partial<GridSettings> = {}
    ): { updatedLayers: StitcherLayer[]; newCanvasDims?: { w: number; h: number } } => {
      if (layers.length === 0) return { updatedLayers: [] };

      const gap = settings.gap ?? gridSettings.gap;
      const padding = settings.padding ?? gridSettings.padding;
      const cornerRadius = settings.cornerRadius ?? gridSettings.cornerRadius;
      const shouldAutoCanvas = settings.autoCanvasSize ?? gridSettings.autoCanvasSize;
      const isAuto = shouldAutoCanvas || canvasConfig.preset === 'auto';

      const count = layers.length;

      let targetH: number;
      if (isAuto) {
        // ANCHOR TO ORIGINAL SIZES:
        // Use the maximum natural height of the images so repeatedly switching
        // between horizontal and vertical layouts never shrinks the canvas/images!
        const baseNaturalH = Math.max(
          ...layers.map((l) => l.naturalHeight || l.height || 600)
        );
        let initialH = Math.min(1200, Math.max(300, baseNaturalH));

        // If estimated total width exceeds reasonable maximum (2560px), scale down proportionally
        const totalAspect = layers.reduce(
          (sum, l) =>
            sum +
            (l.aspectRatio ||
              (l.naturalWidth && l.naturalHeight ? l.naturalWidth / l.naturalHeight : 1.33)),
          0
        );
        const estTotalW = initialH * totalAspect + (count - 1) * gap + padding * 2;
        if (estTotalW > 2560) {
          initialH = Math.max(
            160,
            Math.round((2560 - padding * 2 - (count - 1) * gap) / Math.max(0.1, totalAspect))
          );
        }
        targetH = initialH;
      } else {
        // Fixed canvas preset: fit strictly within canvasConfig bounds
        const availW = Math.max(100, canvasConfig.width - padding * 2 - (count - 1) * gap);
        const availH = Math.max(100, canvasConfig.height - padding * 2);
        const totalAspect = layers.reduce((sum, l) => sum + (l.aspectRatio || 1.33), 0);
        targetH = Math.min(availH, Math.round(availW / Math.max(0.1, totalAspect)));
        if (targetH < 80) targetH = 80;
      }

      let currentX = padding;
      const updatedLayers = layers.map((layer) => {
        const aspect =
          layer.aspectRatio ||
          (layer.naturalWidth && layer.naturalHeight
            ? layer.naturalWidth / layer.naturalHeight
            : 1.33);
        const w = Math.round(targetH * aspect);
        const y = isAuto
          ? padding
          : Math.round(
              padding +
                (Math.max(100, canvasConfig.height - padding * 2) - targetH) / 2
            );

        const updated: StitcherLayer = {
          ...layer,
          x: currentX,
          y: Math.max(0, y),
          width: Math.max(20, w),
          height: Math.max(20, targetH),
          rotation: 0,
          cornerRadius,
        };
        currentX += w + gap;
        return updated;
      });

      const totalCalculatedW = currentX - gap + padding;
      const newCanvasDims = isAuto
        ? {
            w: Math.max(200, totalCalculatedW),
            h: Math.max(100, targetH + padding * 2),
          }
        : undefined;

      return { updatedLayers, newCanvasDims };
    },
    [gridSettings]
  );

  /**
   * Arranges layers into a neat vertical strip
   */
  const arrangeVerticalStrip = useCallback(
    (
      layers: StitcherLayer[],
      canvasConfig: CanvasConfig,
      settings: Partial<GridSettings> = {}
    ): { updatedLayers: StitcherLayer[]; newCanvasDims?: { w: number; h: number } } => {
      if (layers.length === 0) return { updatedLayers: [] };

      const gap = settings.gap ?? gridSettings.gap;
      const padding = settings.padding ?? gridSettings.padding;
      const cornerRadius = settings.cornerRadius ?? gridSettings.cornerRadius;
      const shouldAutoCanvas = settings.autoCanvasSize ?? gridSettings.autoCanvasSize;
      const isAuto = shouldAutoCanvas || canvasConfig.preset === 'auto';

      const count = layers.length;

      let targetW: number;
      if (isAuto) {
        // ANCHOR TO ORIGINAL SIZES:
        // Use the maximum natural width of the images
        const baseNaturalW = Math.max(
          ...layers.map((l) => l.naturalWidth || l.width || 800)
        );
        let initialW = Math.min(1600, Math.max(400, baseNaturalW));

        // If estimated total stacked height exceeds reasonable maximum (3200px), scale down proportionally
        const totalInvAspect = layers.reduce((sum, l) => {
          const aspect =
            l.aspectRatio ||
            (l.naturalWidth && l.naturalHeight ? l.naturalWidth / l.naturalHeight : 1.33);
          return sum + 1 / Math.max(0.1, aspect);
        }, 0);
        const estTotalH = initialW * totalInvAspect + (count - 1) * gap + padding * 2;
        if (estTotalH > 3200) {
          initialW = Math.max(
            300,
            Math.round((3200 - padding * 2 - (count - 1) * gap) / Math.max(0.1, totalInvAspect))
          );
        }
        targetW = initialW;
      } else {
        // Fixed canvas preset: fit strictly within canvasConfig bounds
        targetW = Math.max(100, canvasConfig.width - padding * 2);
      }

      const availH = Math.max(100, canvasConfig.height - padding * 2 - (count - 1) * gap);
      const slotH = isAuto ? 0 : Math.max(40, Math.floor(availH / count));

      let currentY = padding;
      let maxLayerW = 0;
      const updatedLayers = layers.map((layer) => {
        const aspect =
          layer.aspectRatio ||
          (layer.naturalWidth && layer.naturalHeight
            ? layer.naturalWidth / layer.naturalHeight
            : 1.33);

        let w = targetW;
        let h = Math.round(targetW / Math.max(0.1, aspect));

        if (!isAuto) {
          h = slotH;
          w = Math.round(h * aspect);
          if (w > targetW) {
            w = targetW;
            h = Math.round(w / aspect);
          }
        }

        maxLayerW = Math.max(maxLayerW, w);
        const x = isAuto ? padding : Math.round(padding + (targetW - w) / 2);

        const updated: StitcherLayer = {
          ...layer,
          x: Math.max(0, x),
          y: currentY,
          width: Math.max(20, w),
          height: Math.max(20, h),
          rotation: 0,
          cornerRadius,
        };
        currentY += h + gap;
        return updated;
      });

      const totalCalculatedH = currentY - gap + padding;
      const newCanvasDims = isAuto
        ? {
            w: Math.max(200, maxLayerW + padding * 2),
            h: Math.max(100, totalCalculatedH),
          }
        : undefined;

      return { updatedLayers, newCanvasDims };
    },
    [gridSettings]
  );

  /**
   * Arranges layers into a uniform N-column grid
   */
  const arrangeSmartGrid = useCallback(
    (
      layers: StitcherLayer[],
      canvasConfig: CanvasConfig,
      settings: Partial<GridSettings> = {}
    ): { updatedLayers: StitcherLayer[]; newCanvasDims?: { w: number; h: number } } => {
      if (layers.length === 0) return { updatedLayers: [] };

      const cols = Math.max(1, settings.columns ?? gridSettings.columns);
      const gap = settings.gap ?? gridSettings.gap;
      const padding = settings.padding ?? gridSettings.padding;
      const cornerRadius = settings.cornerRadius ?? gridSettings.cornerRadius;
      const shouldAutoCanvas = settings.autoCanvasSize ?? gridSettings.autoCanvasSize;
      const isAuto = shouldAutoCanvas || canvasConfig.preset === 'auto';

      const rows = Math.max(1, Math.ceil(layers.length / cols));

      let cellW: number;
      let cellH: number;

      if (isAuto) {
        // Anchor to natural sizes
        const baseNaturalW = Math.max(
          ...layers.map((l) => l.naturalWidth || l.width || 600)
        );
        cellW = Math.min(1000, Math.max(240, Math.round(baseNaturalW / cols)));
        const avgAspect =
          layers.reduce((s, l) => s + (l.aspectRatio || 1.33), 0) / layers.length;
        cellH = Math.round(cellW / Math.max(0.1, avgAspect));
      } else {
        const availW = Math.max(100, canvasConfig.width - padding * 2 - (cols - 1) * gap);
        const availH = Math.max(100, canvasConfig.height - padding * 2 - (rows - 1) * gap);
        cellW = Math.max(30, Math.floor(availW / cols));
        cellH = Math.max(30, Math.floor(availH / rows));
      }

      const updatedLayers = layers.map((layer, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const cellX = padding + c * (cellW + gap);
        const cellY = padding + r * (cellH + gap);

        const aspect =
          layer.aspectRatio ||
          (layer.naturalWidth && layer.naturalHeight
            ? layer.naturalWidth / layer.naturalHeight
            : 1);
        let itemW = cellW;
        let itemH = Math.round(itemW / aspect);

        // Fit inside cell
        if (itemH > cellH) {
          itemH = cellH;
          itemW = Math.round(itemH * aspect);
        }

        const x = Math.round(cellX + (cellW - itemW) / 2);
        const y = Math.round(cellY + (cellH - itemH) / 2);

        return {
          ...layer,
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: Math.max(20, itemW),
          height: Math.max(20, itemH),
          rotation: 0,
          cornerRadius,
        };
      });

      const newCanvasDims = isAuto
        ? {
            w: Math.max(200, cols * cellW + (cols - 1) * gap + padding * 2),
            h: Math.max(100, rows * cellH + (rows - 1) * gap + padding * 2),
          }
        : undefined;

      return { updatedLayers, newCanvasDims };
    },
    [gridSettings]
  );

  return {
    gridSettings,
    setGridSettings,
    arrangeHorizontalStrip,
    arrangeVerticalStrip,
    arrangeSmartGrid,
  };
}
