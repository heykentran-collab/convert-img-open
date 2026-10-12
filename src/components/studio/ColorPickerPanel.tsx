'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Palette, Pipette } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export const DEFAULT_PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#0f172a', // Slate Black
];

const STORAGE_KEY = 'volticen_studio_recent_colors';

interface ColorPickerPanelProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  iconColorClass?: string;
  hidePresetSwatches?: boolean;
  compactSwatches?: boolean;
}

export const ColorPickerPanel: React.FC<ColorPickerPanelProps> = ({
  label,
  color,
  onChange,
  presetColors = DEFAULT_PRESET_COLORS,
  iconColorClass = 'text-blue-400',
  hidePresetSwatches = false,
  compactSwatches = false,
}) => {
  const { t, locale } = useI18n();
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [hexInput, setHexInput] = useState(color || '#ffffff');
  const [hasEyeDropper, setHasEyeDropper] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Sync hexInput when color prop changes from outside
  useEffect(() => {
    setHexInput(color || '#ffffff');
  }, [color]);

  // Load recent colors from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentColors(parsed.slice(0, 5));
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    // Check EyeDropper API support
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      setHasEyeDropper(true);
    }
  }, []);

  const saveRecentColor = (newColor: string) => {
    const normalized = newColor.toLowerCase();
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== normalized);
      const updated = [normalized, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleSelectColor = (selected: string) => {
    onChange(selected);
    saveRecentColor(selected);
  };

  const handleNativeColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    onChange(val);
    saveRecentColor(val);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    // Auto-apply if it is a valid 6-char or 3-char hex with or without '#'
    let formatted = val.trim();
    if (!formatted.startsWith('#')) {
      formatted = '#' + formatted;
    }
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(formatted)) {
      onChange(formatted);
      saveRecentColor(formatted);
    }
  };

  const handleEyeDropperClick = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onChange(result.sRGBHex);
          saveRecentColor(result.sRGBHex);
        }
      } catch {
        // User cancelled eye dropper
      }
    }
  };

  const isColorSelected = (targetColor: string) =>
    color?.toLowerCase() === targetColor.toLowerCase();

  return (
    <div className="space-y-2">
      {/* Label and Current Color preview */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <Palette className={`w-3 h-3 ${iconColorClass}`} />
          {label}
        </span>
        <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
          <span
            className="w-2.5 h-2.5 rounded-full border border-white/20"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] font-mono text-slate-300 uppercase">{color}</span>
        </div>
      </div>

      {/* Preset Swatches */}
      {!hidePresetSwatches && (
        compactSwatches ? (
          /* Compact 1-Row layout: scrollable / flexible round dots */
          <div className="flex items-center justify-between gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            {presetColors.map((c) => {
              const selected = isColorSelected(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSelectColor(c)}
                  className={`w-5 h-5 rounded-full transition relative flex items-center justify-center border shrink-0 cursor-pointer ${
                    c.toLowerCase() === '#ffffff'
                      ? 'border-slate-500'
                      : c.toLowerCase() === '#0f172a'
                      ? 'border-slate-700'
                      : 'border-transparent'
                  } ${
                    selected
                      ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 scale-110 shadow-sm'
                      : 'hover:scale-110 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {selected && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        c.toLowerCase() === '#ffffff' ? 'bg-slate-900' : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Standard 2-Row grid of rectangular swatches */
          <div className="grid grid-cols-5 gap-1.5">
            {presetColors.map((c) => {
              const selected = isColorSelected(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSelectColor(c)}
                  className={`h-6 rounded-md transition relative flex items-center justify-center border ${
                    c.toLowerCase() === '#ffffff'
                      ? 'border-slate-600'
                      : c.toLowerCase() === '#0f172a'
                      ? 'border-slate-700'
                      : 'border-transparent'
                  } ${
                    selected
                      ? 'ring-2 ring-blue-500 scale-105 z-10 shadow-md'
                      : 'hover:scale-105 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {selected && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        c.toLowerCase() === '#ffffff' ? 'bg-slate-900' : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )
      )}

      {/* Custom Color Tools: Native Picker + Eyedropper + Hex Input */}
      <div className={`flex items-center gap-1.5 ${hidePresetSwatches ? '' : 'pt-1.5 border-t border-slate-800/80'}`}>
        {/* Native color picker trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            className="h-7 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-300 text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer"
            title={t.studio.openColorPaletteTooltip}
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs"
              style={{
                background:
                  'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
              }}
            />
            <span>{locale === 'vi' ? 'Tùy chọn' : 'Custom'}</span>
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={color && color.startsWith('#') && color.length === 7 ? color : '#ef4444'}
            onChange={handleNativeColorInput}
            className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        {/* EyeDropper button (if supported by browser) */}
        {hasEyeDropper && (
          <button
            type="button"
            onClick={handleEyeDropperClick}
            className="h-7 w-7 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:text-blue-400 text-slate-400 flex items-center justify-center transition cursor-pointer shrink-0"
            title={t.studio.eyeDropperTooltip}
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Direct Hex code input */}
        <div className="flex-1 flex items-center bg-slate-950 rounded-lg border border-slate-800 px-2 focus-within:border-blue-500 transition">
          <span className="text-[11px] font-mono text-slate-500 mr-0.5">#</span>
          <input
            type="text"
            value={(hexInput || '').replace(/^#/, '')}
            onChange={handleHexInputChange}
            maxLength={6}
            placeholder={t.studio.enterHexPlaceholder}
            className="w-full bg-transparent text-[11px] font-mono text-slate-200 outline-none uppercase py-1"
          />
        </div>
      </div>

      {/* Recent Colors (if any exist) */}
      {recentColors.length > 0 && (
        <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-500">
          <span>{t.studio.recentColorsLabel}</span>
          <div className="flex items-center gap-1">
            {recentColors.map((rc) => {
              const selected = isColorSelected(rc);
              return (
                <button
                  key={rc}
                  type="button"
                  onClick={() => handleSelectColor(rc)}
                  className={`w-4 h-4 rounded-full border transition ${
                    rc.toLowerCase() === '#ffffff'
                      ? 'border-slate-600'
                      : 'border-white/10'
                  } ${
                    selected ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: rc }}
                  title={locale === 'vi' ? `Dùng lại màu ${rc}` : `Reuse ${rc}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
