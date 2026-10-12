import { NextResponse } from 'next/server';
import { getR2Credentials, cfApiRequest, s3UploadDirect } from '@/lib/r2-client';

export async function POST(request: Request) {
  try {
    const creds = getR2Credentials(request.headers);
    const key = decodeURIComponent(request.headers.get('x-r2-key') || '');
    const contentType =
      request.headers.get('x-r2-content-type') || 'image/webp';

    if (!creds.accountId || !creds.bucketName || !key) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu Account ID, Bucket Name hoặc Key của file',
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await request.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    if (creds.token) {
      await cfApiRequest({
        path: `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects/${encodeURIComponent(key.replace(/^\/+/, ''))}`,
        method: 'PUT',
        token: creds.token,
        body: fileBuffer,
        headers: {
          'Content-Type': contentType,
        },
      });
    } else if (creds.accessKeyId && creds.secretAccessKey) {
      await s3UploadDirect({
        accountId: creds.accountId,
        bucket: creds.bucketName,
        key: key.trim(),
        body: fileBuffer,
        contentType,
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        endpoint: creds.endpoint,
        region: creds.region,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu API Token hoặc S3 Keys để upload lên Cloudflare R2',
        },
        { status: 400 }
      );
    }

    const publicUrl = `${creds.publicDomain}/${key.replace(/^\/+/, '')}`;
    return NextResponse.json({
      success: true,
      key,
      publicUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
