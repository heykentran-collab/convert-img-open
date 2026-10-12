import { useEffect } from 'react';
import { StudioTool, HistoryAction, CropRatio } from '@/types/studio';

export interface UseStudioShortcutsProps {
  handleUndo: () => void;
  handleRedo: () => void;
  handleDeleteAnnotation: (id: string, type: any) => void;
  handleMoveAnnotation: (id: string, dx: number, dy: number) => void;
  selectedAnnotationId: string | null;
  setSelectedAnnotationId: (id: string | null) => void;
  history: HistoryAction[];
  activeTool: StudioTool;
  setActiveTool: (tool: StudioTool) => void;
  cropRect: { x: number; y: number; w: number; h: number } | null;
  setCropRect: (rect: { x: number; y: number; w: number; h: number } | null) => void;
  initDefaultCrop: (ratio?: CropRatio) => void;
  setShowShortcutsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingText: (text: any) => void;
  handleApplyFit: () => void;
  setZoomScale: React.Dispatch<React.SetStateAction<number>> | ((scale: number) => void);
  handleStepZoom: (delta: number) => void;
  setShowExportModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useStudioShortcuts({
  handleUndo,
  handleRedo,
  handleDeleteAnnotation,
  handleMoveAnnotation,
  selectedAnnotationId,
  setSelectedAnnotationId,
  history,
  activeTool,
  setActiveTool,
  cropRect,
  setCropRect,
  initDefaultCrop,
  setShowShortcutsModal,
  setEditingText,
  handleApplyFit,
  setZoomScale,
  handleStepZoom,
  setShowExportModal,
}: UseStudioShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const tagName = activeEl?.tagName.toUpperCase();
      const isEditable = activeEl?.getAttribute('contenteditable') === 'true';
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || isEditable) {
        return;
      }

      const key = e.key.toLowerCase();

      // Undo: Ctrl+Z or Cmd+Z (without Shift)
      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Shift+Z, Cmd+Shift+Z, or Ctrl+Y
      if (
        ((e.ctrlKey || e.metaKey) && key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && key === 'y')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete or Backspace: Remove selected annotation or undo last
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedAnnotationId) {
          const target = history.find((h) => 'item' in h && h.item.id === selectedAnnotationId);
          if (target && 'item' in target) {
            handleDeleteAnnotation(target.item.id, target.type as any);
            return;
          }
        }
        handleUndo();
        return;
      }

      // Arrow keys nudge: Di chuyển chú thích đang chọn (1px hoặc 10px khi giữ Shift)
      if (
        selectedAnnotationId &&
        (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        handleMoveAnnotation(selectedAnnotationId, dx, dy);
        return;
      }

      // Escape: Close shortcuts modal, deselect, or cancel text editing
      if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setEditingText(null);
        setSelectedAnnotationId(null);
        if (activeTool === 'crop') {
          setCropRect(null);
          setActiveTool('select');
        }
        return;
      }

      // Question mark (?): Toggle cheat sheet modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // Zoom shortcuts: Ctrl+0 (Fit), Ctrl+1 (100%), Ctrl+= (Zoom In), Ctrl+- (Zoom Out)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '0') {
          e.preventDefault();
          handleApplyFit();
          return;
        }
        if (e.key === '1') {
          e.preventDefault();
          setZoomScale(1);
          return;
        }
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleStepZoom(0.15);
          return;
        }
        if (e.key === '-') {
          e.preventDefault();
          handleStepZoom(-0.15);
          return;
        }
        if (key === 's') {
          e.preventDefault();
          setShowExportModal(true);
          return;
        }
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Tool shortcut hotkeys
      if (key === 'v') {
        e.preventDefault();
        setActiveTool('select');
      } else if (key === 'a') {
        e.preventDefault();
        setActiveTool('arrow');
      } else if (key === 's') {
        e.preventDefault();
        setActiveTool('step');
      } else if (key === 'b') {
        e.preventDefault();
        setActiveTool('box');
      } else if (key === 'm') {
        e.preventDefault();
        setActiveTool('blur');
      } else if (key === 't') {
        e.preventDefault();
        setActiveTool('text');
      } else if (key === 'f') {
        e.preventDefault();
        setActiveTool('spotlight');
      } else if (key === 'c') {
        e.preventDefault();
        setActiveTool('crop');
        if (!cropRect) initDefaultCrop();
      } else if (key === 'w') {
        e.preventDefault();
        setActiveTool('watermark');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDeleteAnnotation,
    handleMoveAnnotation,
    selectedAnnotationId,
    setSelectedAnnotationId,
    initDefaultCrop,
    history,
    cropRect,
    activeTool,
    handleStepZoom,
    handleApplyFit,
    setActiveTool,
    setCropRect,
    setEditingText,
    setShowExportModal,
    setShowShortcutsModal,
    setZoomScale,
  ]);
}
