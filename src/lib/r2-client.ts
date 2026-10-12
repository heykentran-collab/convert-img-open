import https from 'https';
import crypto from 'crypto';

export function cleanAccountId(input?: string): string {
  if (!input) return '';
  const id = input.trim();
  const match = id.match(/([a-f0-9]{32})/i);
  if (match) return match[1].toLowerCase();
  return id
    .replace(/^https?:\/\//i, '')
    .replace(/\.r2\.cloudflarestorage\.com.*$/i, '')
    .replace(/\/.*$/, '')
    .trim();
}

export function getR2Credentials(headers?: Headers) {
  const accountId = cleanAccountId(
    headers?.get('x-r2-account-id') || ''
  );
  const token = (
    headers?.get('x-r2-api-token') || ''
  ).trim();
  const accessKeyId = (
    headers?.get('x-r2-access-key-id') || ''
  ).trim();
  const secretAccessKey = (
    headers?.get('x-r2-secret-access-key') || ''
  ).trim();
  const bucketName = (
    headers?.get('x-r2-bucket-name') || ''
  ).trim();
  const publicDomain = (
    headers?.get('x-r2-public-domain') || ''
  ).replace(/\/+$/, '');

  const endpoint = (headers?.get('x-r2-endpoint') || '').trim();
  const region = (headers?.get('x-r2-region') || 'auto').trim();

  return {
    accountId,
    token,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicDomain,
    endpoint,
    region,
  };
}

const cfHttpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 15,
});

export function cfApiRequest({
  path,
  method = 'GET',
  token,
  body,
  headers = {},
}: {
  path: string;
  method?: string;
  token: string;
  body?: Buffer | string;
  headers?: Record<string, string>;
}): Promise<any> {
  return new Promise((resolve, reject) => {
    const reqHeaders: Record<string, string | number> = {
      Authorization: `Bearer ${token}`,
      ...headers,
    };
    if (body && !reqHeaders['Content-Length'] && !reqHeaders['content-length']) {
      reqHeaders['Content-Length'] = Buffer.isBuffer(body)
        ? body.length
        : Buffer.byteLength(body);
    }

    const req = https.request(
      {
        hostname: 'api.cloudflare.com',
        port: 443,
        path,
        method,
        headers: reqHeaders,
        agent: cfHttpsAgent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const resBody = Buffer.concat(chunks).toString('utf8');
          try {
            const json = JSON.parse(resBody);
            if (
              res.statusCode &&
              res.statusCode >= 200 &&
              res.statusCode < 300 &&
              json.success
            ) {
              resolve(json);
            } else {
              const errStr =
                json.errors && json.errors.length
                  ? json.errors.map((e: any) => e.message).join(', ')
                  : resBody || `HTTP ${res.statusCode}`;
              reject(new Error(errStr));
            }
          } catch {
            if (
              res.statusCode &&
              res.statusCode >= 200 &&
              res.statusCode < 300
            ) {
              resolve({ raw: resBody, statusCode: res.statusCode });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${resBody}`));
            }
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

export function s3UploadDirect({
  accountId,
  bucket,
  key,
  body,
  contentType,
  accessKeyId,
  secretAccessKey,
  endpoint,
  region = 'auto',
}: {
  accountId: string;
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  region?: string;
}): Promise<{ statusCode?: number }> {
  return new Promise((resolve, reject) => {
    const cleanId = cleanAccountId(accountId);
    const host = endpoint
      ? endpoint.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
      : `${cleanId}.r2.cloudflarestorage.com`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const s3Region = region || 'auto';
    const service = 's3';

    const cleanKey = key.replace(/^\/+/, '');
    const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
    const canonicalUri =
      '/' +
      bucket +
      '/' +
      cleanKey.split('/').map(encodeURIComponent).join('/');
    const canonicalQuery = '';

    const headers: Record<string, string | number> = {
      'content-length': body.length,
      'content-type': contentType || 'application/octet-stream',
      host: host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    const signedHeaders = Object.keys(headers).sort().join(';');
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map((k) => `${k}:${headers[k]}\n`)
      .join('');

    const canonicalRequest = [
      'PUT',
      canonicalUri,
      canonicalQuery,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const canonicalRequestHash = crypto
      .createHash('sha256')
      .update(canonicalRequest, 'utf8')
      .digest('hex');
    const credentialScope = `${dateStamp}/${s3Region}/${service}/aws4_request`;

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    const kDate = crypto
      .createHmac('sha256', 'AWS4' + secretAccessKey)
      .update(dateStamp, 'utf8')
      .digest();
    const kRegion = crypto
      .createHmac('sha256', kDate)
      .update(s3Region, 'utf8')
      .digest();
    const kService = crypto
      .createHmac('sha256', kRegion)
      .update(service, 'utf8')
      .digest();
    const kSigning = crypto
      .createHmac('sha256', kService)
      .update('aws4_request', 'utf8')
      .digest();
    const signature = crypto
      .createHmac('sha256', kSigning)
      .update(stringToSign, 'utf8')
      .digest('hex');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const req = https.request(
      {
        hostname: host,
        port: 443,
        path: canonicalUri,
        method: 'PUT',
        headers: {
          ...headers,
          Authorization: authHeader,
        },
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode });
          } else {
            const codeMatch = resBody.match(/<Code>([^<]+)<\/Code>/i);
            const msgMatch = resBody.match(/<Message>([^<]+)<\/Message>/i);
            const errorMsg =
              (codeMatch ? codeMatch[1] + ': ' : '') +
              (msgMatch ? msgMatch[1] : resBody || res.statusMessage);
            reject(new Error(errorMsg || `HTTP ${res.statusCode}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      let msg = err.message || '';
      if (
        msg.includes('SSL alert number 40') ||
        msg.includes('handshake failure')
      ) {
        msg = `Sai Cloudflare Account ID: Cloudflare từ chối kết nối SSL (Handshake Failure).`;
      }
      reject(new Error(msg));
    });
    req.write(body);
    req.end();
  });
}
