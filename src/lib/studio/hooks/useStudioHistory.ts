'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  StepBadge,
  ArrowAnnotation,
  BoxAnnotation,
  BlurAnnotation,
  TextAnnotation,
  SpotlightAnnotation,
  HistoryAction,
  StudioAnnotationUpdates,
} from '@/types/studio';

export interface UseStudioHistoryOptions {
  onRestoreImage?: (src: string) => void;
}

export function useStudioHistory(options: UseStudioHistoryOptions = {}) {
  const { onRestoreImage } = options;

  const [stepBadges, setStepBadges] = useState<StepBadge[]>([]);
  const [arrows, setArrows] = useState<ArrowAnnotation[]>([]);
  const [boxes, setBoxes] = useState<BoxAnnotation[]>([]);
  const [blurs, setBlurs] = useState<BlurAnnotation[]>([]);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [spotlights, setSpotlights] = useState<SpotlightAnnotation[]>([]);

  const [stepCounter, setStepCounter] = useState<number>(1);
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [movingAnnotation, setMovingAnnotation] = useState<{
    id: string;
    type: 'step' | 'arrow' | 'box' | 'blur' | 'text' | 'spotlight';
    startCoords: { x: number; y: number };
    initialItem: any;
  } | null>(null);

  const annotationLayers = useMemo(
    () =>
      history.filter(
        (h): h is Exclude<HistoryAction, { type: 'image-transform' }> => h.type !== 'image-transform'
      ),
    [history]
  );

  const handleMoveAnnotation = useCallback((id: string, dx: number, dy: number) => {
    setStepBadges((prev) =>
      prev.map((s) => (s.id === id ? { ...s, x: Math.round(s.x + dx), y: Math.round(s.y + dy) } : s))
    );
    setArrows((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              startX: Math.round(a.startX + dx),
              startY: Math.round(a.startY + dy),
              endX: Math.round(a.endX + dx),
              endY: Math.round(a.endY + dy),
            }
          : a
      )
    );
    setBoxes((prev) =>
      prev.map((b) => (b.id === id ? { ...b, x: Math.round(b.x + dx), y: Math.round(b.y + dy) } : b))
    );
    setBlurs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, x: Math.round(b.x + dx), y: Math.round(b.y + dy) } : b))
    );
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, x: Math.round(t.x + dx), y: Math.round(t.y + dy) } : t))
    );
    setSpotlights((prev) =>
      prev.map((sp) => (sp.id === id ? { ...sp, x: Math.round(sp.x + dx), y: Math.round(sp.y + dy) } : sp))
    );
    setHistory((prev) =>
      prev.map((h) => {
        if (!('item' in h) || h.item.id !== id) return h;
        if (h.type === 'step') {
          return { ...h, item: { ...h.item, x: Math.round(h.item.x + dx), y: Math.round(h.item.y + dy) } };
        }
        if (h.type === 'arrow') {
          return {
            ...h,
            item: {
              ...h.item,
              startX: Math.round(h.item.startX + dx),
              startY: Math.round(h.item.startY + dy),
              endX: Math.round(h.item.endX + dx),
              endY: Math.round(h.item.endY + dy),
            },
          };
        }
        if (h.type === 'box') {
          return { ...h, item: { ...h.item, x: Math.round(h.item.x + dx), y: Math.round(h.item.y + dy) } };
        }
        if (h.type === 'blur') {
          return { ...h, item: { ...h.item, x: Math.round(h.item.x + dx), y: Math.round(h.item.y + dy) } };
        }
        if (h.type === 'text') {
          return { ...h, item: { ...h.item, x: Math.round(h.item.x + dx), y: Math.round(h.item.y + dy) } };
        }
        if (h.type === 'spotlight') {
          return { ...h, item: { ...h.item, x: Math.round(h.item.x + dx), y: Math.round(h.item.y + dy) } };
        }
        return h;
      })
    );
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);

    if (last.type === 'image-transform') {
      if (onRestoreImage) onRestoreImage(last.prevImageSrc);
      setStepBadges(last.prevAnnotations.stepBadges);
      setArrows(last.prevAnnotations.arrows);
      setBoxes(last.prevAnnotations.boxes);
      setBlurs(last.prevAnnotations.blurs);
      setTexts(last.prevAnnotations.texts);
      setSpotlights(last.prevAnnotations.spotlights);
      setSelectedAnnotationId(null);
      return;
    }

    if (last.type === 'arrow') {
      setArrows((prev) => prev.filter((a) => a.id !== last.item.id));
    } else if (last.type === 'box') {
      setBoxes((prev) => prev.filter((b) => b.id !== last.item.id));
    } else if (last.type === 'step') {
      setStepBadges((prev) => prev.filter((s) => s.id !== last.item.id));
      setStepCounter((c) => Math.max(1, c - 1));
    } else if (last.type === 'blur') {
      setBlurs((prev) => prev.filter((b) => b.id !== last.item.id));
    } else if (last.type === 'text') {
      setTexts((prev) => prev.filter((t) => t.id !== last.item.id));
    } else if (last.type === 'spotlight') {
      setSpotlights((prev) => prev.filter((sp) => sp.id !== last.item.id));
    }
    setSelectedAnnotationId((curr) => ('item' in last && curr === last.item.id ? null : curr));
  }, [history, onRestoreImage]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setHistory((prev) => [...prev, next]);

    if (next.type === 'image-transform') {
      if (onRestoreImage) onRestoreImage(next.nextImageSrc);
      setStepBadges(next.nextAnnotations.stepBadges);
      setArrows(next.nextAnnotations.arrows);
      setBoxes(next.nextAnnotations.boxes);
      setBlurs(next.nextAnnotations.blurs);
      setTexts(next.nextAnnotations.texts);
      setSpotlights(next.nextAnnotations.spotlights);
      setSelectedAnnotationId(null);
      return;
    }

    if (next.type === 'arrow') {
      setArrows((prev) => [...prev, next.item]);
    } else if (next.type === 'box') {
      setBoxes((prev) => [...prev, next.item]);
    } else if (next.type === 'step') {
      setStepBadges((prev) => [...prev, next.item]);
      setStepCounter((c) => Math.max(c, next.item.num + 1));
    } else if (next.type === 'blur') {
      setBlurs((prev) => [...prev, next.item]);
    } else if (next.type === 'text') {
      setTexts((prev) => [...prev, next.item]);
    } else if (next.type === 'spotlight') {
      setSpotlights((prev) => [...prev, next.item]);
    }
    setSelectedAnnotationId('item' in next ? next.item.id : null);
  }, [redoStack, onRestoreImage]);

  const handleDeleteAnnotation = useCallback(
    (id: string, type: 'step' | 'arrow' | 'box' | 'blur' | 'text' | 'spotlight') => {
      if (type === 'step') setStepBadges((prev) => prev.filter((s) => s.id !== id));
      else if (type === 'arrow') setArrows((prev) => prev.filter((a) => a.id !== id));
      else if (type === 'box') setBoxes((prev) => prev.filter((b) => b.id !== id));
      else if (type === 'blur') setBlurs((prev) => prev.filter((b) => b.id !== id));
      else if (type === 'text') setTexts((prev) => prev.filter((t) => t.id !== id));
      else if (type === 'spotlight') setSpotlights((prev) => prev.filter((sp) => sp.id !== id));

      setHistory((prev) => prev.filter((h) => !('item' in h) || h.item.id !== id));
      setSelectedAnnotationId((curr) => (curr === id ? null : curr));
      setHoveredAnnotationId((curr) => (curr === id ? null : curr));
    },
    []
  );

  const handleUpdateSelectedAnnotation = useCallback(
    (updates: StudioAnnotationUpdates) => {
      if (!selectedAnnotationId) return;

      setHistory((prev) =>
        prev.map((h) => {
          if ('item' in h && h.item && h.item.id === selectedAnnotationId) {
            return {
              ...h,
              item: {
                ...h.item,
                ...updates,
              },
            } as HistoryAction;
          }
          return h;
        })
      );

      setArrows((prev) =>
        prev.map((a) => (a.id === selectedAnnotationId ? { ...a, ...updates } : a))
      );
      setBoxes((prev) =>
        prev.map((b) => (b.id === selectedAnnotationId ? { ...b, ...updates } : b))
      );
      setStepBadges((prev) =>
        prev.map((s) => (s.id === selectedAnnotationId ? { ...s, ...updates } : s))
      );
      setTexts((prev) =>
        prev.map((t) => (t.id === selectedAnnotationId ? { ...t, ...updates } : t))
      );
      setBlurs((prev) =>
        prev.map((b) => (b.id === selectedAnnotationId ? { ...b, ...updates } : b))
      );
      setSpotlights((prev) =>
        prev.map((s) => (s.id === selectedAnnotationId ? { ...s, ...updates } : s))
      );
    },
    [selectedAnnotationId]
  );

  const handleClearAnnotations = useCallback(() => {
    const totalCount =
      arrows.length +
      stepBadges.length +
      boxes.length +
      blurs.length +
      texts.length +
      spotlights.length;
    if (totalCount === 0) return;

    if (
      typeof window !== 'undefined' &&
      window.confirm(
        'Bạn có chắc chắn muốn xóa toàn bộ chú thích trên ảnh không?\n(Ảnh và thiết lập khung/nền vẫn được giữ nguyên)'
      )
    ) {
      setArrows([]);
      setStepBadges([]);
      setBoxes([]);
      setBlurs([]);
      setTexts([]);
      setSpotlights([]);
      setHistory((prev) => prev.filter((h) => h.type === 'image-transform'));
      setRedoStack([]);
      setSelectedAnnotationId(null);
      setHoveredAnnotationId(null);
      setStepCounter(1);
    }
  }, [arrows.length, stepBadges.length, boxes.length, blurs.length, texts.length, spotlights.length]);

  const saveImageSnapshot = useCallback(
    (
      label: string,
      currentImg: string,
      nextImg: string,
      nextAnnotations: {
        stepBadges: StepBadge[];
        arrows: ArrowAnnotation[];
        boxes: BoxAnnotation[];
        blurs: BlurAnnotation[];
        texts: TextAnnotation[];
        spotlights: SpotlightAnnotation[];
      }
    ) => {
      if (!currentImg) return;
      const snapshot: HistoryAction = {
        type: 'image-transform',
        label,
        prevImageSrc: currentImg,
        nextImageSrc: nextImg,
        prevAnnotations: {
          stepBadges: JSON.parse(JSON.stringify(stepBadges)),
          arrows: JSON.parse(JSON.stringify(arrows)),
          boxes: JSON.parse(JSON.stringify(boxes)),
          blurs: JSON.parse(JSON.stringify(blurs)),
          texts: JSON.parse(JSON.stringify(texts)),
          spotlights: JSON.parse(JSON.stringify(spotlights)),
        },
        nextAnnotations: JSON.parse(JSON.stringify(nextAnnotations)),
      };
      setHistory((prev) => [...prev, snapshot]);
      setRedoStack([]);
    },
    [stepBadges, arrows, boxes, blurs, texts, spotlights]
  );

  const resetAnnotations = useCallback(() => {
    setStepBadges([]);
    setArrows([]);
    setBoxes([]);
    setBlurs([]);
    setTexts([]);
    setSpotlights([]);
    setHistory([]);
    setRedoStack([]);
    setStepCounter(1);
    setSelectedAnnotationId(null);
    setHoveredAnnotationId(null);
    setMovingAnnotation(null);
  }, []);

  return {
    stepBadges,
    setStepBadges,
    arrows,
    setArrows,
    boxes,
    setBoxes,
    blurs,
    setBlurs,
    texts,
    setTexts,
    spotlights,
    setSpotlights,
    stepCounter,
    setStepCounter,
    history,
    setHistory,
    redoStack,
    setRedoStack,
    selectedAnnotationId,
    setSelectedAnnotationId,
    hoveredAnnotationId,
    setHoveredAnnotationId,
    movingAnnotation,
    setMovingAnnotation,
    annotationLayers,
    handleMoveAnnotation,
    handleUndo,
    handleRedo,
    handleDeleteAnnotation,
    handleUpdateSelectedAnnotation,
    handleClearAnnotations,
    saveImageSnapshot,
    resetAnnotations,
  };
}
