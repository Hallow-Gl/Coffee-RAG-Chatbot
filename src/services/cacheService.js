/**
 * cacheService.js
 *
 * Abstracts all Redis operations for the product cache layer.
 * The rest of the app never imports redis directly — it goes through here.
 * This means if we ever swap Redis for a different cache, only this file changes.
 */

import { redis } from '../config/redis.js';

// Default TTL: 48 hours in seconds.
// Coffee product prices on Shopee/Lazada change slowly.
// Serving a 48-hour-old price is acceptable for this use case.
const DEFAULT_TTL = 60 * 60 * 48; // 172800 seconds

/**
 * Builds a normalised, collision-safe Redis key from a user query.
 * "Best Hand Grinder" and "best hand grinder" must map to the same key,
 * otherwise the same query bypasses the cache depending on capitalisation.
 */
export function buildCacheKey(query) {
  return 'products:' + query.toLowerCase().trim().replace(/s+/g, '-');
}

/**
 * Retrieves a cached value. Returns parsed JSON or null if not found / expired.
 * Callers treat null as a cache miss and should call the real API.
 */
export async function getCached(key) {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err) {
    // Cache read failure should never crash the app.
    // Log it and return null so the caller falls back to the real API.
    console.warn('[cache] read error — falling back to API:', err.message);
    return null;
  }
}

/**
 * Stores a value in Redis with optional TTL.
 * Serialises to JSON so any JS value can be cached.
 * Failures are silently swallowed — a failed cache write is not fatal.
 */
export async function setCached(key, value, ttl = DEFAULT_TTL) {
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttl });
  } catch (err) {
    console.warn('[cache] write error — continuing without cache:', err.message);
  }
}