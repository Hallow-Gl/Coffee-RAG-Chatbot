import 'dotenv/config';
import { getCached, setCached, buildCacheKey } from '../src/services/cacheService.js';
import { redis } from '../src/config/redis.js';

async function runTests() {
  console.log('=== Cache Edge Case Tests ===');

  // TEST 1: Key normalisation correctness
  // All of these should produce the SAME cache key
  const variations = [
    'Hand Grinder',
    'hand grinder',
    'HAND GRINDER',
    '  hand grinder  ',
    'hand  grinder',   // double space
  ];
  const keys = variations.map(buildCacheKey);
  const allSame = keys.every(k => k === keys[0]);
  console.log('Test 1 — Key normalisation');
  console.log('Keys:', [...new Set(keys)]);
  console.log(allSame ? 'All variations map to same key' : 'Keys differ — normalisation broken');
  console.log();

  // TEST 2: getCached returns null for non-existent key
  const missing = await getCached('products:this-key-does-not-exist-xyz');
  console.log('Test 2 — Missing key returns null');
  console.log(missing === null ? 'Returns null (cache miss)' : 'Expected null, got: ' + missing);
  console.log();

  // TEST 3: setCached + getCached round-trip with complex object
  const testKey   = 'test:edge-case-roundtrip';
  const testValue = [
    { title: 'Timemore C2', price: '₱1,500', rating: 4.8, source: 'Shopee' },
    { title: 'Hario Skerton', price: '₱900', rating: null, source: 'Lazada' },
  ];
  await setCached(testKey, testValue, 30); // 30s TTL for test
  const retrieved = await getCached(testKey);
  const match = JSON.stringify(retrieved) === JSON.stringify(testValue);
  console.log('Test 3 — Round-trip: store array → retrieve array');
  console.log(match ? 'Retrieved value matches stored value' : 'Values do not match');
  console.log('Retrieved:', retrieved?.[0]?.title);
  console.log();

  // TEST 4: setCached handles empty array gracefully
  const emptyKey = 'test:empty-results';
  await setCached(emptyKey, [], 30);
  const emptyResult = await getCached(emptyKey);
  console.log('Test 4 — Empty array stored and retrieved');
  console.log(Array.isArray(emptyResult) && emptyResult.length === 0
    ? 'Empty array returned correctly'
    : 'Expected [], got: ' + JSON.stringify(emptyResult));
  console.log();

  // Cleanup test keys
  await redis.del(testKey);
  await redis.del(emptyKey);
  console.log('=== All tests complete ===');
}

runTests().catch(console.error);