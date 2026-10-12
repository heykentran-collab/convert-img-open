import { NextResponse } from 'next/server';
import https from 'https';
import { getR2Credentials, cfApiRequest } from '@/lib/r2-client';
import { invalidateFolderCache } from '@/lib/r2-cache';

function getObjectBuffer(
  hostname: string,
  path: string,
  token: string
): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        port: 443,
        path,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              buffer: Buffer.concat(chunks),
              contentType: (res.headers['content-type'] as string) || 'application/octet-stream',
            });
          } else {
            reject(new Error(`Lỗi tải file (HTTP ${res.statusCode})`));
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

export async function POST(request: Request) {
  try {
    const creds = getR2Credentials(request.headers);
    if (!creds.accountId || !creds.token) {
      return NextResponse.json(
        { success: false, error: 'Chưa cấu hình Cloudflare Account ID hoặc API Token' },
        { status: 400 }
      );
    }

    const { oldPath, newPath } = await request.json();
    if (!oldPath || !newPath) {
      return NextResponse.json(
        { success: false, error: 'Thiếu đường dẫn thư mục cũ hoặc mới' },
        { status: 400 }
      );
    }

    const cleanOld = oldPath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
    const cleanNew = newPath.trim().replace(/\\/g, '/').replace(/^\/+/, '');

    const normalizedOld = cleanOld.endsWith('/') ? cleanOld : cleanOld + '/';
    const normalizedNew = cleanNew.endsWith('/') ? cleanNew : cleanNew + '/';

    if (normalizedOld === normalizedNew) {
      return NextResponse.json(
        { success: false, error: 'Tên thư mục mới phải khác tên thư mục hiện tại' },
        { status: 400 }
      );
    }

    // 1. Gather all objects under normalizedOld
    let cursor: string | null = null;
    const matchingObjects: string[] = [];

    do {
      let cfPath = `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects?prefix=${encodeURIComponent(normalizedOld)}&per_page=100`;
      if (cursor) cfPath += `&cursor=${encodeURIComponent(cursor)}`;

      const listRes = await cfApiRequest({
        path: cfPath,
        token: creds.token,
      });

      const items = listRes.result || [];
      for (const item of items) {
        if (item.key) matchingObjects.push(item.key);
      }

      cursor = listRes.result_info?.cursor || null;
    } while (cursor);

    let movedCount = 0;

    // 2. Move each object
    for (const oldKey of matchingObjects) {
      const suffix = oldKey.substring(normalizedOld.length);
      const newKey = normalizedNew + suffix;

      if (oldKey.endsWith('/')) {
        // Folder placeholder (root or nested sub-folder)
        await cfApiRequest({
          path: `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects/${encodeURIComponent(newKey)}`,
          method: 'PUT',
          token: creds.token,
          body: Buffer.alloc(0),
          headers: {
            'Content-Type': 'application/x-directory',
            'Content-Length': '0',
          },
        });
        // Delete old placeholder
        await cfApiRequest({
          path: `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects/${encodeURIComponent(oldKey)}`,
          method: 'DELETE',
          token: creds.token,
        });
        continue;
      }

      // Download old object
      const downloadPath = `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects/${encodeURIComponent(oldKey)}`;
      const { buffer, contentType } = await getObjectBuffer('api.cloudflare.com', downloadPath, creds.token);

      // Upload to new key
      const uploadPath = `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects/${encodeURIComponent(newKey)}`;
      await cfApiRequest({
        path: uploadPath,
        method: 'PUT',
        token: creds.token,
        body: buffer,
        headers: {
          'Content-Type': contentType,
        },
      });

      // Delete old object
      await cfApiRequest({
        path: downloadPath,
        method: 'DELETE',
        token: creds.token,
      });

      movedCount++;
    }

    // If folder was empty without placeholder, ensure new folder placeholder exists
    if (matchingObjects.length === 0) {
      await cfApiRequest({
        path: `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects/${encodeURIComponent(normalizedNew)}`,
        method: 'PUT',
        token: creds.token,
        body: Buffer.alloc(0),
        headers: {
          'Content-Type': 'application/x-directory',
          'Content-Length': '0',
        },
      });
    }

    invalidateFolderCache(creds.accountId, creds.bucketName);

    return NextResponse.json({
      success: true,
      oldPath: normalizedOld,
      newPath: normalizedNew,
      movedCount,
      message: `Đã đổi tên thư mục thành "${normalizedNew}" (${movedCount} tệp được chuyển)`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
