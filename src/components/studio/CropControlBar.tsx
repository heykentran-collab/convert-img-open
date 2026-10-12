'use client';

import React from 'react';
import { Crop, X, Check } from 'lucide-react';
import { CropRatio } from '@/types/studio';
import { useI18n } from '@/lib/i18n-context';

export type { CropRatio };

interface CropControlBarProps {
  cropRatio: CropRatio;
  onSelectRatio: (ratio: CropRatio) => void;
  onCancel: () => void;
  onApply: () => void;
  hasCropRect: boolean;
}

export const CropControlBar: React.FC<CropControlBarProps> = ({
  cropRatio,
  onSelectRatio,
  onCancel,
  onApply,
  hasCropRect,
}) => {
  const { t } = useI18n();

  return (
    <div className="p-2.5 rounded-xl bg-slate-900 border border-sky-500/50 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
          <Crop className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-white block">{t.studio.cropModeTitle}</span>
          <span className="text-[11px] text-slate-400">
            {t.studio.cropModeSubtitle}
          </span>
        </div>
      </div>

      {/* Ratio Presets */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
        {(['free', '1:1', '3:4', '16:9', '4:3', '9:16', '1200:630'] as CropRatio[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onSelectRatio(r)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
              cropRatio === r
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {r === 'free' ? t.studio.cropFree : r === '1200:630' ? 'OG Card' : r === '3:4' ? '3:4 (TikTok)' : r}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>{t.studio.cancelBtn}</span>
        </button>

        <button
          type="button"
          onClick={onApply}
          disabled={!hasCropRect}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{t.studio.applyCropBtn}</span>
        </button>
      </div>
    </div>
  );
};
