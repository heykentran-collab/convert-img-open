'use client';

import React, { useState, useRef } from 'react';
import {
  Stamp,
  Type,
  Image as ImageIcon,
  SlidersHorizontal,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { WatermarkConfig } from '@/types/studio';
import { ColorPickerPanel } from '@/components/studio/ColorPickerPanel';
import { WatermarkCanvasOverlay } from './WatermarkCanvasOverlay';
import { useI18n } from '@/lib/i18n-context';

interface WatermarkControlProps {
  watermarkConfig: WatermarkConfig;
  onUpdateWatermarkConfig: (updates: Partial<WatermarkConfig>) => void;
  sampleImageSrc?: string;
  logoImg?: HTMLImageElement | null;
}

export const WatermarkControl: React.FC<WatermarkControlProps> = ({
  watermarkConfig,
  onUpdateWatermarkConfig,
  sampleImageSrc,
  logoImg,
}) => {
  const { t, locale } = useI18n();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onUpdateWatermarkConfig({
        type: 'image',
        imageSrc: result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    onUpdateWatermarkConfig({
      imageSrc: undefined,
      type: 'text',
    });
  };

  const positions = [
    { id: 'top-left', label: locale === 'vi' ? '↖ Trái' : '↖ TL' },
    { id: 'top-center', label: locale === 'vi' ? '↑ Giữa' : '↑ TC' },
    { id: 'top-right', label: locale === 'vi' ? '↗ Phải' : '↗ TR' },
    { id: 'center-left', label: locale === 'vi' ? '← Trái' : '← CL' },
    { id: 'center', label: locale === 'vi' ? '• Giữa' : '• Mid' },
    { id: 'center-right', label: locale === 'vi' ? '→ Phải' : '→ CR' },
    { id: 'bottom-left', label: locale === 'vi' ? '↙ Trái' : '↙ BL' },
    { id: 'bottom-center', label: locale === 'vi' ? '↓ Giữa' : '↓ BC' },
    { id: 'bottom-right', label: locale === 'vi' ? '↘ Phải' : '↘ BR' },
  ];

  return (
    <div className="pt-2.5 border-t border-slate-800/80">
      {/* Header Bar with Toggle Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Stamp className={`w-3.5 h-3.5 ${watermarkConfig.enabled ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            {t.converter.watermarkTitle}
          </span>
          {watermarkConfig.enabled && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {t.converter.watermarkActiveBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateWatermarkConfig({ enabled: !watermarkConfig.enabled })}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              watermarkConfig.enabled
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {watermarkConfig.enabled ? t.studio.watermarkOn : t.studio.watermarkOff}
          </button>

          {watermarkConfig.enabled && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={t.converter.watermarkConfigBtn}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Summary Tag when collapsed but enabled */}
      {watermarkConfig.enabled && !isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          className="mt-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 hover:border-slate-700 cursor-pointer flex items-center justify-between transition"
        >
          <div className="flex items-center gap-2 truncate">
            {watermarkConfig.type === 'image' && watermarkConfig.imageSrc ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Logo ảnh
              </span>
            ) : (
              <span className="text-amber-300 font-medium truncate">
                "{watermarkConfig.text || '© Volticen'}"
              </span>
            )}
            <span className="text-slate-500 text-[10px]">
              • {watermarkConfig.position === 'tile-pattern' ? 'Lặp 45°' : watermarkConfig.position}
            </span>
            <span className="text-slate-500 text-[10px]">
              • {Math.round((watermarkConfig.opacity ?? 0.75) * 100)}%
            </span>
          </div>
          <span className="text-[10px] text-blue-400 hover:underline shrink-0">
            {locale === 'vi' ? 'Sửa' : 'Edit'}
          </span>
        </div>
      )}

      {/* Expanded Setting Panel */}
      {watermarkConfig.enabled && isExpanded && (
        <div className="mt-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 animate-in fade-in">
          {/* Live Mini Preview Canvas Box */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {t.converter.watermarkLivePreviewLabel}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {t.converter.watermarkSampleImageBadge}
              </span>
            </div>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
              {sampleImageSrc ? (
                <img
                  src={sampleImageSrc}
                  alt="Sample preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
                  <div className="w-16 h-12 rounded border border-dashed border-slate-800 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-slate-700" />
                  </div>
                </div>
              )}
              {/* Real-time Watermark Canvas Overlay */}
              <WatermarkCanvasOverlay
                watermarkConfig={watermarkConfig}
                logoImg={logoImg}
                width={320}
                height={180}
              />
            </div>
          </div>

          {/* Mode Tabs: Text vs Image */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => onUpdateWatermarkConfig({ type: 'text' })}
              className={`py-1.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                watermarkConfig.type === 'text'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-3 h-3" />
              <span>{t.studio.watermarkModeText}</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateWatermarkConfig({ type: 'image' })}
              className={`py-1.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                watermarkConfig.type === 'image'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>{t.studio.watermarkModeLogo}</span>
            </button>
          </div>

          {/* Hidden File Input for Logo upload - always kept outside to avoid reconciliation issues */}
          <input
            key="watermark-file-input"
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleLogoUpload}
            className="hidden"
          />

          {/* Text Input & Color */}
          {watermarkConfig.type === 'text' ? (
            <div key="watermark-mode-text" className="space-y-2">
              <input
                key="watermark-text-input"
                type="text"
                value={watermarkConfig.text ?? ''}
                onChange={(e) => onUpdateWatermarkConfig({ text: e.target.value })}
                placeholder={t.converter.watermarkTextPlaceholder}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <ColorPickerPanel
                label={t.studio.watermarkTextColorLabel}
                color={watermarkConfig.color ?? '#ffffff'}
                onChange={(c) => onUpdateWatermarkConfig({ color: c })}
                compactSwatches={true}
                iconColorClass="text-amber-400"
              />
            </div>
          ) : (
            /* Image Logo Mode */
            <div key="watermark-mode-image" className="space-y-2">
              {watermarkConfig.imageSrc ? (
                <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={watermarkConfig.imageSrc}
                      alt="Logo watermark"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-slate-200 block truncate">Logo watermark PNG</span>
                    <span className="text-[10px] text-slate-400">Đã nạp sẵn sàng</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="p-1 text-slate-400 hover:text-red-400 transition"
                    title={t.studio.removeLogoBtn}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-amber-500/80 rounded-lg bg-slate-950/50 hover:bg-slate-950 text-xs text-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.studio.uploadLogoBtn}</span>
                </button>
              )}
            </div>
          )}

          {/* Position Selector (9-Grid + Tile) */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-slate-400 font-medium">
                {t.converter.watermarkPosTitle}
              </label>
              <button
                type="button"
                onClick={() => onUpdateWatermarkConfig({ position: 'tile-pattern' })}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                  watermarkConfig.position === 'tile-pattern'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.studio.posTile}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              {positions.map((pos) => {
                const isSelected = watermarkConfig.position === pos.id;
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => onUpdateWatermarkConfig({ position: pos.id as any })}
                    className={`py-1 text-[11px] rounded font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {pos.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opacity & Size */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            {/* Opacity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                  {t.studio.watermarkOpacityLabel}
                </span>
                <span className="font-mono text-amber-400 font-bold text-xs">
                  {Math.round((watermarkConfig.opacity ?? 0.75) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={Math.round((watermarkConfig.opacity ?? 0.75) * 100)}
                onChange={(e) =>
                  onUpdateWatermarkConfig({ opacity: Number(e.target.value) / 100 })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Size Slider & Custom Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Type className="w-3 h-3 text-slate-400" />
                  {watermarkConfig.type === 'image'
                    ? (locale === 'vi' ? 'Chiều cao logo (px):' : 'Logo height (px):')
                    : (locale === 'vi' ? 'Cỡ chữ (px):' : 'Font size (px):')}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={watermarkConfig.type === 'image' ? 16 : 10}
                    max={watermarkConfig.type === 'image' ? 300 : 120}
                    value={watermarkConfig.size ?? 20}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        onUpdateWatermarkConfig({ size: Math.max(8, val) });
                      }
                    }}
                    className="w-12 px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-center font-mono text-amber-400 font-bold text-xs focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">px</span>
                </div>
              </div>
              <input
                type="range"
                min={watermarkConfig.type === 'image' ? 16 : 10}
                max={watermarkConfig.type === 'image' ? 240 : 80}
                step={2}
                value={watermarkConfig.size ?? 20}
                onChange={(e) =>
                  onUpdateWatermarkConfig({ size: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Style Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-medium">
                {locale === 'vi' ? 'Phong cách hiển thị:' : 'Display style:'}
              </label>
              <select
                value={watermarkConfig.style ?? 'pill'}
                onChange={(e) => onUpdateWatermarkConfig({ style: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="pill">{locale === 'vi' ? '🏷️ Nền mờ (Glass Pill)' : '🏷️ Glass Pill'}</option>
                <option value="shadow">{locale === 'vi' ? '👤 Đổ bóng (Drop Shadow)' : '👤 Drop Shadow'}</option>
                <option value="outline">{locale === 'vi' ? '🔲 Nét viền tương phản (Outline)' : '🔲 Outline'}</option>
                <option value="clean">{locale === 'vi' ? '✨ Tối giản tự nhiên (Clean)' : '✨ Clean'}</option>
              </select>
            </div>

            {/* Hint Notice */}
            <p className="text-[10px] text-slate-500 italic pt-0.5">
              💡 {t.converter.watermarkAutoScaled}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
