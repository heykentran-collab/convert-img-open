import React from 'react';
import {
  StudioTool,
  CropRatio,
  StepBadge,
  ArrowAnnotation,
  BoxAnnotation,
  BlurAnnotation,
  TextAnnotation,
  SpotlightAnnotation,
  HistoryAction,
} from '@/types/studio';
import { findAnnotationAtCoords, getCropHandleAt } from '@/lib/studio';

export interface UseStudioCanvasEventsProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasOffsetRef: React.RefObject<{ x: number; y: number }>;
  activeTool: StudioTool;
  frameType: string;
  cropRect: { x: number; y: number; w: number; h: number } | null;
  setCropRect: (rect: { x: number; y: number; w: number; h: number } | null) => void;
  cropDrag: {
    mode: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | 'create';
    startMouse: { x: number; y: number };
    startRect: { x: number; y: number; w: number; h: number };
  } | null;
  setCropDrag: (drag: any) => void;
  cropRatio: CropRatio;
  getCropRatioValue: (ratio: CropRatio) => number | null;
  computedDims: { w: number; h: number };
  history: HistoryAction[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryAction[]>>;
  setRedoStack: React.Dispatch<React.SetStateAction<HistoryAction[]>>;
  selectedAnnotationId: string | null;
  setSelectedAnnotationId: (id: string | null) => void;
  setHoveredAnnotationId: (id: string | null) => void;
  movingAnnotation: any;
  setMovingAnnotation: (mov: any) => void;
  dragStart: { x: number; y: number } | null;
  setDragStart: (pt: { x: number; y: number } | null) => void;
  dragCurrent: { x: number; y: number } | null;
  setDragCurrent: (pt: { x: number; y: number } | null) => void;
  stepCounter: number;
  setStepCounter: React.Dispatch<React.SetStateAction<number>>;
  toolColors: Record<string, string>;
  strokeWidth: number;
  arrowStyle: 'straight' | 'curved';
  boxIsDashed: boolean;
  textFontSize: number;
  textHasBackdrop: boolean;
  setEditingText: (text: any) => void;
  setStepBadges: React.Dispatch<React.SetStateAction<StepBadge[]>>;
  setArrows: React.Dispatch<React.SetStateAction<ArrowAnnotation[]>>;
  setBoxes: React.Dispatch<React.SetStateAction<BoxAnnotation[]>>;
  setBlurs: React.Dispatch<React.SetStateAction<BlurAnnotation[]>>;
  setTexts: React.Dispatch<React.SetStateAction<TextAnnotation[]>>;
  setSpotlights: React.Dispatch<React.SetStateAction<SpotlightAnnotation[]>>;
}

