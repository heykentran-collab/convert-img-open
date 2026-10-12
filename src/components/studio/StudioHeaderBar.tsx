'use client';

import React from 'react';
import {
  Wand2,
  Upload,
  RefreshCw,
  Undo2,
  Redo2,
  Eraser,
  Keyboard,
  PanelRightClose,
  PanelRightOpen,
  Copy,
  Check,
  Download,
  ChevronDown,
  Sliders,
  Layers,
  CloudUpload,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export interface StudioHeaderBarProps {
  onUploadClick: () => void;
  onResetCanvas: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  onClearAnnotations: () => void;
  canClearAnnotations: boolean;
  onOpenShortcuts: () => void;
  showRightSidebar: boolean;
  onToggleRightSidebar: () => void;
  copied: boolean;
  onCopyImage: () => void;
  onExportQuick: (format: 'png' | 'webp' | 'jpeg') => void;
  onOpenExportModal: () => void;
  showExportMenu: boolean;
  setShowExportMenu: React.Dispatch<React.SetStateAction<boolean>>;
  imageSrc: string | null;
  sendingToStitcher: boolean;
  onSendToStitcher: () => void;
  uploadingToR2: boolean;
  uploadSuccess: boolean;
  onSaveToR2: () => void;
}

export function StudioHeaderBar({
  onUploadClick,
  onResetCanvas,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onClearAnnotations,
  canClearAnnotations,
  onOpenShortcuts,
  showRightSidebar,
  onToggleRightSidebar,
  copied,
  onCopyImage,
  onExportQuick,
  onOpenExportModal,
  showExportMenu,
  setShowExportMenu,
  imageSrc,
  sendingToStitcher,
  onSendToStitcher,
  uploadingToR2,
  uploadSuccess,
  onSaveToR2,
}: StudioHeaderBarProps) {
  const { t } = useI18n();

  return (
    <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-blue-500 shrink-0" />
          {t.studio.headerTitle}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Upload Button */}
        <button
          type="button"
          onClick={onUploadClick}
          title={t.studio.uploadTooltip}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">{t.studio.uploadBtn}</span>
        </button>

        {/* Reset Canvas */}
        <button
          type="button"
          onClick={onResetCanvas}
          title={t.studio.resetCanvasTooltip}
          className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t.studio.resetCanvasBtn}</span>
        </button>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title={t.studio.undoTooltip}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.studio.undoBtn}</span>
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title={t.studio.redoTooltip}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1"
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.studio.redoBtn}</span>
        </button>

        {/* Clear Annotations */}
        <button
          onClick={onClearAnnotations}
          disabled={!canClearAnnotations}
          title={t.studio.clearAnnotationsTooltip}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/60 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-300 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1"
        >
          <Eraser className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">{t.studio.clearAnnotationsBtn}</span>
        </button>

        {/* Shortcuts Modal Button */}
        <button
          onClick={onOpenShortcuts}
          title={t.studio.shortcutsTooltip}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
        >
          <Keyboard className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">{t.studio.shortcutsBtn}</span>
          <span className="text-[10px] bg-slate-700 text-slate-300 px-1 rounded font-mono">?</span>
        </button>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Toggle Right Inspector */}
        <button
          type="button"
          onClick={onToggleRightSidebar}
          title={showRightSidebar ? t.studio.collapseInspectorTooltip : t.studio.expandInspectorTooltip}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
            showRightSidebar
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              : 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30'
          }`}
        >
          {showRightSidebar ? (
            <>
              <PanelRightClose className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline">{t.studio.collapseInspector}</span>
            </>
          ) : (
            <>
              <PanelRightOpen className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline">{t.studio.expandInspector}</span>
            </>
          )}
        </button>

        {/* Copy Image (PNG to Clipboard) */}
        <button
          onClick={onCopyImage}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          title={t.studio.copyImageTooltip}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">{t.studio.copyImageSuccess}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.studio.copyImageBtn}</span>
            </>
          )}
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <div className="inline-flex rounded-lg border border-emerald-500/30 bg-emerald-600/10 p-0.5 shadow-sm">
            <button
              onClick={() => onExportQuick('png')}
              className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title={t.studio.downloadPngTooltip}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.studio.downloadPngBtn}</span>
            </button>
            <button
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="px-1.5 py-1 rounded-md hover:bg-emerald-500/20 text-emerald-300 transition cursor-pointer flex items-center justify-center border-l border-emerald-500/20"
              title={t.studio.exportMenuTooltip}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Dropdown Menu */}
          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md p-1.5 shadow-xl z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t.studio.quickExportHeader}
                </div>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportQuick('png');
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="font-medium">{t.studio.exportPngLossless}</span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">.png</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportQuick('webp');
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="font-medium">{t.studio.exportWebpOptimized}</span>
                  <span className="text-[10px] text-blue-400 font-mono bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">.webp</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportQuick('jpeg');
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="font-medium">{t.studio.exportJpgWhiteBg}</span>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">.jpg</span>
                </button>

                <div className="my-1 border-t border-slate-800" />

                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onOpenExportModal();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-950/30 text-emerald-300 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.studio.exportCustomOptions}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Send to Stitcher as Layer */}
        <button
          onClick={onSendToStitcher}
          disabled={sendingToStitcher || !imageSrc}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          title={t.studio.stitcherTooltip}
        >
          {sendingToStitcher ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t.studio.sendingToStitcher}</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5" />
              <span>{t.studio.stitcherBtn}</span>
            </>
          )}
        </button>

        {/* Save to R2 */}
        <button
          onClick={onSaveToR2}
          disabled={uploadingToR2 || !imageSrc}
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {uploadingToR2 ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {t.studio.savingToR2}
            </>
          ) : uploadSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              {t.studio.savedToR2Success}
            </>
          ) : (
            <>
              <CloudUpload className="w-3.5 h-3.5" />
              {t.studio.saveToR2Btn}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
