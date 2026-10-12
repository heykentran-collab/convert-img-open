/**
 * IndexedDB storage for persisting bulk converter queue across navigation
 */

const DB_NAME = 'volticen_converter_db';
const STORE_NAME = 'items';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
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

export interface StoredItem {
  id: string;
  originalFile: File | Blob;
  originalName: string;
  originalSize: number;
  originalFormat: string;
  width: number;
  height: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  convertedBlob: Blob | null;
  convertedSize: number;
  convertedWidth: number;
  convertedHeight: number;
  convertedFormat: string;
  seoName: string;
}

export async function saveConverterQueue(items: StoredItem[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear existing and replace with current queue
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const item of items) {
      store.put({
        id: item.id,
        originalFile: item.originalFile,
        originalName: item.originalName,
        originalSize: item.originalSize,
        originalFormat: item.originalFormat,
        width: item.width,
        height: item.height,
        status: item.status,
        convertedBlob: item.convertedBlob,
        convertedSize: item.convertedSize,
        convertedWidth: item.convertedWidth,
        convertedHeight: item.convertedHeight,
        convertedFormat: item.convertedFormat,
        seoName: item.seoName,
      });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save queue to IndexedDB:', err);
  }
}

export async function loadConverterQueue(): Promise<StoredItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results: StoredItem[] = request.result || [];
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to load queue from IndexedDB:', err);
    return [];
  }
}

export async function clearConverterQueue(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear IndexedDB:', err);
  }
}

export async function updateOrAddConverterItemBlob(
  id: string,
  newBlob: Blob,
  name: string,
  newWidth: number,
  newHeight: number
): Promise<{ success: boolean; effectiveId: string; isNew: boolean }> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    let effectiveId = id;
    let isNew = false;

    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          // Update existing item in queue
          item.originalFile = newBlob;
          item.originalSize = newBlob.size;
          item.width = newWidth;
          item.height = newHeight;
          item.status = 'pending';
          item.convertedBlob = null;
          item.convertedSize = 0;
          store.put(item);
        } else {
          // If item doesn't exist (e.g. queue was cleared or brand new upload), add as new item!
          isNew = true;
          effectiveId = id || Math.random().toString(36).slice(2);
          const cleanName = name || 'studio-edited.png';
          store.put({
            id: effectiveId,
            originalFile: newBlob,
            originalName: cleanName,
            originalSize: newBlob.size,
            originalFormat: 'png',
            width: newWidth,
            height: newHeight,
            status: 'pending',
            convertedBlob: null,
            convertedSize: 0,
            convertedWidth: newWidth,
            convertedHeight: newHeight,
            convertedFormat: 'webp',
            seoName: cleanName,
          });
        }
      };

      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = () => resolve({ success: true, effectiveId, isNew });
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to update/add item in IndexedDB:', err);
    return { success: false, effectiveId: id, isNew: false };
  }
}

export async function getConverterItem(id: string): Promise<StoredItem | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('Failed to get item from IndexedDB:', err);
    return null;
  }
}

