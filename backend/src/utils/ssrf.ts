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

export const MAX_PROXY_IMAGE_SIZE = 5 * 1024 * 1024;

export class PayloadTooLargeError extends Error {
  code = 'PAYLOAD_TOO_LARGE';
  constructor(message = 'Image exceeds maximum allowable size of 5MB') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

export function isPrivateIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return true;
  const cleanIp = ip.trim();

  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }
    if (parts[0] === 0) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    return false;
  }

  if (net.isIPv6(cleanIp)) {
    const normalized = cleanIp.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true;

    if (normalized.startsWith('::ffff:')) {
      const ipv4Part = cleanIp.slice(7);
      if (net.isIPv4(ipv4Part)) {
        return isPrivateIp(ipv4Part);
      }
      return true;
    }

    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

    if (/^fe[89ab]/i.test(normalized)) return true;

    return false;
  }

  return true;
}

export type DnsLookupFn = (
  hostname: string,
  options: { all: true }
) => Promise<Array<{ address: string; family: number }>>;

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

export const imageProxyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many image proxy requests, please slow down.' },
});
