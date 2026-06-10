# Coffee RAG Chatbot Context

## Project Overview

Coffee RAG Chatbot is a Node.js/Express backend for "BrewBuddy", an AI coffee assistant for the Philippines market. It answers brewing, gear, troubleshooting, flavor, grinder, and budget questions by retrieving coffee knowledge from Supabase pgvector and generating grounded responses with Gemini.

Primary API:

```text
POST /api/chat
body: { "message": "Why does my espresso taste sour?" }
response: { "reply": "...", "sources": [...] }
```

The repository also includes product-search infrastructure for Philippine shopping queries using SerpAPI with a two-tier cache, but product search is not currently exposed through the chat route.

## Tech Stack and Dependencies

- Runtime: Node.js >= 18, ES modules (`"type": "module"`).
- API: Express 5, CORS, JSON body parsing.
- Generation: Google Gemini through `@google/generative-ai`, using `gemini-2.5-flash`.
- Embeddings: Gemini REST API, `gemini-embedding-001`, 3072-dimensional vectors.
- Database: Supabase PostgreSQL with pgvector.
- Cache: Upstash Redis as L1, Supabase `product_cache` as L2.
- Product search: SerpAPI Google Shopping via `fetch`.
- Tooling: ESLint 10 flat config, `@eslint/js`, `globals`, `nodemon`, `prettier`.

Core dependencies: `@google/generative-ai`, `@supabase/supabase-js`, `@upstash/redis`, `axios`, `cors`, `dotenv`, `express`.

## Folder and File Structure

```text
src/
  app.js                         Express app entry point
  config/
    gemini.js                    Gemini client and chat model
    redis.js                     Upstash Redis client
    supabase.js                  Supabase service-role client
  middleware/
    errorHandler.js              Central Express error handler
  routes/
    chat.js                      POST /api/chat route
  services/
    embeddingService.js          Gemini embedding request
    retrievalService.js          Query embedding + Supabase vector retrieval
    generationService.js         BrewBuddy prompt + Gemini generation
    productService.js            SerpAPI product search with L1/L2 cache
    cacheService.js              Redis and Supabase product cache helpers
  eslint.config.js               ESLint flat config

database/
  scheme.sql                     Tables/extensions: pgvector, knowledge, product cache, sessions
  functions.sql                  match_coffee_knowledge RPC

scripts/
  KnowledgeEntries.js            Raw markdown coffee knowledge
  seedKnowledge.js               Chunk and upsert knowledge rows
  generateEmbeddings.js          Fill null embeddings for knowledge rows
  testConnection.js              Supabase connection check
  testEmbeddings.js              Retrieval smoke tests
  testDims.js                    Embedding dimension check
  listModels.js                  Gemini model listing
  testCache.js                   Redis TTL test
  testCacheEdgeCases.js          Cache key/round-trip tests
  testProducts.js                Product search/cache smoke test
  warmCache.js                   Pre-warm common product queries
  backfillL2Cache.js             Copy warmed Redis entries to Supabase L2
  testTwoTierCache.js            Verify L2 hit and Redis backfill

README.md                        Short architecture summary
CONTEXT.md                       This onboarding/context file
.env.example                     Environment variable template
```

## Architecture and Data Flow

### RAG Chat Flow

1. `src/app.js` starts Express, enables CORS/JSON, exposes `GET /health`, mounts `/api/chat`, and registers `errorHandler`.
2. `src/routes/chat.js` validates `message` as a non-empty string.
3. `retrieveContext(query, { topK: 5 })` in `retrievalService.js` embeds the query with `embedText`.
4. `embedText` calls Gemini `gemini-embedding-001:embedContent`.
5. Retrieval calls Supabase RPC `match_coffee_knowledge` with `query_embedding`, `match_count`, and optional `filter_category`.
6. The RPC returns chunks above similarity `0.70`, ordered by cosine distance.
7. If no chunks match, retrieval falls back to the first 3 embedded `coffee_knowledge` rows and marks `similarity: null`.
8. `generateAnswer(query, chunks)` builds a BrewBuddy prompt that instructs Gemini to answer only from context, stay concise, mention Philippine peso prices when relevant, and acknowledge missing context.
9. The route returns `{ reply, sources }`, where `sources` includes title, category, and similarity percentage for real vector matches.

### Product Search Cache Flow

`searchProducts(query)` in `productService.js` is designed for shopping recommendations:

1. Build normalized key with `buildCacheKey(query)`, e.g. `products:hand-grinder`.
2. Check L1 Redis via `getCached`.
3. If L1 misses, check L2 Supabase `product_cache` via `getL2Cached`.
4. If L2 hits, backfill Redis with `setCached`.
5. If both miss, call SerpAPI Google Shopping for `${query} Philippines`.
6. Normalize top 8 product results into `{ title, price, link, source, rating, image }`.
7. Store results in Redis with TTL jitter and Supabase L2 with a 14-day expiry.
8. Quota exhaustion returns an empty array; retryable network/API errors throw `ProductSearchError`.

## Key Features

- Grounded coffee Q&A using seeded knowledge chunks and vector search.
- Philippines-specific coffee advice, including local prices, Shopee/Lazada context, local beans, and student/young professional budgets.
- Source transparency in chat responses.
- Fallback retrieval for broad or low-similarity questions.
- Markdown knowledge seeding by `##`/`###` headings with metadata preservation.
- Separate embedding generation script for rows missing vectors.
- Two-tier product cache for common gear/product searches.
- Cache warming/backfill scripts for deployment or quota protection.
- Production-aware error responses: raw error messages are hidden when `NODE_ENV=production`.

## APIs, Services, and Database Models

### HTTP API

