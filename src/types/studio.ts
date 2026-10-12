export type StudioTool =
  | 'arrow'
  | 'step'
  | 'box'
  | 'blur'
  | 'text'
  | 'spotlight'
  | 'crop'
  | 'watermark'
  | 'select';

export type CropRatio = 'free' | '1:1' | '3:4' | '16:9' | '4:3' | '9:16' | '1200:630';

export interface StepBadge {
  id: string;
  x: number;
  y: number;
  num: number;
  color: string;
}

export interface ArrowAnnotation {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width: number;
  isCurved?: boolean;
}

export interface BoxAnnotation {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  isDashed: boolean;
  strokeWidth?: number;
}

export interface BlurAnnotation {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  hasBackdrop: boolean;
}

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'tile-pattern';

export type WatermarkStyle = 'pill' | 'shadow' | 'clean' | 'outline';

export interface WatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image';
  text: string;
  imageSrc?: string;
  color: string;
  opacity: number; // 0.1 to 1.0
  size: number;
  position: WatermarkPosition;
  style: WatermarkStyle;
}

export interface SpotlightAnnotation {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type BackgroundType = 'gradient' | 'solid' | 'transparent';

export type ShadowIntensity = 'none' | 'soft' | 'medium' | 'heavy';

export type AspectRatioPreset = 'auto' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16';

export interface BackgroundPreset {
  id: string;
  name: string;
  type: BackgroundType;
  value: string;
  stops?: string[];
}

export type HistoryAction =
  | { type: 'arrow'; item: ArrowAnnotation }
  | { type: 'step'; item: StepBadge }
  | { type: 'box'; item: BoxAnnotation }
  | { type: 'blur'; item: BlurAnnotation }
  | { type: 'text'; item: TextAnnotation }
  | { type: 'spotlight'; item: SpotlightAnnotation }
  | {
      type: 'image-transform';
      label: string;
      prevImageSrc: string;
      nextImageSrc: string;
      prevAnnotations: {
        stepBadges: StepBadge[];
        arrows: ArrowAnnotation[];
        boxes: BoxAnnotation[];
        blurs: BlurAnnotation[];
        texts: TextAnnotation[];
        spotlights: SpotlightAnnotation[];
      };
      nextAnnotations: {
        stepBadges: StepBadge[];
        arrows: ArrowAnnotation[];
        boxes: BoxAnnotation[];
        blurs: BlurAnnotation[];
        texts: TextAnnotation[];
        spotlights: SpotlightAnnotation[];
      };
    };

export type StudioAnnotationItem =
  | StepBadge
  | ArrowAnnotation
  | BoxAnnotation
  | BlurAnnotation
  | TextAnnotation
  | SpotlightAnnotation;

export type StudioAnnotationUpdates = Partial<
  StepBadge & ArrowAnnotation & BoxAnnotation & BlurAnnotation & TextAnnotation & SpotlightAnnotation
>;


