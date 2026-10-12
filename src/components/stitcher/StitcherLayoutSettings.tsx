'use client';

import React, { useState, useEffect } from 'react';
import { CanvasConfig, GridSettings, StitchMode, CanvasPreset } from '@/types/stitcher';
import { CANVAS_PRESET_DIMS } from '@/lib/stitcher';
import { ECOMMERCE_PRESETS, getLocalizedPreset } from '@/lib/constants/ecommerce-presets';
import { Sliders, Palette, Maximize2, Store, Square } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface StitcherLayoutSettingsProps {
  mode: StitchMode;
  gridSettings: GridSettings;
  onUpdateGridSettings: (updates: Partial<GridSettings>) => void;
  canvasConfig: CanvasConfig;
  onUpdateCanvasConfig: (updates: Partial<CanvasConfig>) => void;
  onPresetChange?: (preset: CanvasPreset) => void;
  onCustomSizeChange?: (w: number, h: number) => void;
  onOpenPresetModal?: () => void;
}

export function StitcherLayoutSettings({
  mode,
  gridSettings,
  onUpdateGridSettings,
  canvasConfig,
  onUpdateCanvasConfig,
  onPresetChange,
  onCustomSizeChange,
  onOpenPresetModal,
}: StitcherLayoutSettingsProps) {
  const { t, locale } = useI18n();
  const isGrid = mode === 'grid';
  const isStrip = mode === 'strip-h' || mode === 'strip-v';

  // Local buffered states for custom width & height to prevent squashing layers while typing
  const [localW, setLocalW] = useState<string>(String(canvasConfig.width));
  const [localH, setLocalH] = useState<string>(String(canvasConfig.height));

  useEffect(() => {
    setLocalW(String(canvasConfig.width));
  }, [canvasConfig.width]);

  useEffect(() => {
    setLocalH(String(canvasConfig.height));
  }, [canvasConfig.height]);

  const commitCustomSize = () => {
    const w = parseInt(localW, 10);
    const h = parseInt(localH, 10);
    if (!isNaN(w) && !isNaN(h) && w >= 200 && h >= 200 && (w !== canvasConfig.width || h !== canvasConfig.height)) {
      onCustomSizeChange?.(w, h);
    } else {
      setLocalW(String(canvasConfig.width));
      setLocalH(String(canvasConfig.height));
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs w-full lg:w-80 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>{t.stitcher.settingsHeader}</span>
        </div>
      </div>

      {/* Canva-style Image Size Section */}
      <div className="flex flex-col gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.stitcher.imageSizeSection}</span>
          </span>
          <span className="font-mono text-[10px] text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2 py-0.5 rounded-full font-semibold">
            {canvasConfig.width} × {canvasConfig.height}
          </span>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5">
          {(() => {
            const matchingPreset =
              canvasConfig.preset === 'auto'
                ? null
                : ECOMMERCE_PRESETS.find(
                    (p) =>
                      p.id === canvasConfig.preset ||
                      (p.width === canvasConfig.width && p.height === canvasConfig.height)
                  ) || null;

            const selectValue =
              canvasConfig.preset === 'auto'
                ? 'auto'
                : matchingPreset
                ? matchingPreset.id
                : Object.entries(CANVAS_PRESET_DIMS).find(
                    ([, val]) => val.w === canvasConfig.width && val.h === canvasHeightDim(canvasConfig.height)
                  )?.[0] || 'custom';

            function canvasHeightDim(h: number) {
              return h;
            }

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
                  onPresetChange && onPresetChange(e.target.value as CanvasPreset);
                }}
                className="flex-1 min-w-0 bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
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

          {onOpenPresetModal && (
            <button
              type="button"
              onClick={onOpenPresetModal}
              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 hover:text-white transition shrink-0 cursor-pointer"
              title={t.stitcher.ecomModalTooltip}
            >
              <Store className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Custom Width & Height Inputs */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">{t.stitcher.widthLabel}</label>
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
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">{t.stitcher.heightLabel}</label>
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
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick Sizes (E-commerce & Standard) */}
        <div className="flex flex-wrap gap-1 pt-1">
          {[
            { label: 'Shopee 1:1', w: 1000, h: 1000 },
            { label: 'TikTok 3:4', w: 900, h: 1200 },
            { label: 'Amazon 1:1', w: 2000, h: 2000 },
            { label: '1920×1080', w: 1920, h: 1080 },
            { label: '1200×630', w: 1200, h: 630 },
            { label: '1080×1920', w: 1080, h: 1920 },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => onCustomSizeChange && onCustomSizeChange(s.w, s.h)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                canvasConfig.width === s.w && canvasConfig.height === s.h
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Settings */}
      {isGrid && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400">{t.stitcher.columnsLabel}</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => onUpdateGridSettings({ columns: num })}
                className={`w-7 h-7 rounded-lg font-medium transition ${
                  gridSettings.columns === num
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spacing & Gap Slider */}
      {(isGrid || isStrip) && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{t.stitcher.gapLabel}</span>
            <span className="font-mono text-slate-300">{gridSettings.gap}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            value={gridSettings.gap}
            onChange={(e) => onUpdateGridSettings({ gap: parseInt(e.target.value, 10) })}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      )}

      {/* Corner Radius Slider */}
      {(isGrid || isStrip) && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{t.stitcher.photoRadiusLabel}</span>
            <span className="font-mono text-slate-300">{gridSettings.cornerRadius}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={gridSettings.cornerRadius}
            onChange={(e) =>
              onUpdateGridSettings({ cornerRadius: parseInt(e.target.value, 10) })
            }
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      )}

      {/* Canvas Padding Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{t.stitcher.canvasPaddingLabel}</span>
          <span className="font-mono text-slate-300">{canvasConfig.padding}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="80"
          value={canvasConfig.padding}
          onChange={(e) => {
            const pad = parseInt(e.target.value, 10);
            onUpdateCanvasConfig({ padding: pad });
            onUpdateGridSettings({ padding: pad });
          }}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Canvas Border Controls */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <Square className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.stitcher.canvasBorderLabel}</span>
          </div>
          <span className="font-mono text-slate-300 text-xs">{canvasConfig.borderWidth || 0}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          value={canvasConfig.borderWidth || 0}
          onChange={(e) => {
            const bw = parseInt(e.target.value, 10);
            onUpdateCanvasConfig({ borderWidth: bw });
          }}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        {/* Border Color Palette (visible when borderWidth > 0) */}
        {(canvasConfig.borderWidth || 0) > 0 && (
          <div className="flex items-center justify-between gap-1.5 pt-1 animate-in fade-in duration-150">
            <span className="text-[11px] text-slate-400">{t.stitcher.canvasBorderColorLabel}</span>
            <div className="flex items-center gap-1.5">
              {[
                { color: '#ffffff', label: 'White' },
                { color: '#000000', label: 'Black' },
                { color: '#3b82f6', label: 'Blue' },
                { color: '#f59e0b', label: 'Amber' },
                { color: '#f43f5e', label: 'Rose' },
                { color: '#10b981', label: 'Emerald' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  title={c.label}
                  onClick={() => onUpdateCanvasConfig({ borderColor: c.color })}
                  className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                    (canvasConfig.borderColor || '#ffffff').toLowerCase() === c.color.toLowerCase()
                      ? 'ring-2 ring-blue-400 scale-110 border-white'
                      : 'border-slate-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
              <div className="relative w-5 h-5 rounded-full overflow-hidden border border-slate-700 cursor-pointer">
                <input
                  type="color"
                  value={canvasConfig.borderColor || '#ffffff'}
                  onChange={(e) => onUpdateCanvasConfig({ borderColor: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: canvasConfig.borderColor || '#ffffff' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Canvas Corner Radius Slider */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{t.stitcher.canvasRadiusLabel}</span>
            <span className="font-mono text-slate-300 text-xs">{canvasConfig.borderRadius || 0}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            value={canvasConfig.borderRadius || 0}
            onChange={(e) => {
              const r = parseInt(e.target.value, 10);
              onUpdateCanvasConfig({ borderRadius: r });
            }}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Canvas Background Settings */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <Palette className="w-3.5 h-3.5 text-blue-400" />
          <span>{t.stitcher.bgColorLabel}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onUpdateCanvasConfig({ backgroundType: 'color', backgroundColor: '#090d16' })}
            className={`py-1.5 rounded-lg border text-[11px] font-medium transition ${
              canvasConfig.backgroundType === 'color' && canvasConfig.backgroundColor === '#090d16'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
            }`}
          >
            {t.stitcher.colorBlack}
          </button>
          <button
            onClick={() => onUpdateCanvasConfig({ backgroundType: 'color', backgroundColor: '#ffffff' })}
            className={`py-1.5 rounded-lg border text-[11px] font-medium transition ${
              canvasConfig.backgroundType === 'color' && canvasConfig.backgroundColor === '#ffffff'
                ? 'bg-white text-slate-900 border-white'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
            }`}
          >
            {t.stitcher.colorWhite}
          </button>
          <button
            onClick={() => onUpdateCanvasConfig({ backgroundType: 'transparent' })}
            className={`py-1.5 rounded-lg border text-[11px] font-medium transition ${
              canvasConfig.backgroundType === 'transparent'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
            }`}
          >
            {t.stitcher.colorTransparent}
          </button>
        </div>

        {/* Gradient presets */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-slate-500">{t.stitcher.gradientLabel}</span>
          {['midnight', 'sunset', 'emerald'].map((grad) => (
            <button
              key={grad}
              onClick={() => onUpdateCanvasConfig({ backgroundType: 'gradient', backgroundGradient: grad })}
              className={`px-2 py-0.5 rounded text-[10px] capitalize transition ${
                canvasConfig.backgroundType === 'gradient' && canvasConfig.backgroundGradient === grad
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {grad}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
