'use client';

import React from 'react';
import {
  ArrowUpRight,
  Square,
  Stamp,
  Spline,
  RotateCcw,
  MousePointer,
  Sparkles,
  ChevronDown,
  Type,
  Image as ImageIcon,
  SlidersHorizontal,
  Upload,
  Trash2,
} from 'lucide-react';
import { StudioTool, WatermarkConfig } from '@/types/studio';
import { ColorPickerPanel } from './ColorPickerPanel';
import { useI18n } from '@/lib/i18n-context';

interface ContextualInspectorProps {
  activeTool: StudioTool;
  selectedAnnotation: any | null;
  onUpdateSelectedAnnotation?: (updates: any) => void;

  // Active styles for new annotations per tool
  toolColors: Record<string, string>;
  onUpdateToolColor: (tool: string, color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  arrowStyle: 'straight' | 'curved';
  setArrowStyle: (style: 'straight' | 'curved') => void;
  boxIsDashed: boolean;
  setBoxIsDashed: (dashed: boolean) => void;
  stepCounter: number;
  setStepCounter: (val: number | ((prev: number) => number)) => void;
  textFontSize: number;
  setTextFontSize: (sz: number) => void;
  textHasBackdrop: boolean;
  setTextHasBackdrop: (val: boolean) => void;

  // Professional Watermark config & handlers
  watermarkConfig: WatermarkConfig;
  onUpdateWatermarkConfig: (updates: Partial<WatermarkConfig>) => void;
  onConvertWatermarkToText?: () => void;

  // Collapsible state
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ContextualInspector: React.FC<ContextualInspectorProps> = ({
  activeTool,
  selectedAnnotation,
  onUpdateSelectedAnnotation,
  toolColors,
  onUpdateToolColor,
  strokeWidth,
  setStrokeWidth,
  arrowStyle,
  setArrowStyle,
  boxIsDashed,
  setBoxIsDashed,
  stepCounter,
  setStepCounter,
  textFontSize,
  setTextFontSize,
  textHasBackdrop,
  setTextHasBackdrop,
  watermarkConfig,
  onUpdateWatermarkConfig,
  onConvertWatermarkToText,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { t, locale } = useI18n();

  // If an annotation is actively selected, prioritize inspector for that annotation
  const isEditingExisting = Boolean(selectedAnnotation && (activeTool === 'select' || selectedAnnotation.type === activeTool));
  const effectiveType = isEditingExisting ? selectedAnnotation.type : activeTool;

  // Get Inspector Title & Icon
  const getInspectorHeader = () => {
    if (isEditingExisting) {
      const badgeText = selectedAnnotation.type === 'box'
        ? `${selectedAnnotation.item?.strokeWidth || strokeWidth}px • ${selectedAnnotation.item?.isDashed ? t.studio.dashedBorder : t.studio.solidBorder}`
        : selectedAnnotation.type.toUpperCase();
      return {
        title: t.studio.editSelectedAnnotation,
        badge: badgeText,
        highlight: true,
      };
    }
    switch (activeTool) {
      case 'arrow':
        return {
          title: t.studio.optionsArrow,
          badge: `${strokeWidth}px • ${arrowStyle === 'curved' ? t.studio.badgeCurved : t.studio.badgeStraight}`,
        };
      case 'step':
        return {
          title: t.studio.optionsStep,
          badge: t.studio.badgeNext.replace('{num}', String(stepCounter)),
        };
      case 'box':
        return {
          title: t.studio.optionsBox,
          badge: `${strokeWidth}px • ${boxIsDashed ? t.studio.dashedBorder : t.studio.solidBorder}`,
        };
      case 'blur':
        return { title: t.studio.optionsBlur, badge: t.studio.badgeMosaic };
      case 'text':
        return { title: t.studio.optionsText, badge: `${textFontSize}px` };
      case 'spotlight':
        return { title: t.studio.optionsSpotlight, badge: t.studio.badgeLighting };
      case 'watermark':
        return {
          title: t.studio.optionsWatermark,
          badge: watermarkConfig.enabled
            ? (watermarkConfig.position === 'tile-pattern' ? t.studio.badgeTile45 : watermarkConfig.position)
            : t.studio.badgeDisabled,
        };
      case 'crop':
        return { title: t.studio.optionsCrop, badge: 'Crop' };
      default:
        return { title: t.studio.optionsDefault, badge: locale === 'vi' ? 'Mặc định' : 'Default' };
    }
  };

  const header = getInspectorHeader();

  // Helper to change color (updates tool default and selected item)
  const handleColorChange = (c: string) => {
    onUpdateToolColor(effectiveType, c);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ color: c });
    }
  };

