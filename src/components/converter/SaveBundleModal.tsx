'use client';

import React, { useState } from 'react';
import { MultiSizeTarget, PresetBundle } from '@/types/multi-size';
import { saveCustomBundle, getLocalizedTargetName } from '@/lib/user-preset-storage';
import { Bookmark, X, Check, Layers } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface SaveBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: MultiSizeTarget[];
  onSaved: (bundle: PresetBundle) => void;
}

export function SaveBundleModal({
  isOpen,
  onClose,
  targets,
  onSaved,
}: SaveBundleModalProps) {
  const { t, locale } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.saveBundleModal.nameRequiredError);
      return;
    }

    if (targets.length === 0) {
      setError(t.saveBundleModal.minTargetError);
      return;
    }

    const newBundle = saveCustomBundle({
      name: name.trim(),
      description: description.trim() || t.saveBundleModal.defaultDesc.replace('{count}', String(targets.length)),
      targets,
    });

    setName('');
    setDescription('');
    setError('');
    onSaved(newBundle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">{t.saveBundleModal.title}</h3>
              <p className="text-[11px] text-slate-400">{t.saveBundleModal.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              {t.saveBundleModal.nameLabel} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder={t.saveBundleModal.namePlaceholder}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
            />
            {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              {t.saveBundleModal.descLabel}
            </label>
            <input
              type="text"
              placeholder={t.saveBundleModal.descPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
            />
          </div>

          {/* Target preview */}
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.saveBundleModal.targetPreviewLabel.replace('{count}', String(targets.length))}</span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-lg bg-slate-950/50 border border-slate-800">
              {targets.map((tTarget, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300 flex items-center gap-1.5"
                >
                  <span className="font-semibold text-blue-400">
                    {tTarget.width === 'original'
                      ? t.multiSize.originalBadge
                      : `${tTarget.width}${tTarget.height ? `×${tTarget.height}` : ''}px`}
                  </span>
                  <span className="text-slate-400 truncate max-w-[140px]">
                    {getLocalizedTargetName(tTarget, locale)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t.saveBundleModal.saveButton}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
