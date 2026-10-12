'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { StitcherLayer, TransformHandle, SnapLine } from '@/types/stitcher';
import { setCachedImage, removeCachedImage } from '../renderers/renderStitchCanvas';

export interface UseStitcherLayersOptions {
  canvasWidth: number;
  canvasHeight: number;
  initialLayers?: StitcherLayer[];
  onLayerChange?: (layers: StitcherLayer[]) => void;
}

export function useStitcherLayers(options: UseStitcherLayersOptions) {
  const { canvasWidth, canvasHeight, onLayerChange } = options;
  const [layers, setLayers] = useState<StitcherLayer[]>(options.initialLayers || []);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);

  const layersRef = useRef<StitcherLayer[]>([]);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  // Add Layer from user File or Blob
  const addLayer = useCallback(
    async (fileOrBlob: File | Blob, customName?: string): Promise<StitcherLayer | null> => {
      const name = customName || (fileOrBlob instanceof File ? fileOrBlob.name : 'image.png');
      const blob = fileOrBlob;
      const src = URL.createObjectURL(blob);

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const natW = img.naturalWidth || 800;
          const natH = img.naturalHeight || 600;
          const aspect = natW / natH;

          // Default initial size: fit comfortably within 75% of the selected canvas size
          // while preserving exact natural aspect ratio
          const maxTargetW = Math.round(canvasWidth * 0.75);
          const maxTargetH = Math.round(canvasHeight * 0.75);

          let initW = maxTargetW;
          let initH = Math.round(initW / aspect);
          if (initH > maxTargetH) {
            initH = maxTargetH;
            initW = Math.round(initH * aspect);
          }

          // If natural image is smaller than target slot, preserve 1:1 crisp size
          if (natW < initW && natH < initH) {
            initW = natW;
            initH = natH;
          }

          // Center on canvas, slightly staggered by count
          setLayers((prev) => {
            const stagger = (prev.length % 6) * 24;
            let initX = Math.round((canvasWidth - initW) / 2) + stagger;
            let initY = Math.round((canvasHeight - initH) / 2) + stagger;
            if (initX + initW > canvasWidth) initX = Math.max(0, canvasWidth - initW);
            if (initY + initH > canvasHeight) initY = Math.max(0, canvasHeight - initH);

            const maxZ = prev.length > 0 ? Math.max(...prev.map((l) => l.zIndex)) + 1 : 1;

            const newLayer: StitcherLayer = {
              id: Math.random().toString(36).slice(2),
              name,
              blob,
              src,
              naturalWidth: natW,
              naturalHeight: natH,
              x: initX,
              y: initY,
              width: initW,
              height: initH,
              rotation: 0,
              opacity: 1,
              zIndex: maxZ,
              isLocked: false,
              isVisible: true,
              aspectRatio: aspect,
              cornerRadius: 0,
              shadow: true,
            };

            // Preload loaded image directly into cache for zero-latency instant rendering
            setCachedImage(newLayer.id, img);

            const next = [...prev, newLayer];
            if (onLayerChange) onLayerChange(next);
            resolve(newLayer);
            return next;
          });
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });
    },
    [canvasWidth, canvasHeight, onLayerChange]
  );

  const removeLayer = useCallback(
    (id: string) => {
      removeCachedImage(id);
      setLayers((prev) => {
        const target = prev.find((l) => l.id === id);
        if (target && target.src && target.src.startsWith('blob:')) {
          URL.revokeObjectURL(target.src);
        }
        const next = prev.filter((l) => l.id !== id);
        if (onLayerChange) onLayerChange(next);
        return next;
      });
      setSelectedLayerId((curr) => (curr === id ? null : curr));
    },
    [onLayerChange]
  );

  const duplicateLayer = useCallback(
    (id: string) => {
      setLayers((prev) => {
        const target = prev.find((l) => l.id === id);
        if (!target) return prev;
        const maxZ = Math.max(...prev.map((l) => l.zIndex)) + 1;
        const cloneSrc = target.blob ? URL.createObjectURL(target.blob) : target.src;
        const clone: StitcherLayer = {
          ...target,
          id: Math.random().toString(36).slice(2),
          name: `${target.name} (Copy)`,
          src: cloneSrc,
          x: target.x + 24,
          y: target.y + 24,
          zIndex: maxZ,
        };
        const next = [...prev, clone];
        if (onLayerChange) onLayerChange(next);
        return next;
      });
    },
    [onLayerChange]
  );

  const updateLayer = useCallback(
    (id: string, updates: Partial<StitcherLayer>) => {
      setLayers((prev) => {
        const next = prev.map((l) => (l.id === id ? { ...l, ...updates } : l));
        if (onLayerChange) onLayerChange(next);
        return next;
      });
    },
    [onLayerChange]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      setLayers((prev) => {
        const next = prev.map((l) => (l.id === id ? { ...l, isVisible: !l.isVisible } : l));
        if (onLayerChange) onLayerChange(next);
        return next;
      });
    },
    [onLayerChange]
  );

  const toggleLock = useCallback(
    (id: string) => {
      setLayers((prev) => {
        const next = prev.map((l) => (l.id === id ? { ...l, isLocked: !l.isLocked } : l));
        if (onLayerChange) onLayerChange(next);
        return next;
      });
    },
    [onLayerChange]
  );

  // Z-Index Management (Reorder Layers)
  const bringForward = useCallback((id: string) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx].zIndex;
      next[idx].zIndex = next[idx + 1].zIndex;
      next[idx + 1].zIndex = temp;
      const sorted = next.sort((a, b) => a.zIndex - b.zIndex);
      if (onLayerChange) onLayerChange(sorted);
      return sorted;
    });
  }, [onLayerChange]);

  const sendBackward = useCallback((id: string) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx].zIndex;
      next[idx].zIndex = next[idx - 1].zIndex;
      next[idx - 1].zIndex = temp;
      const sorted = next.sort((a, b) => a.zIndex - b.zIndex);
      if (onLayerChange) onLayerChange(sorted);
      return sorted;
    });
  }, [onLayerChange]);

  const bringToFront = useCallback((id: string) => {
    setLayers((prev) => {
      const maxZ = Math.max(...prev.map((l) => l.zIndex), 0) + 1;
      const sorted = prev.map((l) => (l.id === id ? { ...l, zIndex: maxZ } : l)).sort((a, b) => a.zIndex - b.zIndex);
      if (onLayerChange) onLayerChange(sorted);
      return sorted;
    });
  }, [onLayerChange]);

  const sendToBack = useCallback((id: string) => {
    setLayers((prev) => {
      const minZ = Math.min(...prev.map((l) => l.zIndex), 1) - 1;
      const sorted = prev.map((l) => (l.id === id ? { ...l, zIndex: minZ } : l)).sort((a, b) => a.zIndex - b.zIndex);
      if (onLayerChange) onLayerChange(sorted);
      return sorted;
    });
  }, [onLayerChange]);

  const clearLayers = useCallback(() => {
    setLayers((prev) => {
      prev.forEach((l) => {
        removeCachedImage(l.id);
        if (l.src && l.src.startsWith('blob:')) {
          URL.revokeObjectURL(l.src);
        }
      });
      return [];
    });
    setSelectedLayerId(null);
    if (onLayerChange) onLayerChange([]);
  }, [onLayerChange]);

  // Hit test layer at point (x, y)
  const findLayerAtCoords = useCallback(
    (canvasX: number, canvasY: number): StitcherLayer | null => {
      // Search top-to-bottom (highest z-index first)
      const sorted = [...layers]
        .filter((l) => l.isVisible && !l.isLocked)
        .sort((a, b) => b.zIndex - a.zIndex);

      for (const l of sorted) {
        // Simple unrotated hit test or transformed hit test
        const cx = l.x + l.width / 2;
        const cy = l.y + l.height / 2;

        let px = canvasX;
        let py = canvasY;

        if (l.rotation) {
          const rad = (-l.rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const dx = canvasX - cx;
          const dy = canvasY - cy;
          px = cx + dx * cos - dy * sin;
          py = cy + dx * sin + dy * cos;
        }

        if (px >= l.x && px <= l.x + l.width && py >= l.y && py <= l.y + l.height) {
          return l;
        }
      }
      return null;
    },
    [layers]
  );

  // Hit test transform handle of active layer (with zoom-compensated hit radius)
  const findHandleAtCoords = useCallback(
    (layer: StitcherLayer, canvasX: number, canvasY: number, zoomScale: number = 1): TransformHandle | null => {
      // Scale handle hit radius so that on screen it's always at least 14-16px easy to grab
      const handleRadius = Math.max(12, Math.round(16 / Math.max(0.08, zoomScale)));
      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;

      let px = canvasX;
      let py = canvasY;

      if (layer.rotation) {
        const rad = (-layer.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = canvasX - cx;
        const dy = canvasY - cy;
        px = cx + dx * cos - dy * sin;
        py = cy + dx * sin + dy * cos;
      }

      // Check rotation lollipop
      const rotDist = Math.max(22, Math.round(28 / Math.max(0.08, zoomScale)));
      const rotX = layer.x + layer.width / 2;
      const rotY = layer.y - rotDist;
      if (Math.hypot(px - rotX, py - rotY) <= handleRadius) return 'rot';

      const pts: { h: TransformHandle; x: number; y: number }[] = [
        { h: 'nw', x: layer.x, y: layer.y },
        { h: 'ne', x: layer.x + layer.width, y: layer.y },
        { h: 'se', x: layer.x + layer.width, y: layer.y + layer.height },
        { h: 'sw', x: layer.x, y: layer.y + layer.height },
        { h: 'n', x: layer.x + layer.width / 2, y: layer.y },
        { h: 's', x: layer.x + layer.width / 2, y: layer.y + layer.height },
        { h: 'w', x: layer.x, y: layer.y + layer.height / 2 },
        { h: 'e', x: layer.x + layer.width, y: layer.y + layer.height / 2 },
      ];

      for (const pt of pts) {
        if (Math.hypot(px - pt.x, py - pt.y) <= handleRadius) {
          return pt.h;
        }
      }

      return null;
    },
    []
  );

  return {
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
    snapLines,
    setSnapLines,
    addLayer,
    removeLayer,
    duplicateLayer,
    updateLayer,
    toggleVisibility,
    toggleLock,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    clearLayers,
    findLayerAtCoords,
    findHandleAtCoords,
  };
}
