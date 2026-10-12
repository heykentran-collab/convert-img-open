export interface MultiSizeTarget {
  id: string; // unique ID or preset id or custom
  name: string; // e.g. 'Feature Image (1200×630)'
  nameEn?: string;
  width: number | 'original';
  height?: number;
  folderName: string; // e.g. '1200px_feature'
  badge?: string; // e.g. 'Facebook / Blog'
  badgeEn?: string;
  ratio?: string; // e.g. '1.91:1'
}

export interface PresetBundle {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  targets: MultiSizeTarget[];
  isBuiltIn?: boolean;
}

export interface ConvertedVariant {
  id: string;
  label: string;
  width: number;
  height: number;
  blob: Blob;
  url: string;
  size: number;
  seoName: string;
  folderName: string;
}

export interface ImageItem {
  id: string;
  originalFile: File;
  originalName: string;
  originalSize: number;
  originalFormat: string;
  previewUrl: string;
  width: number;
  height: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  convertedSize: number;
  convertedWidth: number;
  convertedHeight: number;
  convertedFormat: string;
  seoName: string;
  variants?: ConvertedVariant[];
  error?: string;
}

