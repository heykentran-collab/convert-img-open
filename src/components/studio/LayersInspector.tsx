'use client';

import React from 'react';
import {
  Layers,
  ArrowUpRight,
  Square,
  EyeOff,
  Type,
  Focus,
  Trash2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface LayersInspectorProps {
  annotationLayers: any[];
  selectedAnnotationId: string | null;
  onSelectLayer: (id: string | null) => void;
  onHoverLayer: (id: string | null) => void;
  onDeleteLayer: (id: string, type: any) => void;
  onClearAll: () => void;
}

export const LayersInspector: React.FC<LayersInspectorProps> = ({
  annotationLayers,
  selectedAnnotationId,
  onSelectLayer,
  onHoverLayer,
  onDeleteLayer,
  onClearAll,
}) => {
  const { t } = useI18n();

  return (
    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            {t.studio.layersHeader}
          </span>
          {annotationLayers.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
              {annotationLayers.length}
            </span>
          )}
        </div>
        {annotationLayers.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
            title={t.studio.clearAllLayersTooltip}
          >
            {t.studio.clearAllLayers}
          </button>
        )}
      </div>

      {annotationLayers.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-400 font-medium">{t.studio.emptyLayersTitle}</p>
          <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto">
            {t.studio.emptyLayersDesc}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {[...annotationLayers].reverse().map((h) => {
              const isSelected = selectedAnnotationId === h.item.id;
              return (
                <div
                  key={h.item.id}
                  onClick={() => onSelectLayer(isSelected ? null : h.item.id)}
                  onMouseEnter={() => onHoverLayer(h.item.id)}
                  onMouseLeave={() => onHoverLayer(null)}
                  className={`p-2 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition border ${
                    isSelected
                      ? 'bg-blue-950/70 border-blue-500/70 text-white shadow-sm ring-1 ring-blue-500/50'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {h.type === 'step' && (
                      <div
                        className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: h.item.color }}
                      >
                        {h.item.num}
                      </div>
                    )}
                    {h.type === 'arrow' && (
                      <ArrowUpRight
                        className="w-4 h-4 shrink-0"
                        style={{ color: h.item.color }}
                      />
                    )}
                    {h.type === 'box' && (
                      <Square
                        className="w-4 h-4 shrink-0"
                        style={{ color: h.item.color }}
                      />
                    )}
                    {h.type === 'blur' && (
                      <EyeOff className="w-4 h-4 text-purple-400 shrink-0" />
                    )}
                    {h.type === 'text' && (
                      <Type className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    {h.type === 'spotlight' && (
                      <Focus className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}

                    <span className="truncate">
                      {h.type === 'step' &&
                        t.studio.stepLayerName.replace('{num}', String(h.item.num))}
                      {h.type === 'arrow' &&
                        t.studio.arrowLayerName.replace(
                          '{style}',
                          h.item.isCurved ? t.studio.arrowCurved : t.studio.arrowStraight
                        )}
                      {h.type === 'box' && t.studio.boxLayerName}
                      {h.type === 'blur' && t.studio.blurLayerName}
                      {h.type === 'text' && `"${h.item.text}"`}
                      {h.type === 'spotlight' && t.studio.spotlightLayerName}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(h.item.id, h.type);
                    }}
                    title={t.studio.deleteLayerTooltip}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500 pt-1 text-center">
            {t.studio.layersHint}
          </p>
        </>
      )}
    </div>
  );
};
