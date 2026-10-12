/**
 * Unified Storage Settings Manager
 * Supports:
 * 1. Local Folder via File System Access API (window.showDirectoryPicker) persisted in IndexedDB
 * 2. Cloud Storage (Cloudflare R2 / AWS S3 / Custom S3) persisted in LocalStorage
 * 3. Default browser downloads
 */

import {
  CloudStorageConfig,
  LocalFolderConfig,
  StorageDestinationType,
  UnifiedStorageSettings,
} from '@/types/storage';

const STORAGE_SETTINGS_KEY = 'volticen_storage_settings_v1';
const IDB_NAME = 'volticen_local_storage_db';
const IDB_STORE = 'handles';
const DIR_HANDLE_KEY = 'output_dir_handle';

export const DEFAULT_CLOUD_CONFIG: CloudStorageConfig = {
  provider: 'cloudflare_r2',
  accountId: '',
  apiToken: '',
  accessKeyId: '',
  secretAccessKey: '',
  bucketName: '',
  publicDomain: '',
  endpoint: '',
  region: 'auto',
};

export const DEFAULT_LOCAL_FOLDER_CONFIG: LocalFolderConfig = {
  enabled: false,
  folderName: '',
  autoSaveOnDone: false,
  createSubfolders: false,
};

export const DEFAULT_STORAGE_SETTINGS: UnifiedStorageSettings = {
  activeDestination: 'download',
  localFolder: DEFAULT_LOCAL_FOLDER_CONFIG,
  cloudStorage: DEFAULT_CLOUD_CONFIG,
};

// ==================== LocalStorage Settings ====================

export function getStorageSettings(): UnifiedStorageSettings {
  if (typeof window === 'undefined') return DEFAULT_STORAGE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_STORAGE_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      activeDestination: parsed.activeDestination || 'download',
      localFolder: { ...DEFAULT_LOCAL_FOLDER_CONFIG, ...(parsed.localFolder || {}) },
      cloudStorage: { ...DEFAULT_CLOUD_CONFIG, ...(parsed.cloudStorage || {}) },
    };
  } catch {
    return DEFAULT_STORAGE_SETTINGS;
  }
}

export function saveStorageSettings(settings: UnifiedStorageSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('storage_settings_updated'));
  } catch (err) {
    console.error('Failed to save storage settings:', err);
  }
}

export function getCloudStorageHeaders(): Record<string, string> {
  const settings = getStorageSettings();
  const c = settings.cloudStorage;
  const headers: Record<string, string> = {};

  if (c.accountId) headers['x-r2-account-id'] = c.accountId;
  if (c.apiToken) headers['x-r2-api-token'] = c.apiToken;
  if (c.accessKeyId) headers['x-r2-access-key-id'] = c.accessKeyId;
  if (c.secretAccessKey) headers['x-r2-secret-access-key'] = c.secretAccessKey;
  if (c.bucketName) headers['x-r2-bucket-name'] = c.bucketName;
  if (c.publicDomain) headers['x-r2-public-domain'] = c.publicDomain;
  if (c.endpoint) headers['x-r2-endpoint'] = c.endpoint;
  if (c.region) headers['x-r2-region'] = c.region;

  return headers;
}

// ==================== File System Access API (Local Folder) ====================

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.put(handle, DIR_HANDLE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(DIR_HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearStoredDirectoryHandle(): Promise<void> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(DIR_HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

/**
 * Verify and request permission to write to directory handle
 */
export async function verifyDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  mode: 'read' | 'readwrite' = 'readwrite'
): Promise<boolean> {
  try {
    const options = { mode };
    // Check if permission was already granted
    if ((await (handle as any).queryPermission(options)) === 'granted') {
      return true;
    }
    // Request permission if not already granted
    if ((await (handle as any).requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Open native directory picker, store handle, and update config
 */
export async function pickLocalDirectory(): Promise<{
  success: boolean;
  handle?: FileSystemDirectoryHandle;
  folderName?: string;
  error?: string;
}> {
  if (!isFileSystemAccessSupported()) {
    return {
      success: false,
      error: 'Trình duyệt của bạn không hỗ trợ File System Access API. Vui lòng dùng Chrome hoặc Edge.',
    };
  }

  try {
    const handle = await (window as any).showDirectoryPicker({
      id: 'volticen_export_folder',
      mode: 'readwrite',
    });

    const hasPerm = await verifyDirectoryPermission(handle, 'readwrite');
    if (!hasPerm) {
      return { success: false, error: 'Không được cấp quyền ghi vào thư mục' };
    }

    await storeDirectoryHandle(handle);

    const folderName = handle.name || 'Thư mục đã chọn';
    const current = getStorageSettings();
    saveStorageSettings({
      ...current,
      activeDestination: 'local_folder',
      localFolder: {
        ...current.localFolder,
        enabled: true,
        folderName,
      },
    });

    return { success: true, handle, folderName };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Đã hủy chọn thư mục' };
    }
    return { success: false, error: err.message || 'Lỗi khi chọn thư mục' };
  }
}

/**
 * Writes a file directly into the local directory handle
 */
export async function saveFileToLocalDirectory(
  fileName: string,
  blob: Blob,
  customHandle?: FileSystemDirectoryHandle,
  subFolder?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const handle = customHandle || (await getStoredDirectoryHandle());
    if (!handle) {
      return { success: false, error: 'Chưa chọn thư mục lưu trữ trên máy tính' };
    }

    const hasPerm = await verifyDirectoryPermission(handle, 'readwrite');
    if (!hasPerm) {
      return { success: false, error: 'Chưa được cấp quyền ghi vào thư mục này' };
    }

    let targetDir = handle;
    if (subFolder) {
      const cleanSub = subFolder.trim().replace(/^\/+|\/+$/g, '');
      if (cleanSub) {
        targetDir = await handle.getDirectoryHandle(cleanSub, { create: true });
      }
    }

    const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi khi ghi file vào thư mục' };
  }
}
