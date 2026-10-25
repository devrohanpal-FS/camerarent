import dns from 'dns';
import net from 'net';
import rateLimit from 'express-rate-limit';

export const ALLOWED_PROXY_DOMAINS = ['gpcamerarental.com', 'www.gpcamerarental.com'];

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export const MAX_PROXY_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB maximum

export class PayloadTooLargeError extends Error {
  code = 'PAYLOAD_TOO_LARGE';
  constructor(message = 'Image exceeds maximum allowable size of 5MB') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

/**
 * Validates whether an IP address belongs to private, loopback, link-local,
 * carrier-grade NAT, or other non-routable internal ranges.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return true;
  const cleanIp = ip.trim();

  // Handle IPv4
  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }
    // 0.0.0.0/8 (Current network)
    if (parts[0] === 0) return true;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;
    // 100.64.0.0/10 (Carrier-Grade NAT: 100.64.0.0 - 100.127.255.255)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (Link-Local, Cloud Instance Metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    return false;
  }

  // Handle IPv6
  if (net.isIPv6(cleanIp)) {
    const normalized = cleanIp.toLowerCase();
    // IPv6 loopback / unspecified
    if (normalized === '::1' || normalized === '::') return true;

    // IPv4-mapped IPv6 address (e.g., ::ffff:127.0.0.1 or ::ffff:7f00:1)
    if (normalized.startsWith('::ffff:')) {
      const ipv4Part = cleanIp.slice(7);
      if (net.isIPv4(ipv4Part)) {
        return isPrivateIp(ipv4Part);
      }
      return true;
    }

    // Unique Local Addresses (fc00::/7: fc00... to fdff...)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

    // Link-Local Unicast (fe80::/10: fe8..., fe9..., fea..., feb...)
    if (/^fe[89ab]/i.test(normalized)) return true;

    return false;
  }

  // If unparseable by net.isIP, treat as unsafe
  return true;
}

export type DnsLookupFn = (
  hostname: string,
  options: { all: true }
) => Promise<Array<{ address: string; family: number }>>;

/**
 * Resolves the given hostname using the provided lookup implementation (defaulting to dns.promises.lookup)
 * and verifies that none of the resolved IPs belong to private/internal networks.
 */
export async function validateDns(
  hostname: string,
  lookupFn: DnsLookupFn = (h, opt) =>
    dns.promises.lookup(h, opt) as Promise<Array<{ address: string; family: number }>>
): Promise<{ safe: boolean; error?: string }> {
  try {
    const records = await lookupFn(hostname, { all: true });
    if (!records || records.length === 0) {
      return { safe: false, error: 'No DNS records found for target host' };
    }
    for (const record of records) {
      if (isPrivateIp(record.address)) {
        return {
          safe: false,
          error: 'Forbidden: Access to private or internal addresses is prohibited.',
        };
      }
    }
    return { safe: true };
  } catch (_err) {
    return { safe: false, error: 'Failed to resolve remote host' };
  }
}

/**
 * Streams the response body and accumulates chunks up to maxSize.
 * If the accumulated bytes exceed maxSize, immediately aborts the fetch controller
 * and throws a PayloadTooLargeError. Does NOT depend on Content-Length header.
 */
export async function streamImageWithLimit(
  bodyStream: any,
  abortController?: AbortController,
  maxSize: number = MAX_PROXY_IMAGE_SIZE
): Promise<Buffer> {
  if (!bodyStream) {
    throw new Error('Empty response body from remote server');
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of bodyStream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.length;
    if (totalBytes > maxSize) {
      if (abortController) {
        abortController.abort();
      }
      throw new PayloadTooLargeError();
    }
    chunks.push(buf);
  }

  return Buffer.concat(chunks);
}

/**
 * Rate limiter for proxy-image requests (max 60 requests per minute per IP)
 */
export const imageProxyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 proxy image requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many image proxy requests, please slow down.' },
});