  // Helper to change stroke width
  const handleStrokeChange = (w: number) => {
    setStrokeWidth(w);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ width: w, strokeWidth: w });
    }
  };

  // Helper to change dashed style for box
  const handleDashedChange = (dashed: boolean) => {
    setBoxIsDashed(dashed);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ isDashed: dashed });
    }
  };

  // Helper to change arrow style
  const handleArrowStyleChange = (style: 'straight' | 'curved') => {
    setArrowStyle(style);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ isCurved: style === 'curved' });
    }
  };

  // Helper to change font size
  const handleFontSizeChange = (sz: number) => {
    setTextFontSize(sz);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ fontSize: sz });
    }
  };

  // Helper to change text backdrop
  const handleBackdropToggle = (val: boolean) => {
    setTextHasBackdrop(val);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ hasBackdrop: val });
    }
  };

  return (
    <div
      className={`p-3 rounded-xl bg-slate-900 border transition ${
        header.highlight
          ? 'border-blue-500/70 shadow-md ring-1 ring-blue-500/30'
          : activeTool === 'watermark'
          ? 'border-amber-500/40'
          : 'border-slate-800'
      } space-y-3`}
    >
      {/* Header with Title, Badge & Collapse Toggle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between group cursor-pointer text-left select-none"
      >
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition ${
            header.highlight
              ? 'text-sky-400'
              : activeTool === 'watermark'
              ? 'text-amber-400'
              : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          {header.highlight ? <MousePointer className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{header.title}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {isCollapsed && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                header.highlight
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {header.badge}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
              isCollapsed ? '-rotate-90' : 'rotate-0'
            }`}
          />
        </div>
      </button>

      {!isCollapsed && (
        <div className="space-y-3 pt-0.5 animate-in fade-in duration-150">
          {/* ============================================================ */}
          {/* CASE 1: ARROW (Mũi tên)                                      */}
          {/* ============================================================ */}
          {effectiveType === 'arrow' && (
            <>
              <ColorPickerPanel
                label={locale === 'vi' ? 'Màu sắc mũi tên' : 'Arrow Color'}
                color={
                  isEditingExisting
                    ? selectedAnnotation.item?.color || '#ef4444'
                    : toolColors.arrow || '#ef4444'
                }
                onChange={handleColorChange}
                iconColorClass="text-blue-400"
              />

              {/* Stroke Thickness */}
              <div className="space-y-1 pt-1.5 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>{t.studio.strokeWidthLabel}</span>
                  <span className="font-mono text-blue-400">
                    {isEditingExisting ? selectedAnnotation.item?.width || 4 : strokeWidth}px
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[2, 4, 6, 8].map((w) => {
                    const currentW = isEditingExisting ? selectedAnnotation.item?.width || 4 : strokeWidth;
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleStrokeChange(w)}
                        className={`py-1 text-xs rounded font-medium transition text-center cursor-pointer ${
                          currentW === w
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {w}px
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Arrow Style */}
              <div className="space-y-1 pt-1.5 border-t border-slate-800">
                <span className="text-[11px] text-slate-300 block">{t.studio.arrowStyleLabel}</span>
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleArrowStyleChange('curved')}
                    className={`py-1 rounded font-medium flex items-center justify-center gap-1 transition cursor-pointer ${
                      (isEditingExisting ? selectedAnnotation.item?.isCurved : arrowStyle === 'curved')
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Spline className="w-3 h-3" />
                    <span>{t.studio.arrowCurved}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArrowStyleChange('straight')}
                    className={`py-1 rounded font-medium flex items-center justify-center gap-1 transition cursor-pointer ${
                      !(isEditingExisting ? selectedAnnotation.item?.isCurved : arrowStyle === 'curved')
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    <span>{t.studio.arrowStraight}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* CASE 2: STEP BADGE (Số bước)                                 */}
          {/* ============================================================ */}
          {effectiveType === 'step' && (
            <>
              <ColorPickerPanel
                label={locale === 'vi' ? 'Màu huy hiệu bước' : 'Step Badge Color'}
                color={
                  isEditingExisting
                    ? selectedAnnotation.item?.color || '#ef4444'
                    : toolColors.step || '#ef4444'
                }
                onChange={handleColorChange}
                iconColorClass="text-blue-400"
              />

              {/* Step Counter Controls */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{isEditingExisting ? (locale === 'vi' ? 'Số thứ tự của bước:' : 'Step Number:') : (locale === 'vi' ? 'Số bước kế tiếp:' : 'Next Step Number:')}</span>
                  <span
                    className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow-xs"
                    style={{
                      backgroundColor: isEditingExisting ? selectedAnnotation.item?.color : (toolColors.step || '#ef4444'),
                    }}
                  >
                    {isEditingExisting ? selectedAnnotation.item?.num : stepCounter}
                  </span>
                </div>

                {!isEditingExisting && (
                  <button
                    type="button"
                    onClick={() => setStepCounter(1)}
                    className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={locale === 'vi' ? 'Đặt lại số thứ tự đánh dấu bắt đầu từ 1' : 'Reset step sequence back to 1'}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.studio.resetStepToOne}</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* CASE 3: BOX (Khoanh viền)                                     */}
          {/* ============================================================ */}
          {effectiveType === 'box' && (
            <>
              <ColorPickerPanel
                label={locale === 'vi' ? 'Màu viền khung' : 'Box Outline Color'}
                color={
                  isEditingExisting
                    ? selectedAnnotation.item?.color || '#ef4444'
                    : toolColors.box || '#ef4444'
                }
                onChange={handleColorChange}
                iconColorClass="text-blue-400"
              />

              {/* Stroke Thickness */}
              <div className="space-y-1 pt-1.5 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>{t.studio.strokeWidthLabel}</span>
                  <span className="font-mono text-blue-400">
                    {isEditingExisting ? selectedAnnotation.item?.strokeWidth || 4 : strokeWidth}px
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[2, 4, 6, 8].map((w) => {
                    const currentW = isEditingExisting ? selectedAnnotation.item?.strokeWidth || 4 : strokeWidth;
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleStrokeChange(w)}
                        className={`py-1 text-xs rounded font-medium transition text-center cursor-pointer ${
                          currentW === w
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {w}px
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style Dashed / Solid */}
              <div className="space-y-1 pt-1.5 border-t border-slate-800">
                <span className="text-[11px] text-slate-300 block">{t.studio.boxBorderStyleLabel}</span>
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleDashedChange(false)}
                    className={`py-1 rounded font-medium transition cursor-pointer ${
                      !(isEditingExisting ? selectedAnnotation.item?.isDashed : boxIsDashed)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.studio.solidBorder}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDashedChange(true)}
                    className={`py-1 rounded font-medium transition cursor-pointer ${
                      (isEditingExisting ? selectedAnnotation.item?.isDashed : boxIsDashed)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.studio.dashedBorder}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* CASE 4: BLUR (Che mờ) - NO COLOR PALETTE!                    */}
          {/* ============================================================ */}
          {effectiveType === 'blur' && (
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                  <Square className="w-3.5 h-3.5" />
                  <span>{locale === 'vi' ? 'Vùng che mờ bảo mật' : 'Security Blur Area'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {locale === 'vi'
                    ? 'Kéo thả chuột trên ảnh để che các dữ liệu nhạy cảm (email, mật khẩu, số tài khoản, khuôn mặt).'
                    : 'Drag and draw on canvas to obscure sensitive information (emails, passwords, accounts, faces).'}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 italic text-center">
                {locale === 'vi'
                  ? '💡 Công cụ này sử dụng thuật toán Pixelate che giấu thông tin hoàn hảo không thể phục hồi.'
                  : '💡 Utilizes irreversibly pixelated redaction algorithm.'}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* CASE 5: TEXT (Chèn chữ)                                      */}
          {/* ============================================================ */}
          {effectiveType === 'text' && (
            <>
              <ColorPickerPanel
                label={locale === 'vi' ? 'Màu chữ' : 'Text Color'}
                color={
                  isEditingExisting
                    ? selectedAnnotation.item?.color || '#ffffff'
                    : toolColors.text || '#ffffff'
                }
                onChange={handleColorChange}
                iconColorClass="text-amber-400"
              />

              {/* Font Size */}
              <div className="space-y-1 pt-1.5 border-t border-slate-800">
                <span className="text-[11px] text-slate-300 block">{t.studio.fontSizeLabel}</span>
                <div className="grid grid-cols-4 gap-1">
                  {[14, 16, 20, 26].map((sz) => {
                    const currentSz = isEditingExisting ? selectedAnnotation.item?.fontSize || 16 : textFontSize;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleFontSizeChange(sz)}
                        className={`py-1 text-xs rounded font-medium transition text-center cursor-pointer ${
                          currentSz === sz
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Backdrop Pill Toggle */}
              <div className="pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    handleBackdropToggle(
                      isEditingExisting ? !selectedAnnotation.item?.hasBackdrop : !textHasBackdrop
                    )
                  }
                  className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-medium text-center transition border cursor-pointer ${
                    (isEditingExisting ? selectedAnnotation.item?.hasBackdrop : textHasBackdrop)
                      ? 'bg-blue-950/40 border-blue-500/50 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {(isEditingExisting ? selectedAnnotation.item?.hasBackdrop : textHasBackdrop)
                    ? (locale === 'vi' ? '🏷️ Nền pill tương phản: BẬT' : '🏷️ Pill Badge: ON')
                    : (locale === 'vi' ? 'Chữ trần (Không nền)' : 'Plain Text (No Backdrop)')}
                </button>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* CASE 6: SPOTLIGHT (Chiếu sáng)                                */}
          {/* ============================================================ */}
          {effectiveType === 'spotlight' && (
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{locale === 'vi' ? 'Vùng Spotlight chiếu sáng' : 'Spotlight Focus Area'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {locale === 'vi'
                    ? 'Kéo thả chuột để tạo vùng chiếu sáng làm nổi bật nút bấm, menu hay đoạn văn bản quan trọng. Các vùng xung quanh sẽ tự động được phủ mờ tối.'
                    : 'Drag to highlight important buttons, menus, or text. Surrounding areas will be automatically dimmed.'}
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* CASE 7: WATERMARK (Đóng dấu bản quyền)                       */}
          {/* ============================================================ */}
          {effectiveType === 'watermark' && (
            <div className="space-y-3">
              {/* Toggle Enable / Disable */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Stamp className={`w-4 h-4 ${watermarkConfig.enabled ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{t.studio.watermarkTitle}</span>
                    <span className="text-[10px] text-slate-400">
                      {watermarkConfig.enabled ? t.studio.watermarkActive : t.studio.watermarkHidden}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateWatermarkConfig({ enabled: !watermarkConfig.enabled })}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    watermarkConfig.enabled
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {watermarkConfig.enabled ? t.studio.watermarkOn : t.studio.watermarkOff}
                </button>
              </div>

              {/* Type Switcher: Văn bản vs Logo ảnh */}
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => onUpdateWatermarkConfig({ type: 'text' })}
                  className={`py-1.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
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
                  className={`py-1.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    watermarkConfig.type === 'image'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{t.studio.watermarkModeLogo}</span>
                </button>
              </div>

              {/* Text Mode Controls */}
              {watermarkConfig.type === 'text' && (
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">{t.studio.watermarkContentLabel}</label>
                    <input
                      type="text"
                      value={watermarkConfig.text}
                      onChange={(e) => onUpdateWatermarkConfig({ text: e.target.value })}
                      placeholder={t.studio.watermarkContentPlaceholder}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Color Picker for text */}
                  <div className="pt-1.5 border-t border-slate-800">
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

              {/* Image Mode Controls */}
              {watermarkConfig.type === 'image' && (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    {watermarkConfig.imageSrc ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={watermarkConfig.imageSrc}
                            alt="Logo preview"
                            className="w-10 h-10 object-contain rounded bg-slate-900 border border-slate-700 p-0.5"
                          />
                          <span className="text-[11px] text-slate-300 truncate">
                            {locale === 'vi' ? 'Logo đã tải lên' : 'Uploaded logo'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onUpdateWatermarkConfig({ imageSrc: '' })}
                          className="p-1 rounded hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                          title={t.studio.removeLogoBtn}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-slate-700 hover:border-amber-500/70 bg-slate-900/50 cursor-pointer transition text-center group">
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-amber-400 mb-1" />
                        <span className="text-xs text-slate-300 font-medium">{t.studio.uploadLogoBtn}</span>
                        <span className="text-[10px] text-slate-500">
                          {locale === 'vi' ? 'Khuyên dùng PNG trong suốt' : 'Transparent PNG recommended'}
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

              {/* Position: 9-Grid + Tile Pattern */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium">{t.studio.watermarkPositionLabel}</span>
                  <span className="text-amber-400 font-mono text-[10px]">
                    {watermarkConfig.position === 'tile-pattern'
                      ? t.studio.posTile
                      : watermarkConfig.position}
                  </span>
                </div>

                {/* Tile Pattern Button */}
                <button
                  type="button"
                  onClick={() => onUpdateWatermarkConfig({ position: 'tile-pattern' })}
                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                    watermarkConfig.position === 'tile-pattern'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{locale === 'vi' ? 'Phủ chéo toàn ảnh (Tile Pattern 45°)' : 'Tile Entire Canvas (45° Pattern)'}</span>
                </button>

                {/* 3x3 Grid */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
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
                        className={`py-1 text-[10px] rounded font-medium transition text-center cursor-pointer ${
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
              <div className="space-y-2 pt-1.5 border-t border-slate-800">
                {/* Opacity Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                      {t.studio.watermarkOpacityLabel}
                    </span>
                    <span className="font-mono text-amber-400">
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
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
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
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="pill">{locale === 'vi' ? '🏷️ Nền kính mờ' : '🏷️ Glass Pill'}</option>
                      <option value="shadow">{locale === 'vi' ? '👤 Bóng đổ' : '👤 Drop Shadow'}</option>
                      <option value="outline">{locale === 'vi' ? '🔲 Nét viền' : '🔲 Outline'}</option>
                      <option value="clean">{locale === 'vi' ? '✨ Tối giản' : '✨ Clean'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Button: Convert to standalone annotation */}
              {onConvertWatermarkToText && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onConvertWatermarkToText}
                    className="w-full py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title={locale === 'vi' ? 'Chuyển lớp đóng dấu thành chú thích chữ để có thể kéo thả di chuyển bằng chuột' : 'Duplicate as movable text annotation'}
                  >
                    <span>{locale === 'vi' ? 'Tạo bản sao thành chữ rời' : 'Convert to floating text layer'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* CASE 8: SELECT (Khi không chọn annotation nào)               */}
          {/* ============================================================ */}
          {effectiveType === 'select' && !selectedAnnotation && (
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-400">
              <p className="font-medium text-slate-300">
                {locale === 'vi' ? '💡 Chế độ Chọn & Di chuyển' : '💡 Select & Move Mode'}
              </p>
              <p className="text-[11px] leading-relaxed">
                {locale === 'vi'
                  ? 'Click trực tiếp vào một chú thích bất kỳ trên ảnh để kéo di chuyển hoặc tùy chỉnh lại màu sắc, nét vẽ ngay tại đây.'
                  : 'Click directly on any annotation on canvas to drag and move or customize its colors and strokes here.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
