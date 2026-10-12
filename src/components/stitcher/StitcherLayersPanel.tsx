'use client';

import React, { useState } from 'react';
import {
  StitcherLayer,
  CanvasConfig,
} from '@/types/stitcher';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  AlignCenter,
  AlignVerticalJustifyCenter,
  Maximize,
  Maximize2,
  RotateCcw,
  Link2,
  Unlink2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface StitcherLayersPanelProps {
  layers: StitcherLayer[];
  selectedLayerId: string | null;
  canvasConfig: CanvasConfig;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<StitcherLayer>) => void;
  onRemoveLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

export function StitcherLayersPanel({
  layers,
  selectedLayerId,
  canvasConfig,
  onSelectLayer,
  onUpdateLayer,
  onRemoveLayer,
  onDuplicateLayer,
  onToggleVisibility,
  onToggleLock,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}: StitcherLayersPanelProps) {
  const { t } = useI18n();
  // Sorted top-to-bottom (highest z-index first)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);
  const selected = layers.find((l) => l.id === selectedLayerId);

  // Aspect ratio lock state for layer dimension inputs
  const [isAspectLocked, setIsAspectLocked] = useState<boolean>(true);

  // Layer resizing helpers
  const handleWidthChange = (val: number) => {
    if (!selected || isNaN(val) || val <= 0) return;
    const aspect = selected.aspectRatio || (selected.width / selected.height) || 1;
    const newW = val;
    const newH = isAspectLocked ? Math.round(newW / aspect) : selected.height;
    onUpdateLayer(selected.id, { width: newW, height: newH });
  };

  const handleHeightChange = (val: number) => {
    if (!selected || isNaN(val) || val <= 0) return;
    const aspect = selected.aspectRatio || (selected.width / selected.height) || 1;
    const newH = val;
    const newW = isAspectLocked ? Math.round(newH * aspect) : selected.width;
    onUpdateLayer(selected.id, { width: newW, height: newH });
  };

  const handleScalePercent = (percent: number) => {
    if (!selected) return;
    const baseW = selected.naturalWidth || selected.width;
    const baseH = selected.naturalHeight || selected.height;
    const p = Math.max(10, Math.min(500, percent));
    const newW = Math.round(baseW * (p / 100));
    const newH = Math.round(baseH * (p / 100));

    // Keep center position stable when scaling
    const cx = selected.x + selected.width / 2;
    const cy = selected.y + selected.height / 2;
    const newX = Math.round(cx - newW / 2);
    const newY = Math.round(cy - newH / 2);

    onUpdateLayer(selected.id, { width: newW, height: newH, x: newX, y: newY });
  };

  // Quick alignment helpers
  const handleCenterHorizontal = () => {
    if (!selected) return;
    const newX = Math.round((canvasConfig.width - selected.width) / 2);
    onUpdateLayer(selected.id, { x: newX });
  };

  const handleCenterVertical = () => {
    if (!selected) return;
    const newY = Math.round((canvasConfig.height - selected.height) / 2);
    onUpdateLayer(selected.id, { y: newY });
  };

  const handleFitCanvas = () => {
    if (!selected) return;
    const aspect = selected.aspectRatio || 1;
    let newW = canvasConfig.width;
    let newH = Math.round(newW / aspect);
    if (newH > canvasConfig.height) {
      newH = canvasConfig.height;
      newW = Math.round(newH * aspect);
    }
    const newX = Math.round((canvasConfig.width - newW) / 2);
    const newY = Math.round((canvasConfig.height - newH) / 2);
    onUpdateLayer(selected.id, { x: newX, y: newY, width: newW, height: newH });
  };

  const handleFillCanvas = () => {
    if (!selected) return;
    const aspect = selected.aspectRatio || 1;
    let newW = canvasConfig.width;
    let newH = Math.round(newW / aspect);
    if (newH < canvasConfig.height) {
      newH = canvasConfig.height;
      newW = Math.round(newH * aspect);
    }
    const newX = Math.round((canvasConfig.width - newW) / 2);
    const newY = Math.round((canvasConfig.height - newH) / 2);
    onUpdateLayer(selected.id, { x: newX, y: newY, width: newW, height: newH });
  };

  const handleResetNaturalSize = () => {
    if (!selected || !selected.naturalWidth || !selected.naturalHeight) return;
    const newW = selected.naturalWidth;
    const newH = selected.naturalHeight;
    const newX = Math.round((canvasConfig.width - newW) / 2);
    const newY = Math.round((canvasConfig.height - newH) / 2);
    onUpdateLayer(selected.id, { x: newX, y: newY, width: newW, height: newH });
  };

  const currentScale = selected
    ? Math.round((selected.width / (selected.naturalWidth || selected.width)) * 100)
    : 100;

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs w-full lg:w-80 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>{t.stitcher.layersTitle.replace('{count}', String(layers.length))}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {t.stitcher.zIndexHint}
        </span>
      </div>

      {/* Selected Layer Quick Inspector */}
      {selected && (
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-blue-500/30 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-300 truncate max-w-[170px]" title={selected.name}>
              {selected.name}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDuplicateLayer(selected.id)}
                title={t.stitcher.duplicateTooltip}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRemoveLayer(selected.id)}
                title={t.stitcher.deleteLayerTooltip}
                className="p-1 hover:text-red-400 text-slate-400 hover:bg-red-950/40 rounded transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Layer Dimensions (Width & Height) */}
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-slate-900/70 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-300">{t.stitcher.layerDimensionsLabel}</span>
              <button
                onClick={() => setIsAspectLocked((prev) => !prev)}
                className={`p-1 rounded transition flex items-center gap-1 text-[10px] ${
                  isAspectLocked
                    ? 'text-blue-400 bg-blue-950/70 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700'
                }`}
                title={isAspectLocked ? t.stitcher.aspectLockTooltipLocked : t.stitcher.aspectLockTooltipUnlocked}
              >
                {isAspectLocked ? <Link2 className="w-3 h-3" /> : <Unlink2 className="w-3 h-3" />}
                <span>{isAspectLocked ? t.stitcher.aspectLocked : t.stitcher.aspectFree}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <span className="text-[9px] text-slate-400 block mb-0.5">{t.stitcher.widthPx}</span>
                <input
                  type="number"
                  min={20}
                  max={10000}
                  value={selected.width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-slate-500 font-mono mt-3">×</span>
              <div className="flex-1">
                <span className="text-[9px] text-slate-400 block mb-0.5">{t.stitcher.heightPx}</span>
                <input
                  type="number"
                  min={20}
                  max={10000}
                  value={selected.height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Scale Slider (%) */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <span className="text-[10px] text-slate-400">{t.stitcher.scaleLabel}</span>
              <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={currentScale}
                  onChange={(e) => handleScalePercent(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[10px] font-mono text-blue-400 w-9 text-right font-semibold">
                  {currentScale}%
                </span>
              </div>
            </div>

            {/* Quick Scale Pills */}
            <div className="flex items-center justify-between gap-1 pt-1">
              {[50, 75, 100, 150, 200].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleScalePercent(pct)}
                  className={`flex-1 py-0.5 rounded text-[9px] font-mono transition text-center ${
                    currentScale === pct
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">{t.stitcher.opacityLabel}</span>
            <div className="flex items-center gap-2 flex-1 max-w-[130px]">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={selected.opacity ?? 1}
                onChange={(e) =>
                  onUpdateLayer(selected.id, { opacity: parseFloat(e.target.value) })
                }
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                {Math.round((selected.opacity ?? 1) * 100)}%
              </span>
            </div>
          </div>

          {/* Corner Radius & Shadow */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">{t.stitcher.cornerRadiusLabel}</span>
            <input
              type="range"
              min="0"
              max="60"
              value={selected.cornerRadius ?? 0}
              onChange={(e) =>
                onUpdateLayer(selected.id, { cornerRadius: parseInt(e.target.value, 10) })
              }
              className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <button
              onClick={() => onUpdateLayer(selected.id, { shadow: !selected.shadow })}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                selected.shadow ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {t.stitcher.shadowButton}
            </button>
          </div>

          {/* Z-Index Controls */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
            <span className="text-[10px] text-slate-400">{t.stitcher.layerOrderLabel}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onBringToFront(selected.id)}
                title={t.stitcher.bringToFrontTooltip}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition"
              >
                <ChevronsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onBringForward(selected.id)}
                title={t.stitcher.bringForwardTooltip}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSendBackward(selected.id)}
                title={t.stitcher.sendBackwardTooltip}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSendToBack(selected.id)}
                title={t.stitcher.sendToBackTooltip}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition"
              >
                <ChevronsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Alignments */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
            <span className="text-[10px] text-slate-400">{t.stitcher.alignmentLabel}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCenterHorizontal}
                title={t.stitcher.centerHTooltip}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCenterVertical}
                title={t.stitcher.centerVTooltip}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition"
              >
                <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFitCanvas}
                title={t.stitcher.fitCanvasTooltip}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFillCanvas}
                title={t.stitcher.fillCanvasTooltip}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetNaturalSize}
                title={t.stitcher.resetNaturalSizeTooltip}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layers List */}
      <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto pr-1">
        {sortedLayers.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <span>{t.stitcher.noLayersNotice}</span>
          </div>
        ) : (
          sortedLayers.map((layer) => {
            const isSelected = layer.id === selectedLayerId;
            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(isSelected ? null : layer.id)}
                className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500/80 shadow-sm'
                    : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-800'
                }`}
              >
                {/* Thumbnail & Name */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0">
                    <img
                      src={layer.src}
                      alt={layer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-medium ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>
                      {layer.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {layer.width} × {layer.height} • Z:{layer.zIndex}
                    </p>
                  </div>
                </div>

                {/* Quick actions (Visibility, Lock) */}
                <div
                  className="flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onToggleVisibility(layer.id)}
                    title={layer.isVisible ? t.stitcher.hideLayerTooltip : t.stitcher.showLayerTooltip}
                    className={`p-1 rounded hover:bg-slate-700 transition ${
                      layer.isVisible ? 'text-slate-400 hover:text-white' : 'text-slate-600'
                    }`}
                  >
                    {layer.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onToggleLock(layer.id)}
                    title={layer.isLocked ? t.stitcher.lockLayerTooltip : t.stitcher.unlockLayerTooltip}
                    className={`p-1 rounded hover:bg-slate-700 transition ${
                      layer.isLocked ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {layer.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
