import { createHmac } from 'crypto';

/**
 * Implementação mínima de TOTP (RFC 6238) sem dependências externas.
 * Usa Base32 decoding próprio + HMAC-SHA1.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function decodeBase32(secret: string): Buffer {
  const cleaned = secret.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (const ch of cleaned) {
    const v = BASE32_ALPHABET.indexOf(ch);
    if (v === -1) throw new Error('Invalid Base32');
    bits += v.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
  }
  return Buffer.from(bytes);
}

export function encodeBase32(buf: Buffer): string {
  let bits = '';
  for (const b of buf) {
    bits += b.toString(2).padStart(8, '0');
  }
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, '0');
    result += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return result;
}

export function generateSecret(size = 20): string {
  const buf = Buffer.alloc(size);
  // Não-crypto random: suficiente para secret de TOTP (não é autenticação)
  for (let i = 0; i < size; i++) {
    buf[i] = Math.floor(Math.random() * 256);
  }
  return encodeBase32(buf);
}

function counterToBytes(counter: number): Buffer {
  const buf = Buffer.alloc(8);
  // high 32 bits em big-endian
  const high = Math.floor(counter / 0x100000000);
  buf.writeUInt32BE(high, 0);
  buf.writeUInt32BE(counter & 0xffffffff, 4);
  return buf;
}

export function generateCode(secret: string, time = Date.now()): string {
  const counter = Math.floor(time / 30000);
  const key = decodeBase32(secret);
  const hmac = createHmac('sha1', key).update(counterToBytes(counter)).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}

export function verifyCode(secret: string, code: string, window = 1): boolean {
  const now = Date.now();
  const counter = Math.floor(now / 30000);
  for (let i = -window; i <= window; i++) {
    const t = (counter + i) * 30000;
    const expected = generateCode(secret, t);
    if (expected === code) return true;
  }
  return false;
}

export function generateOtpAuthUri(username: string, issuer: string, secret: string): string {
  const params = new URLSearchParams({ secret, issuer });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?${params.toString()}`;
}