export function useStudioCanvasEvents({
  canvasRef,
  canvasOffsetRef,
  activeTool,
  frameType,
  cropRect,
  setCropRect,
  cropDrag,
  setCropDrag,
  cropRatio,
  getCropRatioValue,
  computedDims,
  history,
  setHistory,
  setRedoStack,
  setSelectedAnnotationId,
  setHoveredAnnotationId,
  movingAnnotation,
  setMovingAnnotation,
  dragStart,
  setDragStart,
  setDragCurrent,
  stepCounter,
  setStepCounter,
  toolColors,
  strokeWidth,
  arrowStyle,
  boxIsDashed,
  textFontSize,
  textHasBackdrop,
  setEditingText,
  setStepBadges,
  setArrows,
  setBoxes,
  setBlurs,
  setTexts,
  setSpotlights,
}: UseStudioCanvasEventsProps) {
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const getInnerCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    return {
      x: coords.x - canvasOffsetRef.current.x,
      y: coords.y - canvasOffsetRef.current.y,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getInnerCoords(e);
    setDragStart(coords);

    // 0. Crop tool interaction
    if (activeTool === 'crop') {
      const topBar = frameType === 'macos' || frameType === 'browser' ? 44 : 0;
      const handle = getCropHandleAt(coords.x, coords.y, cropRect, topBar);
      const imgPixelX = coords.x;
      const imgPixelY = coords.y - topBar;

      if (handle && cropRect) {
        setCropDrag({
          mode: handle,
          startMouse: { x: imgPixelX, y: imgPixelY },
          startRect: { ...cropRect },
        });
      } else {
        const initialRect = { x: imgPixelX, y: imgPixelY, w: 20, h: 20 };
        setCropRect(initialRect);
        setCropDrag({
          mode: 'se',
          startMouse: { x: imgPixelX, y: imgPixelY },
          startRect: initialRect,
        });
      }
      return;
    }

    // 1. Check if clicking on an existing annotation
    const hitId = findAnnotationAtCoords(coords, history);

    if (activeTool === 'select' || hitId) {
      if (hitId) {
        setSelectedAnnotationId(hitId);
        const target = history.find((h) => 'item' in h && h.item.id === hitId);
        if (target && 'item' in target) {
          setMovingAnnotation({
            id: hitId,
            type: target.type as any,
            startCoords: coords,
            initialItem: JSON.parse(JSON.stringify(target.item)),
          });
        }
        return;
      } else if (activeTool === 'select') {
        setSelectedAnnotationId(null);
        setMovingAnnotation(null);
        return;
      }
    }

    if (activeTool === 'text') {
      setEditingText({
        x: coords.x,
        y: coords.y,
        text: '',
        fontSize: textFontSize,
        hasBackdrop: textHasBackdrop,
      });
      return;
    }

    if (activeTool === 'step') {
      const newId = Math.random().toString();
      const newItem: StepBadge = {
        id: newId,
        x: coords.x,
        y: coords.y,
        num: stepCounter,
        color: toolColors.step || '#ef4444',
      };
      setStepBadges((prev) => [...prev, newItem]);
      setStepCounter((c) => c + 1);
      setHistory((prev) => [...prev, { type: 'step', item: newItem }]);
      setRedoStack([]);
      setSelectedAnnotationId(newId);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 0. Crop Drag Finish
    if (activeTool === 'crop') {
      if (cropDrag) {
        setCropDrag(null);
      }
      return;
    }

    // 1. If we were moving an annotation, finish and clean up
    if (movingAnnotation) {
      setMovingAnnotation(null);
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    if (!dragStart) return;
    const end = getInnerCoords(e);

    const dist = Math.hypot(end.x - dragStart.x, end.y - dragStart.y);
    if (dist <= 10) {
      if (activeTool !== 'step' && activeTool !== 'text') {
        const hitId = findAnnotationAtCoords(end, history);
        setSelectedAnnotationId(hitId);
      }
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    if (dist > 10) {
      const newId = Math.random().toString();
      if (activeTool === 'arrow') {
        const newItem: ArrowAnnotation = {
          id: newId,
          startX: dragStart.x,
          startY: dragStart.y,
          endX: end.x,
          endY: end.y,
          color: toolColors.arrow || '#ef4444',
          width: strokeWidth,
          isCurved: arrowStyle === 'curved',
        };
        setArrows((prev) => [...prev, newItem]);
        setHistory((prev) => [...prev, { type: 'arrow', item: newItem }]);
        setRedoStack([]);
        setSelectedAnnotationId(newId);
      } else if (activeTool === 'box') {
        const newItem: BoxAnnotation = {
          id: newId,
          x: Math.min(dragStart.x, end.x),
          y: Math.min(dragStart.y, end.y),
          w: Math.abs(end.x - dragStart.x),
          h: Math.abs(end.y - dragStart.y),
          color: toolColors.box || '#ef4444',
          isDashed: boxIsDashed,
          strokeWidth,
        };
        setBoxes((prev) => [...prev, newItem]);
        setHistory((prev) => [...prev, { type: 'box', item: newItem }]);
        setRedoStack([]);
        setSelectedAnnotationId(newId);
      } else if (activeTool === 'blur') {
        const newItem: BlurAnnotation = {
          id: newId,
          x: Math.min(dragStart.x, end.x),
          y: Math.min(dragStart.y, end.y),
          w: Math.abs(end.x - dragStart.x),
          h: Math.abs(end.y - dragStart.y),
        };
        setBlurs((prev) => [...prev, newItem]);
        setHistory((prev) => [...prev, { type: 'blur', item: newItem }]);
        setRedoStack([]);
        setSelectedAnnotationId(newId);
      } else if (activeTool === 'spotlight') {
        const newItem: SpotlightAnnotation = {
          id: newId,
          x: Math.min(dragStart.x, end.x),
          y: Math.min(dragStart.y, end.y),
          w: Math.abs(end.x - dragStart.x),
          h: Math.abs(end.y - dragStart.y),
        };
        setSpotlights((prev) => [...prev, newItem]);
        setHistory((prev) => [...prev, { type: 'spotlight', item: newItem }]);
        setRedoStack([]);
        setSelectedAnnotationId(newId);
      }
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getInnerCoords(e);

    // 0. Crop Drag in Real-time
    if (activeTool === 'crop') {
      const topBar = frameType === 'macos' || frameType === 'browser' ? 44 : 0;
      const imgPixelX = coords.x;
      const imgPixelY = coords.y - topBar;

      if (cropDrag && cropRect) {
        const dx = imgPixelX - cropDrag.startMouse.x;
        const dy = imgPixelY - cropDrag.startMouse.y;
        const s = cropDrag.startRect;
        const ratioVal = getCropRatioValue(cropRatio);

        const imgW = computedDims.w || 1280;
        const imgH = computedDims.h || 720;

        if (cropDrag.mode === 'move') {
          const newX = Math.max(0, Math.min(imgW - s.w, s.x + dx));
          const newY = Math.max(0, Math.min(imgH - s.h, s.y + dy));
          setCropRect({ ...s, x: newX, y: newY });
        } else {
          let newX = s.x;
          let newY = s.y;
          let newW = s.w;
          let newH = s.h;

          if (cropDrag.mode === 'se') {
            newW = Math.max(30, s.w + dx);
            newH = ratioVal ? Math.round(newW / ratioVal) : Math.max(30, s.h + dy);
          } else if (cropDrag.mode === 'sw') {
            newW = Math.max(30, s.w - dx);
            newH = ratioVal ? Math.round(newW / ratioVal) : Math.max(30, s.h + dy);
            newX = s.x + (s.w - newW);
          } else if (cropDrag.mode === 'ne') {
            newW = Math.max(30, s.w + dx);
            newH = ratioVal ? Math.round(newW / ratioVal) : Math.max(30, s.h - dy);
            newY = s.y + (s.h - newH);
          } else if (cropDrag.mode === 'nw') {
            newW = Math.max(30, s.w - dx);
            newH = ratioVal ? Math.round(newW / ratioVal) : Math.max(30, s.h - dy);
            newX = s.x + (s.w - newW);
            newY = s.y + (s.h - newH);
          } else if (cropDrag.mode === 'e') {
            newW = Math.max(30, s.w + dx);
            if (ratioVal) newH = Math.round(newW / ratioVal);
          } else if (cropDrag.mode === 'w') {
            newW = Math.max(30, s.w - dx);
            newX = s.x + (s.w - newW);
            if (ratioVal) newH = Math.round(newW / ratioVal);
          } else if (cropDrag.mode === 's') {
            newH = Math.max(30, s.h + dy);
            if (ratioVal) newH = Math.round(newH * ratioVal);
          } else if (cropDrag.mode === 'n') {
            newH = Math.max(30, s.h - dy);
            newY = s.y + (s.h - newH);
            if (ratioVal) newW = Math.round(newH * ratioVal);
          }

          newX = Math.max(0, newX);
          newY = Math.max(0, newY);
          if (newX + newW > imgW) newW = Math.max(30, imgW - newX);
          if (newY + newH > imgH) newH = Math.max(30, imgH - newY);

          setCropRect({ x: newX, y: newY, w: newW, h: newH });
        }
      }

      if (!cropDrag && cropRect && canvasRef.current) {
        const handle = getCropHandleAt(coords.x, coords.y, cropRect, topBar);
        if (handle === 'nw' || handle === 'se') canvasRef.current.style.cursor = 'nwse-resize';
        else if (handle === 'ne' || handle === 'sw') canvasRef.current.style.cursor = 'nesw-resize';
        else if (handle === 'n' || handle === 's') canvasRef.current.style.cursor = 'ns-resize';
        else if (handle === 'e' || handle === 'w') canvasRef.current.style.cursor = 'ew-resize';
        else if (handle === 'move') canvasRef.current.style.cursor = 'move';
        else canvasRef.current.style.cursor = 'crosshair';
      }
      return;
    }

    // 1. Dragging to move existing annotation in real-time
    if (movingAnnotation) {
      const dx = coords.x - movingAnnotation.startCoords.x;
      const dy = coords.y - movingAnnotation.startCoords.y;
      const init = movingAnnotation.initialItem;

      if (movingAnnotation.type === 'step') {
        setStepBadges((prev) =>
          prev.map((s) => (s.id === init.id ? { ...s, x: Math.round(init.x + dx), y: Math.round(init.y + dy) } : s))
        );
      } else if (movingAnnotation.type === 'arrow') {
        setArrows((prev) =>
          prev.map((a) =>
            a.id === init.id
              ? {
                  ...a,
                  startX: Math.round(init.startX + dx),
                  startY: Math.round(init.startY + dy),
                  endX: Math.round(init.endX + dx),
                  endY: Math.round(init.endY + dy),
                }
              : a
          )
        );
      } else if (movingAnnotation.type === 'box') {
        setBoxes((prev) =>
          prev.map((b) => (b.id === init.id ? { ...b, x: Math.round(init.x + dx), y: Math.round(init.y + dy) } : b))
        );
      } else if (movingAnnotation.type === 'blur') {
        setBlurs((prev) =>
          prev.map((b) => (b.id === init.id ? { ...b, x: Math.round(init.x + dx), y: Math.round(init.y + dy) } : b))
        );
      } else if (movingAnnotation.type === 'text') {
        setTexts((prev) =>
          prev.map((t) => (t.id === init.id ? { ...t, x: Math.round(init.x + dx), y: Math.round(init.y + dy) } : t))
        );
      } else if (movingAnnotation.type === 'spotlight') {
        setSpotlights((prev) =>
          prev.map((sp) => (sp.id === init.id ? { ...sp, x: Math.round(init.x + dx), y: Math.round(init.y + dy) } : sp))
        );
      }

      setHistory((prev) =>
        prev.map((h) => {
          if (!('item' in h) || h.item.id !== init.id) return h;
          if (h.type === 'step') return { ...h, item: { ...h.item, x: Math.round(init.x + dx), y: Math.round(init.y + dy) } };
          if (h.type === 'arrow') {
            return {
              ...h,
              item: {
                ...h.item,
                startX: Math.round(init.startX + dx),
                startY: Math.round(init.startY + dy),
                endX: Math.round(init.endX + dx),
                endY: Math.round(init.endY + dy),
              },
            };
          }
          if (h.type === 'box') return { ...h, item: { ...h.item, x: Math.round(init.x + dx), y: Math.round(init.y + dy) } };
          if (h.type === 'blur') return { ...h, item: { ...h.item, x: Math.round(init.x + dx), y: Math.round(init.y + dy) } };
          if (h.type === 'text') return { ...h, item: { ...h.item, x: Math.round(init.x + dx), y: Math.round(init.y + dy) } };
          if (h.type === 'spotlight') return { ...h, item: { ...h.item, x: Math.round(init.x + dx), y: Math.round(init.y + dy) } };
          return h;
        })
      );
      return;
    }

    // 2. Rubber-band preview when drawing new annotations
    if (dragStart) {
      setDragCurrent(coords);
      return;
    }

    // 3. Hover detection for grab cursor & highlight
    const hitId = findAnnotationAtCoords(coords, history);
    setHoveredAnnotationId(hitId);
  };

  const handleCanvasMouseLeave = () => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = '';
    }
    if (cropDrag) {
      setCropDrag(null);
    }
    if (movingAnnotation) {
      setMovingAnnotation(null);
    }
    if (dragStart) {
      setDragStart(null);
      setDragCurrent(null);
    }
    setHoveredAnnotationId(null);
  };

  return {
    getCanvasCoords,
    getInnerCoords,
    handleCanvasMouseDown,
    handleCanvasMouseUp,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
  };
}
