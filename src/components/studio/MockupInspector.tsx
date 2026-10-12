'use client';

import React from 'react';
import {
  Sparkles,
  Ratio,
  Save,
  RotateCcw,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  BackgroundType,
  ShadowIntensity,
  AspectRatioPreset,
  BackgroundPreset,
} from '@/types/studio';
import { useI18n } from '@/lib/i18n-context';

export type MockupFrameType = 'macos' | 'browser' | 'none';

interface MockupInspectorProps {
  frameType: MockupFrameType;
  setFrameType: (type: MockupFrameType) => void;
  browserUrl: string;
  setBrowserUrl: (url: string) => void;
  aspectRatio: AspectRatioPreset;
  setAspectRatio: (ar: AspectRatioPreset) => void;
  canvasPadding: number;
  setCanvasPadding: (padding: number) => void;
  backgroundType: BackgroundType;
  setBackgroundType: (type: BackgroundType) => void;
  backgroundPresetId: string;
  setBackgroundPresetId: (id: string) => void;
  customSolidColor: string;
  setCustomSolidColor: (color: string) => void;
  shadowIntensity: ShadowIntensity;
  setShadowIntensity: (s: ShadowIntensity) => void;
  cornerRadius: number;
  setCornerRadius: (r: number) => void;
  computedDims: { w: number; h: number };
  collapsedCards: Record<string, boolean>;
  toggleCard: (key: string) => void;
  toggleAllRightCards: () => void;
  onSaveSettings: () => void;
  onResetSettings: () => void;
  settingsFeedback: string | null;
  backgroundPresets: BackgroundPreset[];
  solidPresets: Array<{ label: string; color: string }>;
}

