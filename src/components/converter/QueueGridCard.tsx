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
  Clock,
  ArrowRight,
  ArrowLeftRight,
  Layers,
} from 'lucide-react';
import { ImageItem } from '@/types/multi-size';
import { WatermarkConfig } from '@/types/studio';
import { WatermarkCanvasOverlay } from './WatermarkCanvasOverlay';
import { useI18n } from '@/lib/i18n-context';

interface QueueGridCardProps {
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

export function QueueGridCard({
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
}: QueueGridCardProps) {
  const { t } = useI18n();
  const isDone = item.status === 'done';
  const isProcessing = item.status === 'processing';
  const isPending = item.status === 'pending';

  const diffPercent =
    isDone && item.originalSize > item.convertedSize
      ? Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)
      : 0;

  return (
    <div className="p-3.5 rounded-xl bg-transparent border border-slate-800 hover:border-slate-600 transition-colors flex flex-col justify-between space-y-3 group/card">
      <div>
        {/* Thumbnail Preview */}
        <div
          onClick={() => onCompare(item.id)}
          className="aspect-video bg-slate-950 rounded-lg overflow-hidden relative mb-2.5 border border-slate-800/80 group cursor-pointer"
          title={t.converter.compareTooltipCard}
        >
          <img
            src={item.convertedUrl || item.previewUrl}
            alt="preview"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Real-time Watermark Live Preview Overlay when pending */}
          {!isDone && watermarkConfig && watermarkConfig.enabled && (
            <WatermarkCanvasOverlay
              watermarkConfig={watermarkConfig}
              logoImg={logoImg}
              width={320}
              height={180}
            />
          )}

          {/* Hover Overlay Hint */}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
            <span className="px-2.5 py-1 rounded-full bg-slate-900/95 text-white border border-slate-700 text-[10px] font-semibold flex items-center gap-1.5 shadow-xl backdrop-blur-md">
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.converter.compare}</span>
            </span>
          </div>

          {/* Selection Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(item.id);
            }}
            className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center transition shadow-md z-10 cursor-pointer ${
              isSelected
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                : 'bg-black/60 text-slate-400 hover:text-white border border-white/20'
            }`}
            title={isSelected ? t.converter.deselectImageToStitch : t.converter.selectImageToStitch}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Status Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-slate-300 font-semibold uppercase">
              {t.converter.originalFormatBadge.replace('{format}', item.originalFormat)}
            </span>

            {isDone && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-600 text-white font-semibold uppercase flex items-center gap-0.5">
                <ArrowRight className="w-2.5 h-2.5" />
                {item.convertedFormat}
              </span>
            )}
          </div>

          {isPending && (
            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 border border-amber-500/40 text-amber-300 font-medium flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {t.converter.pendingStatus}
            </span>
          )}

          {isProcessing && (
            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-600/80 text-white font-medium flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              {t.converter.processingStatus}
            </span>
          )}

          {diffPercent > 0 && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-emerald-400 font-medium">
              -{diffPercent}%
            </span>
          )}
        </div>

        <h4
          className="text-xs font-semibold text-slate-200 truncate font-mono"
          title={isDone ? item.seoName : item.originalName}
        >
          {isDone ? item.seoName : item.originalName}
        </h4>

        {/* Dimensions & Size Details */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
          <span>
            {formatSize(item.originalSize)}
            {isDone && (
              <>
                {' '}&rarr;{' '}
                <strong className="text-slate-200">
                  {formatSize(item.convertedSize)}
                </strong>
              </>
            )}
          </span>
          <span className="font-mono">
            {isDone
              ? item.variants && item.variants.length > 1
                ? `⚡ ${item.variants.length} size`
                : `${item.convertedWidth} × ${item.convertedHeight}`
              : `${item.width} × ${item.height}`}
          </span>
        </div>

        {/* Multi-size variants pills */}
        {item.variants && item.variants.length > 1 && (
          <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-medium">
              {t.converter.downloadVariantsLabel}
            </span>
            <div className="flex flex-wrap gap-1">
              {item.variants.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  download={v.seoName}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/70 hover:bg-blue-900/80 border border-blue-500/30 text-[10px] text-blue-300 font-mono transition"
                  title={`Download: ${v.label} (${v.width}×${v.height}px, ${formatSize(v.size)})`}
                >
                  <Download className="w-2.5 h-2.5" />
                  <span>{v.width}×{v.height}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-800">
        <button
          type="button"
          onClick={() => onSendToStudio(item)}
          className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 transition cursor-pointer"
          title={t.converter.openInStudioTooltip}
        >
          <Wand2 className="w-3 h-3 text-blue-400" />
          <span>{t.converter.openInStudio}</span>
        </button>

        <Link
          href={`/stitcher?source=converter&ids=${item.id}`}
          className="py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1 transition"
          title={t.converter.addToStitcherTooltip}
        >
          <Layers className="w-3 h-3 text-indigo-400" />
          <span>{t.converter.addToStitcher}</span>
        </Link>

        {isPending ? (
          <button
            onClick={() => onConvertSingle(item, index)}
            className="py-1 px-2.5 rounded bg-blue-600 hover:bg-blue-500 text-[11px] font-medium text-white flex items-center gap-1 transition cursor-pointer"
            title={t.converter.compressSingleTooltip}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{t.converter.compressSingle}</span>
          </button>
        ) : (
          <button
            onClick={() => onConvertSingle(item, index)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title={t.converter.recompressSingleTooltip}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}


        {isDone && (
          <button
            onClick={() => onCopyHtmlTag(item)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
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
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition cursor-pointer"
          title={t.converter.compareTooltipCard}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onDownloadSingle(item)}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          title={
            isDone
              ? item.variants && item.variants.length > 1
                ? t.converter.downloadZipBundleTooltip.replace('{count}', String(item.variants.length))
                : t.converter.downloadSingleTooltip
              : t.converter.downloadOriginalTooltip
          }
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onRemove(item.id)}
          className="p-1 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition cursor-pointer"
          title={t.converter.removeFromQueueTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
