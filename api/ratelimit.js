/**
 * api/ratelimit.js — In-memory rate limiter (Vercel serverless)
 * Limit: 3 requests per IP per 10 minutes
 * Features: sliding window, detailed headers, abuse fingerprinting
 */

const store = new Map();
const LIMIT = 3;
const WINDOW_MS = 10 * 60 * 1000; // 10 min
const BAN_THRESHOLD = 20;          // >20 req = temp ban 1h
const BAN_DURATION  = 60 * 60 * 1000;

export function checkRateLimit(ip) {
  const now = Date.now();
  const entry = store.get(ip);

  // Check temp ban
  if (entry?.bannedUntil && now < entry.bannedUntil) {
    const retryAfter = Math.ceil((entry.bannedUntil - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter, banned: true };
  }

  // New IP or expired window
  if (!entry || now - entry.resetAt > WINDOW_MS) {
    store.set(ip, { count: 1, resetAt: now, total: (entry?.total || 0) + 1 });
    return { allowed: true, remaining: LIMIT - 1, resetAt: now + WINDOW_MS };
  }

  entry.total = (entry.total || 0) + 1;

  // Abuse detection: apply temp ban
  if (entry.total >= BAN_THRESHOLD) {
    entry.bannedUntil = now + BAN_DURATION;
    store.set(ip, entry);
    return { allowed: false, remaining: 0, retryAfter: BAN_DURATION / 1000, banned: true };
  }

  if (entry.count >= LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: LIMIT - entry.count, resetAt: entry.resetAt + WINDOW_MS };
}

// Cleanup every 30 min
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store.entries()) {
      const expired = now - entry.resetAt > WINDOW_MS;
      const banExpired = entry.bannedUntil && now > entry.bannedUntil;
      if (expired && !entry.bannedUntil) store.delete(ip);
      else if (banExpired) store.delete(ip);
    }
  }, 30 * 60 * 1000);
}
