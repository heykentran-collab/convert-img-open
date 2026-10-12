'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  ShoppingBag,
  Globe,
  Share2,
  Maximize,
  LayoutGrid,
  Check,
  Store,
} from 'lucide-react';
import { EcommercePreset, PresetCategory } from '@/types/presets';
import {
  ECOMMERCE_PRESETS,
  PRESET_CATEGORIES,
  filterEcommercePresets,
  getLocalizedPreset,
} from '@/lib/constants/ecommerce-presets';
import { useI18n } from '@/lib/i18n-context';

interface PresetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: EcommercePreset) => void;
  currentWidth?: number;
  currentHeight?: number;
}

export function PresetPickerModal({
  isOpen,
  onClose,
  onSelectPreset,
  currentWidth,
  currentHeight,
}: PresetPickerModalProps) {
  const { t, locale } = useI18n();
  const [activeCategory, setActiveCategory] = useState<PresetCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reset search when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredPresets = useMemo(() => {
    return filterEcommercePresets(ECOMMERCE_PRESETS, searchQuery, activeCategory);
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  const getCategoryIcon = (id: PresetCategory) => {
    switch (id) {
      case 'vn-ecom':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'intl-ecom':
        return <Globe className="w-3.5 h-3.5" />;
      case 'social':
        return <Share2 className="w-3.5 h-3.5" />;
      case 'standard':
        return <Maximize className="w-3.5 h-3.5" />;
      default:
        return <LayoutGrid className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryLabel = (id: PresetCategory, defaultLabel: string) => {
    switch (id) {
      case 'all':
        return t.presetPickerModal.categoryAll;
      case 'vn-ecom':
        return t.presetPickerModal.categoryVnEcom;
      case 'intl-ecom':
        return t.presetPickerModal.categoryIntlEcom;
      case 'social':
        return t.presetPickerModal.categorySocial;
      case 'standard':
        return t.presetPickerModal.categoryStandard;
      default:
        return defaultLabel;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t.presetPickerModal.title}
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {t.presetPickerModal.badgeCount.replace('{count}', String(ECOMMERCE_PRESETS.length))}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.presetPickerModal.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40 flex flex-col gap-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.presetPickerModal.searchPlaceholder}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner font-sans"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {PRESET_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {getCategoryIcon(cat.id)}
                  <span>{getCategoryLabel(cat.id, cat.label)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Presets Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredPresets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">{t.presetPickerModal.noResultsTitle}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t.presetPickerModal.noResultsDesc}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-4 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                {t.presetPickerModal.clearFilterButton}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPresets.map((preset) => {
                const p = getLocalizedPreset(preset, locale);
                const isCurrent =
                  currentWidth === preset.width && currentHeight === preset.height;

                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative ${
                      isCurrent
                        ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-md'
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 hover:shadow-lg'
                    }`}
                  >
                    <div>
                      {/* Top Row: Platform badge & Ratio */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${p.badgeColor}`}
                        >
                          {p.platform}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700/60 font-semibold">
                            {p.ratio}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500 text-white text-[10px] font-bold">
                              <Check className="w-3 h-3" />
                              <span>{t.presetPickerModal.selectedBadge}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name & Purpose */}
                      <h3 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {p.purpose}
                      </p>
                    </div>

                    {/* Bottom: Recommendation & Dimension Value */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-end justify-between gap-2">
                      <p className="text-[10px] text-slate-500 italic line-clamp-2 max-w-[65%]">
                        {p.recommendation}
                      </p>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold font-mono text-white block">
                          {p.width} × {p.height}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">pixels</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-mono text-[11px]">
            {t.presetPickerModal.showingCount
              .replace('{current}', String(filteredPresets.length))
              .replace('{total}', String(ECOMMERCE_PRESETS.length))}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
}
