import { R2FolderNode } from '@/types/r2';

interface FolderTreeCache {
  tree: R2FolderNode[];
  allFolders: string[];
  totalFiles: number;
  totalFolders: number;
  timestamp: number;
}

const cacheStore = new Map<string, FolderTreeCache>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function getCachedFolderTree(accountId: string, bucketName: string): FolderTreeCache | null {
  if (!accountId || !bucketName) return null;
  const key = `${accountId}:${bucketName}`;
  const entry = cacheStore.get(key);
  if (!entry) return null;
  const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    cacheStore.delete(key);
    return null;
  }
  return entry;
}

export function setCachedFolderTree(
  accountId: string,
  bucketName: string,
  data: {
    tree: R2FolderNode[];
    allFolders: string[];
    totalFiles: number;
    totalFolders: number;
  }
) {
  if (!accountId || !bucketName) return;
  const key = `${accountId}:${bucketName}`;
  cacheStore.set(key, {
    ...data,
    timestamp: Date.now(),
  });
}

export function invalidateFolderCache(accountId?: string, bucketName?: string) {
  if (accountId && bucketName) {
    cacheStore.delete(`${accountId}:${bucketName}`);
  } else {
    cacheStore.clear();
  }
}
