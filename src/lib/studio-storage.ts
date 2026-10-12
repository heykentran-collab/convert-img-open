/**
 * IndexedDB storage for persisting active Studio canvas and image session.
 * Ensures images and canvas work survive page reloads (F5), tab switches, and navigation.
 */

const DB_NAME = 'volticen_studio_db';
const STORE_NAME = 'active_session';
const DB_VERSION = 1;

export interface StudioAnnotations {
  stepBadges?: any[];
  arrows?: any[];
  boxes?: any[];
  blurs?: any[];
  texts?: any[];
  spotlights?: any[];
}

export interface StudioActiveSession {
  id: string; // 'current'
  blob: Blob;
  name: string;
  sourceKey?: string | null;
  sourceType?: string | null;
  converterId?: string | null;
  annotations?: StudioAnnotations | null;
  updatedAt: number;
}


function openStudioDB(): Promise<IDBDatabase> {
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

/**
 * Saves current image blob and metadata to persistent IndexedDB
 */
export async function saveStudioActiveSession(
  blob: Blob,
  meta: {
    name: string;
    sourceKey?: string | null;
    sourceType?: string | null;
    converterId?: string | null;
  }
): Promise<void> {
  try {
    const db = await openStudioDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const session: StudioActiveSession = {
      id: 'current',
      blob,
      name: meta.name || 'image.png',
      sourceKey: meta.sourceKey ?? null,
      sourceType: meta.sourceType ?? null,
      converterId: meta.converterId ?? null,
      updatedAt: Date.now(),
    };

    store.put(session);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save Studio session to IndexedDB:', err);
  }
}

/**
 * Loads current image blob and metadata from persistent IndexedDB
 */
export async function loadStudioActiveSession(): Promise<StudioActiveSession | null> {
  try {
    const db = await openStudioDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.get('current');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load Studio session from IndexedDB:', err);
    return null;
  }
}

/**
 * Clears current image session from persistent IndexedDB (e.g. on "Xóa" canvas)
 */
export async function clearStudioActiveSession(): Promise<void> {
  try {
    const db = await openStudioDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('current');

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear Studio session from IndexedDB:', err);
  }
}

/**
 * Safely converts a data URL or Blob into a raw Blob
 */
export async function srcToBlob(src: string | Blob): Promise<Blob | null> {
  if (src instanceof Blob) return src;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    return await res.blob();
  } catch (err) {
    console.warn('Failed to convert src to blob:', err);
    return null;
  }
}

/**
 * Updates annotations on the current active session in IndexedDB
 */
export async function updateStudioAnnotations(annotations: StudioAnnotations): Promise<void> {
  try {
    const db = await openStudioDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('current');
    req.onsuccess = () => {
      const session = req.result as StudioActiveSession | undefined;
      if (session) {
        session.annotations = annotations;
        session.updatedAt = Date.now();
        store.put(session);
      }
    };
  } catch (err) {
    console.warn('Failed to update Studio annotations in IndexedDB:', err);
  }
}

