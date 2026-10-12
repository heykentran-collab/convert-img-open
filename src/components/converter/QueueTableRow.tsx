'use client';

import React from 'react';
import Link from 'next/link';
import {
  Download,
  Wand2,
  Code,
  Check,
  Trash2,
  RefreshCw,
  Play,
  ArrowLeftRight,
  Layers,
} from 'lucide-react';
import { ImageItem } from '@/types/multi-size';
import { WatermarkConfig } from '@/types/studio';
import { WatermarkCanvasOverlay } from './WatermarkCanvasOverlay';
import { useI18n } from '@/lib/i18n-context';

interface QueueTableRowProps {
  item: ImageItem;
  index: number;
  isSelected: boolean;
  watermarkConfig?: WatermarkConfig;
  logoImg?: HTMLImageElement | null;
  onToggleSelect: (id: string) => void;
  onCompare: (id: string) => void;
  onSendToStudio: (item: ImageItem) => void;
  onConvertSingle: (item: ImageItem, index: number) => void;
  onCopyHtmlTag: (item: ImageItem) => void;
  isCopiedHtml: boolean;
  onDownloadSingle: (item: ImageItem) => void;
  onRemove: (id: string) => void;
  formatSize: (bytes: number) => string;
}

export function QueueTableRow({
  item,
  index,
  isSelected,
  watermarkConfig,
  logoImg,
  onToggleSelect,
  onCompare,
  onSendToStudio,
  onConvertSingle,
  onCopyHtmlTag,
  isCopiedHtml,
  onDownloadSingle,
  onRemove,
  formatSize,
}: QueueTableRowProps) {
  const { t } = useI18n();
  const isDone = item.status === 'done';
  const isProcessing = item.status === 'processing';
  const isPending = item.status === 'pending';

  const diffPercent =
    isDone && item.originalSize > item.convertedSize
      ? Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)
      : 0;

  return (
    <div className="p-2.5 rounded-xl bg-transparent border border-slate-800 hover:border-slate-600 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group/row">
      {/* Left: Selection + Thumbnail + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleSelect(item.id)}
          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition cursor-pointer ${
            isSelected
              ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
          }`}
          title={isSelected ? t.converter.deselectImageToStitch : t.converter.selectImageToStitch}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Thumbnail Preview */}
        <div
          onClick={() => onCompare(item.id)}
          className="w-12 h-12 rounded-lg bg-slate-950 overflow-hidden relative shrink-0 border border-slate-800 cursor-pointer group"
          title={t.converter.compareTooltipCard}
        >
          <img
            src={item.convertedUrl || item.previewUrl}
            alt="preview"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          {!isDone && watermarkConfig && watermarkConfig.enabled && (
            <WatermarkCanvasOverlay
              watermarkConfig={watermarkConfig}
              logoImg={logoImg}
              width={96}
              height={96}
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>

        {/* File Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              className="text-xs font-semibold text-slate-200 truncate font-mono max-w-[200px] sm:max-w-xs md:max-w-md"
              title={isDone ? item.seoName : item.originalName}
            >
              {isDone ? item.seoName : item.originalName}
            </h4>

            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 uppercase shrink-0">
              {item.originalFormat}
            </span>

            {isDone && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-600/80 text-white uppercase shrink-0">
                &rarr; {item.convertedFormat}
              </span>
            )}

            {isPending && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0 font-medium">
                {t.converter.waitingStatus}
              </span>
            )}

            {isProcessing && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0 font-medium flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                {t.converter.processingStatus}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
            <span>{formatSize(item.originalSize)}</span>
            {isDone && (
              <>
                <span>&rarr;</span>
                <strong className="text-emerald-400">{formatSize(item.convertedSize)}</strong>
                {diffPercent > 0 && (
                  <span className="text-emerald-400 font-mono text-[10px]">(-{diffPercent}%)</span>
                )}
              </>
            )}
            <span>•</span>
            <span className="font-mono text-slate-400">
              {isDone
                ? item.variants && item.variants.length > 1
                  ? `⚡ ${item.variants.length} sizes`
                  : `${item.convertedWidth}×${item.convertedHeight}px`
                : `${item.width}×${item.height}px`}
            </span>
          </div>

          {/* Multi-size compact variant pills */}
          {item.variants && item.variants.length > 1 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.variants.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  download={v.seoName}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-950/70 hover:bg-blue-900 border border-blue-500/30 text-[9px] text-blue-300 font-mono transition"
                  title={`Tải riêng: ${v.label} (${v.width}×${v.height}px, ${formatSize(v.size)})`}
                >
                  <Download className="w-2.5 h-2.5" />
                  <span>{v.width}×{v.height}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => onSendToStudio(item)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition cursor-pointer"
          title={t.converter.openInStudioTooltip}
        >
          <Wand2 className="w-3.5 h-3.5" />
        </button>

        <Link
          href={`/stitcher?source=converter&ids=${item.id}`}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition"
          title={t.converter.addToStitcherTooltip}
        >
          <Layers className="w-3.5 h-3.5" />
        </Link>

        {isPending ? (
          <button
            onClick={() => onConvertSingle(item, index)}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition flex items-center gap-1 cursor-pointer"
            title={t.converter.compressSingleTooltip}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t.converter.compressSingle}</span>
          </button>
        ) : (
          <button
            onClick={() => onConvertSingle(item, index)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title={t.converter.recompressSingleTooltip}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}


        {isDone && (
          <button
            onClick={() => onCopyHtmlTag(item)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title={t.converter.copyHtmlTooltip}
          >
            {isCopiedHtml ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Code className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => onCompare(item.id)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition cursor-pointer"
          title={t.converter.compareTooltipCard}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onDownloadSingle(item)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          title={isDone ? t.converter.downloadSingleTooltip : t.converter.downloadOriginalTooltip}
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition cursor-pointer"
          title={t.converter.removeFromQueueTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
