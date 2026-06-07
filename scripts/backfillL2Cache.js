import 'dotenv/config';
import { redis } from '../src/config/redis.js';
import { buildCacheKey, setL2Cached } from '../src/services/cacheService.js';

const WARM_QUERIES = [
  'hand grinder',
  'french press',
  'moka pot',
  'pour over v60',
  'espresso machine beginner',
  'coffee beans Philippines',
  'gooseneck kettle',
  'coffee scale',
];

async function backfill() {
  console.log('Backfilling Redis → Supabase L2...\n');
  let written = 0;
  let missing = 0;

  for (const query of WARM_QUERIES) {
    const key = buildCacheKey(query);
    const raw = await redis.get(key);

    if (!raw) {
      console.log(`⚠  Not in Redis (not warmed yet): ${query}`);
      missing++;
      continue;
    }

    const results = typeof raw === 'string' ? JSON.parse(raw) : raw;
    await setL2Cached(key, query, results);
    console.log(`✅ Backfilled: ${query} → ${results.length} products`);
    written++;
  }

  console.log(`\nDone. Written: ${written} | Not found in Redis: ${missing}`);
}

backfill().catch(console.error);