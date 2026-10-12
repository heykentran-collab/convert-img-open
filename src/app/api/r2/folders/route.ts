import { NextResponse } from 'next/server';
import { getR2Credentials, cfApiRequest } from '@/lib/r2-client';
import { R2FolderNode } from '@/types/r2';
import {
  getCachedFolderTree,
  setCachedFolderTree,
  invalidateFolderCache,
} from '@/lib/r2-cache';

/**
 * Builds a hierarchical tree from a flat list of folder paths and file stats
 */
function buildFolderTree(
  foldersMap: Map<string, { directCount: number; totalCount: number; directBytes: number; totalBytes: number }>
): R2FolderNode[] {
  const rootNodes: R2FolderNode[] = [];
  const nodeMap = new Map<string, R2FolderNode>();

  // Root nodes collection
  const sortedPaths = Array.from(foldersMap.keys()).sort();

  for (const path of sortedPaths) {
    const clean = path.replace(/\/+$/, '');
    const parts = clean.split('/');
    const name = parts[parts.length - 1];
    const depth = parts.length;
    const stats = foldersMap.get(path) || { directCount: 0, totalCount: 0, directBytes: 0, totalBytes: 0 };

    const node: R2FolderNode = {
      name,
      path,
      depth,
      fileCount: stats.totalCount,
      directFileCount: stats.directCount,
      totalBytes: stats.totalBytes,
      children: [],
    };

    nodeMap.set(path, node);

    if (parts.length === 1) {
      // Top level folder
      rootNodes.push(node);
    } else {
      // Find parent folder
      const parentPath = parts.slice(0, parts.length - 1).join('/') + '/';
      const parentNode = nodeMap.get(parentPath);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }
  }

  return rootNodes;
}

/**
 * GET: Retrieve the full folder tree with file counts and bytes
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const creds = getR2Credentials(request.headers);
    if (!creds.accountId || !creds.token || !creds.bucketName) {
      return NextResponse.json(
        { success: false, configured: false, error: 'Chưa cấu hình Cloudflare Account ID, API Token hoặc Bucket Name trong Cài đặt' },
        { status: 400 }
      );
    }

    // 1. Check in-memory cache first for lightning fast sub-millisecond response
    if (!forceRefresh) {
      const cached = getCachedFolderTree(creds.accountId, creds.bucketName);
      if (cached) {
        return NextResponse.json({
          success: true,
          tree: cached.tree,
          allFolders: cached.allFolders,
          totalFiles: cached.totalFiles,
          totalFolders: cached.totalFolders,
          cached: true,
        });
      }
    }

    // Fetch using per_page=1000 so the entire bucket returns in 1 single fast call
    let cursor: string | null = null;
    const allObjects: { key: string; size: number }[] = [];
    let page = 0;

    do {
      page++;
      let cfPath = `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects?per_page=1000`;
      if (cursor) cfPath += `&cursor=${encodeURIComponent(cursor)}`;

      const cfRes = await cfApiRequest({
        path: cfPath,
        token: creds.token,
      });

      const items = cfRes.result || [];
      for (const item of items) {
        allObjects.push({ key: item.key || '', size: item.size || 0 });
      }

      cursor = cfRes.result_info?.cursor || null;
    } while (cursor && page < 5);

    const foldersMap = new Map<
      string,
      { directCount: number; totalCount: number; directBytes: number; totalBytes: number }
    >();

    // Analyze files and folder paths
    for (const obj of allObjects) {
      const key = obj.key;
      if (!key) continue;

      // If it's a folder placeholder object ending in /
      if (key.endsWith('/')) {
        if (!foldersMap.has(key)) {
          foldersMap.set(key, { directCount: 0, totalCount: 0, directBytes: 0, totalBytes: 0 });
        }
        continue;
      }

      const slashIdx = key.lastIndexOf('/');
      const directFolder = slashIdx !== -1 ? key.substring(0, slashIdx + 1) : '';

      // Tally for all parent folders
      if (directFolder) {
        const parts = directFolder.replace(/\/+$/, '').split('/');
        let cur = '';
        for (let i = 0; i < parts.length; i++) {
          cur += parts[i] + '/';
          const isDirect = cur === directFolder;
          const prev = foldersMap.get(cur) || { directCount: 0, totalCount: 0, directBytes: 0, totalBytes: 0 };
          foldersMap.set(cur, {
            directCount: prev.directCount + (isDirect ? 1 : 0),
            totalCount: prev.totalCount + 1,
            directBytes: prev.directBytes + (isDirect ? obj.size : 0),
            totalBytes: prev.totalBytes + obj.size,
          });
        }
      }
    }

    const tree = buildFolderTree(foldersMap);
    const totalFiles = allObjects.filter((o) => !o.key.endsWith('/')).length;
    const allFolders = Array.from(foldersMap.keys()).sort();

    // Cache the computed tree for 60s
    setCachedFolderTree(creds.accountId, creds.bucketName, {
      tree,
      allFolders,
      totalFiles,
      totalFolders: foldersMap.size,
    });

    return NextResponse.json({
      success: true,
      tree,
      allFolders,
      totalFiles,
      totalFolders: foldersMap.size,
      cached: false,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Create a new folder (creates a 0-byte directory placeholder in R2)
 */
export async function POST(request: Request) {
  try {
    const creds = getR2Credentials(request.headers);
    if (!creds.accountId || !creds.token) {
      return NextResponse.json(
        { success: false, error: 'Chưa cấu hình Cloudflare Account ID hoặc API Token' },
        { status: 400 }
      );
    }

    const { folderPath } = await request.json();
    if (!folderPath || typeof folderPath !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Tên thư mục không được để trống' },
        { status: 400 }
      );
    }

    // Clean folder path: replace backslashes, strip leading slashes, ensure trailing slash
    const cleanPath = folderPath
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');

    const finalPath = cleanPath.endsWith('/') ? cleanPath : cleanPath + '/';

    if (!finalPath || finalPath === '/') {
      return NextResponse.json(
        { success: false, error: 'Đường dẫn thư mục không hợp lệ' },
        { status: 400 }
      );
    }

    // Send PUT request with 0-byte body and Content-Type: application/x-directory
    await cfApiRequest({
      path: `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects/${encodeURIComponent(finalPath)}`,
      method: 'PUT',
      token: creds.token,
      body: Buffer.alloc(0),
      headers: {
        'Content-Type': 'application/x-directory',
        'Content-Length': '0',
      },
    });

    // Invalidate cached tree so next fetch picks up the new folder
    invalidateFolderCache(creds.accountId, creds.bucketName);

    return NextResponse.json({
      success: true,
      folderPath: finalPath,
      message: `Đã tạo thư mục "${finalPath}" thành công trên Cloudflare R2`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
