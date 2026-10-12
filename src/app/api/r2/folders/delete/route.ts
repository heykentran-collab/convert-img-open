import { NextResponse } from 'next/server';
import { getR2Credentials, cfApiRequest } from '@/lib/r2-client';
import { invalidateFolderCache } from '@/lib/r2-cache';

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
    if (!folderPath) {
      return NextResponse.json(
        { success: false, error: 'Thiếu đường dẫn thư mục cần xóa' },
        { status: 400 }
      );
    }

    const cleanPath = folderPath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
    const normalizedFolder = cleanPath.endsWith('/') ? cleanPath : cleanPath + '/';

    // Prevent accidental deletion of root or critical empty path
    if (!normalizedFolder || normalizedFolder === '/') {
      return NextResponse.json(
        { success: false, error: 'Không thể xóa thư mục gốc của bucket' },
        { status: 400 }
      );
    }

    // 1. Gather all objects with prefix normalizedFolder
    let cursor: string | null = null;
    const matchingKeys: string[] = [];

    do {
      let cfPath = `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects?prefix=${encodeURIComponent(normalizedFolder)}&per_page=100`;
      if (cursor) cfPath += `&cursor=${encodeURIComponent(cursor)}`;

      const listRes = await cfApiRequest({
        path: cfPath,
        token: creds.token,
      });

      const items = listRes.result || [];
      for (const item of items) {
        if (item.key) matchingKeys.push(item.key);
      }

      cursor = listRes.result_info?.cursor || null;
    } while (cursor);

    // 2. Delete each object
    let deletedCount = 0;
    for (const key of matchingKeys) {
      await cfApiRequest({
        path: `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects/${encodeURIComponent(key)}`,
        method: 'DELETE',
        token: creds.token,
      });
      deletedCount++;
    }

    // Also attempt deleting folder placeholder itself if not matched
    try {
      await cfApiRequest({
        path: `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects/${encodeURIComponent(normalizedFolder)}`,
        method: 'DELETE',
        token: creds.token,
      });
    } catch {
      // Ignore if doesn't exist
    }

    invalidateFolderCache(creds.accountId, creds.bucketName);

    return NextResponse.json({
      success: true,
      folderPath: normalizedFolder,
      deletedCount,
      message: `Đã xóa thư mục "${normalizedFolder}" (${deletedCount} tệp và thư mục con đã được dọn sạch)`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
