import { NextResponse } from 'next/server';
import { getR2Credentials } from '@/lib/r2-client';

export async function GET(request: Request) {
  const creds = getR2Credentials(request.headers);
  const isConfigured = !!(
    creds.accountId &&
    (creds.token || (creds.accessKeyId && creds.secretAccessKey))
  );

  return NextResponse.json({
    success: true,
    configured: isConfigured,
    accountId: creds.accountId,
    bucketName: creds.bucketName,
    publicDomain: creds.publicDomain,
    hasToken: !!creds.token,
    hasS3Keys: !!(creds.accessKeyId && creds.secretAccessKey),
  });
}