export const MockupInspector: React.FC<MockupInspectorProps> = ({
  frameType,
  setFrameType,
  browserUrl,
  setBrowserUrl,
  aspectRatio,
  setAspectRatio,
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
  computedDims,
  collapsedCards,
  toggleCard,
  toggleAllRightCards,
  onSaveSettings,
  onResetSettings,
  settingsFeedback,
  backgroundPresets,
  solidPresets,
}) => {
  const { t, locale } = useI18n();
  const allCollapsed = ['mockup_frame', 'canvas_dimensions', 'canvas_bg', 'canvas_effects'].every(
    (k) => collapsedCards[k]
  );

  return (
    <div className="space-y-2.5">
      {/* Top Settings Toolbar & Toggle All */}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
          {t.studio.mockupConfigHeader}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSaveSettings}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 flex items-center gap-1 transition cursor-pointer"
            title={t.studio.savePresetTooltip}
          >
            <Save className="w-2.5 h-2.5 text-blue-400" />
            <span>{t.studio.savePresetBtn}</span>
          </button>

          <button
            type="button"
            onClick={onResetSettings}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
            title={t.studio.resetPresetTooltip}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>{t.studio.resetPresetBtn}</span>
          </button>

          <button
            type="button"
            onClick={toggleAllRightCards}
            className="text-[10px] text-slate-400 hover:text-sky-400 transition ml-1 cursor-pointer"
            title={allCollapsed ? t.studio.expandAllCards : t.studio.collapseAllCards}
          >
            {allCollapsed ? t.studio.expandAllCards : t.studio.collapseAllCards}
          </button>
        </div>
      </div>

      {/* Feedback notification banner */}
      {settingsFeedback && (
        <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium">{settingsFeedback}</span>
        </div>
      )}

      {/* CARD 1: MOCKUP FRAME */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={() => toggleCard('mockup_frame')}
          className="w-full flex items-center justify-between group cursor-pointer text-left select-none"
        >
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 transition">
            <span>{t.studio.cardMockupFrame}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {collapsedCards.mockup_frame && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {frameType === 'macos'
                  ? 'macOS'
                  : frameType === 'browser'
                  ? 'Chrome URL'
                  : t.studio.frameNone}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                collapsedCards.mockup_frame ? '-rotate-90' : 'rotate-0'
              }`}
            />
          </div>
        </button>

        {!collapsedCards.mockup_frame && (
          <div className="space-y-3 pt-0.5 animate-in fade-in duration-150">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="frame"
                  checked={frameType === 'macos'}
                  onChange={() => setFrameType('macos')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{t.studio.frameMacos}</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="frame"
                  checked={frameType === 'browser'}
                  onChange={() => setFrameType('browser')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{t.studio.frameBrowser}</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="frame"
                  checked={frameType === 'none'}
                  onChange={() => setFrameType('none')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{t.studio.frameNone}</span>
              </label>
            </div>

            {frameType === 'browser' && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <label className="text-[11px] text-slate-400">{t.studio.browserUrlLabel}</label>
                <input
                  type="text"
                  value={browserUrl}
                  onChange={(e) => setBrowserUrl(e.target.value)}
                  placeholder={t.studio.browserUrlPlaceholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* CARD 2: ASPECT RATIO & PADDING */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={() => toggleCard('canvas_dimensions')}
          className="w-full flex items-center justify-between group cursor-pointer text-left select-none"
        >
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 transition">
            <Ratio className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.studio.cardCanvasDimensions}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {collapsedCards.canvas_dimensions && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {aspectRatio.toUpperCase()} • {canvasPadding}px
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                collapsedCards.canvas_dimensions ? '-rotate-90' : 'rotate-0'
              }`}
            />
          </div>
        </button>

        {!collapsedCards.canvas_dimensions && (
          <div className="space-y-3 pt-0.5 animate-in fade-in duration-150">
            {/* Aspect Ratio Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>{t.studio.aspectRatioLabel}</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {computedDims.w} × {computedDims.h}px
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[
                  { id: 'auto', label: 'Auto' },
                  { id: '1:1', label: '1:1' },
                  { id: '3:4', label: '3:4' },
                  { id: '16:9', label: '16:9' },
                  { id: '4:3', label: '4:3' },
                  { id: '9:16', label: '9:16' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id as AspectRatioPreset)}
                    className={`py-1 text-xs rounded-lg transition font-medium text-center cursor-pointer ${
                      aspectRatio === r.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {aspectRatio !== 'auto' && (
                <p className="text-[10px] text-blue-400/90 font-mono">
                  {aspectRatio === '16:9'
                    ? (locale === 'vi' ? '🎯 16:9: Chuẩn YouTube, Slides, Twitter/X Card' : '🎯 16:9: Standard for YouTube, Slides, Twitter/X Card')
                    : aspectRatio === '4:3'
                    ? (locale === 'vi' ? '📄 4:3: Chuẩn bài thuyết trình, tài liệu' : '📄 4:3: Standard for presentations, documents')
                    : aspectRatio === '1:1'
                    ? (locale === 'vi' ? '⬛ 1:1: Chuẩn vuông Shopee, Instagram, Avatar' : '⬛ 1:1: Standard square for Shopee, Instagram, Avatar')
                    : aspectRatio === '3:4'
                    ? (locale === 'vi' ? '👗 3:4: Chuẩn TikTok Shop, thời trang & lookbook' : '👗 3:4: Standard for TikTok Shop, fashion & lookbooks')
                    : (locale === 'vi' ? '📱 9:16: Chuẩn Stories, Reels, TikTok dọc' : '📱 9:16: Standard for Stories, Reels, vertical TikTok')}
                </p>
              )}
            </div>

            {/* Padding Presets */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
                <span>{t.studio.paddingLabel}</span>
                <span className="text-blue-400 font-mono text-[11px]">{canvasPadding}px</span>
              </label>
              <div className="grid grid-cols-5 gap-1">
                {[0, 24, 36, 48, 64].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCanvasPadding(p)}
                    className={`py-1 text-xs rounded-lg transition font-medium text-center cursor-pointer ${
                      canvasPadding === p
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {p === 0 ? '0' : `${p}px`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CARD 3: CANVAS BACKGROUND */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={() => toggleCard('canvas_bg')}
          className="w-full flex items-center justify-between group cursor-pointer text-left select-none"
        >
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 transition">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.studio.cardCanvasBg}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {collapsedCards.canvas_bg && (
              <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {backgroundType === 'gradient' && (
                  <>
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                      style={{
                        background:
                          backgroundPresets.find((p) => p.id === backgroundPresetId)?.value ||
                          '#3b82f6',
                      }}
                    />
                    <span>
                      {backgroundPresets.find((p) => p.id === backgroundPresetId)?.name ||
                        'Gradient'}
                    </span>
                  </>
                )}
                {backgroundType === 'solid' && (
                  <>
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                      style={{ backgroundColor: customSolidColor }}
                    />
                    <span>{t.studio.bgSolids}</span>
                  </>
                )}
                {backgroundType === 'transparent' && <span>{t.studio.bgTransparent}</span>}
              </div>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                collapsedCards.canvas_bg ? '-rotate-90' : 'rotate-0'
              }`}
            />
          </div>
        </button>

        {!collapsedCards.canvas_bg && (
          <div className="space-y-3 pt-0.5 animate-in fade-in duration-150">
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setBackgroundType('gradient')}
                className={`py-1 rounded-md transition font-medium cursor-pointer ${
                  backgroundType === 'gradient'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.studio.bgGradients}
              </button>
              <button
                type="button"
                onClick={() => setBackgroundType('solid')}
                className={`py-1 rounded-md transition font-medium cursor-pointer ${
                  backgroundType === 'solid'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.studio.bgSolids}
              </button>
              <button
                type="button"
                onClick={() => setBackgroundType('transparent')}
                className={`py-1 rounded-md transition font-medium cursor-pointer ${
                  backgroundType === 'transparent'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.studio.bgTransparent}
              </button>
            </div>

            {/* Gradient Presets */}
            {backgroundType === 'gradient' && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {backgroundPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setBackgroundPresetId(preset.id)}
                    className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      backgroundPresetId === preset.id
                        ? 'border-blue-500 bg-blue-950/40 text-white ring-1 ring-blue-500'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 shadow-inner"
                      style={{ background: preset.value }}
                    />
                    <span className="text-[11px] font-medium truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Solid Colors */}
            {backgroundType === 'solid' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-1">
                  {solidPresets.map((item) => (
                    <button
                      key={item.color}
                      type="button"
                      onClick={() => setCustomSolidColor(item.color)}
                      title={item.label}
                      className={`w-6 h-6 rounded-full transition border border-slate-700 cursor-pointer ${
                        customSolidColor.toLowerCase() === item.color.toLowerCase()
                          ? 'ring-2 ring-blue-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: item.color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                  <input
                    type="color"
                    value={customSolidColor}
                    onChange={(e) => setCustomSolidColor(e.target.value)}
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customSolidColor}
                    onChange={(e) => setCustomSolidColor(e.target.value)}
                    className="bg-transparent text-xs font-mono text-slate-200 outline-none w-full"
                  />
                </div>
              </div>
            )}

            {/* Transparent info */}
            {backgroundType === 'transparent' && (
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                {locale === 'vi'
                  ? 'Nền trong suốt chuẩn PNG/WebP alpha, thích hợp chèn trực tiếp vào blog, tài liệu hoặc giao diện web.'
                  : 'Transparent PNG/WebP alpha background, perfect for blogs, docs, or web UI mockups.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CARD 4: EFFECTS - SHADOW & CORNER RADIUS */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={() => toggleCard('canvas_effects')}
          className="w-full flex items-center justify-between group cursor-pointer text-left select-none"
        >
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 transition">
            <span>{t.studio.cardCanvasEffects}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {collapsedCards.canvas_effects && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {t.studio.shadowIntensityLabel} {shadowIntensity === 'none' ? t.studio.shadowNone : shadowIntensity} • {cornerRadius}px
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                collapsedCards.canvas_effects ? '-rotate-90' : 'rotate-0'
              }`}
            />
          </div>
        </button>

        {!collapsedCards.canvas_effects && (
          <div className="space-y-3 pt-0.5 animate-in fade-in duration-150">
            {/* Drop Shadow */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium block">{t.studio.shadowIntensityLabel}</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'none', label: t.studio.shadowNone },
                  { id: 'soft', label: t.studio.shadowSubtle },
                  { id: 'medium', label: t.studio.shadowMedium },
                  { id: 'heavy', label: t.studio.shadowStrong },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShadowIntensity(s.id as ShadowIntensity)}
                    className={`py-1 text-xs rounded-lg transition font-medium text-center cursor-pointer ${
                      shadowIntensity === s.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bo góc (Corner Radius) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
                <span>{t.studio.cornerRadiusLabel}</span>
                <span className="text-blue-400 font-mono text-[11px]">{cornerRadius}px</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[0, 8, 14, 20].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCornerRadius(r)}
                    className={`py-1 text-xs rounded-lg transition font-medium text-center cursor-pointer ${
                      cornerRadius === r
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {r === 0 ? '0' : `${r}px`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
