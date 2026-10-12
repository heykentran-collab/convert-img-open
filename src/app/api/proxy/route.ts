import { NextResponse } from 'next/server';
import { isIP } from 'net';
import dns from 'dns/promises';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const FETCH_TIMEOUT_MS = 10000; // 10 seconds
const MAX_REDIRECTS = 3;

/**
 * Check if an IP address belongs to private, loopback, link-local, multicast, or reserved ranges.
 */
function isPrivateOrBlockedIP(rawIp: string): boolean {
  let ip = rawIp.trim().toLowerCase();

  // Handle IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (ip.startsWith('::ffff:')) {
    const after = ip.slice(7);
    if (after.includes('.')) {
      ip = after;
    }
  }

  const ipFamily = isIP(ip);
  if (ipFamily === 0) {
    return true; // Not a valid IP -> block
  }

  if (ipFamily === 4) {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }
    const [b0, b1] = parts;

    if (b0 === 0) return true; // 0.0.0.0/8 (Broadcast/Current network)
    if (b0 === 10) return true; // 10.0.0.0/8 (Private)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true; // 100.64.0.0/10 (Carrier-grade NAT)
    if (b0 === 127) return true; // 127.0.0.0/8 (Loopback)
    if (b0 === 169 && b1 === 254) return true; // 169.254.0.0/16 (Link-local / Cloud Metadata)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true; // 172.16.0.0/12 (Private)
    if (b0 === 192 && b1 === 0 && parts[2] === 0) return true; // 192.0.0.0/24
    if (b0 === 192 && b1 === 0 && parts[2] === 2) return true; // 192.0.2.0/24 (TEST-NET-1)
    if (b0 === 192 && b1 === 168) return true; // 192.168.0.0/16 (Private)
    if (b0 === 198 && (b1 === 18 || b1 === 19)) return true; // 198.18.0.0/15 (Benchmarking)
    if (b0 === 198 && b1 === 51 && parts[2] === 100) return true; // 198.51.100.0/24 (TEST-NET-2)
    if (b0 === 203 && b1 === 0 && parts[2] === 113) return true; // 203.0.113.0/24 (TEST-NET-3)
    if (b0 >= 224 && b0 <= 239) return true; // 224.0.0.0/4 (Multicast)
    if (b0 >= 240) return true; // 240.0.0.0/4 (Reserved / Broadcast)

    return false;
  }

  // IPv6
  if (ip === '::1' || ip === '::') return true; // Loopback & Unspecified
  if (ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb')) return true; // fe80::/10 (Link-local)
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // fc00::/7 (Unique local)
  if (ip.startsWith('ff')) return true; // ff00::/8 (Multicast)
  if (ip.startsWith('64:ff9b:')) return true; // 64:ff9b::/96 (NAT64)
  if (ip.startsWith('2001:db8:')) return true; // 2001:db8::/32 (Documentation)

  return false;
}

/**
 * Check if hostname is blocked (e.g. localhost, internal cloud metadata).
 */
function isBlockedHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();

  const blockedExact = [
    'localhost',
    'metadata',
    'metadata.google.internal',
    'instance-data',
    '169.254.169.254',
  ];
  if (blockedExact.includes(host)) return true;

  const blockedSuffixes = [
    '.local',
    '.internal',
    '.localhost',
    '.lan',
    '.home',
    '.corp',
    '.test',
    '.example',
    '.invalid',
  ];
  return blockedSuffixes.some((suffix) => host.endsWith(suffix));
}

/**
 * Validate URL against SSRF vulnerabilities: protocol, hostname and DNS IP lookup.
 */
async function validateUrlForSSRF(urlString: string): Promise<{ ok: boolean; error?: string; parsedUrl?: URL }> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { ok: false, error: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only HTTP and HTTPS protocols are allowed' };
  }

  const hostname = parsed.hostname;
  if (!hostname) {
    return { ok: false, error: 'Missing hostname in URL' };
  }

  if (isBlockedHostname(hostname)) {
    return { ok: false, error: 'Access to internal or private hosts is forbidden' };
  }

  // Check if hostname is directly an IP
  if (isIP(hostname)) {
    if (isPrivateOrBlockedIP(hostname)) {
      return { ok: false, error: 'Access to private or reserved IP addresses is forbidden' };
    }
    return { ok: true, parsedUrl: parsed };
  }

  // Resolve hostname via DNS to prevent DNS rebinding to internal addresses
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { ok: false, error: 'Could not resolve hostname' };
    }

    for (const record of addresses) {
      if (isPrivateOrBlockedIP(record.address)) {
        return { ok: false, error: 'Resolved host points to a private or reserved network' };
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'DNS lookup failed';
    return { ok: false, error: `Failed to resolve host: ${msg}` };
  }

  return { ok: true, parsedUrl: parsed };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // SSRF Validation
    let currentUrl = targetUrl;
    let redirectCount = 0;
    let res: Response | null = null;

    while (redirectCount <= MAX_REDIRECTS) {
      const validation = await validateUrlForSSRF(currentUrl);
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 403 });
      }

      res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          'User-Agent': 'VolticenMediaStudioProxy/1.0',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      // Handle redirects manually to validate each target URL against SSRF
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (!location) {
          return NextResponse.json({ error: 'Redirect without Location header' }, { status: 502 });
        }
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        continue;
      }

      break;
    }

    if (!res || !res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch remote image: HTTP ${res?.status || 502}` },
        { status: res?.status || 502 }
      );
    }

    // Verify content type is image
    const contentType = res.headers.get('content-type') || '';
    const isImage = contentType.startsWith('image/') || contentType === 'application/octet-stream';
    if (!isImage) {
      return NextResponse.json(
        { error: `Invalid content type: only image types are permitted (received ${contentType})` },
        { status: 415 }
      );
    }

    // Check Content-Length if provided
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Image exceeds maximum allowed size (25MB)' },
        { status: 413 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Image exceeds maximum allowed size (25MB)' },
        { status: 413 }
      );
    }

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType || 'image/webp',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
