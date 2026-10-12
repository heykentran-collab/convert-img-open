'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StitcherLayer,
  CanvasConfig,
  TransformHandle,
  SnapLine,
} from '@/types/stitcher';
import {
  drawCanvasBackground,
  drawCanvasBorder,
  drawRoundedRectPath,
  renderLayers,
} from '@/lib/stitcher';
import { ZoomIn, ZoomOut, Maximize2, Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface StitcherCanvasProps {
  layers: StitcherLayer[];
  canvasConfig: CanvasConfig;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<StitcherLayer>) => void;
  findLayerAtCoords: (x: number, y: number) => StitcherLayer | null;
  findHandleAtCoords: (layer: StitcherLayer, x: number, y: number, zoomScale?: number) => TransformHandle | null;
  zoomScale: number;
  onZoomChange: (scale: number) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onSaveSnapshot: () => void;
}

export function StitcherCanvas({
  layers,
  canvasConfig,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  findLayerAtCoords,
  findHandleAtCoords,
  zoomScale,
  onZoomChange,
  onAddFiles,
  onSaveSnapshot,
}: StitcherCanvasProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Interaction State
  const [activeHandle, setActiveHandle] = useState<TransformHandle | null>(null);
  const [isDraggingLayer, setIsDraggingLayer] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialLayerState, setInitialLayerState] = useState<StitcherLayer | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const [cursorStyle, setCursorStyle] = useState<string>('default');

  // Drag & drop state for file uploads
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Convert mouse event coordinates to Canvas coordinates
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: Math.round((e.clientX - rect.left) * scaleX),
        y: Math.round((e.clientY - rect.top) * scaleY),
      };
    },
    []
  );

  // Dynamic Viewport Fit: calculates exact ratio so canvas fits cleanly inside container
  const calculateFitScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 0.6;
    const cW = container.clientWidth;
    const cH = container.clientHeight;
    if (!cW || !cH) return 0.6;

    // Leave 48px padding (24px each side)
    const availW = Math.max(100, cW - 48);
    const availH = Math.max(100, cH - 48);

    const targetW = canvasConfig.width || 1920;
    const targetH = canvasConfig.height || 1080;

    const rawScale = Math.min(availW / targetW, availH / targetH);
    // Don't upscale past 1.5x, minimum 0.05, round down to 2 decimals for zero-overflow
    const scale = Math.max(0.05, Math.min(1.5, Math.floor(rawScale * 100) / 100));
    return scale;
  }, [canvasConfig.width, canvasConfig.height]);

  const handleFitView = useCallback(() => {
    const fit = calculateFitScale();
    onZoomChange(fit);
  }, [calculateFitScale, onZoomChange]);

  // Auto-fit on initial mount or when canvas preset/dimensions change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitView();
    }, 60);

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return () => clearTimeout(timer);
    }

    const ro = new ResizeObserver(() => {
      // Container resized (e.g. sidebar toggle or window resize)
    });
    ro.observe(container);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [canvasConfig.width, canvasConfig.height, handleFitView]);

  // Wheel zoom (Ctrl + Wheel)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      onZoomChange(Math.max(0.05, Math.min(3.0, Math.round((zoomScale + delta) * 100) / 100)));
    }
  };

  // State to trigger immediate canvas redraw whenever a layer image loads
  const [redrawTrigger, setRedrawTrigger] = useState<number>(0);
  const handleImageReady = useCallback(() => {
    setRedrawTrigger((c) => c + 1);
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasConfig.width;
    canvas.height = canvasConfig.height;

    // Clear entire canvas to transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const r = canvasConfig.borderRadius || 0;
    if (r > 0) {
      ctx.save();
      ctx.beginPath();
      drawRoundedRectPath(ctx, 0, 0, canvas.width, canvas.height, r);
      ctx.clip();
    }

    // Draw background
    drawCanvasBackground(ctx, canvas.width, canvas.height, canvasConfig);

    // Draw layers
    renderLayers(ctx, layers, {
      selectedLayerId,
      isExporting: false,
      snapLines,
      onImageReady: handleImageReady,
      zoomScale,
    });

    if (r > 0) {
      ctx.restore();
    }

    // Draw canvas border
    drawCanvasBorder(ctx, canvas.width, canvas.height, canvasConfig);
  }, [layers, canvasConfig, selectedLayerId, snapLines, redrawTrigger, handleImageReady, zoomScale]);

  // Container Mouse Down: Deselect when clicking on backdrop / empty workspace outside canvas
  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) {
      return;
    }
    if (selectedLayerId) {
      onSelectLayer(null);
    }
  };

  // Mouse Down: Start selection, drag, or transform
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const coords = getCanvasCoords(e);
    const selected = layers.find((l) => l.id === selectedLayerId);

    // 1. Check if clicking on active layer's transform handles
    if (selected && !selected.isLocked) {
      const handle = findHandleAtCoords(selected, coords.x, coords.y, zoomScale);
      if (handle) {
        setActiveHandle(handle);
        setDragStart(coords);
        setInitialLayerState({ ...selected });
        return;
      }
    }

    // 2. Check if clicking on any layer
    const hit = findLayerAtCoords(coords.x, coords.y);
    if (hit) {
      onSelectLayer(hit.id);
      if (!hit.isLocked) {
        setIsDraggingLayer(true);
        setDragStart(coords);
        setInitialLayerState({ ...hit });
      }
    } else {
      // Clicked on empty canvas -> deselect
      onSelectLayer(null);
    }
  };

  // Window-level Drag & Resize listeners for rock-solid interaction even outside canvas
  useEffect(() => {
    if (!activeHandle && !isDraggingLayer) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e);
      if (!dragStart || !initialLayerState) return;

      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;

      // A. Active Handle Resizing & Rotation
      if (activeHandle) {
        if (activeHandle === 'rot') {
          const cx = initialLayerState.x + initialLayerState.width / 2;
          const cy = initialLayerState.y + initialLayerState.height / 2;
          const angle = Math.atan2(coords.y - cy, coords.x - cx) * (180 / Math.PI) + 90;
          const cleanAngle = Math.round((angle + 360) % 360);
          onUpdateLayer(initialLayerState.id, { rotation: cleanAngle });
          return;
        }

        let newX = initialLayerState.x;
        let newY = initialLayerState.y;
        let newW = initialLayerState.width;
        let newH = initialLayerState.height;
        const aspect = initialLayerState.aspectRatio || (initialLayerState.width / initialLayerState.height) || 1;
        const preserveAspect = !e.shiftKey; // Lock aspect by default, Shift unlocks freeform

        if (activeHandle === 'se') {
          newW = Math.max(20, initialLayerState.width + dx);
          newH = preserveAspect ? Math.round(newW / aspect) : Math.max(20, initialLayerState.height + dy);
        } else if (activeHandle === 'sw') {
          newW = Math.max(20, initialLayerState.width - dx);
          newX = initialLayerState.x + (initialLayerState.width - newW);
          newH = preserveAspect ? Math.round(newW / aspect) : Math.max(20, initialLayerState.height + dy);
        } else if (activeHandle === 'ne') {
          newW = Math.max(20, initialLayerState.width + dx);
          newH = preserveAspect ? Math.round(newW / aspect) : Math.max(20, initialLayerState.height - dy);
          newY = initialLayerState.y + (initialLayerState.height - newH);
        } else if (activeHandle === 'nw') {
          newW = Math.max(20, initialLayerState.width - dx);
          newX = initialLayerState.x + (initialLayerState.width - newW);
          newH = preserveAspect ? Math.round(newW / aspect) : Math.max(20, initialLayerState.height - dy);
          newY = initialLayerState.y + (initialLayerState.height - newH);
        } else if (activeHandle === 'e') {
          newW = Math.max(20, initialLayerState.width + dx);
        } else if (activeHandle === 'w') {
          newW = Math.max(20, initialLayerState.width - dx);
          newX = initialLayerState.x + (initialLayerState.width - newW);
        } else if (activeHandle === 's') {
          newH = Math.max(20, initialLayerState.height + dy);
        } else if (activeHandle === 'n') {
          newH = Math.max(20, initialLayerState.height - dy);
          newY = initialLayerState.y + (initialLayerState.height - newH);
        }

        onUpdateLayer(initialLayerState.id, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
        return;
      }

      // B. Layer Dragging with Magnetic Snapping
      if (isDraggingLayer) {
        let targetX = initialLayerState.x + dx;
        let targetY = initialLayerState.y + dy;

        const snapThreshold = 10;
        const guides: SnapLine[] = [];
        const canvasCenterX = canvasConfig.width / 2;
        const canvasCenterY = canvasConfig.height / 2;
        const layerCenterX = targetX + initialLayerState.width / 2;
        const layerCenterY = targetY + initialLayerState.height / 2;

        if (Math.abs(layerCenterX - canvasCenterX) < snapThreshold) {
          targetX = canvasCenterX - initialLayerState.width / 2;
          guides.push({ type: 'x', pos: canvasCenterX });
        }
        if (Math.abs(layerCenterY - canvasCenterY) < snapThreshold) {
          targetY = canvasCenterY - initialLayerState.height / 2;
          guides.push({ type: 'y', pos: canvasCenterY });
        }
        if (Math.abs(targetX) < snapThreshold) {
          targetX = 0;
          guides.push({ type: 'x', pos: 0 });
        }
        if (Math.abs(targetY) < snapThreshold) {
          targetY = 0;
          guides.push({ type: 'y', pos: 0 });
        }

        setSnapLines(guides);
        onUpdateLayer(initialLayerState.id, {
          x: Math.round(targetX),
          y: Math.round(targetY),
        });
      }
    };

    const handleWindowMouseUp = () => {
      onSaveSnapshot();
      setActiveHandle(null);
      setIsDraggingLayer(false);
      setDragStart(null);
      setInitialLayerState(null);
      setSnapLines([]);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [
    activeHandle,
    isDraggingLayer,
    initialLayerState,
    dragStart,
    canvasConfig,
    getCanvasCoords,
    onUpdateLayer,
    onSaveSnapshot,
  ]);

  // Mouse Move on Canvas: Update hover cursor style when idle
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeHandle || isDraggingLayer) return; // Managed by window listener

    const coords = getCanvasCoords(e);
    const selected = layers.find((l) => l.id === selectedLayerId);

    // Hover Cursor Update
    if (selected && !selected.isLocked) {
      const handle = findHandleAtCoords(selected, coords.x, coords.y, zoomScale);
      if (handle) {
        if (handle === 'rot') setCursorStyle('grab');
        else if (handle === 'nw' || handle === 'se') setCursorStyle('nwse-resize');
        else if (handle === 'ne' || handle === 'sw') setCursorStyle('nesw-resize');
        else if (handle === 'e' || handle === 'w') setCursorStyle('ew-resize');
        else if (handle === 'n' || handle === 's') setCursorStyle('ns-resize');
        return;
      }
    }

    const hoverLayer = findLayerAtCoords(coords.x, coords.y);
    if (hoverLayer) {
      setCursorStyle(hoverLayer.isLocked ? 'not-allowed' : 'move');
    } else {
      setCursorStyle('default');
    }
  };

  // Drag and drop image files directly onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleContainerMouseDown}
      data-stitcher-container="true"
      className={`relative w-full h-[640px] lg:h-[720px] bg-slate-950/90 rounded-2xl border ${
        isDragOver ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800'
      } flex items-center justify-center overflow-hidden select-none transition-colors shadow-inner`}
    >
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.webp,.png,.jpg,.jpeg,.avif,.gif,.jfif,.bmp,.svg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Zoomed Canvas Container */}
      <div
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out',
          borderRadius: canvasConfig.borderRadius ? `${canvasConfig.borderRadius}px` : undefined,
        }}
        className="relative shadow-2xl"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          style={{
            cursor: cursorStyle,
            borderRadius: canvasConfig.borderRadius ? `${canvasConfig.borderRadius}px` : undefined,
          }}
          className="shadow-2xl block"
        />
      </div>

      {/* Empty State Dropzone: 100% Unified with Studio style */}
      {layers.length === 0 && (
        <div
          onClick={handleTriggerUpload}
          className="flex flex-col items-center justify-center p-8 sm:p-12 text-center w-[520px] max-w-[92%] min-h-[360px] border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/40 hover:bg-slate-900/60 rounded-3xl transition-all cursor-pointer group shadow-xl absolute z-20 shrink-0"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors">
            {t.stitcher.dropzoneTitle}
          </h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed max-w-sm">
            {t.stitcher.dropzoneDesc}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTriggerUpload();
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{t.stitcher.pickPhotosButton}</span>
          </button>
          <span className="text-[11px] text-slate-500 mt-3 font-mono">
            {t.stitcher.pasteShortcutHint}
          </span>
        </div>
      )}

      {/* Floating Canvas Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-xl text-xs text-slate-300 z-30">
        <button
          onClick={() => onZoomChange(Math.max(0.05, Math.round((zoomScale - 0.1) * 100) / 100))}
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
          title={t.stitcher.zoomOutTooltip}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onZoomChange(1.0)}
          className="font-mono text-[11px] min-w-[42px] px-1 py-0.5 hover:bg-slate-800 hover:text-white rounded text-center font-medium transition cursor-pointer"
          title={t.stitcher.zoomResetTooltip}
        >
          {Math.round(zoomScale * 100)}%
        </button>
        <button
          onClick={() => onZoomChange(Math.min(3.0, Math.round((zoomScale + 0.1) * 100) / 100))}
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
          title={t.stitcher.zoomInTooltip}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3.5 bg-slate-800 mx-0.5" />
        <button
          onClick={handleFitView}
          className="px-2 py-1 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer flex items-center gap-1.5"
          title={t.stitcher.fitViewTooltip}
        >
          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-medium text-slate-200">{t.stitcher.fitLabel}</span>
        </button>
      </div>

      {/* Drag & Drop Active Overlay - Unified with Studio */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shadow-lg animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-white mb-1">
              {t.stitcher.dragActiveTitle}
            </h3>
            <p className="text-xs text-blue-200/80">
              {t.stitcher.dragActiveSubtitle}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
