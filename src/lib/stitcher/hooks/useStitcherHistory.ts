'use client';

import { useState, useCallback } from 'react';
import { StitcherLayer } from '@/types/stitcher';

export function useStitcherHistory() {
  const [history, setHistory] = useState<StitcherLayer[][]>([]);
  const [redoStack, setRedoStack] = useState<StitcherLayer[][]>([]);

  const pushSnapshot = useCallback((layers: StitcherLayer[]) => {
    // Clone layers to prevent reference mutation
    const snapshot = layers.map((l) => ({ ...l }));
    setHistory((prev) => {
      // Limit to 20 steps
      const next = [...prev, snapshot];
      if (next.length > 20) return next.slice(next.length - 20);
      return next;
    });
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(
    (currentLayers: StitcherLayer[]): StitcherLayer[] | null => {
      if (history.length === 0) return null;
      const prevSnapshot = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setRedoStack((redo) => [...redo, currentLayers.map((l) => ({ ...l }))]);
      return prevSnapshot;
    },
    [history]
  );

  const handleRedo = useCallback(
    (currentLayers: StitcherLayer[]): StitcherLayer[] | null => {
      if (redoStack.length === 0) return null;
      const nextSnapshot = redoStack[redoStack.length - 1];
      setRedoStack((redo) => redo.slice(0, -1));
      setHistory((hist) => [...hist, currentLayers.map((l) => ({ ...l }))]);
      return nextSnapshot;
    },
    [redoStack]
  );

  const canUndo = history.length > 0;
  const canRedo = redoStack.length > 0;

  return {
    pushSnapshot,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  };
}
