'use client';

import React, { useState, useEffect } from 'react';
import { MultiSizeTarget, PresetBundle } from '@/types/multi-size';
import { EcommercePreset } from '@/types/presets';
import {
  getSavedBundles,
  deleteCustomBundle,
  BUILTIN_BUNDLES,
  getLocalizedBundleName,
  getLocalizedTargetName,
} from '@/lib/user-preset-storage';
import { SaveBundleModal } from './SaveBundleModal';
import { useI18n } from '@/lib/i18n-context';
import {
  Layers,
  Plus,
  Trash2,
  Bookmark,
  Store,
  Sparkles,
  X,
  FolderTree,
  Sliders,
} from 'lucide-react';

interface MultiSizeControlProps {
  isMultiSize: boolean;
  onToggleMode: (isMulti: boolean) => void;
  selectedTargets: MultiSizeTarget[];
  onTargetsChange: (targets: MultiSizeTarget[]) => void;
  onOpenPresetModal: () => void;
}

export function MultiSizeControl({
  isMultiSize,
  onToggleMode,
  selectedTargets,
  onTargetsChange,
  onOpenPresetModal,
}: MultiSizeControlProps) {
  const { t, locale } = useI18n();
  const [bundles, setBundles] = useState<PresetBundle[]>(BUILTIN_BUNDLES);
  const [selectedBundleId, setSelectedBundleId] = useState<string>('bundle-blog-web');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [customW, setCustomW] = useState<string>('800');
  const [customH, setCustomH] = useState<string>('');
  const [customLabel, setCustomLabel] = useState<string>('');

  // Load saved bundles on mount
  useEffect(() => {
    const list = getSavedBundles();
    setBundles(list);
  }, []);

  const handleSelectBundle = (bundleId: string) => {
    setSelectedBundleId(bundleId);
    const targetBundle = bundles.find((b) => b.id === bundleId);
    if (targetBundle) {
      onTargetsChange([...targetBundle.targets]);
    }
  };

  const handleRemoveTarget = (id: string) => {
    const updated = selectedTargets.filter((t) => t.id !== id);
    onTargetsChange(updated);
    setSelectedBundleId('custom');
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseInt(customW, 10);
    if (isNaN(w) || w <= 0) return;
    const h = customH ? parseInt(customH, 10) : undefined;

    const label = customLabel.trim() || `${w}${h ? `×${h}` : ''}px ${t.converter.customSize.replace('{width}', '').trim()}`;
    const folderName = `${w}${h ? `x${h}` : ''}px_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20)}`;

    const newTarget: MultiSizeTarget = {
      id: `target-custom-${Date.now()}`,
      name: label,
      width: w,
      height: !isNaN(h || 0) && (h || 0) > 0 ? h : undefined,
      folderName,
      badge: 'Custom',
    };

    onTargetsChange([...selectedTargets, newTarget]);
    setCustomLabel('');
    setShowCustomInput(false);
    setSelectedBundleId('custom');
  };

  const handleDeleteBundle = (bundleId: string) => {
    if (confirm(t.multiSize.deleteBundleConfirm)) {
      deleteCustomBundle(bundleId);
      const updated = getSavedBundles();
      setBundles(updated);
      if (selectedBundleId === bundleId) {
        setSelectedBundleId('bundle-blog-web');
        const defaultBundle = updated.find((b) => b.id === 'bundle-blog-web') || updated[0];
        if (defaultBundle) onTargetsChange(defaultBundle.targets);
      }
    }
  };

  const activeBundle = bundles.find((b) => b.id === selectedBundleId);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Mode Switcher Tabs */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>{t.multiSize.exportSizesTitle}</span>
        </label>

        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onToggleMode(false)}
            className={`py-1.5 px-2 rounded-md font-medium transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              !isMultiSize
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.multiSize.singleSizeTab}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleMode(true);
              if (selectedTargets.length === 0) {
                const defaultBundle = bundles[0];
                if (defaultBundle) onTargetsChange(defaultBundle.targets);
              }
            }}
            className={`py-1.5 px-2 rounded-md font-medium transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              isMultiSize
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
            <span>{t.multiSize.multiSizeTab}</span>
            {selectedTargets.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-bold">
                {selectedTargets.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Multi-Size Settings Box */}
      {isMultiSize && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-blue-500/30 flex flex-col gap-3 animate-in fade-in duration-200">
          {/* Bundle Selector & Actions */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {t.multiSize.sampleBundlesTitle}
              </span>

              <div className="flex items-center gap-2">
                {activeBundle && !activeBundle.isBuiltIn && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBundle(activeBundle.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title={t.multiSize.deleteBundleTooltip}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowSaveModal(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition cursor-pointer"
                  title={t.multiSize.saveBundleButton}
                >
                  <Bookmark className="w-3 h-3" />
                  <span>{t.multiSize.saveBundleButton}</span>
                </button>
              </div>
            </div>

            <select
              value={selectedBundleId}
              onChange={(e) => handleSelectBundle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {selectedBundleId === 'custom' && (
                <option value="custom">{t.multiSize.customFreeLabel.replace('{count}', String(selectedTargets.length))}</option>
              )}
              <optgroup label={t.multiSize.builtinGroup}>
                {bundles
                  .filter((b) => b.isBuiltIn)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {getLocalizedBundleName(b, locale)} ({b.targets.length})
                    </option>
                  ))}
              </optgroup>
              {bundles.some((b) => !b.isBuiltIn) && (
                <optgroup label={t.multiSize.userSavedGroup}>
                  {bundles
                    .filter((b) => !b.isBuiltIn)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        ⭐ {b.name} ({b.targets.length})
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Active Target Chips List */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{t.multiSize.willExportNotice}</span>
              <span className="font-mono text-blue-400 font-semibold">
                {t.multiSize.sizesCountBadge.replace('{count}', String(selectedTargets.length))}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 items-center">
              {selectedTargets.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">
                  {t.multiSize.noTargetsNotice}
                </span>
              ) : (
                selectedTargets.map((target) => {
                  const displayName = getLocalizedTargetName(target, locale);
                  return (
                    <div
                      key={target.id}
                      className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-md bg-slate-800 border border-slate-700/80 text-xs text-slate-200 group hover:border-blue-500/50 transition"
                    >
                      <span className="font-mono font-semibold text-blue-300">
                        {target.width === 'original'
                          ? t.multiSize.originalBadge
                          : `${target.width}${target.height ? `×${target.height}` : ''}px`}
                      </span>
                      <span className="text-slate-400 truncate max-w-[130px]" title={displayName}>
                        {displayName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTarget(target.id)}
                        className="p-0.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title={t.multiSize.removeTargetTooltip}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Add Buttons Bar */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onOpenPresetModal}
              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[10px] sm:text-[11px] font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer"
              title={t.converter.ecomSocialPresetsTooltip}
            >
              <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{t.multiSize.addEcomButton}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[10px] sm:text-[11px] font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer"
              title={t.multiSize.addCustomButton}
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{t.multiSize.addCustomButton}</span>
            </button>
          </div>

          {/* Inline Custom Width/Height Input Form */}
          {showCustomInput && (
            <form
              onSubmit={handleAddCustom}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-2 animate-in fade-in"
            >
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400">{t.multiSize.widthLabel}</span>
                <input
                  type="number"
                  placeholder={t.multiSize.widthPlaceholder}
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                  min={50}
                  max={8000}
                  required
                  className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400">{t.multiSize.heightLabel}</span>
                <input
                  type="number"
                  placeholder={t.multiSize.heightPlaceholder}
                  value={customH}
                  onChange={(e) => setCustomH(e.target.value)}
                  min={50}
                  max={8000}
                  className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <input
                type="text"
                placeholder={t.multiSize.customNamePlaceholder}
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="flex-1 min-w-[120px] bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
              />

              <button
                type="submit"
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer"
              >
                {t.multiSize.addButton}
              </button>
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Download Organization Hint */}
          <div className="flex items-center gap-1.5 text-[10px] text-blue-300/80 bg-blue-950/30 px-2 py-1 rounded-lg border border-blue-500/20">
            <FolderTree className="w-3 h-3 text-blue-400 shrink-0" />
            <span>{t.multiSize.zipFolderHint}</span>
          </div>
        </div>
      )}


      {/* Save Bundle Modal */}
      <SaveBundleModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        targets={selectedTargets}
        onSaved={(newBundle) => {
          const list = getSavedBundles();
          setBundles(list);
          setSelectedBundleId(newBundle.id);
        }}
      />
    </div>
  );
}
