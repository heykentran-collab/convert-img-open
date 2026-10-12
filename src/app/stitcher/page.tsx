'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StitchMode, CanvasPreset, StitcherLayer, GridSettings } from '@/types/stitcher';
import {
  useStitcherLayers,
  useStitcherCanvas,
  useStitcherLayout,
  useStitcherHistory,
  saveStitcherSession,
  loadStitcherSession,
  clearStitcherSession,
  getInMemoryStitcherSession,
  setInMemoryStitcherSession,
  preloadLayerImages,
  sendStitchedToStudio,
  sendStitchedToConverter,
  uploadStitchedToR2,
  loadItemsFromConverter,
  exportStitchedCanvasToBlob,
  downloadStitchedBlob,
} from '@/lib/stitcher';
import {
  StitcherToolbar,
  StitcherCanvas,
  StitcherLayersPanel,
  StitcherLayoutSettings,
} from '@/components/stitcher';
import { PresetPickerModal } from '@/components/presets';
import { EcommercePreset } from '@/types/presets';
import { getLocalizedPreset } from '@/lib/constants/ecommerce-presets';
import { useI18n } from '@/lib/i18n-context';

function StitcherContent() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Instant warm cache for instantaneous navigation between pages
  const cachedSession = getInMemoryStitcherSession();

  // Mode state: freeform | grid | strip-h | strip-v
  const [mode, setMode] = useState<StitchMode>(
    cachedSession?.mode && (cachedSession.mode as string) !== 'comparison'
      ? cachedSession.mode
      : 'freeform'
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);

  // Core Hooks (Headless Architecture)
  const {
    canvasConfig,
    setCanvasConfig,
    updateCanvasConfig,
    applyPreset,
    setCustomDimensions,
    zoomScale,
    setZoomScale,
  } = useStitcherCanvas({ initialConfig: cachedSession?.canvasConfig });

  const {
    pushSnapshot,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  } = useStitcherHistory();

  const {
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
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
  } = useStitcherLayers({
    canvasWidth: canvasConfig.width,
    canvasHeight: canvasConfig.height,
    initialLayers: cachedSession?.layers,
    onLayerChange: (updated) => {
      if (updated.length === 0) {
        clearStitcherSession();
      } else {
        setInMemoryStitcherSession({
          layers: updated,
          canvasConfig,
          gridSettings,
          mode,
        });
        saveStitcherSession({
          layers: updated,
          canvasConfig,
          gridSettings,
          mode,
        });
      }
    },
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const handlePresetChange = useCallback(
    (newPreset: CanvasPreset) => {
      applyPreset(newPreset, layers, (updated) => {
        pushSnapshot(layers);
        setLayers(updated);
      });
      showToast(t.stitcher.presetAppliedToast.replace('{name}', newPreset));
    },
    [applyPreset, layers, pushSnapshot, setLayers, showToast, t]
  );

  const handleCustomSizeChange = useCallback(
    (w: number, h: number) => {
      setCustomDimensions(w, h, layers, (updated) => {
        pushSnapshot(layers);
        setLayers(updated);
      });
      showToast(
        t.stitcher.customSizeAppliedToast
          .replace('{width}', String(w))
          .replace('{height}', String(h))
      );
    },
    [setCustomDimensions, layers, pushSnapshot, setLayers, showToast, t]
  );

  const {
    gridSettings,
    setGridSettings,
    arrangeHorizontalStrip,
    arrangeVerticalStrip,
    arrangeSmartGrid,
  } = useStitcherLayout();

  // Add multiple files as layers
  const handleAddFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileList = Array.from(files).filter(
        (f) =>
          (f.type && f.type.startsWith('image/')) ||
          /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico|jfif)$/i.test(f.name)
      );
      if (fileList.length === 0) return;

      pushSnapshot(layers);
      let lastAdded: StitcherLayer | null = null;
      for (const file of fileList) {
        const added = await addLayer(file);
        if (added) {
          lastAdded = added;
        }
      }
      if (lastAdded) {
        setSelectedLayerId(lastAdded.id);
      }
      showToast(t.stitcher.addedPhotosToast.replace('{count}', String(fileList.length)));
    },
    [addLayer, layers, pushSnapshot, setSelectedLayerId, showToast, t]
  );

  const hasSourceParam = Boolean(searchParams.get('source'));
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const latestStateRef = useRef({ layers, canvasConfig, gridSettings, mode });

  useEffect(() => {
    latestStateRef.current = { layers, canvasConfig, gridSettings, mode };
  }, [layers, canvasConfig, gridSettings, mode]);

  // Restore session from IndexedDB or Import from Studio/Converter (Runs once on mount)
  useEffect(() => {
    let isCancelled = false;

    const initStitcher = async () => {
      try {
        const source = searchParams.get('source');
        const idsParam = searchParams.get('ids');

        // 1. Check if redirected from Studio (?source=studio)
        if (source === 'studio') {
          const saved = await loadStitcherSession();
          if (!isCancelled && saved) {
            if (saved.layers && saved.layers.length > 0) {
              preloadLayerImages(saved.layers);
              setLayers(saved.layers);
              const lastId = typeof window !== 'undefined' ? sessionStorage.getItem('stitcher_selected_layer_id') : null;
              if (lastId) setSelectedLayerId(lastId);
            }
            if (saved.canvasConfig) setCanvasConfig(saved.canvasConfig);
            if (saved.gridSettings) setGridSettings(saved.gridSettings);
            if (saved.mode && (saved.mode as string) !== 'comparison') setMode(saved.mode);
          }
          showToast(t.stitcher.importedFromStudioToast);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/stitcher');
          }
          return;
        }

        // 2. Check if redirected from Converter with item IDs (?source=converter&ids=id1,id2,...)
        if (source === 'converter' && idsParam) {
          const ids = idsParam.split(',').filter(Boolean);
          const items = await loadItemsFromConverter(ids);
          if (!isCancelled && items.length > 0) {
            // Restore any existing session first so we APPEND rather than delete user's existing work
            const saved = await loadStitcherSession();
            if (saved) {
              if (saved.layers && saved.layers.length > 0) {
                preloadLayerImages(saved.layers);
                setLayers(saved.layers);
              }
              if (saved.canvasConfig) setCanvasConfig(saved.canvasConfig);
              if (saved.gridSettings) setGridSettings(saved.gridSettings);
              if (saved.mode && (saved.mode as string) !== 'comparison') setMode(saved.mode);
            }

            let addedCount = 0;
            for (const item of items) {
              const fileBlob = item.convertedBlob || item.originalFile;
              if (fileBlob) {
                await addLayer(fileBlob, item.seoName || item.originalName);
                addedCount++;
              }
            }
            showToast(t.stitcher.importedFromConverterToast.replace('{count}', String(addedCount)));
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', '/stitcher');
            }
            return;
          }
        }

        // 3. Otherwise standard restore from in-memory cache or IndexedDB
        const saved = await loadStitcherSession();
        if (!isCancelled && saved) {
          if (saved.layers && saved.layers.length > 0) {
            preloadLayerImages(saved.layers);
            setLayers(saved.layers);
          }
          if (saved.canvasConfig) setCanvasConfig(saved.canvasConfig);
          if (saved.gridSettings) setGridSettings(saved.gridSettings);
          if (saved.mode && (saved.mode as string) !== 'comparison') setMode(saved.mode);
        }
      } finally {
        if (!isCancelled) {
          setIsInitialized(true);
          isInitializedRef.current = true;
        }
      }
    };

    initStitcher();

    return () => {
      isCancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up selected layer in sessionStorage when deselected
  useEffect(() => {
    if (!selectedLayerId && typeof window !== 'undefined') {
      sessionStorage.removeItem('stitcher_selected_layer_id');
    }
  }, [selectedLayerId]);

  // Debounced auto-save session to IndexedDB & immediate synchronization of in-memory session cache
  useEffect(() => {
    if (!isInitializedRef.current) return;

    if (layers.length === 0) {
      clearStitcherSession();
      return;
    }

    // 1. Immediately update in-memory cache
    setInMemoryStitcherSession({
      layers,
      canvasConfig,
      gridSettings,
      mode,
    });

    // 2. Debounce writing to persistent IndexedDB
    const timer = setTimeout(() => {
      saveStitcherSession({
        layers,
        canvasConfig,
        gridSettings,
        mode,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [isInitialized, layers, canvasConfig, gridSettings, mode]);

  // Flush to IndexedDB on unmount only if initialized and layers exist
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        if (latestStateRef.current.layers.length > 0) {
          saveStitcherSession(latestStateRef.current);
        } else {
          clearStitcherSession();
        }
      }
    };
  }, []);

  // Clipboard Paste support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        handleAddFiles(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleAddFiles]);

  // Keyboard Shortcuts (Delete, Undo, Redo, Duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        const prev = handleUndo(layers);
        if (prev) setLayers(prev);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        const next = handleRedo(layers);
        if (next) setLayers(next);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId) {
          e.preventDefault();
          pushSnapshot(layers);
          removeLayer(selectedLayerId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedLayerId) {
          e.preventDefault();
          pushSnapshot(layers);
          duplicateLayer(selectedLayerId);
        }
      } else if (e.key === 'Escape') {
        if (selectedLayerId) {
          e.preventDefault();
          setSelectedLayerId(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        const container = document.querySelector('[data-stitcher-container]') as HTMLElement;
        const cW = container ? container.clientWidth : 1200;
        const cH = container ? container.clientHeight : 700;
        const scale = Math.max(
          0.05,
          Math.min(
            1.5,
            Math.floor(Math.min((cW - 48) / canvasConfig.width, (cH - 48) / canvasConfig.height) * 100) / 100
          )
        );
        setZoomScale(scale);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setZoomScale(1.0);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoomScale((prev) => Math.min(3.0, Math.round((prev + 0.1) * 100) / 100));
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoomScale((prev) => Math.max(0.05, Math.round((prev - 0.1) * 100) / 100));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    layers,
    selectedLayerId,
    canvasConfig.width,
    canvasConfig.height,
    handleUndo,
    handleRedo,
    removeLayer,
    duplicateLayer,
    pushSnapshot,
    setLayers,
    setZoomScale,
  ]);

  // Apply Auto Layout (Grid, Horizontal Strip, Vertical Strip, or Freeform Smart Tile)
  const handleApplyAutoLayout = useCallback(
    (targetMode?: StitchMode) => {
      if (layers.length === 0) return;
      pushSnapshot(layers);

      const activeMode = typeof targetMode === 'string' ? targetMode : mode;

      if (activeMode === 'grid' || activeMode === 'freeform') {
        const res = arrangeSmartGrid(layers, canvasConfig, gridSettings);
        setLayers(res.updatedLayers);
        if (res.newCanvasDims && (gridSettings.autoCanvasSize || canvasConfig.preset === 'auto')) {
          setCanvasConfig((prev) => ({
            ...prev,
            width: res.newCanvasDims!.w,
            height: res.newCanvasDims!.h,
          }));
        }
        showToast(t.stitcher.autoLayoutGridToast);
      } else if (activeMode === 'strip-h') {
        const res = arrangeHorizontalStrip(layers, canvasConfig, gridSettings);
        setLayers(res.updatedLayers);
        if (res.newCanvasDims && (gridSettings.autoCanvasSize || canvasConfig.preset === 'auto')) {
          setCanvasConfig((prev) => ({
            ...prev,
            width: res.newCanvasDims!.w,
            height: res.newCanvasDims!.h,
          }));
        }
        showToast(t.stitcher.autoLayoutStripHToast);
      } else if (activeMode === 'strip-v') {
        const res = arrangeVerticalStrip(layers, canvasConfig, gridSettings);
        setLayers(res.updatedLayers);
        if (res.newCanvasDims && (gridSettings.autoCanvasSize || canvasConfig.preset === 'auto')) {
          setCanvasConfig((prev) => ({
            ...prev,
            width: res.newCanvasDims!.w,
            height: res.newCanvasDims!.h,
          }));
        }
        showToast(t.stitcher.autoLayoutStripVToast);
      }
    }, [
    layers,
    mode,
    canvasConfig,
    gridSettings,
    pushSnapshot,
    setLayers,
    setCanvasConfig,
    arrangeSmartGrid,
    arrangeHorizontalStrip,
    arrangeVerticalStrip,
    showToast,
    t,
  ]);

  // Live real-time update of grid settings & canvas layout on viewport
  const handleUpdateGridSettings = useCallback(
    (up: Partial<GridSettings>) => {
      setGridSettings((prevSettings) => {
        const newSettings = { ...prevSettings, ...up };

        if (layers.length > 0) {
          const isCornerRadiusOnly = Object.keys(up).length === 1 && 'cornerRadius' in up;

          if (isCornerRadiusOnly && mode === 'freeform') {
            // In freeform mode, just update corner radius without moving layer positions
            setLayers((prevLayers) =>
              prevLayers.map((l) => ({ ...l, cornerRadius: newSettings.cornerRadius }))
            );
          } else {
            // Dynamically recalculate layer positions in real-time
            const activeMode = mode;
            if (activeMode === 'strip-h') {
              const res = arrangeHorizontalStrip(layers, canvasConfig, newSettings);
              setLayers(res.updatedLayers);
              if (res.newCanvasDims && (newSettings.autoCanvasSize || canvasConfig.preset === 'auto')) {
                setCanvasConfig((prev) => ({
                  ...prev,
                  width: res.newCanvasDims!.w,
                  height: res.newCanvasDims!.h,
                }));
              }
            } else if (activeMode === 'strip-v') {
              const res = arrangeVerticalStrip(layers, canvasConfig, newSettings);
              setLayers(res.updatedLayers);
              if (res.newCanvasDims && (newSettings.autoCanvasSize || canvasConfig.preset === 'auto')) {
                setCanvasConfig((prev) => ({
                  ...prev,
                  width: res.newCanvasDims!.w,
                  height: res.newCanvasDims!.h,
                }));
              }
            } else {
              // grid or freeform
              const res = arrangeSmartGrid(layers, canvasConfig, newSettings);
              setLayers(res.updatedLayers);
              if (res.newCanvasDims && (newSettings.autoCanvasSize || canvasConfig.preset === 'auto')) {
                setCanvasConfig((prev) => ({
                  ...prev,
                  width: res.newCanvasDims!.w,
                  height: res.newCanvasDims!.h,
                }));
              }
            }
          }
        }

        return newSettings;
      });
    },
    [
      layers,
      mode,
      canvasConfig,
      arrangeHorizontalStrip,
      arrangeVerticalStrip,
      arrangeSmartGrid,
      setLayers,
      setCanvasConfig,
    ]
  );

  // Export to WebP or PNG file download
  const handleExport = async (format: 'image/webp' | 'image/png') => {
    if (layers.length === 0) {
      showToast(t.stitcher.emptyCanvasExportToast);
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportStitchedCanvasToBlob(layers, canvasConfig, {
        format,
        quality: 0.92,
      });

      if (blob) {
        const ext = format === 'image/webp' ? 'webp' : 'png';
        downloadStitchedBlob(blob, `volticen-stitched-${Date.now()}.${ext}`);
        showToast(t.stitcher.exportSuccessToast);
      }
    } catch (err) {
      console.error('Export error:', err);
      showToast(t.stitcher.exportErrorToast);
    } finally {
      setIsExporting(false);
    }
  };

  // Send to Annotation Studio (Bridge feature!)
  const handleSendToStudio = async () => {
    if (layers.length === 0) {
      showToast(t.stitcher.emptyCanvasStudioToast);
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportStitchedCanvasToBlob(layers, canvasConfig, {
        format: 'image/png',
        quality: 1,
      });

      if (blob) {
        const success = await sendStitchedToStudio(blob, `stitched-${Date.now()}.png`);
        if (success) {
          router.push('/studio');
        }
      }
    } catch (err) {
      console.error('Send to studio error:', err);
      showToast(t.stitcher.sendToStudioErrorToast);
    } finally {
      setIsExporting(false);
    }
  };

  // Send to Converter queue
  const handleSendToConverter = async () => {
    if (layers.length === 0) return;
    setIsExporting(true);
    try {
      const blob = await exportStitchedCanvasToBlob(layers, canvasConfig, {
        format: 'image/png',
        quality: 1,
      });

      if (blob) {
        const res = await sendStitchedToConverter(
          blob,
          `stitched-${Date.now()}.png`,
          canvasConfig.width,
          canvasConfig.height
        );
        if (res.success) {
          router.push('/converter');
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Upload directly to Cloudflare R2
  const handleSaveToR2 = async () => {
    if (layers.length === 0) return;
    setIsExporting(true);
    try {
      const blob = await exportStitchedCanvasToBlob(layers, canvasConfig, {
        format: 'image/webp',
        quality: 0.92,
      });

      if (blob) {
        const key = `stitched/artwork-${Date.now()}.webp`;
        const res = await uploadStitchedToR2(blob, key);
        if (res.success) {
          showToast(t.stitcher.saveToR2SuccessToast);
        } else {
          showToast(t.stitcher.saveToR2ErrorToast.replace('{error}', res.error || ''));
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAll = () => {
    if (confirm(t.stitcher.clearConfirm)) {
      pushSnapshot(layers);
      clearLayers();
      clearStitcherSession();
      showToast(t.stitcher.clearedCanvasToast);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-blue-500/60 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Stitcher Toolbar */}
      <StitcherToolbar
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          if (newMode === 'grid' || newMode === 'strip-h' || newMode === 'strip-v') {
            handleApplyAutoLayout(newMode);
          }
        }}
        onAutoArrange={() => handleApplyAutoLayout(mode)}
        layerCount={layers.length}
        preset={canvasConfig.preset}
        onPresetChange={handlePresetChange}
        onCustomSizeChange={handleCustomSizeChange}
        canvasWidth={canvasConfig.width}
        canvasHeight={canvasConfig.height}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => {
          const prev = handleUndo(layers);
          if (prev) setLayers(prev);
        }}
        onRedo={() => {
          const next = handleRedo(layers);
          if (next) setLayers(next);
        }}
        onClear={handleClearAll}
        onAddFiles={handleAddFiles}
        onExport={handleExport}
        onSendToStudio={handleSendToStudio}
        onSaveToR2={handleSaveToR2}
        onSendToConverter={handleSendToConverter}
        isExporting={isExporting}
        onOpenPresetModal={() => setShowPresetModal(true)}
      />

      {/* Main Canvas Viewport with Sidebars */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Main Canvas Viewport */}
        <div className="flex-1 w-full min-w-0">
          <StitcherCanvas
            layers={layers}
            canvasConfig={canvasConfig}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={updateLayer}
            findLayerAtCoords={findLayerAtCoords}
            findHandleAtCoords={findHandleAtCoords}
            zoomScale={zoomScale}
            onZoomChange={setZoomScale}
            onAddFiles={handleAddFiles}
            onSaveSnapshot={() => pushSnapshot(layers)}
          />
        </div>

        {/* Right Sidebar Controls: Layer Inspector & Layout Settings */}
        <div className="flex flex-col gap-4 w-full lg:w-80 flex-shrink-0">
          <StitcherLayersPanel
            layers={layers}
            selectedLayerId={selectedLayerId}
            canvasConfig={canvasConfig}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={updateLayer}
            onRemoveLayer={removeLayer}
            onDuplicateLayer={duplicateLayer}
            onToggleVisibility={toggleVisibility}
            onToggleLock={toggleLock}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
          />

          <StitcherLayoutSettings
            mode={mode}
            gridSettings={gridSettings}
            onUpdateGridSettings={handleUpdateGridSettings}
            canvasConfig={canvasConfig}
            onUpdateCanvasConfig={updateCanvasConfig}
            onPresetChange={handlePresetChange}
            onCustomSizeChange={handleCustomSizeChange}
            onOpenPresetModal={() => setShowPresetModal(true)}
          />
        </div>
      </div>

      {/* E-commerce Preset Picker Modal */}
      <PresetPickerModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        onSelectPreset={(p: EcommercePreset) => {
          handlePresetChange(p.id as CanvasPreset);
          const locPreset = getLocalizedPreset(p, locale);
          showToast(
            t.stitcher.presetModalAppliedToast
              .replace('{name}', locPreset.name)
              .replace('{width}', String(p.width))
              .replace('{height}', String(p.height))
          );
        }}
        currentWidth={canvasConfig.width}
        currentHeight={canvasConfig.height}
      />
    </div>
  );
}

function StitcherLoadingFallback() {
  const { t } = useI18n();
  return <div className="p-8 text-center text-slate-400 text-xs">{t.stitcher.loadingText}</div>;
}

export default function StitcherPage() {
  return (
    <Suspense fallback={<StitcherLoadingFallback />}>
      <StitcherContent />
    </Suspense>
  );
}
