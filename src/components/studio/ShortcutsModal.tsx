'use client';

import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, locale } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.studio.shortcutsTitle}</h3>
              <p className="text-xs text-slate-400">{t.studio.shortcutsSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {t.studio.toolSelectionHeader}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800 col-span-2">
                <span className="text-slate-300">{t.studio.selectMoveTool}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-sky-300 font-mono font-bold text-[11px] border border-slate-600">V</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.arrowTool}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-blue-300 font-mono font-bold text-[11px] border border-slate-600">A</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.stepBadgeTool}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-blue-300 font-mono font-bold text-[11px] border border-slate-600">S</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.boxTool}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-blue-300 font-mono font-bold text-[11px] border border-slate-600">B</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.blurTool}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-blue-300 font-mono font-bold text-[11px] border border-slate-600">M</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.textTool}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-blue-300 font-mono font-bold text-[11px] border border-slate-600">T</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.spotlightTool}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-blue-300 font-mono font-bold text-[11px] border border-slate-600">F</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.cropTool}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-blue-300 font-mono font-bold text-[11px] border border-slate-600">C</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800 col-span-2">
                <span className="text-slate-300">{t.studio.watermarkTool}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-blue-300 font-mono font-bold text-[11px] border border-slate-600">W</kbd>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {t.studio.actionsHeader}
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.moveSelected}</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-slate-700 text-sky-300 font-mono text-[11px] border border-slate-600">↑ ↓ ← →</kbd>
                  <span className="text-slate-500 text-[10px]">(+Shift: 10px)</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.deleteSelected}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-rose-300 font-mono text-[11px] border border-slate-600">Delete / Backspace</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.undoAction}</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-600">Ctrl / ⌘</kbd>
                  <span className="text-slate-500">+</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-600">Z</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.redoAction}</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-600">Ctrl / ⌘</kbd>
                  <span className="text-slate-500">+</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-600">Y</kbd>
                  <span className="text-slate-500 text-[10px] mx-0.5">{locale === 'vi' ? 'hoặc' : 'or'}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-600">Ctrl+Shift+Z</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.openShortcutsAction}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-600">?</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.deselectEsc}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-600">Esc</kbd>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {t.studio.zoomViewportHeader}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.fitScreen}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-amber-300 font-mono text-[11px] border border-slate-600">Ctrl + 0</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.originalSize}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-amber-300 font-mono text-[11px] border border-slate-600">Ctrl + 1</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.zoomInOut}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-amber-300 font-mono text-[11px] border border-slate-600">Ctrl + +/-</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300">{t.studio.mouseWheelZoom}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-amber-300 font-mono text-[11px] border border-slate-600">{locale === 'vi' ? 'Ctrl + Lăn chuột' : 'Ctrl + Wheel'}</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer"
          >
            {t.studio.gotItBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
