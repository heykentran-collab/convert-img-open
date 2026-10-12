'use client';
 
import React, { useState } from 'react';
import { Sliders, X, Download } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export interface StudioExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceKey: string | null;
  onExport: (options: {
    format: 'png' | 'webp' | 'jpeg';
    quality: number;
    scale: number;
    customName?: string;
  }) => void;
}

export function StudioExportModal({
  isOpen,
  onClose,
  sourceKey,
  onExport,
}: StudioExportModalProps) {
  const { t } = useI18n();
  const [exportFormat, setExportFormat] = useState<'png' | 'webp' | 'jpeg'>('png');
  const [exportQuality, setExportQuality] = useState<number>(0.92);
  const [exportScale, setExportScale] = useState<number>(1);
  const [exportCustomName, setExportCustomName] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{t.studio.advancedExportTitle}</h3>
              <p className="text-[11px] text-slate-400">{t.studio.advancedExportSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">{t.studio.exportFileNameLabel}</label>
          <input
            type="text"
            value={exportCustomName}
            onChange={(e) => setExportCustomName(e.target.value)}
            placeholder={
              sourceKey
                ? sourceKey.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'artwork'
                : 'artwork'
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Format Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">{t.studio.exportFormatLabel}</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'png' as const, label: 'PNG', desc: t.studio.formatPngDesc },
              { id: 'webp' as const, label: 'WebP', desc: t.studio.formatWebpDesc },
              { id: 'jpeg' as const, label: 'JPG', desc: t.studio.formatJpgDesc },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setExportFormat(fmt.id)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  exportFormat === fmt.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold">{fmt.label}</span>
                <span className="text-[10px] opacity-75 mt-0.5">{fmt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Slider (for WebP and JPEG) */}
        {exportFormat !== 'png' && (
          <div className="space-y-1.5 rounded-xl bg-slate-800/40 p-3 border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">{t.studio.compressionQualityLabel}</span>
              <span className="font-mono text-emerald-400 font-semibold">{Math.round(exportQuality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1"
              step="0.05"
              value={exportQuality}
              onChange={(e) => setExportQuality(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Resolution Scale */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">{t.studio.resolutionScaleLabel}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setExportScale(1)}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                exportScale === 1
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold">{t.studio.scaleStandard}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{t.studio.scaleStandardDesc}</div>
            </button>
            <button
              onClick={() => setExportScale(2)}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                exportScale === 2
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold flex items-center justify-between">
                <span>{t.studio.scaleRetina}</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-normal">{t.studio.scaleRetinaBadge}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{t.studio.scaleRetinaDesc}</div>
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            {t.studio.cancelBtn}
          </button>
          <button
            onClick={() => {
              onClose();
              onExport({
                format: exportFormat,
                quality: exportQuality,
                scale: exportScale,
                customName: exportCustomName,
              });
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.studio.downloadImageBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
