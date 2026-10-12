'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ArrowLeftRight,
  Download,
  Wand2,
  Code,
  Check,
  ChevronLeft,
  ChevronRight,
  Columns,
  SlidersHorizontal,
  Sparkles,
  Play,
  RefreshCw,
} from 'lucide-react';
import { WatermarkConfig } from '@/types/studio';
import { WatermarkCanvasOverlay } from './WatermarkCanvasOverlay';
import { useI18n } from '@/lib/i18n-context';

export interface ComparisonItemData {
  id: string;
  originalName: string;
  originalSize: number;
  originalFormat: string;
  previewUrl: string;
  width: number;
  height: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  convertedSize: number;
  convertedWidth: number;
  convertedHeight: number;
  convertedFormat: string;
  seoName: string;
}

interface ImageComparisonModalProps {
  item: ComparisonItemData | null;
  itemsList?: ComparisonItemData[];
  watermarkConfig?: WatermarkConfig;
  logoImg?: HTMLImageElement | null;
  onClose: () => void;
  onSelectIndex?: (index: number) => void;
  onConvertItem?: (item: ComparisonItemData) => Promise<void> | void;
  onSendToStudio?: (item: ComparisonItemData) => void;
  onCopyHtml?: (item: ComparisonItemData) => void;
}

export function ImageComparisonModal({
  item,
  itemsList = [],
  watermarkConfig,
  logoImg,
  onClose,
  onSelectIndex,
  onConvertItem,
  onSendToStudio,
  onCopyHtml,
}: ImageComparisonModalProps) {
  const { t } = useI18n();
  const [splitPos, setSplitPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side'>('split');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExportingComposite, setIsExportingComposite] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Close on Escape & Arrow keys for prev/next
  const currentIndex = item ? itemsList.findIndex((i) => i.id === item.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < itemsList.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && onSelectIndex) {
      onSelectIndex(currentIndex - 1);
    }
  }, [hasPrev, onSelectIndex, currentIndex]);

  const handleNext = useCallback(() => {
    if (hasNext && onSelectIndex) {
      onSelectIndex(currentIndex + 1);
    }
  }, [hasNext, onSelectIndex, currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  // Handle pointer dragging for split slider
  const updateSplitFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    setSplitPos(Math.round(percent));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  if (!item) return null;

  const isDone = item.status === 'done' && !!item.convertedUrl;
  const isProcessing = item.status === 'processing';

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const diffPercent =
    isDone && item.originalSize > item.convertedSize
      ? Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)
      : 0;

  const savedBytes = isDone ? item.originalSize - item.convertedSize : 0;

  // Export combined comparison image (side-by-side with labels)
  const handleExportComparisonImage = async () => {
    if (!item.previewUrl) return;
    setIsExportingComposite(true);

    try {
      const img1 = new Image();
      const img2 = new Image();

      await new Promise<void>((resolve, reject) => {
        img1.crossOrigin = 'anonymous';
        img1.src = item.previewUrl;
        img1.onload = () => resolve();
        img1.onerror = () => reject(new Error('Cannot load original image'));
      });

      const afterSrc = item.convertedUrl || item.previewUrl;
      await new Promise<void>((resolve, reject) => {
        img2.crossOrigin = 'anonymous';
        img2.src = afterSrc;
        img2.onload = () => resolve();
        img2.onerror = () => reject(new Error('Cannot load converted image'));
      });

      const gap = 20;
      const bannerHeight = 60;
      const canvasW = img1.naturalWidth + img2.naturalWidth + gap * 3;
      const canvasH = Math.max(img1.naturalHeight, img2.naturalHeight) + bannerHeight + gap * 2;

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Header Banner
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(`So sánh Before / After: ${item.seoName || item.originalName}`, gap, 38);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui, sans-serif';
      const statsText = isDone
        ? `Gốc: ${formatSize(item.originalSize)} (${item.originalFormat.toUpperCase()}) → Sau nén: ${formatSize(item.convertedSize)} (${item.convertedFormat.toUpperCase()}) | Tiết kiệm ${diffPercent}%`
        : `Gốc: ${formatSize(item.originalSize)} (${item.originalFormat.toUpperCase()})`;
      ctx.fillText(statsText, gap, 58);

      // Draw original
      const yOffset = bannerHeight + gap;
      ctx.drawImage(img1, gap, yOffset);

      // Draw converted
      ctx.drawImage(img2, gap * 2 + img1.naturalWidth, yOffset);

      // Download
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/webp', 0.92);
      a.download = `so-sanh-${item.seoName || 'before-after'}.webp`;
      a.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh so sánh:', err);
    } finally {
      setIsExportingComposite(false);
    }
  };

  const handleCopyCode = () => {
    if (onCopyHtml) {
      onCopyHtml(item);
    } else {
      let domain = '';
      try {
        const raw = localStorage.getItem('volticen_storage_settings_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          domain = (parsed.cloudStorage?.publicDomain || '').replace(/\/+$/, '');
        }
      } catch {}
      const w = item.convertedWidth || item.width;
      const h = item.convertedHeight || item.height;
      const name = item.seoName || item.originalName;
      const imgUrl = domain ? `${domain}/${name}` : `/${name}`;
      const html = `<img src="${imgUrl}" alt="${name}" width="${w}" height="${h}" loading="lazy" decoding="async">`;
      navigator.clipboard.writeText(html);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadConverted = () => {
    const a = document.createElement('a');
    a.href = item.convertedUrl || item.previewUrl;
    a.download = item.seoName || item.originalName;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate font-mono">
                  {item.seoName || item.originalName}
                </h3>
                {currentIndex >= 0 && itemsList.length > 1 && (
                  <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono flex-shrink-0">
                    {currentIndex + 1} / {itemsList.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>
                  {t.comparisonModal.origLabel
                    .replace('{size}', formatSize(item.originalSize))
                    .replace('{format}', item.originalFormat.toUpperCase())}
                </span>
                {isDone && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span>
                      {t.comparisonModal.convertedLabel
                        .replace('{size}', formatSize(item.convertedSize))
                        .replace('{format}', item.convertedFormat.toUpperCase())}
                    </span>
                    {diffPercent > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800/50 text-[10px]">
                        -{diffPercent}% ({formatSize(savedBytes)})
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Controls: View Toggle & Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Mode Switcher */}
            {(isDone || (watermarkConfig && watermarkConfig.enabled)) && (
              <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
                    viewMode === 'split'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={t.comparisonModal.splitViewTooltip}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.comparisonModal.splitView}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
                    viewMode === 'side-by-side'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={t.comparisonModal.sideBySideViewTooltip}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.comparisonModal.sideBySideView}</span>
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title={t.comparisonModal.closeTooltip}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Viewport */}
        <div className="relative flex-1 min-h-[380px] max-h-[68vh] p-4 bg-slate-950/80 flex items-center justify-center overflow-auto select-none">
          {/* Navigation Chevron Left */}
          {hasPrev && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-slate-900/90 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 shadow-2xl transition group"
              title={t.comparisonModal.prevImageTooltip}
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Navigation Chevron Right */}
          {hasNext && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-slate-900/90 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 shadow-2xl transition group"
              title={t.comparisonModal.nextImageTooltip}
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* CASE 1: Pending Conversion Notification (Only if Watermark is NOT enabled) */}
          {!isDone && (!watermarkConfig || !watermarkConfig.enabled) ? (
            <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white mb-1.5">{t.comparisonModal.pendingNoticeTitle}</h4>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                {t.comparisonModal.pendingNoticeDesc}
              </p>
              {onConvertItem && (
                <button
                  type="button"
                  onClick={() => onConvertItem(item)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.comparisonModal.convertingButton}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>{t.comparisonModal.convertNowButton}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : viewMode === 'split' ? (
            /* CASE 2: Interactive Split Slider */
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full max-w-4xl max-h-full aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 cursor-ew-resize touch-none"
            >
              {/* Before Layer (Original) */}
              <div className="absolute inset-0">
                <img
                  src={item.previewUrl}
                  alt="Original"
                  className="w-full h-full object-contain pointer-events-none"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-slate-200 text-xs font-mono font-medium border border-white/10 shadow-lg pointer-events-none">
                  {t.comparisonModal.origLayerBadge.replace('{size}', formatSize(item.originalSize))}
                </span>
              </div>

              {/* After Layer (Overlay with clip-path) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
              >
                <img
                  src={item.convertedUrl || item.previewUrl}
                  alt={isDone ? "Optimized" : "Watermark Preview"}
                  className="w-full h-full object-contain pointer-events-none"
                />
                {!isDone && watermarkConfig && watermarkConfig.enabled && (
                  <WatermarkCanvasOverlay
                    watermarkConfig={watermarkConfig}
                    logoImg={logoImg}
                    width={item.width || 800}
                    height={item.height || 450}
                  />
                )}
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg backdrop-blur-md text-white text-xs font-mono font-semibold border shadow-lg pointer-events-none ${
                  isDone
                    ? 'bg-blue-600/90 border-blue-400/30'
                    : 'bg-amber-600/90 border-amber-400/30'
                }`}>
                  {isDone
                    ? t.comparisonModal.convertedLayerBadge
                        .replace('{format}', item.convertedFormat.toUpperCase())
                        .replace('{size}', formatSize(item.convertedSize))
                    : 'Watermark Live Preview'}
                </span>
              </div>

              {/* Divider Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none"
                style={{ left: `${splitPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center font-bold text-xs border-2 border-blue-500">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-900" />
                </div>
              </div>

              {/* Split Percentage Pill at bottom */}
              <div
                className="absolute bottom-3 -translate-x-1/2 pointer-events-none px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-slate-300 text-[10px] font-mono border border-white/10"
                style={{ left: `${splitPos}%` }}
              >
                {splitPos}%
              </div>
            </div>
          ) : (
            /* CASE 3: Side-by-Side Dual View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {/* Left Column: Original */}
              <div className="flex flex-col gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                  <span>{t.comparisonModal.origLabel.replace('{size}', formatSize(item.originalSize)).replace('{format}', item.originalFormat.toUpperCase())}</span>
                  <span className="font-mono text-slate-400">{formatSize(item.originalSize)}</span>
                </div>
                <div className="aspect-video bg-black/60 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={item.previewUrl}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="text-[11px] text-slate-400 font-mono text-center">
                  {item.width} × {item.height} px
                </div>
              </div>

              {/* Right Column: Converted */}
              <div className="flex flex-col gap-2 bg-slate-900/90 border border-blue-900/40 rounded-xl p-3 shadow-md">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-300 pb-1.5 border-b border-slate-800">
                  <span>{t.comparisonModal.convertedLabel.replace('{size}', formatSize(item.convertedSize)).replace('{format}', item.convertedFormat.toUpperCase())}</span>
                  <span className="font-mono text-emerald-400 font-bold">{formatSize(item.convertedSize)}</span>
                </div>
                <div className="aspect-video bg-black/60 rounded-lg overflow-hidden flex items-center justify-center relative">
                  <img
                    src={item.convertedUrl || item.previewUrl}
                    alt={isDone ? "Converted" : "Watermark Preview"}
                    className="max-w-full max-h-full object-contain"
                  />
                  {!isDone && watermarkConfig && watermarkConfig.enabled && (
                    <WatermarkCanvasOverlay
                      watermarkConfig={watermarkConfig}
                      logoImg={logoImg}
                      width={item.width || 800}
                      height={item.height || 450}
                    />
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono text-center flex items-center justify-center gap-2">
                  <span>{item.convertedWidth} × {item.convertedHeight} px</span>
                  {diffPercent > 0 && (
                    <span className="text-emerald-400 font-semibold">(-{diffPercent}%)</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950/70 text-xs">
          <div className="text-slate-400 text-xs hidden sm:block">
            {isDone ? (
              <span>{t.comparisonModal.keyboardNavHint}</span>
            ) : (
              <span>{t.comparisonModal.convertFirstHint}</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Export Composite Comparison */}
            {isDone && (
              <button
                type="button"
                onClick={handleExportComparisonImage}
                disabled={isExportingComposite}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                title={t.comparisonModal.exportCompositeTooltip}
              >
                {isExportingComposite ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Columns className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>{t.comparisonModal.exportCompositeButton}</span>
              </button>
            )}

            {/* Copy HTML tag */}
            {isDone && (
              <button
                type="button"
                onClick={handleCopyCode}
                disabled={isCopied}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                title={t.comparisonModal.copyHtmlTooltip}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{t.comparisonModal.copiedSuccess}</span>
                  </>
                ) : (
                  <>
                    <Code className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.comparisonModal.copyHtmlButton}</span>
                  </>
                )}
              </button>
            )}

            {/* Open in Annotation Studio */}
            {onSendToStudio && (
              <button
                type="button"
                onClick={() => onSendToStudio(item)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                title={t.comparisonModal.openStudioTooltip}
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
                <span>{t.comparisonModal.openStudioButton}</span>
              </button>
            )}

            {/* Download Optimized Image */}
            {isDone && (
              <button
                type="button"
                onClick={handleDownloadConverted}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                title={t.comparisonModal.downloadOptimizedTooltip}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.comparisonModal.downloadOptimizedButton}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
