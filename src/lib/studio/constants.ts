import { BackgroundPreset, BackgroundType, ShadowIntensity, AspectRatioPreset } from '@/types/studio';

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'purple-blue',
    name: 'Cosmic Indigo',
    type: 'gradient',
    value: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    stops: ['#6366f1', '#a855f7'],
  },
  {
    id: 'sunset',
    name: 'Sunset Pink',
    type: 'gradient',
    value: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
    stops: ['#f97316', '#ec4899', '#8b5cf6'],
  },
  {
    id: 'ocean',
    name: 'Ocean Cyan',
    type: 'gradient',
    value: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #0d9488 100%)',
    stops: ['#06b6d4', '#3b82f6', '#0d9488'],
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    type: 'gradient',
    value: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    stops: ['#10b981', '#047857'],
  },
  {
    id: 'dark-cosmic',
    name: 'Midnight Slate',
    type: 'gradient',
    value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
    stops: ['#0f172a', '#1e1b4b', '#312e81'],
  },
  {
    id: 'candy',
    name: 'Peach Candy',
    type: 'gradient',
    value: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
    stops: ['#f43f5e', '#fb923c'],
  },
];

export const SOLID_PRESETS = [
  { label: 'Slate', color: '#0f172a' },
  { label: 'Dark Studio', color: '#1e293b' },
  { label: 'Pure Black', color: '#000000' },
  { label: 'Light Studio', color: '#f8fafc' },
  { label: 'Pure White', color: '#ffffff' },
];

export const DEFAULT_STUDIO_SETTINGS = {
  canvasPadding: 0,
  backgroundType: 'transparent' as BackgroundType,
  backgroundPresetId: 'purple-blue',
  customSolidColor: '#0f172a',
  shadowIntensity: 'none' as ShadowIntensity,
  cornerRadius: 0,
  aspectRatio: 'auto' as AspectRatioPreset,
  frameType: 'none' as 'macos' | 'browser' | 'none',
  browserUrl: 'https://volticen.com/dashboard',
};
