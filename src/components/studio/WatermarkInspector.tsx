'use client';

import React from 'react';
import {
  Stamp,
  Type,
  Image as ImageIcon,
  SlidersHorizontal,
  Upload,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { WatermarkConfig } from '@/types/studio';
import { ColorPickerPanel } from './ColorPickerPanel';
import { useI18n } from '@/lib/i18n-context';

interface WatermarkInspectorProps {
  watermarkConfig: WatermarkConfig;
  onUpdateWatermarkConfig: (updates: Partial<WatermarkConfig>) => void;
  onConvertWatermarkToText?: () => void;
}

export const WatermarkInspector: React.FC<WatermarkInspectorProps> = ({
  watermarkConfig,
  onUpdateWatermarkConfig,
  onConvertWatermarkToText,
}) => {
  const { t, locale } = useI18n();

  return (
    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-sm">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Stamp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">{t.studio.watermarkTitle}</span>
            <span className="text-[10px] text-slate-400">
              {watermarkConfig.enabled ? t.studio.watermarkActive : t.studio.watermarkHidden}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onUpdateWatermarkConfig({ enabled: !watermarkConfig.enabled })}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
            watermarkConfig.enabled
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {watermarkConfig.enabled ? t.studio.watermarkOn : t.studio.watermarkOff}
        </button>
      </div>

      {/* Type Switcher: Text vs Image Logo */}
      <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => onUpdateWatermarkConfig({ type: 'text' })}
          className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
            watermarkConfig.type === 'text'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>{t.studio.watermarkModeText}</span>
        </button>
        <button
          type="button"
          onClick={() => onUpdateWatermarkConfig({ type: 'image' })}
          className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
            watermarkConfig.type === 'image'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{t.studio.watermarkModeLogo}</span>
        </button>
      </div>

      {/* Text Mode */}
      {watermarkConfig.type === 'text' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">{t.studio.watermarkContentLabel}</label>
            <input
              type="text"
              value={watermarkConfig.text}
              onChange={(e) => onUpdateWatermarkConfig({ text: e.target.value })}
              placeholder={t.studio.watermarkContentPlaceholder}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Color Picker for text */}
          <div className="pt-2 border-t border-slate-800">
            <ColorPickerPanel
              label={t.studio.watermarkTextColorLabel}
              color={watermarkConfig.color || '#ffffff'}
              onChange={(c) => onUpdateWatermarkConfig({ color: c })}
              iconColorClass="text-amber-400"
              hidePresetSwatches={true}
            />
          </div>
        </div>
      )}

      {/* Image Logo Mode */}
      {watermarkConfig.type === 'image' && (
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            {watermarkConfig.imageSrc ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={watermarkConfig.imageSrc}
                    alt="Logo preview"
                    className="w-12 h-12 object-contain rounded-lg bg-slate-900 border border-slate-700 p-1"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block truncate">
                      {locale === 'vi' ? 'Logo đã sẵn sàng' : 'Logo ready'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {locale === 'vi' ? 'Hiển thị trong suốt trên ảnh' : 'Translucent watermark on canvas'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateWatermarkConfig({ imageSrc: '' })}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                  title={t.studio.removeLogoBtn}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/70 bg-slate-900/50 cursor-pointer transition text-center group">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-400 mb-1.5" />
                <span className="text-xs text-slate-200 font-semibold">{t.studio.uploadLogoBtn}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {locale === 'vi' ? 'Khuyên dùng định dạng PNG trong suốt' : 'Transparent PNG recommended'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        onUpdateWatermarkConfig({ imageSrc: dataUrl });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Position 9-Grid + Tile Pattern */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">{t.studio.watermarkPositionLabel}</span>
          <span className="text-amber-400 font-mono text-[11px] font-semibold">
            {watermarkConfig.position === 'tile-pattern'
              ? t.studio.posTile
              : watermarkConfig.position}
          </span>
        </div>

        {/* Tile Pattern Button */}
        <button
          type="button"
          onClick={() => onUpdateWatermarkConfig({ position: 'tile-pattern' })}
          className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
            watermarkConfig.position === 'tile-pattern'
              ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{locale === 'vi' ? 'Phủ chéo toàn ảnh (Tile Pattern 45°)' : 'Tile Entire Canvas (45° Pattern)'}</span>
        </button>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
          {[
            { id: 'top-left', label: locale === 'vi' ? '↖ Trên trái' : '↖ Top Left' },
            { id: 'top-center', label: locale === 'vi' ? '↑ Trên giữa' : '↑ Top Center' },
            { id: 'top-right', label: locale === 'vi' ? '↗ Trên phải' : '↗ Top Right' },
            { id: 'center-left', label: locale === 'vi' ? '← Giữa trái' : '← Center Left' },
            { id: 'center', label: locale === 'vi' ? '• Chính giữa' : '• Center' },
            { id: 'center-right', label: locale === 'vi' ? '→ Giữa phải' : '→ Center Right' },
            { id: 'bottom-left', label: locale === 'vi' ? '↙ Dưới trái' : '↙ Bottom Left' },
            { id: 'bottom-center', label: locale === 'vi' ? '↓ Dưới giữa' : '↓ Bottom Center' },
            { id: 'bottom-right', label: locale === 'vi' ? '↘ Dưới phải' : '↘ Bottom Right' },
          ].map((pos) => {
            const isSelected = watermarkConfig.position === pos.id;
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => onUpdateWatermarkConfig({ position: pos.id as any })}
                className={`py-1.5 text-xs rounded-lg font-medium transition text-center cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white font-bold shadow-xs ring-1 ring-amber-400/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={pos.label}
              >
                {pos.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Opacity & Size */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800">
        {/* Opacity Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              {t.studio.watermarkOpacityLabel}
            </span>
            <span className="font-mono text-amber-400 font-bold">
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
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Size & Style */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">{t.studio.watermarkSizeLabel}</label>
            <select
              value={watermarkConfig.size}
              onChange={(e) => onUpdateWatermarkConfig({ size: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
            >
              <option value={14}>{locale === 'vi' ? 'Nhỏ (14px)' : 'Small (14px)'}</option>
              <option value={18}>{locale === 'vi' ? 'Vừa (18px)' : 'Medium (18px)'}</option>
              <option value={24}>{locale === 'vi' ? 'Lớn (24px)' : 'Large (24px)'}</option>
              <option value={32}>{locale === 'vi' ? 'Cực lớn (32px)' : 'Extra Large (32px)'}</option>
              <option value={42}>{locale === 'vi' ? 'Siêu lớn (42px)' : 'Huge (42px)'}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">{locale === 'vi' ? 'Phong cách:' : 'Style:'}</label>
            <select
              value={watermarkConfig.style}
              onChange={(e) =>
                onUpdateWatermarkConfig({ style: e.target.value as any })
              }
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
            >
              <option value="pill">{locale === 'vi' ? '🏷️ Nền kính mờ' : '🏷️ Glass Pill'}</option>
              <option value="shadow">{locale === 'vi' ? '👤 Bóng đổ' : '👤 Drop Shadow'}</option>
              <option value="outline">{locale === 'vi' ? '🔲 Nét viền' : '🔲 Outline'}</option>
              <option value="clean">{locale === 'vi' ? '✨ Tối giản' : '✨ Clean'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Convert to Standalone Text Annotation button */}
      {onConvertWatermarkToText && (
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onConvertWatermarkToText}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
            title={locale === 'vi' ? 'Tạo bản sao thành chú thích chữ để có thể kéo thả di chuyển bằng chuột' : 'Duplicate as movable text annotation'}
          >
            <span>{locale === 'vi' ? 'Tạo bản sao thành chữ rời để kéo thả' : 'Convert to floating text layer'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
