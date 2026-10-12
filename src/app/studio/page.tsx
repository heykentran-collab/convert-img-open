'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Wand2,
  Undo2,
  Copy,
  Download,
  Upload,
  Check,
  CloudUpload,
  RefreshCw,
  Database,
  ExternalLink,
  Layers,
  Sparkles,
  Redo2,
  Eraser,
  Keyboard,
  Type,
  PanelRightClose,
  PanelRightOpen,
  Stamp,
  ChevronDown,
  Sliders,
  X,
} from 'lucide-react';
import {
  StudioTool,
  CropRatio,
  StepBadge,
  ArrowAnnotation,
  BoxAnnotation,
  BlurAnnotation,
  TextAnnotation,
  SpotlightAnnotation,
  WatermarkConfig,
} from '@/types/studio';
import { updateOrAddConverterItemBlob, getConverterItem } from '@/lib/converter-storage';
import {
  saveStudioActiveSession,
  loadStudioActiveSession,
  clearStudioActiveSession,
  srcToBlob,
  updateStudioAnnotations,
} from '@/lib/studio-storage';
import { addLayerBlobToStitcher } from '@/lib/stitcher';

import {
  BACKGROUND_PRESETS,
  SOLID_PRESETS,
  calculateMockupDimensions,
  renderBackground,
  renderDropShadow,
  renderMockupWindow,
  renderSpotlights,
  renderBlurs,
  renderBoxes,
  renderArrows,
  renderStepBadges,
  renderTexts,
  renderWatermark,
  renderRubberband,
  renderHighlightOutline,
  renderCropOverlay,
  findAnnotationAtCoords,
  getCropHandleAt,
  useStudioSettings,
  useStudioHistory,
  useStudioShortcuts,
  useStudioExport,
  useStudioTransform,
  useStudioCrop,
  useStudioViewport,
  useStudioCanvasEvents,
} from '@/lib/studio';
import {
  FloatingStudioIsland,
  WatermarkInspector,
  SelectionStatusBar,
  LayersInspector,
  MockupInspector,
  ShortcutsModal,
  StudioExportModal,
  StudioHeaderBar,
} from '@/components/studio';
import { useI18n } from '@/lib/i18n-context';

function StudioContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  // Safely update imageSrc: release previous blob URL only when replacing with a new one
  const updateImageSrc = useCallback((newSrc: string | null) => {
    if (
      activeBlobUrlRef.current &&
      activeBlobUrlRef.current !== newSrc &&
      activeBlobUrlRef.current.startsWith('blob:')
    ) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
    }
    activeBlobUrlRef.current = newSrc && newSrc.startsWith('blob:') ? newSrc : null;
    setImageSrc(newSrc);
  }, []);

  // Cleanup active blob URL on final component unmount
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current && activeBlobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  const [sourceKey, setSourceKey] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [sourceType, setSourceType] = useState<string | null>(null);
  const [converterId, setConverterId] = useState<string | null>(null);
  const [savedToConverter, setSavedToConverter] = useState<boolean>(false);

  // Multi-format & High-res Export States
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Custom Hook: Studio Export Engine
  const {
    copied,
    sendingToStitcher,
    uploadingToR2,
    uploadSuccess,
    handleExportStudioImage,
    copyImageToClipboard,
    handleSendToStitcher,
    handleSaveToR2,
  } = useStudioExport({
    canvasRef,
    sourceKey,
    setSourceKey,
    imageSrc,
  });

  // Helper to persist active image blob in IndexedDB for F5 resilience
  const persistActiveImage = useCallback(
    async (src: string | Blob, customKey?: string) => {
      const blob = await srcToBlob(src);
      if (blob) {
        const key = customKey || sourceKey || 'image.png';
        await saveStudioActiveSession(blob, {
          name: key,
          sourceKey: key,
          sourceType: sourceType || 'converter',
          converterId: converterId || null,
        });
      }
    },
    [sourceKey, sourceType, converterId]
  );

  const [activeTool, setActiveTool] = useState<StudioTool>('select');

  
  // Per-tool color states so changing box color doesn't alter step badge or arrow colors
  const [toolColors, setToolColors] = useState<Record<string, string>>({
    step: '#ef4444',
    box: '#ef4444',
    arrow: '#ef4444',
    text: '#ffffff',
    spotlight: '#38bdf8',
  });

  const handleUpdateToolColor = useCallback((tool: string, color: string) => {
    setToolColors((prev) => ({
      ...prev,
      [tool]: color,
    }));
  }, []);

  // Custom Hook 1: Studio Mockup Settings Engine
  const {
    canvasPadding,
    setCanvasPadding,
    backgroundType,
    setBackgroundType,
    backgroundPresetId,
    setBackgroundPresetId,
    customSolidColor,
    setCustomSolidColor,
    shadowIntensity,
    setShadowIntensity,
    cornerRadius,
    setCornerRadius,
    aspectRatio,
    setAspectRatio,
    frameType,
    setFrameType,
    browserUrl,
    setBrowserUrl,
    settingsFeedback,
    computedDims,
    setComputedDims,
    canvasOffsetRef,
    handleSaveSettings,
    handleResetSettings,
  } = useStudioSettings();

  // Custom Hook 2: Studio Annotations & History Engine
  const {
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
  } = useStudioHistory({
    onRestoreImage: (src) => {
      updateImageSrc(src);
      persistActiveImage(src);
    },
  });

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Custom Hook 4: Studio Crop Engine
  const {
    cropRect,
    setCropRect,
    cropRatio,
    setCropRatio,
    cropDrag,
    setCropDrag,
    initDefaultCrop,
    handleApplyCrop,
    getCropRatioValue,
  } = useStudioCrop({
    imageSrc,
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
    setActiveTool,
    saveImageSnapshot,
    updateImageSrc,
    persistActiveImage,
  });

  // Professional Watermark State
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
    enabled: false,
    type: 'text',
    text: '© Volticen.com',
    color: '#ffffff',
    opacity: 0.75,
    size: 18,
    position: 'bottom-right',
    style: 'pill',
  });
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const [logoLoadCount, setLogoLoadCount] = useState<number>(0);
  const innerDimensionsRef = useRef<{ w: number; h: number; topBarHeight: number }>({
    w: 1280,
    h: 720,
    topBarHeight: 0,
  });

  // Stroke, text & shortcut modal state
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [arrowStyle, setArrowStyle] = useState<'straight' | 'curved'>('curved');
  const [boxIsDashed, setBoxIsDashed] = useState<boolean>(false);
  const [textFontSize, setTextFontSize] = useState<number>(16);
  const [textHasBackdrop, setTextHasBackdrop] = useState<boolean>(true);
  const [editingText, setEditingText] = useState<{
    id?: string;
    x: number;
    y: number;
    text: string;
    fontSize: number;
    hasBackdrop: boolean;
  } | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [rightTab, setRightTab] = useState<'mockup' | 'watermark' | 'layers'>('mockup');
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true);

  // Custom Hook 5: Studio Viewport & Zoom Engine
  const {
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
  } = useStudioViewport({
    canvasRef,
    computedDims,
    imageSrc,
  });

  // Common file loader for Drag & Drop, File Input, and Clipboard Paste
  const handleLoadFile = useCallback(
    (file: File) => {
      if (!file || !file.type.startsWith('image/')) return;
      const newBlobUrl = URL.createObjectURL(file);
      updateImageSrc(newBlobUrl);
      setSourceKey(file.name);
      hasInitialFitRef.current = false;
      resetAnnotations();
      setEditingText(null);
      const newId = Math.random().toString(36).slice(2);
      setConverterId(newId);
      setSourceType('converter');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('studio_image_key', file.name);
        sessionStorage.setItem('studio_source', 'converter');
        sessionStorage.setItem('studio_converter_id', newId);
        const cleanUrl = new URL(window.location.href);
        cleanUrl.search = '';
        window.history.replaceState({}, '', cleanUrl.toString());
      }
      saveStudioActiveSession(file, {
        name: file.name,
        sourceKey: file.name,
        sourceType: 'converter',
        converterId: newId,
      });
    },
    [resetAnnotations, updateImageSrc]
  );


  // Drag & Drop State and Handlers
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const dragCounterRef = useRef<number>(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          handleLoadFile(file);
        }
      }
    },
    [handleLoadFile]
  );

  // Clipboard Paste support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleLoadFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleLoadFile]);
  // Collapsible Accordion Cards State (initialized empty to match SSR and avoid hydration mismatch)
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  // Load saved preferences from localStorage on mount (client-only)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedWatermark = localStorage.getItem('studio_watermark_config');
        if (savedWatermark) {
          try {
            const parsed = JSON.parse(savedWatermark);
            setWatermarkConfig((prev) => ({ ...prev, ...parsed }));
          } catch {
            // ignore
          }
        } else {
          const savedW = localStorage.getItem('studio_watermark_text');
          if (savedW) setWatermarkConfig((prev) => ({ ...prev, text: savedW }));
        }

        const savedCards = localStorage.getItem('studio_collapsed_cards');
        if (savedCards) setCollapsedCards(JSON.parse(savedCards));
      }
    } catch {
      // ignore
    }
  }, []);

  // Preload logo image for canvas rendering
  useEffect(() => {
    if (watermarkConfig.type === 'image' && watermarkConfig.imageSrc) {
      const img = new Image();
      img.src = watermarkConfig.imageSrc;
      img.onload = () => {
        logoImageRef.current = img;
        setLogoLoadCount((c) => c + 1);
      };
    } else {
      logoImageRef.current = null;
    }
  }, [watermarkConfig.type, watermarkConfig.imageSrc]);

  const handleUpdateWatermarkConfig = (updates: Partial<WatermarkConfig>) => {
    setWatermarkConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('studio_watermark_config', JSON.stringify(next));
        }
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleCard = useCallback((key: string) => {
    setCollapsedCards((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('studio_collapsed_cards', JSON.stringify(next));
        }
      } catch {
        // ignore
      }
      return next;
    });
  }, []);


  const toggleAllRightCards = useCallback(() => {
    const rightKeys = ['mockup_frame', 'canvas_dimensions', 'canvas_bg', 'canvas_effects'];
    setCollapsedCards((prev) => {
      const allCollapsed = rightKeys.every((k) => prev[k] === true);
      const next = { ...prev };
      rightKeys.forEach((k) => {
        next[k] = !allCollapsed;
      });
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('studio_collapsed_cards', JSON.stringify(next));
        }
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Auto-switch to watermark tab if user activates watermark tool
  useEffect(() => {
    if (activeTool === 'watermark') {
      setRightTab('watermark');
      setShowRightSidebar(true);
    }
  }, [activeTool]);

  // Load image reliably via blob proxy to prevent CORS issues
  const loadImageFromUrl = useCallback(
    async (url: string) => {
      setLoadingImage(true);
      try {
        if (url.startsWith('blob:')) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const blob = await res.blob();
              const localBlobUrl = URL.createObjectURL(blob);
              updateImageSrc(localBlobUrl);
              hasInitialFitRef.current = false;
              saveStudioActiveSession(blob, {
                name: 'studio-image.png',
                sourceKey: 'studio-image.png',
                sourceType: 'converter',
                converterId: null,
              });
              return;
            }
          } catch {
            // If fetch fails (expired blob), continue
          }
          updateImageSrc(url);
          return;
        }
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const localBlobUrl = URL.createObjectURL(blob);
        updateImageSrc(localBlobUrl);
        hasInitialFitRef.current = false;

        let key = 'r2-image.webp';
        try {
          const parsed = new URL(url);
          key = parsed.pathname.replace(/^\/+/, '');
        } catch {
          key = url.split('/').pop() || 'r2-image.webp';
        }
        setSourceKey(key);
        setSourceType('r2');
        saveStudioActiveSession(blob, {
          name: key,
          sourceKey: key,
          sourceType: 'r2',
        });
      } catch (err) {
        console.warn('Proxy load failed, falling back to direct URL:', err);
        updateImageSrc(url);
        hasInitialFitRef.current = false;
      } finally {
        setLoadingImage(false);
      }
    },
    [updateImageSrc]
  );

  const resetCanvas = () => {
    updateImageSrc(null);
    setSourceKey(null);
    resetAnnotations();
    setActiveTool('select');
    setEditingText(null);
    setConverterId(null);
    setSourceType(null);
    setCropRect(null);
    setCropDrag(null);
    resetInitialFit();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('studio_active_image');
      sessionStorage.removeItem('studio_image_key');
      sessionStorage.removeItem('studio_source');
      sessionStorage.removeItem('studio_converter_id');
      const cleanUrl = new URL(window.location.href);
      cleanUrl.search = '';
      window.history.replaceState({}, '', cleanUrl.toString());
    }
    clearStudioActiveSession();
  };

  // Custom Hook 6: Studio Transform Engine
  const { handleRotate90, handleFlipHorizontal, handleFlipVertical } = useStudioTransform({
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
  });

  const handleConvertWatermarkToText = () => {
    const textToUse = (watermarkConfig.text || '© Volticen').trim();
    if (!textToUse) return;

    const { w: innerW, h: innerH, topBarHeight } = innerDimensionsRef.current;
    const padding = 24;
    const fontSize = watermarkConfig.size || 18;
    const approxW = textToUse.length * (fontSize * 0.6) + 28;
    const approxH = fontSize + 16;

    let x = Math.max(16, innerW - approxW - padding);
    let y = Math.max(topBarHeight + 16, innerH - approxH - padding);

    const pos = watermarkConfig.position;
    if (pos === 'top-left' || pos === 'center-left' || pos === 'bottom-left') {
      x = padding;
    } else if (pos === 'top-center' || pos === 'center' || pos === 'bottom-center') {
      x = Math.max(16, Math.round((innerW - approxW) / 2));
    }

    if (pos === 'top-left' || pos === 'top-center' || pos === 'top-right') {
      y = topBarHeight + padding;
    } else if (pos === 'center-left' || pos === 'center' || pos === 'center-right') {
      y = topBarHeight + Math.max(16, Math.round((innerH - topBarHeight - approxH) / 2));
    }

    const newId = Math.random().toString();
    const newWatermark: TextAnnotation = {
      id: newId,
      x,
      y,
      text: textToUse,
      color: watermarkConfig.color || '#ffffff',
      fontSize,
      hasBackdrop: watermarkConfig.style === 'pill',
    };

    setTexts((prev) => [...prev, newWatermark]);
    setHistory((prev) => [...prev, { type: 'text', item: newWatermark }]);
    setRedoStack([]);
    setSelectedAnnotationId(newId);
    setActiveTool('select');
  };

  const handleAddText = (textStr: string) => {
    if (!editingText || !textStr.trim()) {
      setEditingText(null);
      return;
    }
    const newId = editingText.id || Math.random().toString();
    const newItem: TextAnnotation = {
      id: newId,
      x: editingText.x,
      y: editingText.y,
      text: textStr.trim(),
      color: toolColors.text || '#ffffff',
      fontSize: editingText.fontSize,
      hasBackdrop: editingText.hasBackdrop,
    };
    setTexts((prev) => [...prev, newItem]);
    setHistory((prev) => [...prev, { type: 'text', item: newItem }]);
    setRedoStack([]);
    setSelectedAnnotationId(newId);
    setEditingText(null);
  };

  // Auto-save annotations to active session in IndexedDB when modified
  useEffect(() => {
    if (!imageSrc) return;
    const timer = setTimeout(() => {
      updateStudioAnnotations({
        stepBadges,
        arrows,
        boxes,
        blurs,
        texts,
        spotlights,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [imageSrc, stepBadges, arrows, boxes, blurs, texts, spotlights]);

  const initLoadedRef = useRef<string | null>(null);

  // Robust mount initialization & F5 restore from IndexedDB
  useEffect(() => {
    let isCancelled = false;

    const initStudio = async () => {
      const source = searchParams.get('source');
      const convId =
        searchParams.get('converterId') ||
        (typeof window !== 'undefined' ? sessionStorage.getItem('studio_converter_id') : null);
      const paramUrl =
        searchParams.get('imageUrl') ||
        (typeof window !== 'undefined' ? sessionStorage.getItem('studio_active_image') : null);

      if (paramUrl && initLoadedRef.current === paramUrl) {
        return;
      }

      setLoadingImage(true);
      try {
        // Priority 1: Direct navigation from Converter (reads saved blob from IndexedDB immediately)
        if (source === 'converter' || convId) {
          const savedSession = await loadStudioActiveSession();
          if (
            !isCancelled &&
            savedSession &&
            savedSession.blob &&
            (!convId || savedSession.converterId === convId)
          ) {
            initLoadedRef.current = paramUrl || 'converter-active';
            const restoredUrl = URL.createObjectURL(savedSession.blob);
            updateImageSrc(restoredUrl);
            const key = savedSession.sourceKey || savedSession.name || 'converter-image.png';
            setSourceKey(key);
            setSourceType('converter');
            if (savedSession.converterId) setConverterId(savedSession.converterId);
            hasInitialFitRef.current = false;
            resetAnnotations();
            setEditingText(null);
            return;
          }

          if (convId) {
            const convItem = await getConverterItem(convId);
            if (!isCancelled && convItem && (convItem.convertedBlob || convItem.originalFile)) {
              initLoadedRef.current = paramUrl || 'converter-item';
              const rawBlob = convItem.convertedBlob || convItem.originalFile;
              const restoredUrl = URL.createObjectURL(rawBlob);
              updateImageSrc(restoredUrl);
              const key = convItem.seoName || convItem.originalName || 'converter-image.png';
              setSourceKey(key);
              setSourceType('converter');
              setConverterId(convItem.id);
              hasInitialFitRef.current = false;
              resetAnnotations();
              setEditingText(null);
              await saveStudioActiveSession(rawBlob, {
                name: key,
                sourceKey: key,
                sourceType: 'converter',
                converterId: convItem.id,
              });
              return;
            }
          }
        }

        // Priority 2: Explicit remote HTTP/HTTPS URL (e.g. from R2 Explorer)
        const isHttpUrl = paramUrl && (paramUrl.startsWith('http://') || paramUrl.startsWith('https://'));
        if (isHttpUrl) {
          initLoadedRef.current = paramUrl;
          resetAnnotations();
          setEditingText(null);
          await loadImageFromUrl(paramUrl);
          return;
        }

        // Priority 3: Direct client blob URL if still valid
        const isBlobUrl = paramUrl && paramUrl.startsWith('blob:');
        if (isBlobUrl) {
          try {
            const res = await fetch(paramUrl);
            if (res.ok) {
              const blob = await res.blob();
              if (isCancelled) return;
              initLoadedRef.current = paramUrl;
              const freshUrl = URL.createObjectURL(blob);
              updateImageSrc(freshUrl);
              resetAnnotations();
              setEditingText(null);
              const key =
                searchParams.get('key') ||
                (typeof window !== 'undefined' ? sessionStorage.getItem('studio_image_key') : null) ||
                'converter-image.png';
              setSourceKey(key);
              setSourceType('converter');
              if (convId) setConverterId(convId);
              hasInitialFitRef.current = false;
              await saveStudioActiveSession(blob, {
                name: key,
                sourceKey: key,
                sourceType: 'converter',
                converterId: convId,
              });
              return;
            }
          } catch {
            // Expired blob (F5 refresh) -> fallback to IndexedDB below
          }
        }

        // Priority 4: Restore active Studio session from persistent IndexedDB (Survives F5!)
        const savedSession = await loadStudioActiveSession();
        if (isCancelled) return;

        if (savedSession && savedSession.blob) {
          const restoredUrl = URL.createObjectURL(savedSession.blob);
          updateImageSrc(restoredUrl);
          setSourceKey(savedSession.sourceKey || savedSession.name);
          if (savedSession.sourceType) setSourceType(savedSession.sourceType);
          if (savedSession.converterId) setConverterId(savedSession.converterId);
          hasInitialFitRef.current = false;

          // Restore saved annotations if any
          if (savedSession.annotations) {
            if (savedSession.annotations.stepBadges) setStepBadges(savedSession.annotations.stepBadges);
            if (savedSession.annotations.arrows) setArrows(savedSession.annotations.arrows);
            if (savedSession.annotations.boxes) setBoxes(savedSession.annotations.boxes);
            if (savedSession.annotations.blurs) setBlurs(savedSession.annotations.blurs);
            if (savedSession.annotations.texts) setTexts(savedSession.annotations.texts);
            if (savedSession.annotations.spotlights) setSpotlights(savedSession.annotations.spotlights);
          }
          return;
        }

        // Priority 5: Fallback to Converter IndexedDB if converterId is known
        if (convId) {
          const convItem = await getConverterItem(convId);
          if (isCancelled) return;
          if (convItem && (convItem.convertedBlob || convItem.originalFile)) {
            const rawBlob = convItem.convertedBlob || convItem.originalFile;
            const restoredUrl = URL.createObjectURL(rawBlob);
            updateImageSrc(restoredUrl);
            const key = convItem.seoName || convItem.originalName || 'converter-image.png';
            setSourceKey(key);
            setSourceType('converter');
            setConverterId(convItem.id);
            hasInitialFitRef.current = false;

            await saveStudioActiveSession(rawBlob, {
              name: key,
              sourceKey: key,
              sourceType: 'converter',
              converterId: convItem.id,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to initialize studio image:', err);
      } finally {
        setLoadingImage(false);
      }
    };

    initStudio();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, resetAnnotations, setStepBadges, setArrows, setBoxes, setBlurs, setTexts, setSpotlights, loadImageFromUrl, updateImageSrc]);

  // Update canvas output back into Converter queue in IndexedDB
  const handleUpdateBackToConverter = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const effectiveId = converterId || Math.random().toString(36).slice(2);
      const effectiveName = sourceKey || 'studio-edited.png';
      const res = await updateOrAddConverterItemBlob(
        effectiveId,
        blob,
        effectiveName,
        canvas.width,
        canvas.height
      );
      if (res.success) {
        setConverterId(res.effectiveId);
        setSourceType('converter');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('studio_converter_id', res.effectiveId);
          sessionStorage.setItem('studio_source', 'converter');
        }
        saveStudioActiveSession(blob, {
          name: effectiveName,
          sourceKey: effectiveName,
          sourceType: 'converter',
          converterId: res.effectiveId,
        });
        setSavedToConverter(true);
        setTimeout(() => setSavedToConverter(false), 3000);
      }
    }, 'image/png');
  };

  // Modular Canvas Rendering Pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!imageSrc) {
      canvas.width = 1280;
      canvas.height = 720;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        loadingImage
          ? sourceType === 'r2' || searchParams.get('source') === 'r2'
            ? t.studio.loadingImageR2
            : t.studio.loadingImageDefault
          : t.studio.emptyCanvasNoImage,
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const imgW = img.naturalWidth || 1280;
      const imgH = img.naturalHeight || 720;

      const {
        innerW,
        innerH,
        finalCanvasW,
        finalCanvasH,
        offsetX,
        offsetY,
        topBarHeight,
      } = calculateMockupDimensions({
        imgW,
        imgH,
        frameType,
        canvasPadding,
        aspectRatio,
      });

      canvas.width = finalCanvasW;
      canvas.height = finalCanvasH;
      setComputedDims({ w: finalCanvasW, h: finalCanvasH });
      canvasOffsetRef.current = { x: offsetX, y: offsetY };
      innerDimensionsRef.current = { w: innerW, h: innerH, topBarHeight };

      // 1. Draw Background Canvas
      renderBackground(
        ctx,
        finalCanvasW,
        finalCanvasH,
        backgroundType,
        backgroundPresetId,
        customSolidColor,
        BACKGROUND_PRESETS
      );

      // 2. Draw Drop Shadow
      renderDropShadow(
        ctx,
        offsetX,
        offsetY,
        innerW,
        innerH,
        canvasPadding,
        shadowIntensity,
        cornerRadius
      );

      // 3. Draw Mockup Window Header and Main Image
      renderMockupWindow(
        ctx,
        img,
        offsetX,
        offsetY,
        innerW,
        innerH,
        imgH,
        topBarHeight,
        frameType,
        browserUrl,
        cornerRadius
      );

      // 4. Draw Spotlight Highlights
      renderSpotlights(ctx, spotlights, offsetX, offsetY, innerW, innerH, toolColors.spotlight || '#38bdf8');

      // 5. Draw Blurs
      renderBlurs(ctx, blurs, offsetX, offsetY);

      // 6. Draw Boxes
      renderBoxes(ctx, boxes, offsetX, offsetY);

      // 7. Draw Arrows
      renderArrows(ctx, arrows, offsetX, offsetY);

      // 8. Draw Step Badges
      renderStepBadges(ctx, stepBadges, offsetX, offsetY);

      // 9. Draw Texts
      renderTexts(ctx, texts, offsetX, offsetY);

      // 9.5 Draw Professional Watermark (if enabled)
      if (watermarkConfig.enabled) {
        renderWatermark(
          ctx,
          watermarkConfig,
          offsetX,
          offsetY,
          innerW,
          innerH,
          topBarHeight,
          logoImageRef.current
        );
      }

      // 10. Draw Live Rubber-band Preview
      const rubberbandColor = toolColors[activeTool] || '#ef4444';
      renderRubberband(
        ctx,
        dragStart,
        dragCurrent,
        activeTool,
        rubberbandColor,
        strokeWidth,
        arrowStyle,
        offsetX,
        offsetY,
        boxIsDashed
      );

      // 11. Draw Highlight outline for selected or hovered annotation
      const highlightId = selectedAnnotationId || hoveredAnnotationId;
      renderHighlightOutline(ctx, highlightId, history, offsetX, offsetY);

      // 12. Draw Interactive Crop Overlay
      if (activeTool === 'crop' && cropRect) {
        renderCropOverlay(
          ctx,
          canvas.width,
          canvas.height,
          cropRect,
          offsetX,
          offsetY,
          topBarHeight
        );
      }
    };
  }, [
    imageSrc,
    frameType,
    browserUrl,
    stepBadges,
    arrows,
    boxes,
    blurs,
    texts,
    spotlights,
    watermarkConfig,
    logoLoadCount,
    loadingImage,
    canvasPadding,
    backgroundType,
    backgroundPresetId,
    customSolidColor,
    shadowIntensity,
    cornerRadius,
    dragStart,
    dragCurrent,
    activeTool,
    strokeWidth,
    arrowStyle,
    boxIsDashed,
    toolColors,
    aspectRatio,
    selectedAnnotationId,
    hoveredAnnotationId,
    cropRect,
    history,
    setComputedDims,
    canvasOffsetRef,
  ]);

  // Custom Hook 7: Studio Canvas Mouse & Pointer Interactions
  const {
    handleCanvasMouseDown,
    handleCanvasMouseUp,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
  } = useStudioCanvasEvents({
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
    selectedAnnotationId,
    setSelectedAnnotationId,
    setHoveredAnnotationId,
    movingAnnotation,
    setMovingAnnotation,
    dragStart,
    setDragStart,
    dragCurrent,
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
  });

  // Custom Hook 3: Studio Keyboard Shortcuts Engine
  useStudioShortcuts({
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
  });

  const canvasDisplayWidth = Math.round(computedDims.w * zoomScale);
  const canvasDisplayHeight = Math.round(computedDims.h * zoomScale);

  return (
    <div className="flex-1 flex flex-col gap-2.5 w-full">
      {/* Header */}
      <StudioHeaderBar
        onUploadClick={() => fileInputRef.current?.click()}
        onResetCanvas={resetCanvas}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        onRedo={handleRedo}
        canRedo={redoStack.length > 0}
        onClearAnnotations={handleClearAnnotations}
        canClearAnnotations={history.length > 0}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        showRightSidebar={showRightSidebar}
        onToggleRightSidebar={() => setShowRightSidebar((prev) => !prev)}
        copied={copied}
        onCopyImage={copyImageToClipboard}
        onExportQuick={(format) => handleExportStudioImage({ format, scale: 1 })}
        onOpenExportModal={() => setShowExportModal(true)}
        showExportMenu={showExportMenu}
        setShowExportMenu={setShowExportMenu}
        imageSrc={imageSrc}
        sendingToStitcher={sendingToStitcher}
        onSendToStitcher={handleSendToStitcher}
        uploadingToR2={uploadingToR2}
        uploadSuccess={uploadSuccess}
        onSaveToR2={handleSaveToR2}
      />

      {/* Source Converter Banner if loaded from Converter */}
      {sourceType === 'converter' && (
        <div className="shrink-0 py-1.5 px-3 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 text-slate-300 truncate">
            <Wand2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{t.studio.editingFromBulkQueue}</span>
            <span className="font-mono text-purple-300 font-semibold truncate">
              {sourceKey || t.studio.imageInQueue}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {converterId && (
              <button
                type="button"
                onClick={handleUpdateBackToConverter}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1.5 transition"
                title={t.studio.saveOverwriteConverter}
              >
                {savedToConverter ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-emerald-300 font-semibold">{t.studio.savedToConverterSuccess}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.studio.saveOverwriteConverter}</span>
                  </>
                )}
              </button>
            )}

            <Link
              href="/converter"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition px-2 py-1 rounded hover:bg-slate-800"
            >
              <span>{t.studio.backToConverter}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Source R2 Banner if loaded from R2 */}
      {sourceKey && sourceType !== 'converter' && (
        <div className="shrink-0 p-2 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 truncate">
            <Database className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{t.studio.openR2File}</span>
            <span className="font-mono text-blue-300 font-semibold truncate">{sourceKey}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/cloud-explorer"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <span>{t.studio.backToR2Explorer}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleLoadFile(file);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Main Studio Workspace: Expansive Center + Collapsible Right Unified Inspector */}
      <div className="flex-1 min-w-0 flex flex-col lg:flex-row gap-3 items-start w-full">
        {/* CENTER WORKSPACE: Floating Island + Canvas Viewport + Selection Status Bar */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
          {/* Floating Studio Island (Dock + Attached Contextual Options) */}
          <div className="shrink-0">
            <FloatingStudioIsland
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              selectedAnnotation={
                selectedAnnotationId
                  ? history.find((h) => 'item' in h && h.item && h.item.id === selectedAnnotationId) || null
                  : null
              }
              onUpdateSelectedAnnotation={handleUpdateSelectedAnnotation}
              toolColors={toolColors}
              onUpdateToolColor={handleUpdateToolColor}
              strokeWidth={strokeWidth}
              setStrokeWidth={setStrokeWidth}
              arrowStyle={arrowStyle}
              setArrowStyle={setArrowStyle}
              boxIsDashed={boxIsDashed}
              setBoxIsDashed={setBoxIsDashed}
              stepCounter={stepCounter}
              setStepCounter={setStepCounter}
              textFontSize={textFontSize}
              setTextFontSize={setTextFontSize}
              textHasBackdrop={textHasBackdrop}
              setTextHasBackdrop={setTextHasBackdrop}
              watermarkConfig={watermarkConfig}
              onUpdateWatermarkConfig={handleUpdateWatermarkConfig}
              onOpenWatermarkTab={() => {
                setRightTab('watermark');
                setShowRightSidebar(true);
              }}
              cropRatio={cropRatio}
              onSelectCropRatio={(r) => {
                setCropRatio(r);
                initDefaultCrop(r);
              }}
              onApplyCrop={handleApplyCrop}
              onCancelCrop={() => {
                setCropRect(null);
                setActiveTool('select');
              }}
              hasCropRect={!!cropRect}
              onRotate90={handleRotate90}
              onFlipHorizontal={handleFlipHorizontal}
              onFlipVertical={handleFlipVertical}
              disabledTransforms={!imageSrc}
              onDeleteSelected={() => {
                const target = history.find((h) => 'item' in h && h.item && h.item.id === selectedAnnotationId);
                if (target && 'item' in target) handleDeleteAnnotation(target.item.id, target.type as any);
              }}
            />
          </div>

          {/* Main Viewport Card (Balanced Height + Zero-Scroll in Fit Mode + Mini Zoom Controls) */}
          <div
            ref={viewportRef}
            onWheel={handleCanvasWheel}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full h-[520px] lg:h-[580px] bg-slate-950/70 rounded-2xl border border-slate-800 relative flex items-center justify-center p-2 shadow-inner overflow-auto custom-scrollbar ${
              isDraggingFile ? 'border-blue-500/80 bg-blue-950/20' : ''
            }`}
          >
            {/* Drag and Drop Active Overlay */}
            {isDraggingFile && (
              <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 pointer-events-none animate-in fade-in duration-150">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shadow-lg animate-bounce">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-white mb-1">
                    {t.studio.dropToUploadTitle}
                  </h3>
                  <p className="text-xs text-blue-200/80">
                    {t.studio.dropToUploadSubtitle}
                  </p>
                </div>
              </div>
            )}

            {loadingImage && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-2 text-xs text-blue-400 font-medium">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span>
                  {sourceType === 'r2' || searchParams.get('source') === 'r2'
                    ? t.studio.loadingImageR2
                    : t.studio.loadingImageDefault}
                </span>
              </div>
            )}

            {!imageSrc && !loadingImage && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 sm:p-12 text-center w-[520px] max-w-[92%] min-h-[360px] border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/40 hover:bg-slate-900/60 rounded-3xl transition-all cursor-pointer group shadow-xl shrink-0"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors">
                  {t.studio.dropAreaTitle}
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed max-w-sm">
                  {t.studio.dropAreaDesc}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t.studio.chooseImageBtn}</span>
                </button>
                <span className="text-[11px] text-slate-500 mt-3 font-mono">
                  {t.studio.pasteClipboardHint}
                </span>
              </div>
            )}

            {/* Inline Text Input Modal */}
            {editingText && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-30 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-amber-400" />
                      {t.studio.textLabelTitle}
                    </span>
                    <button
                      onClick={() => setEditingText(null)}
                      className="text-slate-400 hover:text-slate-200 text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-800"
                    >
                      ✕
                    </button>
                  </div>

                  <input
                    type="text"
                    autoFocus
                    value={editingText.text}
                    onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddText(editingText.text);
                      if (e.key === 'Escape') setEditingText(null);
                    }}
                    placeholder={t.studio.textLabelPlaceholder}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">{t.studio.fontSizeLabel}</label>
                      <div className="flex gap-1">
                        {[14, 16, 20, 26].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setEditingText({ ...editingText, fontSize: sz })}
                            className={`flex-1 py-1 rounded text-center text-xs font-medium transition ${
                              editingText.fontSize === sz
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">{t.studio.displayStyleLabel}</label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingText({ ...editingText, hasBackdrop: !editingText.hasBackdrop })
                        }
                        className={`w-full py-1 px-2 rounded text-xs font-medium text-center transition border ${
                          editingText.hasBackdrop
                            ? 'bg-blue-950/40 text-blue-300 border-blue-500/50'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {editingText.hasBackdrop ? t.studio.pillBackdrop : t.studio.plainText}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingText(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                    >
                      {t.studio.cancelBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddText(editingText.text)}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      {t.studio.insertToImageBtn}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
              style={{
                width: `${canvasDisplayWidth}px`,
                height: `${canvasDisplayHeight}px`,
              }}
              className={`shadow-2xl border border-slate-700/80 shrink-0 m-auto ${
                !imageSrc ? 'hidden' : ''
              } ${
                activeTool === 'crop'
                  ? 'cursor-crosshair'
                  : movingAnnotation
                  ? 'cursor-grabbing'
                  : hoveredAnnotationId
                  ? 'cursor-grab'
                  : activeTool === 'select'
                  ? 'cursor-default'
                  : 'cursor-crosshair'
              } ${
                backgroundType === 'transparent'
                  ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] bg-slate-900'
                  : ''
              }`}
            />
          </div>

          {/* Under Canvas Active Selection / Status Bar */}
          <div className="shrink-0">
            <SelectionStatusBar
              selectedAnnotationId={selectedAnnotationId}
              history={history}
              activeTool={activeTool}
              computedDims={computedDims}
              onDeleteSelected={() => {
                const target = history.find((h) => 'item' in h && h.item && h.item.id === selectedAnnotationId);
                if (target && 'item' in target) handleDeleteAnnotation(target.item.id, target.type as any);
              }}
              onDeselect={() => setSelectedAnnotationId(null)}
              zoomScale={zoomScale}
              onApplyFit={handleApplyFit}
              onZoom100={() => setZoomScale(1)}
              onStepZoom={handleStepZoom}
              hasImage={!!imageSrc}
            />
          </div>
        </div>

        {/* RIGHT UNIFIED STUDIO INSPECTOR (3 TABS) */}
        {showRightSidebar && (
          <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-90px)] flex flex-col gap-2 min-h-0">
            {/* 3-Tab Segmented Switcher */}
            <div className="shrink-0 p-1 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-3 gap-1 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setRightTab('mockup')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition cursor-pointer ${
                  rightTab === 'mockup'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.studio.tabMockup}</span>
              </button>

              <button
                type="button"
                onClick={() => setRightTab('watermark')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition cursor-pointer ${
                  rightTab === 'watermark'
                    ? 'bg-amber-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Stamp className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.studio.tabWatermark}</span>
                {watermarkConfig.enabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRightTab('layers')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition cursor-pointer ${
                  rightTab === 'layers'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.studio.tabLayers.replace('{count}', String(annotationLayers.length))}</span>
              </button>
            </div>

            {/* TAB CONTENTS WITH INDEPENDENT INTERNAL SCROLL */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar">
              {rightTab === 'mockup' && (
                <MockupInspector
                  frameType={frameType}
                  setFrameType={setFrameType}
                  browserUrl={browserUrl}
                  setBrowserUrl={setBrowserUrl}
                  aspectRatio={aspectRatio}
                  setAspectRatio={setAspectRatio}
                  canvasPadding={canvasPadding}
                  setCanvasPadding={setCanvasPadding}
                  backgroundType={backgroundType}
                  setBackgroundType={setBackgroundType}
                  backgroundPresetId={backgroundPresetId}
                  setBackgroundPresetId={setBackgroundPresetId}
                  customSolidColor={customSolidColor}
                  setCustomSolidColor={setCustomSolidColor}
                  shadowIntensity={shadowIntensity}
                  setShadowIntensity={setShadowIntensity}
                  cornerRadius={cornerRadius}
                  setCornerRadius={setCornerRadius}
                  computedDims={computedDims}
                  collapsedCards={collapsedCards}
                  toggleCard={toggleCard}
                  toggleAllRightCards={toggleAllRightCards}
                  onSaveSettings={handleSaveSettings}
                  onResetSettings={handleResetSettings}
                  settingsFeedback={settingsFeedback}
                  backgroundPresets={BACKGROUND_PRESETS}
                  solidPresets={SOLID_PRESETS}
                />
              )}

              {rightTab === 'watermark' && (
                <WatermarkInspector
                  watermarkConfig={watermarkConfig}
                  onUpdateWatermarkConfig={handleUpdateWatermarkConfig}
                  onConvertWatermarkToText={handleConvertWatermarkToText}
                />
              )}

              {rightTab === 'layers' && (
                <LayersInspector
                  annotationLayers={annotationLayers}
                  selectedAnnotationId={selectedAnnotationId}
                  onSelectLayer={(id) => setSelectedAnnotationId(id)}
                  onHoverLayer={(id) => setHoveredAnnotationId(id)}
                  onDeleteLayer={handleDeleteAnnotation}
                  onClearAll={handleClearAnnotations}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Export Modal */}
      <StudioExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        sourceKey={sourceKey}
        onExport={handleExportStudioImage}
      />

      {/* Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}

function StudioFallback() {
  const { t } = useI18n();
  return <div className="p-12 text-center text-slate-400 text-xs">{t.studio.loadingStudio}</div>;
}

export default function StudioPage() {
  return (
    <Suspense fallback={<StudioFallback />}>
      <StudioContent />
    </Suspense>
  );
}
