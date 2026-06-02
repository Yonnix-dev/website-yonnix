/**
 * api/ratelimit.js — In-memory rate limiter (Vercel serverless)
 * Exported as a helper used by api/ticket.js
 * Limit: 3 requests per IP per 10 minutes
 */

const store = new Map();
const LIMIT = 3;
const WINDOW_MS = 10 * 60 * 1000; // 10 min

export function checkRateLimit(ip) {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.resetAt > WINDOW_MS) {
    store.set(ip, { count: 1, resetAt: now });
    return { allowed: true, remaining: LIMIT - 1 };
  }

  if (entry.count >= LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: LIMIT - entry.count };
}

// Cleanup old entries every 30 min to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    if (now - entry.resetAt > WINDOW_MS) store.delete(ip);
  }
}, 30 * 60 * 1000);