- `GET /health`: returns `{ status: "ok", project: "coffee-rag-chatbot" }`.
- `POST /api/chat`: accepts `{ message: string }`; returns `{ reply, sources }`; returns `400` for missing/empty messages.

### Services

- `embeddingService.js`: embeds text with Gemini and returns raw vector values.
- `retrievalService.js`: coordinates query embedding, Supabase RPC search, and fallback retrieval.
- `generationService.js`: formats context chunks into the final BrewBuddy prompt and calls Gemini.
- `productService.js`: product lookup, SerpAPI error handling, normalization, and L1/L2 cache flow.
- `cacheService.js`: Redis key normalization, Redis get/set with JSON tolerance and TTL jitter, Supabase L2 get/set.

### Database

Defined in `database/scheme.sql`:

- `coffee_knowledge`
  - `id bigint identity primary key`
  - `title text unique not null`
  - `category text not null` checked against `brew_guide`, `flavor`, `troubleshoot`, `grind_chart`, `budget_guide`, `gear`
  - `content text not null`
  - `embedding vector(3072)`
  - `metadata jsonb default '{}'`
  - `created_at timestamptz default now()`

- `product_cache`
  - `id bigint identity primary key`
  - `query_hash text unique not null`
  - `query_text text`
  - `results jsonb default '[]'`
  - `cached_at timestamptz default now()`
  - `expires_at timestamptz default now() + interval '48 hours'`
  - index on `query_hash`

- `chat_sessions`
  - `id uuid primary key default gen_random_uuid()`
  - `session_key text unique not null`
  - `messages jsonb default '[]'`
  - `created_at`, `updated_at`
  - currently defined but not used by app code.

Defined in `database/functions.sql`:

- `match_coffee_knowledge(query_embedding vector(3072), match_count int default 5, filter_category text default null)`
  - returns matching `coffee_knowledge` rows with `similarity`
  - filters out null embeddings
  - applies optional category filter
  - requires similarity `> 0.70`
  - orders by vector distance and limits to `match_count`

## Environment Variables and Configuration

`.env.example` lists:

```text
PORT=3000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
GEMINI_API_KEY=
SERPAPI_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
LAZADA_APP_KEY=
LAZADA_APP_SECRET=
NODE_ENV=development
```

Used by current code:

- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GEMINI_API_KEY`
- `SERPAPI_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NODE_ENV`

Present but currently unused:

- `SUPABASE_ANON_KEY`
- `LAZADA_APP_KEY`
- `LAZADA_APP_SECRET`

## Build, Run, and Test Instructions

Install dependencies:

```bash
npm install
```

Run the server:

```bash
npm run dev
npm start
```

Create database objects in Supabase by running `database/scheme.sql` and `database/functions.sql`.

Seed and embed the knowledge base:

```bash
npm run seed
node scripts/generateEmbeddings.js
```

Warm and backfill product cache:

```bash
npm run warm
node scripts/backfillL2Cache.js
```

Diagnostics and smoke tests:

```bash
node scripts/testConnection.js
node scripts/testDims.js
node scripts/testEmbeddings.js
node scripts/testCache.js
node scripts/testCacheEdgeCases.js
node scripts/testProducts.js
node scripts/testTwoTierCache.js
node scripts/listModels.js
```

Lint:

```bash
npm run lint
```

There is no formal automated test framework yet; tests are standalone scripts that require valid API/database/cache credentials.

## Current Development Status

- Core RAG backend is implemented.
- Database schema and vector RPC are now tracked in `database/`.
- Knowledge base and embedding scripts are implemented.
- Product search and two-tier cache are implemented as services/scripts but not connected to a public API route or chat response path.
- `chat_sessions` table exists but session persistence is not implemented.
- ESLint flat config exists under `src/eslint.config.js`.
- `scripts/warmCache.js` is currently untracked in git (`?? scripts/warmCache.js`).

## Known Issues and Technical Debt

- `productService.js` imports `axios` in `package.json`, but current code uses `fetch`; `axios` may be removable if unused elsewhere.
- `testProducts.js` says it expects `products:hand-grinder-philippines`, but `buildCacheKey('hand grinder')` currently returns `products:hand-grinder`.
- `seedKnowledge.js` merges short chunks with `prev.body += '' + chunk.heading + '' + chunk.body`, which loses separators/headings and may create awkward merged context.
- `generateEmbeddings.js` has local embedding logic duplicated from `embeddingService.js`.
- `cacheService.js` has inline historical comments like `// src/services/cacheService.js` that can be cleaned up.
- Product search is implemented but not routed; there is no endpoint for product lookup.
- No auth, rate limiting, request logging, or input size limiting is implemented.
- No automated test runner or CI config is present.
- Error handler hides messages in production, but all server errors still become status 500 unless an error has `err.status`.
- Some console output in source/scripts appears mojibake-encoded for symbols like coffee, arrows, peso signs, and box drawing characters.

## Coding Patterns and Conventions

- Use ES module syntax with explicit `.js` extensions.
- Keep API route logic thin: validate input, call services, shape response.
- Keep external clients in `src/config`.
- Services use named exports and small focused functions.
- RAG logic is service-oriented: embedding, retrieval, and generation are separate modules.
- Supabase operations use service-role credentials from environment variables.
- Cache code is intentionally tolerant: cache read/write failures should not crash product search.
- Redis keys are normalized to lowercase, trimmed, whitespace-collapsed product keys.
- Product cache values are JSON-compatible arrays of normalized product objects.
- Knowledge is authored in markdown entries, chunked by headings, then stored with metadata.
- Retrieval similarity threshold lives in the SQL RPC, not in JavaScript.

