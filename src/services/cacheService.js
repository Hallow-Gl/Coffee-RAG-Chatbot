/**
 * cacheService.js
 *
 * Abstracts all Redis operations for the product cache layer.
 * The rest of the app never imports redis directly — it goes through here.
 * This means if we ever swap Redis for a different cache, only this file changes.
 */

import { redis } from '../config/redis.js';
import { supabase } from '../config/supabase.js';

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
  return 'products:' + query.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Retrieves a cached value. Returns parsed JSON or null if not found / expired.
 * Callers treat null as a cache miss and should call the real API.
 */
// src/services/cacheService.js — getCached
export async function getCached(key) {
  try {
    const raw = await redis.get(key);
    if (raw === null || raw === undefined) return null;

    // Upstash SDK may return already-parsed object or raw string
    // depending on SDK version and how value was stored
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return raw; }
    }
    return raw; // already an object — return as-is
  } catch (err) {
    console.warn('[cache] read error — falling back:', err.message);
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
    // Jitter: add random offset between -10% and +10% of TTL
    const jitter = Math.floor(ttl * 0.1 * (Math.random() * 2 - 1));
    const finalTTL = ttl + jitter;

    await redis.set(key, JSON.stringify(value), { ex: finalTTL });
  } catch (err) {
    console.warn('[cache] write error:', err.message);
  }
}

const L2_TTL_DAYS = 14;

export async function getL2Cached(queryHash) {
  try {
    const { data, error } = await supabase
      .from('product_cache')
      .select('results, expires_at')
      .eq('query_hash', queryHash)
      .single();

    if (error || !data) return null;
    if (new Date(data.expires_at) < new Date()) return null; // expired
    return data.results;
  } catch {
    return null;
  }
}

export async function setL2Cached(queryHash, queryText, results) {
  try {
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + L2_TTL_DAYS);

    await supabase
      .from('product_cache')
      .upsert({
        query_hash: queryHash,
        query_text: queryText,
        results,
        cached_at: new Date().toISOString(),
        expires_at: expires_at.toISOString(),
      }, { onConflict: 'query_hash' });
  } catch (err) {
    console.warn('[cache-l2] write error:', err.message);
  }
}