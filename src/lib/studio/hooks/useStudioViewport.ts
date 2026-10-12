import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseStudioViewportProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  computedDims: { w: number; h: number };
  imageSrc: string | null;
}

export function useStudioViewport({
  canvasRef,
  computedDims,
  imageSrc,
}: UseStudioViewportProps) {
  const [zoomScale, setZoomScale] = useState<number>(1);
  const hasInitialFitRef = useRef<boolean>(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportDims, setViewportDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateDims = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportDims({
          w: Math.floor(rect.width),
          h: Math.floor(rect.height),
        });
      }
    };

    updateDims();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        updateDims();
      });
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);

  // Compute exact fit ratio so that canvas fits BOTH width AND height without any scroll
  const calculateFitScale = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return 1;

    // Use getBoundingClientRect() to measure the real geometry of the viewport card
    // immune to scrollbars appearing/disappearing
    const rect = el.getBoundingClientRect();
    const vpW = Math.floor(rect.width > 0 ? rect.width : (viewportDims.w || 1000));
    const vpH = Math.floor(rect.height > 0 ? rect.height : (viewportDims.h || 600));

    if (vpW <= 0 || vpH <= 0) return 1;

    // Use computedDims directly as source of truth for target canvas dimensions
    const targetW = computedDims.w > 0 ? computedDims.w : (canvasRef.current?.width || 1280);
    const targetH = computedDims.h > 0 ? computedDims.h : (canvasRef.current?.height || 720);

    if (targetW <= 0 || targetH <= 0) return 1;

    // Safe 32px padding (16px on each side) inside viewport card
    const availW = Math.max(100, vpW - 32);
    const availH = Math.max(100, vpH - 32);

    const rawScale = Math.min(availW / targetW, availH / targetH);
    // Don't upscale past 100% in fit mode to maintain crispness, round DOWN to 2 decimals
    const fit = Math.max(0.05, Math.min(1.0, Math.floor(rawScale * 100) / 100));
    return fit;
  }, [canvasRef, computedDims.w, computedDims.h, viewportDims.w, viewportDims.h]);

  const handleApplyFit = useCallback(() => {
    const scale = calculateFitScale();
    setZoomScale(scale);
  }, [calculateFitScale]);

  // Auto-fit strictly when a new image is loaded and its real dimensions are computed
  const lastFittedKeyRef = useRef<string>('');

  useEffect(() => {
    if (!imageSrc || computedDims.w <= 0 || computedDims.h <= 0) return;

    // Create a key representing this image and its resolved dimensions
    const fitKey = `${imageSrc}-${computedDims.w}x${computedDims.h}`;
    if (lastFittedKeyRef.current === fitKey && hasInitialFitRef.current) return;

    const el = viewportRef.current;
    const rect = el ? el.getBoundingClientRect() : null;
    const vpW = Math.floor(rect && rect.width > 0 ? rect.width : (viewportDims.w || 0));
    const vpH = Math.floor(rect && rect.height > 0 ? rect.height : (viewportDims.h || 0));

    if (vpW > 0 && vpH > 0) {
      const availW = Math.max(100, vpW - 32);
      const availH = Math.max(100, vpH - 32);
      const rawScale = Math.min(availW / computedDims.w, availH / computedDims.h);
      const fit = Math.max(0.05, Math.min(1.0, Math.floor(rawScale * 100) / 100));
      setZoomScale(fit);
      hasInitialFitRef.current = true;
      lastFittedKeyRef.current = fitKey;
    }
  }, [imageSrc, computedDims.w, computedDims.h, viewportDims.w, viewportDims.h]);

  const handleStepZoom = useCallback((delta: number) => {
    setZoomScale((prev) => {
      let next = Math.round((prev + delta) * 100) / 100;
      if (next < 0.05) next = 0.05;
      if (next > 3) next = 3;
      return next;
    });
  }, []);

  const handleCanvasWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        handleStepZoom(delta);
      }
    },
    [handleStepZoom]
  );

  const resetInitialFit = useCallback(() => {
    hasInitialFitRef.current = false;
    lastFittedKeyRef.current = '';
    setZoomScale(1);
  }, []);

  return {
    zoomScale,
    setZoomScale,
    viewportRef,
    viewportDims,
    setViewportDims,
    hasInitialFitRef,
    calculateFitScale,
    handleApplyFit,
    handleStepZoom,
    handleCanvasWheel,
    resetInitialFit,
  };
}
