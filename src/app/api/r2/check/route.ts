import { NextResponse } from 'next/server';
import { getR2Credentials, cfApiRequest } from '@/lib/r2-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số key' },
        { status: 400 }
      );
    }

    const creds = getR2Credentials(request.headers);
    if (!creds.accountId || !creds.token) {
      return NextResponse.json({
        success: true,
        exists: false,
        unconfigured: true,
      });
    }

    const cfRes = await cfApiRequest({
      path: `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects?prefix=${encodeURIComponent(key)}&per_page=1`,
      token: creds.token,
    });

    const match = (cfRes.result || []).find((o: any) => o.key === key);
    return NextResponse.json({
      success: true,
      exists: !!match,
      size: match ? match.size : 0,
      uploaded: match ? match.uploaded : null,
      url: match ? `${creds.publicDomain}/${key.replace(/^\/+/, '')}` : null,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      exists: false,
      error: err.message,
    });
  }
}
