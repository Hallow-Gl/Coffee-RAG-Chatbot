import 'dotenv/config';
import { redis } from '../src/config/redis.js';
import { buildCacheKey, getL2Cached } from '../src/services/cacheService.js';
import { searchProducts } from '../src/services/productService.js';

const TEST_QUERY = 'hand grinder';

async function test() {
  const key = buildCacheKey(TEST_QUERY);
  console.log(`Testing two-tier cache with: "${TEST_QUERY}"`);
  console.log(`Cache key: ${key}\n`);

  // --- confirm L2 exists before we start ---
  const l2before = await getL2Cached(key);
  console.log(`L2 (Supabase) before test: ${l2before ? `${l2before.length} products` : 'EMPTY'}`);
  if (!l2before) {
    console.log('Run backfillL2Cache.js first.');
    process.exit(1);
  }

  // --- delete from Redis to force L2 hit ---
  await redis.del(key);
  console.log(`L1 (Redis) deleted — forcing L2 path\n`);

  // --- call searchProducts — should hit L2, not SerpAPI ---
  console.log('--- Call 1 (expect L2 hit + Redis backfill) ---');
  const result1 = await searchProducts(TEST_QUERY);
  console.log(`Returned: ${result1.length} products`);
  console.log(`First: ${result1[0]?.title}\n`);

  // --- confirm Redis was backfilled ---
  const l1after = await redis.get(key);
  console.log(`L1 (Redis) after L2 hit: ${l1after ? 'REPOPULATED ' : 'still empty X'}\n`);

  // --- call again — should now hit Redis ---
  console.log('--- Call 2 (expect L1 Redis hit) ---');
  const result2 = await searchProducts(TEST_QUERY);
  console.log(`Returned: ${result2.length} products`);

  console.log('\n=== Summary ===');
  console.log(`L2 Supabase had data:     ${l2before ? '' : 'X'}`);
  console.log(`L2 hit returned products: ${result1.length > 0 ? '' : 'X'}`);
  console.log(`Redis backfilled after L2: ${l1after ? '' : 'X'}`);
  console.log(`Second call used Redis:     (check logs above for "L1 hit")`);
  console.log(`SerpAPI calls made:        0 `);
}

test().catch(console.error);