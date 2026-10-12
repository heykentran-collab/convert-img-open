import { NextResponse } from 'next/server';
import { getR2Credentials, cfApiRequest, s3UploadDirect } from '@/lib/r2-client';

export async function POST(request: Request) {
  try {
    const config = await request.json();
    const headers = new Headers();
    if (config.accountId) headers.set('x-r2-account-id', config.accountId);
    if (config.apiToken) headers.set('x-r2-api-token', config.apiToken);
    if (config.accessKeyId) headers.set('x-r2-access-key-id', config.accessKeyId);
    if (config.secretAccessKey) headers.set('x-r2-secret-access-key', config.secretAccessKey);
    if (config.bucketName) headers.set('x-r2-bucket-name', config.bucketName);
    if (config.endpoint) headers.set('x-r2-endpoint', config.endpoint);
    if (config.region) headers.set('x-r2-region', config.region);

    const creds = getR2Credentials(headers);

    if (creds.token && creds.accountId) {
      await cfApiRequest({
        path: `/client/v4/accounts/${creds.accountId}/r2/buckets/${creds.bucketName}/objects?per_page=1`,
        token: creds.token,
      });
      return NextResponse.json({
        success: true,
        message: 'Kết nối Cloudflare R2 qua API Token thành công 100%!',
      });
    }

    if (creds.accessKeyId && creds.secretAccessKey && (creds.accountId || creds.endpoint)) {
      const testData = Buffer.from('volticen-r2-ping-' + Date.now(), 'utf8');
      const pingKey = `_test/ping-${Date.now()}.txt`;
      await s3UploadDirect({
        accountId: creds.accountId,
        bucket: creds.bucketName,
        key: pingKey,
        body: testData,
        contentType: 'text/plain',
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        endpoint: creds.endpoint,
        region: creds.region,
      });
      return NextResponse.json({
        success: true,
        message: 'Kết nối Cloud Storage (S3 API) thành công 100%!',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Thiếu API Token hoặc S3 Keys của Cloudflare R2',
      },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
