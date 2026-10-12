'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Columns,
  Layers,
  Grid,
  Rows,
  Download,
  Upload,
  Undo2,
  Redo2,
  Trash2,
  Wand2,
  CloudUpload,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Store,
} from 'lucide-react';
import { StitchMode, CanvasPreset } from '@/types/stitcher';
import { CANVAS_PRESET_DIMS } from '@/lib/stitcher';
import { ECOMMERCE_PRESETS, getLocalizedPreset } from '@/lib/constants/ecommerce-presets';
import { useI18n } from '@/lib/i18n-context';

interface StitcherToolbarProps {
  mode: StitchMode;
  onModeChange: (mode: StitchMode) => void;
  preset: CanvasPreset;
  onPresetChange: (preset: CanvasPreset) => void;
  canvasWidth: number;
  canvasHeight: number;
  onCustomSizeChange?: (w: number, h: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onAddFiles: (files: FileList | File[]) => void;
  onExport: (format: 'image/webp' | 'image/png') => void;
  onSendToStudio: () => void;
  onSaveToR2: () => void;
  onSendToConverter: () => void;
  isExporting: boolean;
  onAutoArrange?: () => void;
  layerCount?: number;
  onOpenPresetModal?: () => void;
}

export function StitcherToolbar({
  mode,
  onModeChange,
  preset,
  onPresetChange,
  canvasWidth,
  canvasHeight,
  onCustomSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onAddFiles,
  onExport,
  onSendToStudio,
  onSaveToR2,
  onSendToConverter,
  isExporting,
  onAutoArrange,
  layerCount,
  onOpenPresetModal,
}: StitcherToolbarProps) {
  const { t, locale } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Local buffered states for custom width & height to prevent squashing layers while typing
  const [localW, setLocalW] = useState<string>(String(canvasWidth));
  const [localH, setLocalH] = useState<string>(String(canvasHeight));

  useEffect(() => {
    setLocalW(String(canvasWidth));
  }, [canvasWidth]);

  useEffect(() => {
    setLocalH(String(canvasHeight));
  }, [canvasHeight]);

  const commitCustomSize = () => {
    const w = parseInt(localW, 10);
    const h = parseInt(localH, 10);
    if (!isNaN(w) && !isNaN(h) && w >= 200 && h >= 200 && (w !== canvasWidth || h !== canvasHeight)) {
      onCustomSizeChange?.(w, h);
    } else {
      setLocalW(String(canvasWidth));
      setLocalH(String(canvasHeight));
    }
  };

  const modes: { id: StitchMode; label: string; icon: React.ReactNode }[] = [
    { id: 'freeform', label: t.stitcher.modeFreeform, icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'grid', label: t.stitcher.modeGrid, icon: <Grid className="w-3.5 h-3.5" /> },
    { id: 'strip-h', label: t.stitcher.modeStripH, icon: <Columns className="w-3.5 h-3.5" /> },
    { id: 'strip-v', label: t.stitcher.modeStripV, icon: <Rows className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col gap-3 pb-3 border-b border-slate-800">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Columns className="w-4 h-4" />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {t.stitcher.title}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Photos */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.webp,.png,.jpg,.jpeg,.avif,.gif,.jfif,.bmp,.svg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.stitcher.addPhotos}</span>
          </button>

          {/* Quick Auto-arrange button */}
          {onAutoArrange && (
            <button
              onClick={onAutoArrange}
              disabled={!layerCount || layerCount === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title={t.stitcher.autoArrangeTooltip}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.stitcher.autoArrange}</span>
            </button>
          )}

          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title={t.stitcher.undoTooltip}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded transition"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title={t.stitcher.redoTooltip}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded transition"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clear Canvas */}
          <button
            onClick={onClear}
            title={t.stitcher.clearAllTooltip}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/60 text-slate-400 hover:text-red-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Send to Studio Button (Highlight bridge feature!) */}
          <button
            onClick={onSendToStudio}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-medium border border-indigo-500/40 shadow-sm transition flex items-center gap-1.5"
            title={t.stitcher.openInStudioTooltip}
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>{t.stitcher.openInStudio}</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((p) => !p)}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              {isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{t.stitcher.exportDropdown}</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-40 text-xs">
                  <button
                    onClick={() => {
                      onExport('image/webp');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition"
                  >
                    <span>{t.stitcher.exportWebp}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{t.stitcher.exportWebpBadge}</span>
                  </button>
                  <button
                    onClick={() => {
                      onExport('image/png');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition"
                  >
                    <span>{t.stitcher.exportPng}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.stitcher.exportPngBadge}</span>
                  </button>
                  <div className="h-px bg-slate-800 my-1" />
                  <button
                    onClick={() => {
                      onSaveToR2();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-950/60 text-blue-300 flex items-center gap-2 transition"
                  >
                    <CloudUpload className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.stitcher.saveToR2}</span>
                  </button>
                  <button
                    onClick={() => {
                      onSendToConverter();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-950/60 text-indigo-300 flex items-center gap-2 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t.stitcher.sendToConverter}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mode Switcher & Canvas Preset Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        {/* Modes */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                mode === m.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Image Size (Kích thước ảnh) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">{t.stitcher.imageSizeLabel}</span>
          
          {onOpenPresetModal && (
            <button
              type="button"
              onClick={onOpenPresetModal}
              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
              title={t.stitcher.ecomModalTooltip}
            >
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.stitcher.ecomModalButton}</span>
            </button>
          )}

          {(() => {
            const matchingPreset =
              preset === 'auto'
                ? null
                : ECOMMERCE_PRESETS.find(
                    (p) => p.id === preset || (p.width === canvasWidth && p.height === canvasHeight)
                  ) || null;

            const selectValue =
              preset === 'auto'
                ? 'auto'
                : matchingPreset
                ? matchingPreset.id
                : Object.entries(CANVAS_PRESET_DIMS).find(
                    ([, val]) => val.w === canvasWidth && val.h === canvasHeight
                  )?.[0] || 'custom';

            const isHardcoded = [
              'auto',
              'facebook-post',
              '1:1',
              'youtube-thumb',
              '9:16',
              '3:4',
              '16:9',
              'custom',
            ].includes(selectValue);

            return (
              <select
                value={selectValue}
                onChange={(e) => {
                  if (e.target.value === '__open_modal__') {
                    onOpenPresetModal?.();
                    return;
                  }
                  onPresetChange(e.target.value as CanvasPreset);
                }}
                className="bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="auto">{t.stitcher.presetAuto}</option>

                {/* Dynamic option for selected e-commerce preset from modal */}
                {matchingPreset && !isHardcoded && (
                  <option value={matchingPreset.id}>
                    ✨ {getLocalizedPreset(matchingPreset, locale).name} ({matchingPreset.width}×{matchingPreset.height})
                  </option>
                )}

                <optgroup label={t.stitcher.groupSocialPost}>
                  <option value="facebook-post">{t.stitcher.presetFacebookPost}</option>
                  <option value="1:1">{t.stitcher.presetSquare}</option>
                  <option value="youtube-thumb">{t.stitcher.presetYoutubeThumb}</option>
                  <option value="9:16">{t.stitcher.presetStoryReels}</option>
                </optgroup>

                <optgroup label={t.stitcher.groupEcomFrames}>
                  <option value="3:4">{t.stitcher.presetTikTokShop}</option>
                  <option value="16:9">{t.stitcher.presetFullHd}</option>
                </optgroup>

                <option value="__open_modal__">{t.stitcher.viewAllPresetsOption}</option>
                <option value="custom">{t.stitcher.customPresetOption}</option>
              </select>
            );
          })()}

          {/* Direct Width x Height px inputs (buffered with onBlur & Enter) */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/70 rounded-lg px-1.5 py-0.5">
            <input
              type="number"
              min={200}
              max={8000}
              value={localW}
              onChange={(e) => setLocalW(e.target.value)}
              onBlur={commitCustomSize}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitCustomSize();
                  e.currentTarget.blur();
                }
              }}
              className="w-14 bg-transparent text-center text-xs font-mono text-white focus:outline-none focus:text-blue-400"
              title={t.stitcher.widthTooltip}
            />
            <span className="text-[10px] text-slate-500 font-mono">×</span>
            <input
              type="number"
              min={200}
              max={8000}
              value={localH}
              onChange={(e) => setLocalH(e.target.value)}
              onBlur={commitCustomSize}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitCustomSize();
                  e.currentTarget.blur();
                }
              }}
              className="w-14 bg-transparent text-center text-xs font-mono text-white focus:outline-none focus:text-blue-400"
              title={t.stitcher.heightTooltip}
            />
            <span className="text-[10px] text-slate-500 font-mono">px</span>
          </div>
        </div>
      </div>
    </div>
  );
}
