'use client';

import React from 'react';
import { MousePointer, Trash2, Maximize2, Minus, Plus } from 'lucide-react';
import { StudioTool } from '@/types/studio';
import { useI18n } from '@/lib/i18n-context';

interface SelectionStatusBarProps {
  selectedAnnotationId: string | null;
  history: any[];
  activeTool: StudioTool;
  computedDims: { w: number; h: number };
  onDeleteSelected: () => void;
  onDeselect: () => void;
  zoomScale?: number;
  onApplyFit?: () => void;
  onZoom100?: () => void;
  onStepZoom?: (delta: number) => void;
  hasImage?: boolean;
}

export const SelectionStatusBar: React.FC<SelectionStatusBarProps> = ({
  selectedAnnotationId,
  history,
  activeTool,
  computedDims,
  onDeleteSelected,
  onDeselect,
  zoomScale,
  onApplyFit,
  onZoom100,
  onStepZoom,
  hasImage = false,
}) => {
  const { t, locale } = useI18n();

  return (
    <div
      className={`min-h-[42px] px-3 py-1.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition duration-150 ${
        selectedAnnotationId
          ? 'bg-blue-950/70 border-blue-500/70 shadow-lg text-blue-100'
          : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
      }`}
    >
      {/* Left Info: Selected Annotation details or Tool Hint */}
      {selectedAnnotationId ? (
        <div className="flex items-center gap-2 truncate">
          <div className="w-5 h-5 rounded-md bg-blue-600/30 text-sky-400 flex items-center justify-center shrink-0 border border-blue-500/40">
            <MousePointer className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-white truncate text-xs flex items-center gap-1.5">
            <span>{t.studio.selectingLabel}</span>
            <span className="text-sky-300 font-medium">
              {(() => {
                const target = history.find(
                  (h) => 'item' in h && h.item && h.item.id === selectedAnnotationId
                );
                if (!target || !('item' in target)) return t.studio.annotationDefaultLabel;
                if (target.type === 'step')
                  return t.studio.annotationStepLabel.replace('{num}', String(target.item.num));
                if (target.type === 'arrow')
                  return t.studio.annotationArrowLabel.replace(
                    '{style}',
                    target.item.isCurved ? t.studio.arrowCurved : t.studio.arrowStraight
                  );
                if (target.type === 'box') return t.studio.annotationBoxLabel;
                if (target.type === 'blur') return t.studio.annotationBlurLabel;
                if (target.type === 'text')
                  return t.studio.annotationTextLabel.replace('{text}', target.item.text);
                if (target.type === 'spotlight') return t.studio.annotationSpotlightLabel;
                return t.studio.annotationDefaultLabel;
              })()}
            </span>
            <span className="text-[10px] text-blue-300/70 font-normal hidden lg:inline ml-1">
              {t.studio.moveWithArrowsHint}
            </span>
          </span>
        </div>
      ) : (
        <span className="truncate text-[11px]">
          {activeTool === 'select'
            ? t.studio.hintSelect
            : activeTool === 'step'
            ? t.studio.hintStep
            : activeTool === 'text'
            ? t.studio.hintText
            : activeTool === 'spotlight'
            ? t.studio.hintSpotlight
            : t.studio.hintDraw}
        </span>
      )}

      {/* Right Controls: Actions + Dimensions + Zoom Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {selectedAnnotationId && (
          <>
            <button
              type="button"
              onClick={onDeleteSelected}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title={`${t.studio.deleteBtn} (Del / Backspace)`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.studio.deleteBtn}</span>
              <kbd className="px-1.5 py-0.2 rounded bg-rose-700 text-[9px] font-mono">Del</kbd>
            </button>
            <button
              type="button"
              onClick={onDeselect}
              className="px-2.5 py-1 text-slate-300 hover:text-white text-[11px] rounded-lg hover:bg-slate-800 transition border border-slate-700/60 cursor-pointer"
              title={`${t.studio.deselectBtn} (Esc)`}
            >
              {t.studio.deselectBtn}
            </button>
          </>
        )}

        <span className="font-mono text-slate-400 text-[10px] hidden sm:inline">
          {computedDims.w} × {computedDims.h}px
        </span>

        {/* Zoom Controls (Docked cleanly in status bar) */}
        {hasImage && zoomScale !== undefined && (
          <div className="flex items-center gap-0.5 pl-2 border-l border-slate-700/60 shrink-0">
            <button
              type="button"
              onClick={onApplyFit}
              title={`${t.studio.fitScreen} (Ctrl+0)`}
              className="px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" />
              <span>{t.studio.fitBtn}</span>
            </button>

            <button
              type="button"
              onClick={onZoom100}
              title={`${t.studio.originalSize} (Ctrl+1)`}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                Math.abs(zoomScale - 1) < 0.01
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              100%
            </button>

            <div className="h-3 w-px bg-slate-700/80 mx-0.5" />

            <button
              type="button"
              onClick={() => onStepZoom?.(-0.15)}
              disabled={zoomScale <= 0.1}
              title={locale === 'vi' ? 'Thu nhỏ (Ctrl+-)' : 'Zoom out (Ctrl+-)'}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>

            <span className="font-mono text-[11px] px-1 text-slate-200 min-w-[40px] text-center font-semibold">
              {Math.round(zoomScale * 100)}%
            </span>

            <button
              type="button"
              onClick={() => onStepZoom?.(0.15)}
              disabled={zoomScale >= 3}
              title={locale === 'vi' ? 'Phóng to (Ctrl++)' : 'Zoom in (Ctrl++)'}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
