/**
 * Frontend R2 API Client
 * Automatically attaches client-side Cloud Storage headers (from LocalStorage)
 * to all /api/r2/* calls.
 */

import { getCloudStorageHeaders } from './storage-settings';

export async function r2Fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const customHeaders = getCloudStorageHeaders();

  // Merge headers safely
  const mergedHeaders = new Headers(init?.headers || {});
  for (const [key, value] of Object.entries(customHeaders)) {
    if (value && !mergedHeaders.has(key)) {
      mergedHeaders.set(key, value);
    }
  }

  return fetch(input, {
    ...init,
    headers: mergedHeaders,
  });
}
