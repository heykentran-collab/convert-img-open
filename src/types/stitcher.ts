/**
 * Types and interfaces for the Volticen Stitcher Module
 * Highly decoupled and modular design for multi-layer collage and stitching
 */

export interface StitcherLayer {
  id: string;
  name: string;
  blob?: Blob;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees (0 - 360)
  opacity: number; // 0 to 1
  zIndex: number;
  isLocked: boolean;
  isVisible: boolean;
  aspectRatio: number; // naturalWidth / naturalHeight
  cornerRadius?: number; // 0 - 100
  shadow?: boolean;
}

export type StitchMode = 'freeform' | 'grid' | 'strip-h' | 'strip-v';

export type CanvasPreset =
  | 'auto'
  | '16:9'
  | '1:1'
  | '4:3'
  | '3:4'
  | '9:16'
  | 'facebook-post'
  | 'facebook-cover'
  | 'youtube-thumb'
  | 'shopee-main'
  | 'shopee-variant'
  | 'tiktok-fashion'
  | 'lazada-main'
  | 'amazon-hero'
  | 'shopify-product'
  | 'etsy-listing'
  | 'custom'
  | (string & {});

export interface CanvasConfig {
  width: number;
  height: number;
  preset: CanvasPreset;
  backgroundType: 'color' | 'transparent' | 'gradient';
  backgroundColor: string;
  backgroundGradient: string;
  padding: number;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
}

export interface GridSettings {
  columns: number;
  gap: number;
  cornerRadius: number;
  padding: number;
  fitMode: 'cover' | 'contain';
  autoCanvasSize: boolean;
}

export type TransformHandle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | 'rot';

export interface SnapLine {
  type: 'x' | 'y';
  pos: number;
}

export interface StitcherSessionData {
  layers: StitcherLayer[];
  canvasConfig: CanvasConfig;
  gridSettings: GridSettings;
  mode: StitchMode;
  updatedAt: number;
}
