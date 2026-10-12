'use client';

import React from 'react';
import { RotateCw, FlipHorizontal, FlipVertical, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface QuickTransformsProps {
  onRotate90: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  disabled: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const QuickTransforms: React.FC<QuickTransformsProps> = ({
  onRotate90,
  onFlipHorizontal,
  onFlipVertical,
  disabled,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { t } = useI18n();

  return (
    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between group cursor-pointer text-left select-none"
      >
        <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 transition">
          <RotateCw className="w-3.5 h-3.5 text-sky-400" />
          <span>{t.studio.transformHeader}</span>
        </span>
        <div className="flex items-center gap-1.5">
          {isCollapsed && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800">
              {t.studio.transformCollapsed}
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
        <div className="grid grid-cols-3 gap-1.5 pt-0.5 animate-in fade-in duration-150">
          <button
            type="button"
            onClick={onRotate90}
            disabled={disabled}
            className="p-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex flex-col items-center gap-1 transition disabled:opacity-40 cursor-pointer"
            title={t.studio.rotate90Desc}
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px]">{t.studio.rotate90}</span>
          </button>

          <button
            type="button"
            onClick={onFlipHorizontal}
            disabled={disabled}
            className="p-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex flex-col items-center gap-1 transition disabled:opacity-40 cursor-pointer"
            title={t.studio.flipHDesc}
          >
            <FlipHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px]">{t.studio.flipH}</span>
          </button>

          <button
            type="button"
            onClick={onFlipVertical}
            disabled={disabled}
            className="p-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex flex-col items-center gap-1 transition disabled:opacity-40 cursor-pointer"
            title={t.studio.flipVDesc}
          >
            <FlipVertical className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px]">{t.studio.flipV}</span>
          </button>
        </div>
      )}
    </div>
  );
};
