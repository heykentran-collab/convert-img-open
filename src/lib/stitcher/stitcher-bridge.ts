/**
 * Bridge (Adapter) connecting Stitcher with Studio, Converter, and R2 Cloud
 * Keeps Stitcher loosely coupled with the rest of the application.
 */

import { saveStudioActiveSession } from '@/lib/studio-storage';
import { updateOrAddConverterItemBlob, getConverterItem, StoredItem } from '@/lib/converter-storage';
import { loadStitcherSession, saveStitcherSession, getInMemoryStitcherSession } from './stitcher-storage';
import { StitcherLayer, CanvasConfig, GridSettings, StitchMode } from '@/types/stitcher';
import { setCachedImage } from './renderers/renderStitchCanvas';

/**
 * Adds an arbitrary image blob (e.g. from Studio canvas) as a new layer
 * into the active Stitcher session, preserving any existing layers.
 */
export async function addLayerBlobToStitcher(
  blob: Blob,
  fileName: string = 'studio-layer.png'
): Promise<{ success: boolean; layerId?: string }> {
  try {
    let session = getInMemoryStitcherSession();
    if (!session) {
      session = await loadStitcherSession();
    }

    const defaultCanvasConfig: CanvasConfig = {
      width: 1920,
      height: 1080,
      preset: 'auto',
      backgroundType: 'color',
      backgroundColor: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg, #1e293b, #0f172a)',
      padding: 0,
    };

    const defaultGridSettings: GridSettings = {
      columns: 2,
      gap: 16,
      cornerRadius: 0,
      padding: 24,
      fitMode: 'cover',
      autoCanvasSize: false,
    };

    const canvasConfig = session?.canvasConfig || defaultCanvasConfig;
    const gridSettings = session?.gridSettings || defaultGridSettings;
    const mode: StitchMode = session?.mode || 'freeform';
    const layers: StitcherLayer[] = session?.layers ? [...session.layers] : [];

    // Extract natural dimensions
    const blobUrl = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('Failed to load blob image'));
      img.src = blobUrl;
    });

    const naturalWidth = img.naturalWidth || 800;
    const naturalHeight = img.naturalHeight || 600;

    // Scale layer to comfortably fit inside canvas (max 80% canvas size)
    let w = naturalWidth;
    let h = naturalHeight;
    const maxW = canvasConfig.width * 0.8;
    const maxH = canvasConfig.height * 0.8;
    if (w > maxW || h > maxH) {
      const scale = Math.min(maxW / w, maxH / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    // Offset placement slightly if multiple layers exist
    const offset = (layers.length % 6) * 24;
    let x = Math.round((canvasConfig.width - w) / 2) + offset;
    let y = Math.round((canvasConfig.height - h) / 2) + offset;
    if (x + w > canvasConfig.width) x = Math.max(0, canvasConfig.width - w);
    if (y + h > canvasConfig.height) y = Math.max(0, canvasConfig.height - h);

    const maxZ = layers.reduce((max, l) => Math.max(max, l.zIndex), 0);

    const newLayer: StitcherLayer = {
      id: 'layer-' + Math.random().toString(36).slice(2, 9),
      name: fileName,
      src: blobUrl,
      blob: blob,
      naturalWidth,
      naturalHeight,
      x,
      y,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + 1,
      isLocked: false,
      isVisible: true,
      aspectRatio: naturalWidth / naturalHeight,
      cornerRadius: 0,
      shadow: false,
    };

    setCachedImage(newLayer.id, img);
    layers.push(newLayer);

    await saveStitcherSession({
      layers,
      canvasConfig,
      gridSettings,
      mode,
    });

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('stitcher_selected_layer_id', newLayer.id);
    }

    return { success: true, layerId: newLayer.id };
  } catch (err) {
    console.error('Failed to add layer blob to Stitcher:', err);
    return { success: false };
  }
}

/**
 * Sends a stitched canvas blob directly into Studio as the active image
 */
export async function sendStitchedToStudio(
  blob: Blob,
  fileName: string = 'stitched-artwork.png'
): Promise<boolean> {
  try {
    const cleanId = Math.random().toString(36).slice(2);
    await saveStudioActiveSession(blob, {
      name: fileName,
      sourceKey: fileName,
      sourceType: 'stitcher',
      converterId: cleanId,
    });

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('studio_image_key', fileName);
      sessionStorage.setItem('studio_source', 'stitcher');
      sessionStorage.setItem('studio_converter_id', cleanId);
    }
    return true;
  } catch (err) {
    console.warn('Failed to send stitched artwork to Studio:', err);
    return false;
  }
}

/**
 * Sends stitched canvas blob to the Converter queue
 */
export async function sendStitchedToConverter(
  blob: Blob,
  fileName: string = 'stitched-image.png',
  width: number,
  height: number
): Promise<{ success: boolean; id: string }> {
  try {
    const newId = Math.random().toString(36).slice(2);
    const res = await updateOrAddConverterItemBlob(newId, blob, fileName, width, height);
    return { success: res.success, id: res.effectiveId };
  } catch (err) {
    console.warn('Failed to send stitched image to Converter:', err);
    return { success: false, id: '' };
  }
}

/**
 * Loads images from Converter queue by their IDs
 */
export async function loadItemsFromConverter(ids: string[]): Promise<StoredItem[]> {
  const items: StoredItem[] = [];
  for (const id of ids) {
    const item = await getConverterItem(id);
    if (item) items.push(item);
  }
  return items;
}

/**
 * Uploads stitched canvas directly to Cloudflare R2
 */
import { r2Fetch } from '../r2-api-client';

export async function uploadStitchedToR2(
  blob: Blob,
  key: string
): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
  try {
    const res = await r2Fetch('/api/r2/upload', {
      method: 'POST',
      headers: {
        'x-r2-key': encodeURIComponent(key.trim()),
        'x-r2-content-type': blob.type || 'image/webp',
      },
      body: blob,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Upload failed' };
    }
    return { success: true, url: data.publicUrl, key: data.key };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}
