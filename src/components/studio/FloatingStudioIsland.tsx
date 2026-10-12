'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MousePointer,
  ArrowUpRight,
  Square,
  EyeOff,
  Type,
  Focus,
  Crop,
  Stamp,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Spline,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Trash2,
  Pipette,
} from 'lucide-react';
import { StudioTool, CropRatio, WatermarkConfig } from '@/types/studio';
import { useI18n } from '@/lib/i18n-context';

const QUICK_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#0f172a', // Black
];

interface FloatingStudioIslandProps {
  activeTool: StudioTool;
  setActiveTool: (tool: StudioTool) => void;
  selectedAnnotation: any | null;
  onUpdateSelectedAnnotation?: (updates: any) => void;

  // Active styles for annotations
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

  // Watermark
  watermarkConfig: WatermarkConfig;
  onUpdateWatermarkConfig: (updates: Partial<WatermarkConfig>) => void;
  onOpenWatermarkTab: () => void;

  // Crop controls
  cropRatio: CropRatio;
  onSelectCropRatio: (ratio: CropRatio) => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  hasCropRect: boolean;

  // Quick Transforms
  onRotate90: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  disabledTransforms: boolean;

  // Delete active
  onDeleteSelected?: () => void;
}

export const FloatingStudioIsland: React.FC<FloatingStudioIslandProps> = ({
  activeTool,
  setActiveTool,
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
  onOpenWatermarkTab,
  cropRatio,
  onSelectCropRatio,
  onApplyCrop,
  onCancelCrop,
  hasCropRect,
  onRotate90,
  onFlipHorizontal,
  onFlipVertical,
  disabledTransforms,
  onDeleteSelected,
}) => {
  const { t, locale } = useI18n();
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [hasEyeDropper, setHasEyeDropper] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      setHasEyeDropper(true);
    }
  }, []);

  const isEditingExisting = Boolean(selectedAnnotation && (activeTool === 'select' || selectedAnnotation.type === activeTool));
  const effectiveType = isEditingExisting ? selectedAnnotation.type : activeTool;

  const currentColor = isEditingExisting
    ? selectedAnnotation.item?.color || '#ef4444'
    : (toolColors[effectiveType] || '#ef4444');

  const handleColorChange = (c: string) => {
    onUpdateToolColor(effectiveType, c);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ color: c });
    }
  };

  const handleStrokeChange = (w: number) => {
    setStrokeWidth(w);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ width: w, strokeWidth: w });
    }
  };

  const handleArrowStyleChange = (style: 'straight' | 'curved') => {
    setArrowStyle(style);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ isCurved: style === 'curved' });
    }
  };

  const handleDashedChange = (dashed: boolean) => {
    setBoxIsDashed(dashed);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ isDashed: dashed });
    }
  };

  const handleFontSizeChange = (sz: number) => {
    setTextFontSize(sz);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ fontSize: sz });
    }
  };

  const handleBackdropToggle = (val: boolean) => {
    setTextHasBackdrop(val);
    if (isEditingExisting && onUpdateSelectedAnnotation) {
      onUpdateSelectedAnnotation({ hasBackdrop: val });
    }
  };

  const handleEyeDropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          handleColorChange(result.sRGBHex);
        }
      } catch {
        // user cancelled
      }
    }
  };

  const hasOptions =
    isEditingExisting ||
    (effectiveType !== 'select' && effectiveType !== 'blur' && effectiveType !== 'spotlight');

  return (
    <div className="w-full flex flex-col items-center gap-2 select-none">
      {/* ========================================================================= */}
      {/* ROW 1: PRIMARY FLOATING ISLAND TOOLBAR                                    */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl p-1.5 flex flex-wrap items-center justify-center gap-1 max-w-full">
        {/* 1. SELECT */}
        <button
          type="button"
          onClick={() => setActiveTool('select')}
          className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeTool === 'select'
              ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={t.studio.toolSelectDesc}
        >
          <MousePointer className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">{t.studio.toolSelect}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/30 opacity-75">V</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

        {/* 2. STEP BADGE */}
        <button
          type="button"
          onClick={() => setActiveTool('step')}
          className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            activeTool === 'step'
              ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={t.studio.toolStepDesc}
        >
          <div
            className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
            style={{ backgroundColor: toolColors.step || '#ef4444' }}
          >
            {stepCounter}
          </div>
          <span className="hidden sm:inline">{locale === 'vi' ? 'Bước' : 'Step'}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/30 opacity-75">S</span>
        </button>

        {/* 3. ARROW */}
        <button
          type="button"
          onClick={() => setActiveTool('arrow')}
          className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            activeTool === 'arrow'
              ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={t.studio.toolArrowDesc}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
          <span className="hidden sm:inline">{t.studio.toolArrow}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/30 opacity-75">A</span>
        </button>

        {/* 4. BOX */}
        <button
          type="button"
          onClick={() => setActiveTool('box')}
          className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            activeTool === 'box'
              ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={t.studio.toolBoxDesc}
        >
          <Square className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">{t.studio.toolBox}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/30 opacity-75">B</span>
        </button>

        {/* 5. BLUR */}
        <button
          type="button"
          onClick={() => setActiveTool('blur')}
          className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            activeTool === 'blur'
              ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={t.studio.toolBlurDesc}
        >
          <EyeOff className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline">{t.studio.toolBlur}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/30 opacity-75">M</span>
        </button>

        {/* 6. TEXT */}
        <button
          type="button"
          onClick={() => setActiveTool('text')}
          className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            activeTool === 'text'
              ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={t.studio.toolTextDesc}
        >
          <Type className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">{t.studio.toolText}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/30 opacity-75">T</span>
        </button>

        {/* 7. SPOTLIGHT */}
        <button
          type="button"
          onClick={() => setActiveTool('spotlight')}
          className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            activeTool === 'spotlight'
              ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={t.studio.toolSpotlightDesc}
        >
          <Focus className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">{t.studio.toolSpotlight}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/30 opacity-75">F</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

        {/* 8. CROP */}
        <button
          type="button"
          onClick={() => setActiveTool('crop')}
          className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            activeTool === 'crop'
              ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={t.studio.toolCropDesc}
        >
          <Crop className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">{t.studio.toolCrop}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/30 opacity-75">C</span>
        </button>

        {/* 9. WATERMARK */}
        <button
          type="button"
          onClick={() => setActiveTool('watermark')}
          className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            activeTool === 'watermark'
              ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400/50'
              : watermarkConfig.enabled
              ? 'text-amber-300 hover:bg-slate-800'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={t.studio.toolWatermarkDesc}
        >
          <Stamp className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">{t.studio.toolWatermark}</span>
          {watermarkConfig.enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <span className="text-[10px] font-mono px-1 rounded bg-black/30 opacity-75">W</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

        {/* QUICK TRANSFORMS (ROTATE & FLIP) */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onRotate90}
            disabled={disabledTransforms}
            className="w-8 h-9 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
            title={t.studio.rotate90Desc}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onFlipHorizontal}
            disabled={disabledTransforms}
            className="w-8 h-9 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
            title={t.studio.flipHDesc}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onFlipVertical}
            disabled={disabledTransforms}
            className="w-8 h-9 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
            title={t.studio.flipVDesc}
          >
            <FlipVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: CONTEXTUAL OPTIONS STRIP (FIXED HEIGHT CONTAINER TO PREVENT SHIFT) */}
      {/* ========================================================================= */}
      <div className="w-full min-h-[40px] flex items-center justify-center">
        {hasOptions && (
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl rounded-xl px-3 py-1.5 flex flex-wrap items-center justify-center gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Active Item Indicator (if editing existing annotation) */}
          {isEditingExisting && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-500/40 text-blue-300 font-semibold text-[11px]">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>{locale === 'vi' ? `Đang sửa ${effectiveType}` : `Editing ${effectiveType}`}</span>
            </div>
          )}

          {/* COLOR PICKER (FOR ARROW, STEP, BOX, TEXT) */}
          {(effectiveType === 'arrow' || effectiveType === 'step' || effectiveType === 'box' || effectiveType === 'text') && (
            <div className="flex items-center gap-1.5 relative">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">{locale === 'vi' ? 'Màu:' : 'Color:'}</span>
              <div className="flex items-center gap-1">
                {QUICK_COLORS.slice(0, 7).map((c) => {
                  const isSelected = currentColor?.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorChange(c)}
                      className={`w-5 h-5 rounded-full transition cursor-pointer ${
                        isSelected ? 'ring-2 ring-white scale-110 shadow-sm' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  );
                })}

                {/* Native Picker Trigger */}
                <div className="relative flex items-center ml-0.5">
                  <button
                    type="button"
                    onClick={() => colorInputRef.current?.click()}
                    className="w-5 h-5 rounded-full border border-white/40 shadow-xs cursor-pointer hover:scale-110 transition flex items-center justify-center"
                    style={{
                      background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                    }}
                    title={t.studio.openColorPaletteTooltip}
                  />
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#ef4444'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>

                {/* EyeDropper button */}
                {hasEyeDropper && (
                  <button
                    type="button"
                    onClick={handleEyeDropper}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    title={t.studio.eyeDropperTooltip}
                  >
                    <Pipette className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* OPTIONS SPECIFIC TO: ARROW                                */}
          {/* ========================================================= */}
          {effectiveType === 'arrow' && (
            <>
              <div className="w-[1px] h-4 bg-slate-800" />
              {/* Stroke Width */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-medium">{locale === 'vi' ? 'Độ dày:' : 'Width:'}</span>
                {[2, 4, 6, 8].map((w) => {
                  const currentW = isEditingExisting ? selectedAnnotation.item?.width || 4 : strokeWidth;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleStrokeChange(w)}
                      className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition cursor-pointer ${
                        currentW === w
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {w}px
                    </button>
                  );
                })}
              </div>

              <div className="w-[1px] h-4 bg-slate-800" />
              {/* Arrow Style */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleArrowStyleChange('curved')}
                  className={`px-2 py-0.5 text-[10px] rounded font-medium flex items-center gap-1 transition cursor-pointer ${
                    (isEditingExisting ? selectedAnnotation.item?.isCurved : arrowStyle === 'curved')
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Spline className="w-3 h-3" />
                  <span>{t.studio.badgeCurved}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleArrowStyleChange('straight')}
                  className={`px-2 py-0.5 text-[10px] rounded font-medium flex items-center gap-1 transition cursor-pointer ${
                    !(isEditingExisting ? selectedAnnotation.item?.isCurved : arrowStyle === 'curved')
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{t.studio.badgeStraight}</span>
                </button>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* OPTIONS SPECIFIC TO: STEP BADGE                           */}
          {/* ========================================================= */}
          {effectiveType === 'step' && (
            <>
              <div className="w-[1px] h-4 bg-slate-800" />
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-300">
                  {isEditingExisting ? (locale === 'vi' ? 'Số bước:' : 'Step #:') : (locale === 'vi' ? 'Bước kế tiếp:' : 'Next step:')}
                </span>
                <span
                  className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: currentColor }}
                >
                  {isEditingExisting ? selectedAnnotation.item?.num : stepCounter}
                </span>

                {!isEditingExisting && (
                  <button
                    type="button"
                    onClick={() => setStepCounter(1)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1 transition cursor-pointer"
                    title={locale === 'vi' ? 'Đặt lại số bắt đầu từ ①' : 'Reset number starting from ①'}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.studio.resetStepToOne}</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* OPTIONS SPECIFIC TO: BOX                                  */}
          {/* ========================================================= */}
          {effectiveType === 'box' && (
            <>
              <div className="w-[1px] h-4 bg-slate-800" />
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-medium">{locale === 'vi' ? 'Viền:' : 'Stroke:'}</span>
                {[2, 4, 6, 8].map((w) => {
                  const currentW = isEditingExisting ? selectedAnnotation.item?.strokeWidth || 4 : strokeWidth;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleStrokeChange(w)}
                      className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition cursor-pointer ${
                        currentW === w
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {w}px
                    </button>
                  );
                })}
              </div>

              <div className="w-[1px] h-4 bg-slate-800" />
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDashedChange(false)}
                  className={`px-2 py-0.5 text-[10px] rounded font-medium transition cursor-pointer ${
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
                  className={`px-2 py-0.5 text-[10px] rounded font-medium transition cursor-pointer ${
                    (isEditingExisting ? selectedAnnotation.item?.isDashed : boxIsDashed)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.studio.dashedBorder}
                </button>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* OPTIONS SPECIFIC TO: TEXT                                 */}
          {/* ========================================================= */}
          {effectiveType === 'text' && (
            <>
              <div className="w-[1px] h-4 bg-slate-800" />
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-medium">{t.studio.fontSizeLabelShort}</span>
                {[14, 16, 20, 26].map((sz) => {
                  const currentSz = isEditingExisting ? selectedAnnotation.item?.fontSize || 16 : textFontSize;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleFontSizeChange(sz)}
                      className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition cursor-pointer ${
                        currentSz === sz
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              <div className="w-[1px] h-4 bg-slate-800" />
              <button
                type="button"
                onClick={() =>
                  handleBackdropToggle(
                    isEditingExisting ? !selectedAnnotation.item?.hasBackdrop : !textHasBackdrop
                  )
                }
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition border cursor-pointer ${
                  (isEditingExisting ? selectedAnnotation.item?.hasBackdrop : textHasBackdrop)
                    ? 'bg-blue-950/50 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {(isEditingExisting ? selectedAnnotation.item?.hasBackdrop : textHasBackdrop)
                  ? '🏷️ ' + (locale === 'vi' ? 'Nền pill' : 'Pill')
                  : (locale === 'vi' ? 'Chữ trần' : 'Plain')}
              </button>
            </>
          )}

          {/* ========================================================= */}
          {/* OPTIONS SPECIFIC TO: WATERMARK                            */}
          {/* ========================================================= */}
          {effectiveType === 'watermark' && (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateWatermarkConfig({ enabled: !watermarkConfig.enabled })}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                    watermarkConfig.enabled
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {watermarkConfig.enabled ? t.studio.watermarkOn : t.studio.watermarkOff}
                </button>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">{locale === 'vi' ? 'Độ mờ:' : 'Opacity:'}</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={Math.round((watermarkConfig.opacity ?? 0.75) * 100)}
                    onChange={(e) =>
                      onUpdateWatermarkConfig({ opacity: Number(e.target.value) / 100 })
                    }
                    className="w-20 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono text-amber-400 text-[10px]">
                    {Math.round((watermarkConfig.opacity ?? 0.75) * 100)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateWatermarkConfig({
                      position:
                        watermarkConfig.position === 'tile-pattern'
                          ? 'bottom-right'
                          : 'tile-pattern',
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer ${
                    watermarkConfig.position === 'tile-pattern'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {t.studio.tile45Short}
                </button>

                <button
                  type="button"
                  onClick={onOpenWatermarkTab}
                  className="text-amber-400 hover:text-amber-300 text-[10px] font-medium underline transition cursor-pointer"
                >
                  {t.studio.customLogoAndDetails}
                </button>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* OPTIONS SPECIFIC TO: CROP                                 */}
          {/* ========================================================= */}
          {effectiveType === 'crop' && (
            <>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                {(['free', '16:9', '4:3', '1:1', '9:16'] as CropRatio[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onSelectCropRatio(r)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                      cropRatio === r
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'free' ? t.studio.cropFree : r}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onCancelCrop}
                  className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>{t.studio.cancelBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={onApplyCrop}
                  disabled={!hasCropRect}
                  className="px-3 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>{t.studio.applyCropBtn}</span>
                </button>
              </div>
            </>
          )}

          {/* DELETE BUTTON (IF ANNOTATION IS SELECTED) */}
          {isEditingExisting && onDeleteSelected && (
            <>
              <div className="w-[1px] h-4 bg-slate-800" />
              <button
                type="button"
                onClick={onDeleteSelected}
                className="px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-[10px] font-medium flex items-center gap-1 transition cursor-pointer"
                title={`${t.studio.deleteBtn} (Del)`}
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>{t.studio.deleteBtn}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  </div>
);
};
