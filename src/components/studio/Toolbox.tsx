'use client';

import React from 'react';
import {
  MousePointer,
  ArrowUpRight,
  Square,
  EyeOff,
  Type,
  Focus,
  Crop,
  Stamp,
  ChevronDown,
} from 'lucide-react';
import { StudioTool } from '@/types/studio';
import { useI18n } from '@/lib/i18n-context';

interface ToolboxProps {
  activeTool: StudioTool;
  setActiveTool: (tool: StudioTool) => void;
  stepCounter: number;
  stepColor: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  initDefaultCrop: () => void;
  cropRect: any;
}

export const Toolbox: React.FC<ToolboxProps> = ({
  activeTool,
  setActiveTool,
  stepCounter,
  stepColor,
  isCollapsed,
  onToggleCollapse,
  initDefaultCrop,
  cropRect,
}) => {
  const { t } = useI18n();

  const getToolLabel = (tool: StudioTool) => {
    switch (tool) {
      case 'select':
        return t.studio.toolSelect;
      case 'arrow':
        return t.studio.toolArrow;
      case 'step':
        return t.studio.toolStep.replace('{step}', String(stepCounter));
      case 'box':
        return t.studio.toolBox;
      case 'blur':
        return t.studio.toolBlur;
      case 'text':
        return t.studio.toolText;
      case 'spotlight':
        return t.studio.toolSpotlight;
      case 'crop':
        return t.studio.toolCrop;
      case 'watermark':
        return t.studio.toolWatermark;
      default:
        return t.studio.toolDefault;
    }
  };

  return (
    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between group cursor-pointer text-left select-none"
      >
        <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 transition">
          <span>{t.studio.drawingToolsHeader}</span>
        </span>
        <div className="flex items-center gap-1.5">
          {isCollapsed && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {getToolLabel(activeTool)}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
              isCollapsed ? '-rotate-90' : 'rotate-0'
            }`}
          />
        </div>
      </button>

      {!isCollapsed && (
        <div className="space-y-2 pt-0.5 animate-in fade-in duration-150">
          {/* Select / Move Pointer Tool */}
          <button
            onClick={() => setActiveTool('select')}
            className={`w-full py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title={t.studio.toolSelectDesc}
          >
            <MousePointer className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.studio.toolSelect}</span>
            <span className="text-[9px] font-mono px-1 rounded bg-black/30 opacity-75">V</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setActiveTool('arrow')}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition relative ${
                activeTool === 'arrow'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={t.studio.toolArrowDesc}
            >
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4 text-blue-400" />
                <span className="text-[9px] font-mono px-1 rounded bg-black/30 opacity-75">A</span>
              </div>
              <span>{t.studio.toolArrow}</span>
            </button>

            <button
              onClick={() => setActiveTool('step')}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition relative ${
                activeTool === 'step'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={t.studio.toolStepDesc}
            >
              <div className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: stepColor }}
                >
                  {stepCounter}
                </div>
                <span className="text-[9px] font-mono px-1 rounded bg-black/30 opacity-75">S</span>
              </div>
              <span>{t.studio.stepBadgeTool}</span>
            </button>

            <button
              onClick={() => setActiveTool('box')}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition relative ${
                activeTool === 'box'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={t.studio.toolBoxDesc}
            >
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-mono px-1 rounded bg-black/30 opacity-75">B</span>
              </div>
              <span>{t.studio.toolBox}</span>
            </button>

            <button
              onClick={() => setActiveTool('blur')}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition relative ${
                activeTool === 'blur'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={t.studio.toolBlurDesc}
            >
              <div className="flex items-center gap-1">
                <EyeOff className="w-4 h-4 text-purple-400" />
                <span className="text-[9px] font-mono px-1 rounded bg-black/30 opacity-75">M</span>
              </div>
              <span>{t.studio.toolBlur}</span>
            </button>

            <button
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition relative ${
                activeTool === 'text'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={t.studio.toolTextDesc}
            >
              <div className="flex items-center gap-1">
                <Type className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-mono px-1 rounded bg-black/30 opacity-75">T</span>
              </div>
              <span>{t.studio.toolText}</span>
            </button>

            <button
              onClick={() => setActiveTool('spotlight')}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition relative ${
                activeTool === 'spotlight'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={t.studio.toolSpotlightDesc}
            >
              <div className="flex items-center gap-1">
                <Focus className="w-4 h-4 text-cyan-400" />
                <span className="text-[9px] font-mono px-1 rounded bg-black/30 opacity-75">F</span>
              </div>
              <span>{t.studio.toolSpotlight}</span>
            </button>

            <button
              onClick={() => {
                setActiveTool('crop');
                if (!cropRect) initDefaultCrop();
              }}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition relative ${
                activeTool === 'crop'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={t.studio.toolCropDesc}
            >
              <div className="flex items-center gap-1">
                <Crop className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-mono px-1 rounded bg-black/30 opacity-75">C</span>
              </div>
              <span>{t.studio.toolCrop}</span>
            </button>

            <button
              onClick={() => setActiveTool('watermark')}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition relative ${
                activeTool === 'watermark'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={t.studio.toolWatermarkDesc}
            >
              <div className="flex items-center gap-1">
                <Stamp className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-mono px-1 rounded bg-black/30 opacity-75">W</span>
              </div>
              <span>{t.studio.toolWatermark}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
