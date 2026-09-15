import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(userId, secret, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const expiresAt = Date.now() + ttlMs;
  const payload = Buffer.from(`${userId}:${expiresAt}`, 'utf8').toString('base64url');
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload, secret);
  const actual = Buffer.from(signature, 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  let decoded;
  try {
    decoded = Buffer.from(payload, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const [userId, expiresAtRaw] = decoded.split(':');
  const expiresAt = Number(expiresAtRaw);
  if (!userId || !Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    return null;
  }

  return userId;
}
