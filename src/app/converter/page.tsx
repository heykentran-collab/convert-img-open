'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Download,
  FolderArchive,
  Wand2,
  Code,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Play,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  Sliders,
  Layers,
  Zap,
  Store,
  X,
  LayoutGrid,
  List,
  Plus,
  FileImage,
  HardDrive,
  Cloud,
  FolderCheck,
  UploadCloud,
} from 'lucide-react';
import JSZip from 'jszip';
import { PresetPickerModal } from '@/components/presets';
import { EcommercePreset } from '@/types/presets';
import { getLocalizedPreset } from '@/lib/constants/ecommerce-presets';
import {
  saveConverterQueue,
  loadConverterQueue,
  clearConverterQueue,
  updateOrAddConverterItemBlob,
} from '@/lib/converter-storage';
import { saveStudioActiveSession } from '@/lib/studio-storage';
import {
  ImageComparisonModal,
  MultiSizeControl,
  QueueGridCard,
  QueueTableRow,
  WatermarkControl,
} from '@/components/converter';
import { MultiSizeTarget, ConvertedVariant, ImageItem } from '@/types/multi-size';
import { WatermarkConfig } from '@/types/studio';
import { renderWatermark } from '@/lib/studio/renderers/renderWatermark';
import { BUILTIN_BUNDLES } from '@/lib/user-preset-storage';
import {
  getStorageSettings,
  getStoredDirectoryHandle,
  saveFileToLocalDirectory,
} from '@/lib/storage-settings';
import { r2Fetch } from '@/lib/r2-api-client';
import { UnifiedStorageSettings } from '@/types/storage';
import { useI18n } from '@/lib/i18n-context';

