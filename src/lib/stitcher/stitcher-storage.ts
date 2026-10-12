/**
 * Independent IndexedDB Storage for the Volticen Stitcher Module
 * Database: volticen_stitcher_db
 * Completely decoupled from Converter and Studio storage
 */

import { StitcherLayer, CanvasConfig, GridSettings, StitchMode } from '@/types/stitcher';

const DB_NAME = 'volticen_stitcher_db';
const STORE_NAME = 'session';
const DB_VERSION = 1;

export interface StoredStitcherLayer {
  id: string;
  name: string;
  blob: Blob;
  naturalWidth: number;
  naturalHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  isLocked: boolean;
  isVisible: boolean;
  aspectRatio: number;
  cornerRadius?: number;
  shadow?: boolean;
}

export interface StoredStitcherSession {
  id: string; // 'current'
  layers: StoredStitcherLayer[];
  canvasConfig: CanvasConfig;
  gridSettings: GridSettings;
  mode: StitchMode;
  updatedAt: number;
}

function openStitcherDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory session cache for instantaneous navigation between pages
let inMemorySession: {
  layers: StitcherLayer[];
  canvasConfig: CanvasConfig;
  gridSettings: GridSettings;
  mode: StitchMode;
} | null = null;

export function getInMemoryStitcherSession() {
  return inMemorySession;
}

export function setInMemoryStitcherSession(data: {
  layers: StitcherLayer[];
  canvasConfig: CanvasConfig;
  gridSettings: GridSettings;
  mode: StitchMode;
} | null) {
  inMemorySession = data;
}


/**
 * Saves Stitcher session including raw Blobs to persistent IndexedDB
 */
export async function saveStitcherSession(data: {
  layers: StitcherLayer[];
  canvasConfig: CanvasConfig;
  gridSettings: GridSettings;
  mode: StitchMode;
}): Promise<void> {
  // If no layers remain (all layers deleted), delete persistent session directly
  if (!data.layers || data.layers.length === 0) {
    await clearStitcherSession();
    return;
  }

  try {
    const db = await openStitcherDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Convert layers to stored format with blobs
    const storedLayers: StoredStitcherLayer[] = [];
    for (const l of data.layers) {
      let layerBlob = l.blob;
      if (!layerBlob && l.src) {
        try {
          const res = await fetch(l.src);
          if (res.ok) layerBlob = await res.blob();
        } catch {
          // ignore
        }
      }

      if (layerBlob) {
        storedLayers.push({
          id: l.id,
          name: l.name,
          blob: layerBlob,
          naturalWidth: l.naturalWidth,
          naturalHeight: l.naturalHeight,
          x: l.x,
          y: l.y,
          width: l.width,
          height: l.height,
          rotation: l.rotation,
          opacity: l.opacity,
          zIndex: l.zIndex,
          isLocked: l.isLocked,
          isVisible: l.isVisible,
          aspectRatio: l.aspectRatio,
          cornerRadius: l.cornerRadius,
          shadow: l.shadow,
        });
      }
    }

    const session: StoredStitcherSession = {
      id: 'current',
      layers: storedLayers,
      canvasConfig: data.canvasConfig,
      gridSettings: data.gridSettings,
      mode: data.mode,
      updatedAt: Date.now(),
    };

    setInMemoryStitcherSession({
      layers: data.layers,
      canvasConfig: data.canvasConfig,
      gridSettings: data.gridSettings,
      mode: data.mode,
    });

    store.put(session);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save Stitcher session to IndexedDB:', err);
  }
}

/**
 * Loads Stitcher session from IndexedDB and recreates fresh blob URLs
 */
export async function loadStitcherSession(): Promise<{
  layers: StitcherLayer[];
  canvasConfig: CanvasConfig;
  gridSettings: GridSettings;
  mode: StitchMode;
} | null> {
  // If in-memory cache is already warm (e.g. user navigating back and forth), return immediately!
  if (inMemorySession !== null) {
    return inMemorySession;
  }

  try {
    const db = await openStitcherDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.get('current');
      req.onsuccess = () => {
        const session = req.result as StoredStitcherSession | undefined;
        if (!session) {
          resolve(null);
          return;
        }

        const restoredLayers: StitcherLayer[] = (session.layers || []).map((l) => {
          const freshSrc = URL.createObjectURL(l.blob);
          return {
            id: l.id,
            name: l.name,
            blob: l.blob,
            src: freshSrc,
            naturalWidth: l.naturalWidth,
            naturalHeight: l.naturalHeight,
            x: l.x,
            y: l.y,
            width: l.width,
            height: l.height,
            rotation: l.rotation ?? 0,
            opacity: l.opacity ?? 1,
            zIndex: l.zIndex ?? 0,
            isLocked: l.isLocked ?? false,
            isVisible: l.isVisible ?? true,
            aspectRatio: l.aspectRatio || (l.naturalWidth && l.naturalHeight ? l.naturalWidth / l.naturalHeight : 1),
            cornerRadius: l.cornerRadius ?? 0,
            shadow: l.shadow ?? false,
          };
        });

        const result = {
          layers: restoredLayers,
          canvasConfig: session.canvasConfig,
          gridSettings: session.gridSettings,
          mode: session.mode,
        };

        setInMemoryStitcherSession(result);
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load Stitcher session from IndexedDB:', err);
    return null;
  }
}

/**
 * Clears Stitcher session (e.g. on "Clear Canvas / Xóa tất cả")
 */
export async function clearStitcherSession(): Promise<void> {
  setInMemoryStitcherSession(null);
  try {
    const db = await openStitcherDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('current');

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear Stitcher session from IndexedDB:', err);
  }
}

