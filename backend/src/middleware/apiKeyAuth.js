import crypto from 'crypto';

function keysEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function apiKeyAuth(req, res, next) {
  const expected = process.env.EXPORT_API_KEY;

  if (!expected) {
    return res.status(503).json({ error: 'Export API is disabled: EXPORT_API_KEY is not configured' });
  }

  const key = req.get('X-API-Key') || req.query.api_key || '';

  if (!key || !keysEqual(key, expected)) {
    return res.status(401).json({ error: 'Unauthorized: invalid API key' });
  }

  next();
}