export default function ConverterPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState<boolean>(false);
  const [targetFormat, setTargetFormat] = useState<'webp' | 'avif' | 'png' | 'jpeg'>('webp');
  const [quality, setQuality] = useState<number>(88);
  const [maxWidth, setMaxWidth] = useState<string>('original');
  const [slugTitle, setSlugTitle] = useState<string>('');
  const [autoConvert, setAutoConvert] = useState<boolean>(false);
  const [processingAll, setProcessingAll] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [comparingItemId, setComparingItemId] = useState<string | null>(null);
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<EcommercePreset | null>(null);
  const [isMultiSize, setIsMultiSize] = useState<boolean>(false);
  const [multiSizeTargets, setMultiSizeTargets] = useState<MultiSizeTarget[]>(
    () => BUILTIN_BUNDLES[0].targets
  );
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [storageSettings, setStorageSettings] = useState<UnifiedStorageSettings>(getStorageSettings);
  const [isSavingLocal, setIsSavingLocal] = useState<boolean>(false);
  const [localSaveFeedback, setLocalSaveFeedback] = useState<string | null>(null);
  const [isUploadingCloud, setIsUploadingCloud] = useState<boolean>(false);
  const [cloudUploadFeedback, setCloudUploadFeedback] = useState<string | null>(null);

  // Watermark Configuration with SSR-safe persistence
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
    enabled: false,
    type: 'text',
    text: '© Volticen',
    color: '#ffffff',
    opacity: 0.75,
    size: 20,
    position: 'bottom-right',
    style: 'pill',
  });

  // Load saved watermark config on client mount to avoid SSR hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem('volticen_converter_watermark');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setWatermarkConfig((prev) => ({
            ...prev,
            ...parsed,
            text: typeof parsed.text === 'string' ? parsed.text : (prev.text || '© Volticen'),
            color: typeof parsed.color === 'string' ? parsed.color : (prev.color || '#ffffff'),
            size: typeof parsed.size === 'number' ? parsed.size : (prev.size || 20),
            opacity: typeof parsed.opacity === 'number' ? parsed.opacity : (prev.opacity ?? 0.75),
            style: parsed.style || prev.style || 'pill',
            position: parsed.position || prev.position || 'bottom-right',
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load saved watermark config:', e);
    }
  }, []);

  const handleUpdateWatermarkConfig = useCallback((updates: Partial<WatermarkConfig>) => {
    setWatermarkConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('volticen_converter_watermark', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist watermark config:', e);
      }
      return next;
    });
  }, []);

  const [watermarkLogoImg, setWatermarkLogoImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (watermarkConfig.enabled && watermarkConfig.type === 'image' && watermarkConfig.imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setWatermarkLogoImg(img);
      img.onerror = () => setWatermarkLogoImg(null);
      img.src = watermarkConfig.imageSrc;
    } else {
      setWatermarkLogoImg(null);
    }
  }, [watermarkConfig.enabled, watermarkConfig.type, watermarkConfig.imageSrc]);

  useEffect(() => {
    const handleUpdate = () => setStorageSettings(getStorageSettings());
    window.addEventListener('storage_settings_updated', handleUpdate);
    return () => window.removeEventListener('storage_settings_updated', handleUpdate);
  }, []);

  const comparingItem = items.find((i) => i.id === comparingItemId) || null;

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map((it) => it.id));
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<ImageItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Cleanup all Object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
        if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl);
      });
    };
  }, []);

  // Restore persisted queue from IndexedDB on mount & window focus
  const restoreQueue = useCallback(async () => {
    try {
      const stored = await loadConverterQueue();
      if (stored && stored.length > 0) {
        // Clean up previously created URLs before recreating new ones
        itemsRef.current.forEach((it) => {
          if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
          if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl);
        });

        const restored: ImageItem[] = stored.map((st) => {
          const fileName = st.originalName || (st.originalFile as File)?.name || 'image.png';
          const fileObj =
            st.originalFile instanceof File && st.originalFile.name
              ? st.originalFile
              : new File([st.originalFile], fileName, {
                  type: (st.originalFile as any).type || 'image/png',
                });

          return {
            ...st,
            originalFile: fileObj,
            originalName: fileName,
            previewUrl: URL.createObjectURL(fileObj),
            convertedUrl: st.convertedBlob ? URL.createObjectURL(st.convertedBlob) : null,
          };
        });
        setItems(restored);
      } else {
        itemsRef.current.forEach((it) => {
          if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
          if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl);
        });
        setItems([]);
      }
    } catch (e) {
      console.warn('Failed to restore queue from IndexedDB', e);
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    restoreQueue();
    // Auto re-sync when switching back from Studio or other tabs
    const handleFocus = () => restoreQueue();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [restoreQueue]);

  // Debounced Save to IndexedDB whenever items change (prevents disk & RAM thrashing during batch operations)
  useEffect(() => {
    if (!isStorageLoaded) return;
    const timer = setTimeout(() => {
      saveConverterQueue(
        items.map((it) => ({
          id: it.id,
          originalFile: it.originalFile,
          originalName: it.originalName,
          originalSize: it.originalSize,
          originalFormat: it.originalFormat,
          width: it.width,
          height: it.height,
          status: it.status,
          convertedBlob: it.convertedBlob,
          convertedSize: it.convertedSize,
          convertedWidth: it.convertedWidth,
          convertedHeight: it.convertedHeight,
          convertedFormat: it.convertedFormat,
          seoName: it.seoName,
        }))
      );
    }, 1200);

    return () => clearTimeout(timer);
  }, [items, isStorageLoaded]);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const getFormattedName = (
    originalName?: string,
    index = 0,
    format = 'webp',
    slug?: string
  ): string => {
    const ext = format === 'jpeg' ? 'jpg' : format;
    const cleanSlug = slug ? slugify(slug) : '';
    if (cleanSlug) {
      const paddedIndex = String(index + 1).padStart(2, '0');
      return `${cleanSlug}-${paddedIndex}.${ext}`;
    }
    const safeName = (originalName || 'image.png').trim();
    const lastDot = safeName.lastIndexOf('.');
    const baseName = lastDot > 0 ? safeName.substring(0, lastDot) : safeName;
    return `${baseName}.${ext}`;
  };

  const handleSlugTitleChange = (newSlug: string) => {
    setSlugTitle(newSlug);
    setItems((prev) =>
      prev.map((it, idx) => ({
        ...it,
        seoName: getFormattedName(
          it.originalName,
          idx,
          it.status === 'done' ? it.convertedFormat : targetFormat,
          newSlug
        ),
      }))
    );
  };

  const handleTargetFormatChange = (fmt: 'webp' | 'avif' | 'png' | 'jpeg') => {
    setTargetFormat(fmt);
    setItems((prev) =>
      prev.map((it, idx) => {
        if (it.status === 'pending') {
          return {
            ...it,
            convertedFormat: fmt,
            seoName: getFormattedName(it.originalName, idx, fmt, slugTitle),
          };
        }
        return it;
      })
    );
  };

  const getFormatFromType = (type: string, name: string): string => {
    if (type.includes('webp')) return 'webp';
    if (type.includes('png')) return 'png';
    if (type.includes('jpeg') || type.includes('jpg')) return 'jpeg';
    if (type.includes('avif')) return 'avif';
    if (type.includes('gif')) return 'gif';
    if (type.includes('svg')) return 'svg';
    const ext = name.split('.').pop()?.toLowerCase();
    return ext || 'img';
  };

  // Convert a single image canvas with Zero-Retention Canvas optimization
  const convertCanvas = async (
    file: File | Blob,
    index: number,
    format: 'webp' | 'avif' | 'png' | 'jpeg',
    q: number,
    maxWParam: string,
    slug: string,
    maxHParam?: number,
    fallbackFileName?: string,
    wmConfig: WatermarkConfig = watermarkConfig,
    logoImg?: HTMLImageElement | null
  ): Promise<{
    blob: Blob;
    url: string;
    width: number;
    height: number;
    seoName: string;
  }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const tempUrl = URL.createObjectURL(file);
      img.src = tempUrl;

      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        const maxW = maxWParam === 'original' ? w : parseInt(maxWParam, 10);
        const maxH = maxHParam && !isNaN(maxHParam) ? maxHParam : Infinity;

        if (w > maxW || h > maxH) {
          const scale = Math.min(maxW / w, maxH / h);
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(tempUrl);
          reject(new Error('Cannot create 2d canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);

        // Apply watermark if enabled (Exact WYSIWYG pixels)
        if (wmConfig && wmConfig.enabled) {
          renderWatermark(ctx, wmConfig, 0, 0, w, h, 0, logoImg, 1);
        }

        const mimeType =
          format === 'webp'
            ? 'image/webp'
            : format === 'avif'
            ? 'image/avif'
            : format === 'png'
            ? 'image/png'
            : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            // Immediate cleanup
            URL.revokeObjectURL(tempUrl);
            const convertedBlob = blob || file;
            const convertedUrl = URL.createObjectURL(convertedBlob);
            const sourceName = (file as File)?.name || fallbackFileName || 'image.png';
            const seoName = getFormattedName(sourceName, index, format, slug);

            // Zero-Retention: Release Canvas bitmap buffer from GPU/RAM
            canvas.width = 0;
            canvas.height = 0;
            ctx.clearRect(0, 0, 0, 0);

            resolve({
              blob: convertedBlob,
              url: convertedUrl,
              width: w,
              height: h,
              seoName,
            });
          },
          mimeType,
          q / 100
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        reject(new Error('Lỗi nạp ảnh vào canvas'));
      };
    });
  };

  // Convert a single item in queue
  const convertSingleItem = async (
    item: ImageItem,
    index: number,
    format = targetFormat,
    q = quality,
    maxW = maxWidth,
    slug = slugTitle,
    maxH = activePreset?.height
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: 'processing' } : it))
    );

    // Preload logo if watermark is image
    let logoImg: HTMLImageElement | null = null;
    if (watermarkConfig.enabled && watermarkConfig.type === 'image' && watermarkConfig.imageSrc) {
      try {
        logoImg = await new Promise<HTMLImageElement>((res, rej) => {
          const lImg = new Image();
          lImg.crossOrigin = 'anonymous';
          lImg.onload = () => res(lImg);
          lImg.onerror = () => res(lImg);
          lImg.src = watermarkConfig.imageSrc!;
        });
      } catch (e) {
        console.warn('Failed to preload logo image for watermark:', e);
      }
    }

    try {
      if (isMultiSize && multiSizeTargets.length > 0) {
        // Multi-size conversion: generate all targets
        const variants: ConvertedVariant[] = [];
        for (const target of multiSizeTargets) {
          const targetW = target.width === 'original' ? 'original' : String(target.width);
          const res = await convertCanvas(
            item.originalFile,
            index,
            format,
            q,
            targetW,
            slug,
            target.height,
            item.originalName,
            watermarkConfig,
            logoImg
          );
          const baseName = res.seoName.replace(/\.[^/.]+$/, '');
          const sizeLabel =
            target.width === 'original'
              ? 'orig'
              : `${target.width}${target.height ? `x${target.height}` : ''}`;
          variants.push({
            id: target.id,
            label: target.name,
            width: res.width,
            height: res.height,
            blob: res.blob,
            url: res.url,
            size: res.blob.size,
            seoName: `${baseName}_${sizeLabel}.${format}`,
            folderName: target.folderName || `${sizeLabel}_variant`,
          });
        }

        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== item.id) return it;
            if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl);
            if (it.variants) {
              it.variants.forEach((v) => {
                if (v.url !== it.convertedUrl) URL.revokeObjectURL(v.url);
              });
            }
            const primary = variants[0];
            return {
              ...it,
              status: 'done',
              convertedBlob: primary ? primary.blob : null,
              convertedUrl: primary ? primary.url : null,
              convertedSize: variants.reduce((acc, v) => acc + v.size, 0),
              convertedWidth: primary ? primary.width : it.width,
              convertedHeight: primary ? primary.height : it.height,
              convertedFormat: format,
              seoName: primary ? primary.seoName : item.originalName,
              variants,
              error: undefined,
            };
          })
        );
        return;
      }

      // Single size conversion
      const res = await convertCanvas(
        item.originalFile,
        index,
        format,
        q,
        maxW,
        slug,
        maxH,
        item.originalName,
        watermarkConfig,
        logoImg
      );
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== item.id) return it;
          if (it.convertedUrl) {
            URL.revokeObjectURL(it.convertedUrl);
          }
          if (it.variants) {
            it.variants.forEach((v) => {
              if (v.url !== it.convertedUrl) URL.revokeObjectURL(v.url);
            });
          }
          return {
            ...it,
            status: 'done',
            convertedBlob: res.blob,
            convertedUrl: res.url,
            convertedSize: res.blob.size,
            convertedWidth: res.width,
            convertedHeight: res.height,
            convertedFormat: format,
            seoName: res.seoName,
            variants: undefined,
            error: undefined,
          };
        })
      );
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: 'error', error: err.message } : it
        )
      );
    }
  };

  // Convert all items in queue with GC Breathing Room (low-RAM friendly)
  const convertAllItems = async () => {
    if (items.length === 0) return;
    setProcessingAll(true);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      await convertSingleItem(it, i, targetFormat, quality, maxWidth, slugTitle);
      // Yield to main thread & allow browser Garbage Collector to flush memory
      if (i < items.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    }

    setProcessingAll(false);
  };

  // Handle files dropped / selected / pasted
  const handleFilesAdded = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;
      const fileList = Array.from(files).filter(
        (f) =>
          (f.type && f.type.startsWith('image/')) ||
          /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico|jfif|heic)$/i.test(f.name)
      );
      if (fileList.length === 0) return;

      const newItems: ImageItem[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const previewUrl = URL.createObjectURL(file);
        const ext = getFormatFromType(file.type, file.name);

        // Read dimensions quickly
        const { w, h } = await new Promise<{ w: number; h: number }>((res) => {
          const testImg = new Image();
          testImg.src = previewUrl;
          testImg.onload = () => res({ w: testImg.naturalWidth, h: testImg.naturalHeight });
          testImg.onerror = () => res({ w: 0, h: 0 });
        });

        const id = Math.random().toString(36).slice(2);
        const seoName = getFormattedName(file.name, items.length + i, targetFormat, slugTitle);

        newItems.push({
          id,
          originalFile: file,
          originalName: file.name,
          originalSize: file.size,
          originalFormat: ext,
          previewUrl,
          width: w,
          height: h,
          status: 'pending',
          convertedBlob: null,
          convertedUrl: null,
          convertedSize: 0,
          convertedWidth: w,
          convertedHeight: h,
          convertedFormat: targetFormat,
          seoName,
        });
      }

      if (autoConvert) {
        // Auto convert if toggle is ON
        setProcessingAll(true);

        let logoImg: HTMLImageElement | null = null;
        if (watermarkConfig.enabled && watermarkConfig.type === 'image' && watermarkConfig.imageSrc) {
          try {
            logoImg = await new Promise<HTMLImageElement>((res) => {
              const lImg = new Image();
              lImg.crossOrigin = 'anonymous';
              lImg.onload = () => res(lImg);
              lImg.onerror = () => res(lImg);
              lImg.src = watermarkConfig.imageSrc!;
            });
          } catch (e) {
            console.warn('Failed to preload logo for autoConvert:', e);
          }
        }

        const processed: ImageItem[] = [];
        for (let i = 0; i < newItems.length; i++) {
          const it = newItems[i];
          if (isMultiSize && multiSizeTargets.length > 0) {
            const variants: ConvertedVariant[] = [];
            for (const target of multiSizeTargets) {
              const targetW = target.width === 'original' ? 'original' : String(target.width);
              const res = await convertCanvas(
                it.originalFile,
                items.length + i,
                targetFormat,
                quality,
                targetW,
                slugTitle,
                target.height,
                it.originalName,
                watermarkConfig,
                logoImg
              );
              const baseName = res.seoName.replace(/\.[^/.]+$/, '');
              const sizeLabel =
                target.width === 'original'
                  ? 'orig'
                  : `${target.width}${target.height ? `x${target.height}` : ''}`;
              variants.push({
                id: target.id,
                label: target.name,
                width: res.width,
                height: res.height,
                blob: res.blob,
                url: res.url,
                size: res.blob.size,
                seoName: `${baseName}_${sizeLabel}.${targetFormat}`,
                folderName: target.folderName || `${sizeLabel}_variant`,
              });
            }
            const primary = variants[0];
            processed.push({
              ...it,
              status: 'done',
              convertedBlob: primary ? primary.blob : null,
              convertedUrl: primary ? primary.url : null,
              convertedSize: variants.reduce((acc, v) => acc + v.size, 0),
              convertedWidth: primary ? primary.width : it.width,
              convertedHeight: primary ? primary.height : it.height,
              convertedFormat: targetFormat,
              seoName: primary ? primary.seoName : it.originalName,
              variants,
            });
          } else {
            const res = await convertCanvas(
              it.originalFile,
              items.length + i,
              targetFormat,
              quality,
              maxWidth,
              slugTitle,
              activePreset?.height,
              it.originalName,
              watermarkConfig,
              logoImg
            );
            processed.push({
              ...it,
              status: 'done',
              convertedBlob: res.blob,
              convertedUrl: res.url,
              convertedSize: res.blob.size,
              convertedWidth: res.width,
              convertedHeight: res.height,
              convertedFormat: targetFormat,
              seoName: res.seoName,
            });
          }
          // Yield to main thread for GC
          if (i < newItems.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 40));
          }
        }
        setItems((prev) => [...prev, ...processed]);
        setProcessingAll(false);
      } else {
        // Just stage files into queue
        setItems((prev) => [...prev, ...newItems]);
      }
    },
    [
      autoConvert,
      items.length,
      targetFormat,
      quality,
      maxWidth,
      slugTitle,
      convertCanvas,
      getFormattedName,
      isMultiSize,
      multiSizeTargets,
      activePreset,
    ]
  );

  // Clipboard Paste support (Ctrl+V) in Bulk Convert
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;
      const files: File[] = [];
      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.startsWith('image/')) {
          const file = clipboardItems[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        handleFilesAdded(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFilesAdded]);

  const removeItem = (id: string) => {
    const target = items.find((it) => it.id === id);
    if (target) {
      if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target.convertedUrl) URL.revokeObjectURL(target.convertedUrl);
      if (target.variants) {
        target.variants.forEach((v) => {
          if (v.url !== target.convertedUrl) URL.revokeObjectURL(v.url);
        });
      }
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    setSelectedItemIds((prev) => prev.filter((i) => i !== id));
  };

  const downloadSingle = async (item: ImageItem) => {
    if (item.variants && item.variants.length > 1) {
      // Mini-ZIP for all multi-size variants of this single image
      try {
        const zip = new JSZip();
        item.variants.forEach((v) => {
          zip.file(`${v.folderName}/${v.seoName}`, v.blob);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        const baseName = item.originalName.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}-multi-sizes.zip`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch (e) {
        console.error('Error creating mini zip', e);
      }
      return;
    }

    const a = document.createElement('a');
    if (item.convertedUrl) {
      a.href = item.convertedUrl;
      a.download = item.seoName;
    } else {
      a.href = item.previewUrl;
      a.download = item.originalName;
    }
    a.click();
  };

  const downloadAllZip = async (chunkIndex?: number) => {
    if (items.length === 0) return;
    setIsZipping(true);

    try {
      const CHUNK_SIZE = 30;
      let targetItems = items;
      let chunkSuffix = '';

      if (typeof chunkIndex === 'number') {
        const start = chunkIndex * CHUNK_SIZE;
        targetItems = items.slice(start, start + CHUNK_SIZE);
        chunkSuffix = `-part${chunkIndex + 1}`;
      } else if (items.length > 50) {
        // Warning if queue is very large without chunking
        const proceed = confirm(
          `Bạn đang tải ${items.length} file nén cùng lúc. Điều này có thể tốn nhiều RAM của trình duyệt.\n\nBấm "OK" để tiếp tục tải toàn bộ hoặc bấm "Cancel" để tải an toàn theo từng nhóm nhỏ.`
        );
        if (!proceed) {
          setIsZipping(false);
          return;
        }
      }

      const zip = new JSZip();
      targetItems.forEach((item) => {
        if (item.variants && item.variants.length > 0) {
          // Put each variant in its designated folder
          item.variants.forEach((v) => {
            zip.file(`${v.folderName}/${v.seoName}`, v.blob);
          });
        } else if (item.convertedBlob) {
          zip.file(item.seoName, item.convertedBlob);
        } else {
          zip.file(item.originalName, item.originalFile);
        }
      });

      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      const cleanSlug = slugify(slugTitle);
      a.download = cleanSlug
        ? `${cleanSlug}-optimized${chunkSuffix}.zip`
        : `converted-images${chunkSuffix}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      alert('Không thể tạo file nén ZIP. Vui lòng thử tải từng ảnh hoặc chia nhỏ danh sách.');
    } finally {
      setIsZipping(false);
    }
  };

  const clearAll = async () => {
    items.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl);
      if (it.variants) {
        it.variants.forEach((v) => {
          if (v.url !== it.convertedUrl) URL.revokeObjectURL(v.url);
        });
      }
    });
    setItems([]);
    setSelectedItemIds([]);
    await clearConverterQueue();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('studio_active_image');
      sessionStorage.removeItem('studio_image_key');
      sessionStorage.removeItem('studio_source');
      sessionStorage.removeItem('studio_converter_id');
    }
  };

  const handleSendToStudio = async (it: ImageItem) => {
    const rawBlob = it.convertedBlob || it.originalFile;
    const targetName = it.seoName || it.originalName || 'converter-image.png';

    try {
      // 1. Immediately persist to Studio active session in IndexedDB
      await saveStudioActiveSession(rawBlob, {
        name: targetName,
        sourceKey: targetName,
        sourceType: 'converter',
        converterId: it.id,
      });

      // 2. Also ensure it's saved in Converter IndexedDB
      await updateOrAddConverterItemBlob(it.id, rawBlob, targetName, it.width, it.height);
    } catch (e) {
      console.warn('Failed to pre-save before Studio navigation:', e);
    }

    // 3. Set sessionStorage flags for studio
    sessionStorage.setItem('studio_image_key', targetName);
    sessionStorage.setItem('studio_source', 'converter');
    sessionStorage.setItem('studio_converter_id', it.id);
    sessionStorage.removeItem('studio_active_image');

    // 4. Navigate cleanly without transient/revoked blob URL in searchParams
    router.push(`/studio?source=converter&converterId=${encodeURIComponent(it.id)}`);
  };

  const copyHtmlTag = (item: ImageItem) => {
    const w = item.convertedWidth || item.width;
    const h = item.convertedHeight || item.height;
    const safeOrigName = item.originalName || 'image.png';
    const name = item.seoName || safeOrigName;
    const lastDot = safeOrigName.lastIndexOf('.');
    const baseName = lastDot > 0 ? safeOrigName.substring(0, lastDot) : safeOrigName;
    const alt = slugTitle.trim() || baseName.replace(/[-_]/g, ' ');
    const settings = getStorageSettings();
    const domain = (settings.cloudStorage?.publicDomain || '').replace(/\/+$/, '');
    const imgUrl = domain ? `${domain}/${name}` : `/${name}`;
    const html = `<img src="${imgUrl}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async">`;
    navigator.clipboard.writeText(html);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveAllToLocalFolder = async () => {
    const doneItems = items.filter((it) => it.status === 'done' && it.convertedBlob);
    if (doneItems.length === 0) {
      alert(t.converter.noDoneItemsLocalAlert);
      return;
    }

    setIsSavingLocal(true);
    setLocalSaveFeedback(null);
    try {
      const handle = await getStoredDirectoryHandle();
      if (!handle) {
        alert(t.converter.noLocalFolderConfiguredAlert);
        return;
      }

      let savedCount = 0;
      for (const it of doneItems) {
        if (!it.convertedBlob) continue;
        if (it.variants && it.variants.length > 0) {
          for (const v of it.variants) {
            await saveFileToLocalDirectory(v.seoName, v.blob, handle);
          }
        } else {
          const fileName = it.seoName || it.originalName;
          await saveFileToLocalDirectory(fileName, it.convertedBlob, handle);
        }
        savedCount++;
      }

      setLocalSaveFeedback(t.converter.savedLocalSuccess.replace('{count}', String(savedCount)));
      setTimeout(() => setLocalSaveFeedback(null), 3000);
    } catch (err: any) {
      alert(t.converter.saveLocalError + err.message);
    } finally {
      setIsSavingLocal(false);
    }
  };

  const uploadAllToCloud = async () => {
    const doneItems = items.filter((it) => it.status === 'done' && it.convertedBlob);
    if (doneItems.length === 0) {
      alert(t.converter.noDoneItemsCloudAlert);
      return;
    }

    setIsUploadingCloud(true);
    setCloudUploadFeedback(null);
    try {
      let uploadedCount = 0;
      for (const it of doneItems) {
        if (!it.convertedBlob) continue;
        const key = it.seoName || it.originalName;
        const res = await r2Fetch('/api/r2/upload', {
          method: 'POST',
          headers: {
            'x-r2-key': encodeURIComponent(key),
            'x-r2-content-type': it.convertedBlob.type || 'image/webp',
          },
          body: it.convertedBlob,
        });
        const data = await res.json();
        if (data.success) {
          uploadedCount++;
        }
      }

      setCloudUploadFeedback(t.converter.uploadedCloudSuccess.replace('{count}', String(uploadedCount)));
      setTimeout(() => setCloudUploadFeedback(null), 3000);
    } catch (err: any) {
      alert(t.converter.uploadCloudError + err.message);
    } finally {
      setIsUploadingCloud(false);
    }
  };


  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const convertedCount = items.filter((it) => it.status === 'done').length;
  const pendingCount = items.filter((it) => it.status === 'pending').length;

  const totalSaved = items
    .filter((it) => it.status === 'done')
    .reduce((acc, it) => acc + (it.originalSize - it.convertedSize), 0);
  const totalOriginal = items
    .filter((it) => it.status === 'done')
    .reduce((acc, it) => acc + it.originalSize, 0);
  const savedPercent = totalOriginal > 0 ? Math.round((totalSaved / totalOriginal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500 shrink-0" />
            {t.converter.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const targetId = selectedItemIds[0] || items[0].id;
                setComparingItemId(targetId);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              title={t.converter.compareTooltip}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.converter.compare}</span>
            </button>
          )}

          {items.length > 0 && (
            <Link
              href={`/stitcher?source=converter&ids=${
                selectedItemIds.length > 0
                  ? selectedItemIds.join(',')
                  : items.map((it) => it.id).join(',')
              }`}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              title={t.converter.stitchTooltip}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                {selectedItemIds.length > 0
                  ? t.converter.stitchSelected.replace('{count}', String(selectedItemIds.length))
                  : t.converter.stitchAll.replace('{count}', String(items.length))}
              </span>
            </Link>
          )}

          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              {t.converter.clearList}
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Settings */}
        <aside className="col-span-1 lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-20">
          {/* Settings Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>{t.converter.settingsTitle}</span>
              </div>

              {/* Auto convert toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-400 hover:text-white" title={t.converter.autoConvertTooltip}>
                <input
                  type="checkbox"
                  checked={autoConvert}
                  onChange={(e) => setAutoConvert(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>{t.converter.autoConvert}</span>
              </label>
            </div>

            {/* Target Format */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {t.converter.targetFormat}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['webp', 'avif', 'png', 'jpeg'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleTargetFormatChange(fmt)}
                    className={`py-1.5 text-xs font-medium rounded-lg uppercase transition cursor-pointer text-center ${
                      targetFormat === fmt
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {fmt === 'jpeg' ? 'JPG' : fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t.converter.quality}
                </label>
                <span className="font-mono text-blue-400 font-semibold text-xs">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Rename */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {t.converter.renameFile}
              </label>
              <input
                type="text"
                value={slugTitle}
                onChange={(e) => handleSlugTitleChange(e.target.value)}
                placeholder={t.converter.renamePlaceholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
              />
            </div>

            {/* Output Dimensions: Single or Multi-Size */}
            <div className="pt-2 border-t border-slate-800/80">
              <MultiSizeControl
                isMultiSize={isMultiSize}
                onToggleMode={setIsMultiSize}
                selectedTargets={multiSizeTargets}
                onTargetsChange={setMultiSizeTargets}
                onOpenPresetModal={() => setShowPresetModal(true)}
              />

              {!isMultiSize && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {t.converter.chooseSize}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPresetModal(true)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                      title={t.converter.ecomSocialPresetsTooltip}
                    >
                      <Store className="w-3 h-3" />
                      <span>{t.converter.ecomSocialPresets}</span>
                    </button>
                  </div>
                  <select
                    value={maxWidth}
                    onChange={(e) => {
                      if (e.target.value === '__open_modal__') {
                        setShowPresetModal(true);
                        return;
                      }
                      setActivePreset(null);
                      setMaxWidth(e.target.value);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {activePreset && (
                      <option value={maxWidth}>
                        ✨ {getLocalizedPreset(activePreset, locale).name} ({activePreset.width}×{activePreset.height}px)
                      </option>
                    )}
                    {!activePreset &&
                      !['original', '1200', '1080', '720', '1000', '900', '1920', '1280'].includes(maxWidth) && (
                        <option value={maxWidth}>
                          {t.converter.customSize.replace('{width}', maxWidth)}
                        </option>
                      )}

                    <option value="original">{t.converter.keepOriginalSize}</option>

                    <optgroup label={t.converter.groupArticlesThumbSocial}>
                      <option value="1200">{t.converter.opt1200}</option>
                      <option value="1080">{t.converter.opt1080}</option>
                      <option value="720">{t.converter.opt720}</option>
                    </optgroup>

                    <optgroup label={t.converter.groupEcom}>
                      <option value="1000">{t.converter.opt1000}</option>
                      <option value="900">{t.converter.opt900}</option>
                    </optgroup>

                    <optgroup label={t.converter.groupScreensWeb}>
                      <option value="1920">{t.converter.opt1920}</option>
                      <option value="1280">{t.converter.opt1280}</option>
                    </optgroup>

                    <option value="__open_modal__">{t.converter.viewAllEcom}</option>
                  </select>

                  {/* Active Preset Info Badge */}
                  {activePreset && (() => {
                    const locPreset = getLocalizedPreset(activePreset, locale);
                    return (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-300 animate-in fade-in">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${locPreset.badgeColor}`}
                          >
                            {locPreset.platform}
                          </span>
                          <span className="truncate font-medium">{locPreset.name}</span>
                          <span className="font-mono text-slate-400 shrink-0">
                            ({locPreset.width}×{locPreset.height}px)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePreset(null);
                            setMaxWidth('original');
                          }}
                          className="text-slate-400 hover:text-white p-0.5 ml-1 shrink-0 cursor-pointer"
                          title={t.converter.removePresetTooltip}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Bulk Watermark Settings */}
            <WatermarkControl
              watermarkConfig={watermarkConfig}
              onUpdateWatermarkConfig={handleUpdateWatermarkConfig}
              sampleImageSrc={items[0]?.previewUrl}
              logoImg={watermarkLogoImg}
            />
          </div>
        </aside>

        {/* Right Main Workspace */}
        <div className="col-span-1 lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
          {/* Low-RAM Optimization Banner for large batch */}
          {items.length >= 25 && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed animate-in fade-in">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">{t.converter.lowRamBannerTitle.replace('{count}', String(items.length))} </span>
                {t.converter.lowRamBannerDesc}
              </div>
            </div>
          )}

          {/* Drag & Drop Upload Zone (Hero when empty, Compact banner when queue has items) */}
          <input
            type="file"
            multiple
            accept="image/*,.heic,.webp,.png,.jpg,.jpeg,.svg,.gif"
            ref={fileInputRef}
            onChange={(e) => handleFilesAdded(e.target.files)}
            className="hidden"
          />

          {items.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesAdded(e.dataTransfer.files);
              }}
              className="flex flex-col items-center justify-center p-8 sm:p-14 text-center w-full border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/40 hover:bg-slate-900/60 rounded-3xl transition-all cursor-pointer group shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors">
                {t.converter.dropzoneTitle}
              </h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed max-w-md">
                {t.converter.dropzoneDesc}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer mb-3"
              >
                <Upload className="w-4 h-4" />
                <span>{t.converter.selectFromComputer}</span>
              </button>
              <span className="text-[11px] text-slate-500 font-mono">
                {t.converter.pasteClipboardHint}
              </span>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesAdded(e.dataTransfer.files);
              }}
              className="p-3.5 border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/50 hover:bg-slate-900/80 rounded-2xl transition flex items-center justify-between gap-4 cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
                    {t.converter.addMoreTitle}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {t.converter.addMoreDesc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.converter.addImages}</span>
              </button>
            </div>
          )}

          {/* Queue Items Workspace */}
          {items.length > 0 && (
            <div className="space-y-3.5">
              {/* Workspace Toolbar (Sticky when scrolling long lists) */}
              <div className="sticky top-20 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-md">
                {/* Left: Select all & counters */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-medium text-slate-300 hover:text-indigo-400 transition cursor-pointer flex items-center gap-2"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        selectedItemIds.length === items.length
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    >
                      {selectedItemIds.length === items.length && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>
                      {selectedItemIds.length === items.length
                        ? t.converter.deselectAll
                        : selectedItemIds.length > 0
                        ? t.converter.selectedCount.replace('{selected}', String(selectedItemIds.length)).replace('{total}', String(items.length))
                        : t.converter.selectAllToStitch}
                    </span>
                  </button>
                  <span className="text-slate-600">|</span>
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    {t.converter.totalFilesCount.replace('{count}', String(items.length))}
                  </span>
                  {isMultiSize && (
                    <span className="text-[11px] font-medium text-blue-400 bg-blue-950/40 border border-blue-500/20 px-2 py-0.5 rounded-full hidden md:inline">
                      {t.converter.multiSizeExportNotice.replace('{count}', String(items.length * (multiSizeTargets.length || 1)))}
                    </span>
                  )}
                  {savedPercent > 0 && (
                    <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full hidden lg:inline">
                      {t.converter.savedPercentNotice.replace('{percent}', String(savedPercent)).replace('{size}', formatSize(totalSaved))}
                    </span>
                  )}
                </div>

                {/* Right: Primary Convert & ZIP Action buttons + View Mode switcher */}
                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  {/* Convert Button */}
                  {pendingCount > 0 ? (
                    <button
                      onClick={convertAllItems}
                      disabled={processingAll}
                      className="py-1.5 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
                      title={t.converter.startConvertTooltip.replace('{count}', String(pendingCount))}
                    >
                      {processingAll ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>{t.converter.startConvert.replace('{count}', String(pendingCount))}</span>
                    </button>
                  ) : (
                    <button
                      onClick={convertAllItems}
                      disabled={processingAll}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                      title={t.converter.recompressTooltip}
                    >
                      {processingAll ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>{t.converter.recompressAll}</span>
                    </button>
                  )}

                  {/* Save to Local Folder if active */}
                  {storageSettings.activeDestination === 'local_folder' && (
                    <button
                      onClick={saveAllToLocalFolder}
                      disabled={convertedCount === 0 || isSavingLocal}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      title={t.converter.saveToLocal.replace('{count}', String(convertedCount))}
                    >
                      {isSavingLocal ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{t.converter.savingToLocal}</span>
                        </>
                      ) : (
                        <>
                          <FolderCheck className="w-3.5 h-3.5" />
                          <span>{localSaveFeedback || t.converter.saveToLocal.replace('{count}', String(convertedCount))}</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Upload to Cloud S3 / R2 if active */}
                  {storageSettings.activeDestination === 'cloud_s3' && (
                    <button
                      onClick={uploadAllToCloud}
                      disabled={convertedCount === 0 || isUploadingCloud}
                      className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      title={t.converter.saveToCloud.replace('{count}', String(convertedCount))}
                    >
                      {isUploadingCloud ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{t.converter.uploadingToCloud}</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{cloudUploadFeedback || t.converter.saveToCloud.replace('{count}', String(convertedCount))}</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Download ZIP Button */}
                  <button
                    onClick={() => downloadAllZip()}
                    disabled={items.length === 0 || isZipping}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    title={t.converter.downloadZip}
                  >
                    {isZipping ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                        <span>{t.converter.zipping}</span>
                      </>
                    ) : (
                      <>
                        <FolderArchive className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t.converter.downloadZip}</span>
                      </>
                    )}
                  </button>

                  {/* Destination Quick Indicator Pill */}
                  <Link
                    href="/settings"
                    className="text-[11px] font-medium px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                    title={t.converter.destPillTooltip}
                  >
                    {storageSettings.activeDestination === 'local_folder' ? (
                      <>
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden xl:inline text-slate-400">{t.converter.destPillLabel}</span>
                        <span className="text-emerald-300 font-semibold truncate max-w-[80px]">
                          {storageSettings.localFolder.folderName || t.converter.destLocal}
                        </span>
                      </>
                    ) : storageSettings.activeDestination === 'cloud_s3' ? (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-blue-400" />
                        <span className="hidden xl:inline text-slate-400">{t.converter.destPillLabel}</span>
                        <span className="text-blue-300 font-semibold truncate max-w-[80px]">
                          {storageSettings.cloudStorage.bucketName || t.converter.destCloud}
                        </span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden xl:inline text-slate-400">{t.converter.destPillLabel}</span>
                        <span className="text-amber-300 font-semibold">{t.converter.destDownload}</span>
                      </>
                    )}
                  </Link>

                  {/* View Mode Switcher */}
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={t.converter.viewGridTooltip}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="text-[11px] hidden xl:inline">{t.converter.viewGrid}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={t.converter.viewTableTooltip}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="text-[11px] hidden xl:inline">{t.converter.viewTable}</span>
                    </button>
                  </div>
                </div>
              </div>

            {/* List Render: Grid Cards or Table Rows */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {items.map((item, index) => (
                  <QueueGridCard
                    key={item.id}
                    item={item}
                    index={index}
                    isSelected={selectedItemIds.includes(item.id)}
                    watermarkConfig={watermarkConfig}
                    logoImg={watermarkLogoImg}
                    onToggleSelect={toggleSelectItem}
                    onCompare={(id) => setComparingItemId(id)}
                    onSendToStudio={handleSendToStudio}
                    onConvertSingle={convertSingleItem}
                    onCopyHtmlTag={copyHtmlTag}
                    isCopiedHtml={copiedId === item.id}
                    onDownloadSingle={downloadSingle}
                    onRemove={removeItem}
                    formatSize={formatSize}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <QueueTableRow
                    key={item.id}
                    item={item}
                    index={index}
                    isSelected={selectedItemIds.includes(item.id)}
                    watermarkConfig={watermarkConfig}
                    logoImg={watermarkLogoImg}
                    onToggleSelect={toggleSelectItem}
                    onCompare={(id) => setComparingItemId(id)}
                    onSendToStudio={handleSendToStudio}
                    onConvertSingle={convertSingleItem}
                    onCopyHtmlTag={copyHtmlTag}
                    isCopiedHtml={copiedId === item.id}
                    onDownloadSingle={downloadSingle}
                    onRemove={removeItem}
                    formatSize={formatSize}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Interactive Before / After Comparison Modal */}
      {comparingItem && (
        <ImageComparisonModal
          item={comparingItem}
          itemsList={items}
          watermarkConfig={watermarkConfig}
          logoImg={watermarkLogoImg}
          onClose={() => setComparingItemId(null)}
          onSelectIndex={(newIdx) => {
            if (items[newIdx]) {
              setComparingItemId(items[newIdx].id);
            }
          }}
          onConvertItem={async (it) => {
            const idx = items.findIndex((i) => i.id === it.id);
            if (idx >= 0) {
              await convertSingleItem(items[idx], idx);
            }
          }}
          onSendToStudio={(it) => handleSendToStudio(it as ImageItem)}
          onCopyHtml={(it) => copyHtmlTag(it as ImageItem)}
        />
      )}

      {/* E-commerce Preset Picker Modal */}
      <PresetPickerModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        onSelectPreset={(p: EcommercePreset) => {
          if (isMultiSize) {
            const newTarget: MultiSizeTarget = {
              id: `preset-${p.id}-${Date.now()}`,
              name: p.name,
              nameEn: p.nameEn,
              width: p.width,
              height: p.height,
              folderName: `${p.width}${p.height ? `x${p.height}` : ''}px_${p.id.replace(/[^a-z0-9]+/g, '_')}`,
              badge: p.platform,
              badgeEn: p.platformEn,
              ratio: p.ratio,
            };
            setMultiSizeTargets((prev) => [...prev, newTarget]);
          } else {
            setActivePreset(p);
            setMaxWidth(String(p.width));
          }
        }}
        currentWidth={parseInt(maxWidth, 10) || undefined}
        currentHeight={activePreset?.height}
      />
    </div>
  );
}
