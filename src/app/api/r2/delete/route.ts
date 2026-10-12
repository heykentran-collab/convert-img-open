import { NextResponse } from 'next/server';
import { getR2Credentials, cfApiRequest } from '@/lib/r2-client';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số key cần xóa' },
        { status: 400 }
      );
    }

    const creds = getR2Credentials(request.headers);
    if (!creds.accountId || !creds.token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu Cloudflare API Token để xóa file',
        },
        { status: 400 }
      );
    }

    await cfApiRequest({
      path: `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects/${encodeURIComponent(key)}`,
      method: 'DELETE',
      token: creds.token,
    });

    return NextResponse.json({
      success: true,
      key,
      message: 'Đã xóa file thành công trên Cloudflare R2',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
