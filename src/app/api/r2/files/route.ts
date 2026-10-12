import { NextResponse } from 'next/server';
import path from 'path';
import { getR2Credentials, cfApiRequest } from '@/lib/r2-client';
import { R2File } from '@/types/r2';

export async function GET(request: Request) {
  try {
    const creds = getR2Credentials(request.headers);
    if (!creds.accountId || !creds.token || !creds.bucketName) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: 'Chưa cấu hình Cloudflare Account ID, API Token hoặc Bucket Name trong Cài đặt',
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawPrefix = searchParams.get('prefix') || '';
    const prefix = rawPrefix ? (rawPrefix.endsWith('/') ? rawPrefix : rawPrefix + '/') : '';
    const recursive = searchParams.get('recursive') !== 'false'; // default true
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const limit = Math.min(parseInt(searchParams.get('limit') || '300', 10), 1000);

    // Fetch objects with prefix
    let cursor: string | null = searchParams.get('cursor') || null;
    const rawItems: any[] = [];
    let pageCount = 0;
    const maxPages = prefix ? 5 : 2; // fetch up to 500 items if prefix is specified

    do {
      pageCount++;
      let cfPath = `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects?per_page=500`;
      if (prefix) cfPath += `&prefix=${encodeURIComponent(prefix)}`;
      if (cursor) cfPath += `&cursor=${encodeURIComponent(cursor)}`;

      const cfRes = await cfApiRequest({
        path: cfPath,
        token: creds.token,
      });

      const items: any[] = cfRes.result || [];
      rawItems.push(...items);

      cursor = cfRes.result_info?.cursor || null;
    } while (cursor && rawItems.length < limit && pageCount < maxPages);

    const files: R2File[] = [];
    const allFolderSet = new Set<string>();
    const immediateSubfolderSet = new Set<string>();

    for (const item of rawItems) {
      const key: string = item.key || '';
      if (!key) continue;

      // Handle folder placeholder object
      if (key.endsWith('/')) {
        allFolderSet.add(key);
        if (prefix && key.startsWith(prefix) && key !== prefix) {
          const rest = key.substring(prefix.length);
          const firstSlash = rest.indexOf('/');
          if (firstSlash !== -1) {
            immediateSubfolderSet.add(prefix + rest.substring(0, firstSlash + 1));
          } else {
            immediateSubfolderSet.add(key);
          }
        } else if (!prefix) {
          const firstSlash = key.indexOf('/');
          if (firstSlash !== -1) {
            immediateSubfolderSet.add(key.substring(0, firstSlash + 1));
          }
        }
        continue;
      }

      const slashIdx = key.lastIndexOf('/');
      const itemFolder = slashIdx !== -1 ? key.substring(0, slashIdx + 1) : '';
      if (itemFolder) {
        allFolderSet.add(itemFolder);
      }

      // Detect immediate subfolder under current prefix
      if (prefix) {
        if (key.startsWith(prefix)) {
          const rest = key.substring(prefix.length);
          const firstSlash = rest.indexOf('/');
          if (firstSlash !== -1) {
            immediateSubfolderSet.add(prefix + rest.substring(0, firstSlash + 1));
          }
        }
      } else {
        const firstSlash = key.indexOf('/');
        if (firstSlash !== -1) {
          immediateSubfolderSet.add(key.substring(0, firstSlash + 1));
        }
      }

      // Check if file should be included
      if (!recursive) {
        // Only include files whose direct folder matches prefix exactly
        if (itemFolder !== prefix) {
          continue;
        }
      }

      const filename = slashIdx !== -1 ? key.substring(slashIdx + 1) : key;
      const ext = path.extname(filename).toLowerCase().replace('.', '');

      if (search && !key.toLowerCase().includes(search) && !filename.toLowerCase().includes(search)) {
        continue;
      }

      files.push({
        key,
        name: filename,
        folder: itemFolder,
        ext: ext || 'unknown',
        size: item.size || 0,
        uploaded: item.uploaded || item.version || null,
        etag: item.etag || '',
        url: `${creds.publicDomain}/${key.replace(/^\/+/, '')}`,
      });
    }

    // Determine parent folder for navigation
    let parentFolder: string | null = null;
    if (prefix) {
      const trimmed = prefix.replace(/\/+$/, '');
      const lastSlash = trimmed.lastIndexOf('/');
      parentFolder = lastSlash !== -1 ? trimmed.substring(0, lastSlash + 1) : '';
    }

    return NextResponse.json({
      success: true,
      files,
      currentFolder: prefix || '',
      parentFolder,
      immediateSubfolders: Array.from(immediateSubfolderSet).sort(),
      folders: Array.from(allFolderSet).sort(),
      cursor,
      hasMore: !!cursor,
      totalReturned: files.length,
      publicDomain: creds.publicDomain,
      bucketName: creds.bucketName,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
