# ☕ Coffee RAG Chatbot — Project Handoff Document

**Version:** Post Day 10  
**Branch:** `dev` (active), `main` (stable, tagged `v0.1.0`)  
**Repo:** https://github.com/Hallow-Gl/Coffee-RAG-Chatbot  
**Status:** Week 1 + Week 2 complete. Starting Week 3 (frontend + deployment).

---

## 1. Developer Profile

- **Name:** Tom Dwayne
- **Background:** CS student, Philippines
- **Stack known:** Java, Spring Boot, JavaScript, HTML/CSS, REST APIs, SQL
- **Career target:** AI Engineer → AI Systems Engineer → AI Architect
- **Constraint:** ~2 hours/day available
- **AWS Skill Builder:** 3 months access — parallel learning track, not used for hosting yet

---

## 2. Project Overview

AI-powered coffee recommendation and brewing assistant for the Philippines market.

**Two core capabilities:**
1. **Knowledge RAG** — answers brewing questions, troubleshooting, flavor profiles from a static knowledge base
2. **Product retrieval** — finds real Philippine coffee equipment from SerpAPI (Shopee/Lazada appear naturally), filtered and reranked by Gemini

**Target users:** Budget-conscious students and young professionals in the Philippines buying their first coffee setup.

**Monetisation plan (not yet implemented):**
- Phase 1: Shopee + Lazada affiliate links
- Phase 2: Google AdSense, sponsored listings

---

## 3. Exact File Structure

```
Coffee-RAG-Chatbot/
├── src/
│   ├── app.js                      # Express server entry point
│   ├── config/
│   │   ├── gemini.js               # Gemini SDK setup (chatModel)
│   │   ├── redis.js                # Upstash Redis client
│   │   └── supabase.js             # Supabase client (service key)
│   ├── middleware/
│   │   └── errorHandler.js         # Centralised error handler, env-aware
│   ├── routes/
│   │   ├── chat.js                 # POST /api/chat — main RAG + product endpoint
│   │   └── cache.js                # GET /api/cache/status, DELETE /api/cache/invalidate
│   └── services/
│       ├── cacheService.js         # Redis L1 + Supabase L2 cache abstraction
│       ├── embeddingService.js     # embedText() via REST v1beta fetch
│       ├── generationService.js    # generateAnswer() via Gemini SDK
│       ├── intentService.js        # detectIntent() — keyword classifier
│       ├── productService.js       # searchProducts() — SerpAPI + two-tier cache + rerank
│       ├── rerankService.js        # rerankProducts() — Gemini LLM-as-judge
│       └── retrievalService.js     # retrieveContext() — pgvector RPC + fallback
├── scripts/
│   ├── backfillL2Cache.js          # Copy Redis entries → Supabase product_cache
│   ├── generateEmbeddings.js       # Embed coffee_knowledge via Gemini REST
│   ├── knowledgeEntries.js         # 11 rawEntries in markdown format
│   ├── listModels.js               # List available Gemini models for API key
│   ├── seedKnowledge.js            # Chunk by headings + upsert to Supabase
│   ├── testCache.js                # TTL expiry verification
│   ├── testCacheEdgeCases.js       # 4 edge case tests for cacheService
│   ├── testConnection.js           # Supabase connection check
│   ├── testDims.js                 # Verify embedding dimensions
│   ├── testEmbeddings.js           # Vector similarity smoke test
│   ├── testIntent.js               # Intent classification unit test (zero API cost)
│   ├── testProducts.js             # Cache hit/miss + rerank pipeline test
│   ├── testReranker.js             # Raw vs reranked product comparison
│   ├── warmCache.js                # Pre-warm common queries into Redis
│   └── eslint.config.js            # (root level — see below)
├── database/
│   ├── schema.sql                  # All table definitions + pgvector setup
│   └── functions.sql               # match_coffee_knowledge RPC function
├── .env                            # Secrets — never committed
├── .env.example                    # Template — committed
├── .gitignore
├── eslint.config.js                # ESLint 10 flat config with globals
├── package.json
└── README.md
```

---

## 4. Tech Stack (Verified)

### Language & Runtime
- **JavaScript ES2022** — import/export modules throughout
- **Node.js 18+** — native fetch, ES modules, no transpilation
- **SQL** — PostgreSQL schema files, RPC functions

### Backend Framework
- **Express 5** — REST API server, middleware chain, modular routes, centralised error handler

### Database
- **Supabase (PostgreSQL)**
  - Table: `coffee_knowledge` — id, title, category, content, embedding vector(3072), metadata jsonb, created_at
  - Table: `product_cache` — id, query_hash (unique), query_text, results jsonb, cached_at, expires_at
  - Table: `chat_sessions` — id uuid, session_key (unique), messages jsonb, created_at, updated_at
  - Constraint: `coffee_knowledge_title_unique` on title column
- **pgvector** — `vector(3072)` column, cosine distance via `<=>`, `match_coffee_knowledge` RPC

### AI / Embeddings
- **gemini-embedding-001** — REST v1beta direct fetch (NOT SDK), outputs 3072 dims
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`
  - Body: `{ model: "models/gemini-embedding-001", content: { parts: [{ text }] } }`
- **gemini-2.5-flash** — via `@google/generative-ai` SDK for generation and reranking

### RAG Pipeline
- **Chunking strategy:** markdown heading split (`##`/`###`), 80-word minimum merge, parent context prefix
- **Knowledge base:** 11 topics → ~45 chunks, categories: brew_guide, flavor, troubleshoot, grind_chart, budget_guide, gear
- **Retrieval:** pgvector cosine similarity, threshold 0.70, top-5 with fallback (returns top-3 rows if nothing above threshold)
- **No HNSW index** — sequential scan intentional at current row count (~45 rows), add back at ~1000 rows

### Caching
- **Upstash Redis (L1)**
  - 48-hour TTL with ±10% jitter
  - Cache-aside reads
  - `@upstash/redis` SDK (REST-based, works serverless)
- **Supabase product_cache (L2)**
  - 14-day app-level expiry checked in `cacheService.getL2Cached()`
  - Written synchronously after SerpAPI miss (write-through pattern)
  - L2 hit backfills Redis automatically

### Product Retrieval
- **SerpAPI** — Google Shopping engine, `gl=ph` (Philippines), `hl=en`, 8 results normalised
  - Free tier: 250 searches/month (238 remaining as of Day 10)
  - Cache key format: `products:query-normalised-with-hyphens`
- **ProductSearchError** — typed errors: `QUOTA_EXCEEDED`, `NETWORK_ERROR`, `API_ERROR`
- **Graceful degradation** — quota exceeded returns `[]`, does not crash server

### Reranking
- **rerankService.js** — Gemini `gemini-2.5-flash` as LLM-as-judge
- **Score:** 0–10, Gemini-provided `keep` boolean for filtering
- **JSON parser:** `parseGeminiJson()` — strip code fences → parse, then `{` to `}` substring extraction
- **Output fields added:** `rerankScore`, `rerankReason`, `beginnerFriendly`
- **Fallback:** 503/error returns original SerpAPI order unchanged

### Intent Detection
- **intentService.js** — keyword-based classifier, zero API cost
- **Three intents:** `knowledge`, `product`, `combined`
- `combined` uses `Promise.all()` for parallel retrieval

### Dev Tools
- **ESLint 10** — flat config (`eslint.config.js`), `globals` package for Node + browser globals
- **Prettier** — formatting
- **Nodemon** — dev server auto-restart
- **Git** — `main` (stable) / `dev` (active development) branch strategy

---

## 5. Environment Variables

```env
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# SerpAPI
SERPAPI_KEY=your_serpapi_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Lazada (approved but not yet implemented)
LAZADA_APP_KEY=
LAZADA_APP_SECRET=
```

---

## 6. Services & Accounts

| Service | Purpose | Free Tier | Status |
|---|---|---|---|
| Supabase | PostgreSQL + pgvector | 500MB, free forever | ✅ Active |
| Upstash | Redis cache | 10k commands/day | ✅ Active |
| SerpAPI | Google Shopping results | 250/month | ✅ 238 remaining |
| Google AI Studio | Gemini API | 20 RPD (2.5 Flash), 1k RPD (embedding) | ✅ Active |
| Lazada Open Platform | PH product search | Free | ✅ Approved, not implemented |
| GitHub | Version control | Free | ✅ Active |
| Render | Backend hosting (Week 3) | Free tier (cold starts) | ⏳ Not deployed |
| Vercel | Frontend hosting (Week 3) | Free forever | ⏳ Not deployed |

---

## 7. API Endpoints (Current)

### `POST /api/chat`
Main endpoint. Detects intent, retrieves knowledge and/or products, generates reply.

**Request:**
```json
{ "message": "best hand grinder under 2000 pesos" }
```

**Response:**
```json
{
  "reply": "For under ₱2000, the NEOUZA conical burr grinder...",
  "intent": "product",
  "sources": [
    { "title": "Coffee Grinder Types Guide — Manual Burr Grinder", "category": "gear", "similarity": 81.2 }
  ],
  "products": [
    {
      "title": "NEOUZA Coffee Grinder",
      "price": "₱700.00",
      "link": "https://...",
      "source": "neouza.com",
      "rating": 4.8,
      "image": "https://...",
      "rerankScore": 9.0,
      "rerankReason": "Excellent value conical burr within budget",
      "beginnerFriendly": true
    }
  ]
}
```

### `GET /api/cache/status?query=hand+grinder`
Dev only. Returns cache key, TTL remaining, whether entry exists.

### `DELETE /api/cache/invalidate?query=hand+grinder`
Dev only. Removes a Redis cache entry to force fresh SerpAPI call.

### `GET /health`
Returns `{ status: "ok", project: "coffee-rag-chatbot" }`.

---

## 8. Architectural Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| Embedding model | gemini-embedding-001 via REST | Only model available on this API key; text-embedding-004 unavailable |
| Vector dimensions | 3072 | gemini-embedding-001 output; schema updated from 768 |
| HNSW index | Dropped | Suboptimal at <1000 rows; sequential scan faster |
| Similarity threshold | 0.70 | gemini-embedding-001 produces lower scores than smaller models |
| Cache pattern (read) | Cache-aside | External API, needs graceful Redis-down degradation |
| Cache pattern (write) | Write-through | Both L1 and L2 written synchronously after SerpAPI miss |
| Chunking | Markdown heading split | More precise retrieval vs whole-topic blobs |
| Intent detection | Keyword-based | LLM classifier too expensive at 20 RPD free tier |
| Parallel execution | Promise.all() | combined intent runs retrieval + product search simultaneously |
| Error messages | Hidden in production | NODE_ENV check in errorHandler |
| Embedding API | Direct REST fetch | SDK routes to wrong API version for this model |

---

## 9. Known Issues & Technical Debt

| Priority | Issue | File | Status |
|---|---|---|---|
| Resolved | File casing mismatch (Windows vs Linux) | all src/ | ✅ Fixed |
| Resolved | Regex typos `/s+/` should be `/\s+/` | cacheService.js, seedKnowledge.js | ✅ Fixed |
| Resolved | productService duplicated cache logic | productService.js | ✅ Fixed |
| Resolved | getCached double-parse JSON | cacheService.js | ✅ Fixed |
| Resolved | errorHandler exposed raw errors | errorHandler.js | ✅ Fixed |
| Resolved | ESLint no config file | eslint.config.js | ✅ Fixed |
| Resolved | Schema SQL not in repo | database/ | ✅ Fixed |
| Resolved | README said gemini-1.5-flash | README.md | ✅ Fixed |
| Minor | testProducts.js expected key says "philippines" | scripts/testProducts.js | cosmetic only |
| Future | Thundering herd on cache expiry | cacheService.js | TTL jitter added as mitigation |
| Future | Lazada API not wired | productService.js | Day 14 |
| Future | No affiliate link tagging | productService.js | Day 14 |
| Future | No user sessions / history | chat_sessions table exists but unused | Post-MVP |

---

## 10. Supabase Schema Reference

### Enable pgvector
```sql
create extension if not exists vector;
```

### coffee_knowledge table
```sql
create table coffee_knowledge (
  id         bigint primary key generated always as identity,
  title      text not null,
  category   text not null check (category in (
               'brew_guide','flavor','troubleshoot',
               'grind_chart','budget_guide','gear')),
  content    text not null,
  embedding  vector(3072),
  metadata   jsonb default '{}',
  created_at timestamptz default now(),
  constraint coffee_knowledge_title_unique unique (title)
);
```

### match_coffee_knowledge RPC
```sql
create or replace function match_coffee_knowledge(
  query_embedding  vector(3072),
  match_count      int default 5,
  filter_category  text default null
)
returns table (
  id bigint, title text, category text,
  content text, metadata jsonb, similarity float
)
language plpgsql as $$
begin
  return query
  select ck.id, ck.title, ck.category, ck.content, ck.metadata,
         1 - (ck.embedding <=> query_embedding) as similarity
  from coffee_knowledge ck
  where ck.embedding is not null
    and (filter_category is null or ck.category = filter_category)
    and 1 - (ck.embedding <=> query_embedding) > 0.70
  order by ck.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

---

## 11. package.json Scripts

```json
{
  "start": "node src/app.js",
  "dev": "nodemon src/app.js",
  "seed": "node scripts/seedKnowledge.js",
  "warm": "node scripts/warmCache.js",
  "lint": "eslint src/**/*.js"
}
```

---

## 12. Implementation Status

### ✅ Week 1 — Foundation + RAG Pipeline (Days 1–5)

- **Day 1:** Node.js + Express scaffold, all config files, .env setup, GitHub repo
- **Day 2:** Supabase schema, pgvector, match_coffee_knowledge RPC, connection test
- **Day 3:** 6 knowledge entries seeded (brew guides + flavor profiles)
- **Day 4:** 5 more entries, markdown heading chunker, gemini-embedding-001 pipeline, 3072-dim vectors stored. HNSW dropped. Similarity threshold 0.70.
- **Day 5:** RAG pipeline end-to-end — embed → retrieve → generate → `/api/chat` returning `{ reply, sources }`

### ✅ Week 2 — Product Retrieval + Cache + Rerank (Days 6–10)

- **Day 6:** Upstash connected, TTL verified, cacheService.js with buildCacheKey, getCached, setCached, TTL jitter
- **Day 7:** productService.js with SerpAPI, normaliseProduct, ProductSearchError typed errors, graceful quota handling
- **Day 8:** Two-tier cache — Redis L1 + Supabase L2. Cache debug endpoints. warmCache script. backfillL2Cache script.
- **Day 9:** rerankService.js — Gemini LLM-as-judge, parseGeminiJson, rerankScore/rerankReason/beginnerFriendly output fields
- **Day 10:** intentService.js keyword classifier, Promise.all() parallel execution, products wired into `/api/chat`, unified `{ reply, intent, sources, products }` response

### ⏳ Week 3 — Frontend + Deployment (Days 11–15)

- **Day 11:** Chat UI frontend (HTML/CSS/JS)
- **Day 12:** Backend deploy to Render
- **Day 13:** Frontend deploy to Vercel
- **Day 14:** Lazada API + affiliate links
- **Day 15:** E2E production test + portfolio writeup

---

## 13. Week 3 Detailed Plan

### Day 11 — Chat UI

**Goal:** Single-page chat interface that calls `/api/chat`

**Tech:** Vanilla HTML + CSS + JS in one `index.html` file (no build step — easiest Vercel deploy)

**Components to build:**
- Message input + send button
- Chat thread — user bubbles (right) + assistant bubbles (left)
- Product cards — image, title, price, source, rerankReason, beginnerFriendly badge
- Source chips — show which knowledge chunks were used
- Loading state — spinner during 2–5s API wait
- Error state — friendly message when quota exceeded

**API URL config:** Put backend URL at top of JS file as a constant so it's easy to swap localhost → Render URL on deploy.

### Day 12 — Deploy Backend to Render

**Steps:**
1. Push `main` to GitHub (already tagged v0.1.0)
2. Render dashboard → New Web Service → connect GitHub repo
3. Root dir: `/`, Start command: `node src/app.js`
4. Add all `.env` variables in Render environment dashboard
5. Set `NODE_ENV=production`
6. Test `/health` endpoint on live Render URL before touching frontend

**Known issue:** Render free tier spins down after 15 minutes of inactivity. First request after spindown takes ~30s. Note this in README.

### Day 13 — Deploy Frontend to Vercel

**Steps:**
1. Update API URL constant in `index.html` to Render URL
2. Update Express CORS config to allow Vercel domain
3. Vercel dashboard → New Project → drag-and-drop `index.html` or GitHub connect
4. Test full flow on live Vercel URL → Render backend

### Day 14 — Lazada API + Affiliate Links

**Lazada:** Registration approved. Implement `lazadaService.js` as secondary product source if needed. Wire as supplement when SerpAPI returns fewer than 5 results.

**Affiliate links:**
- Register Shopee Affiliate Program
- Register Lazada Affiliate Program
- Modify `normaliseProduct()` to append affiliate tracking params to `link` field

### Day 15 — E2E Test + Portfolio Writeup

**Production smoke tests:**
- Knowledge-only: "Why does my espresso taste sour?"
- Product-only: "best hand grinder under 2000 pesos"
- Combined: "what grinder for french press under 3000"
- Troubleshoot: "my cold brew tastes weak"

**Merge and tag:**
```bash
git checkout main
git merge dev
git tag -a v1.0.0 -m "v1.0.0 — full MVP deployed"
git push origin main --tags
```

**README update:** live demo URL, architecture diagram, tech stack table, setup instructions

**Resume bullet (from original handoff):**
> Built an AI-powered coffee recommendation platform using Retrieval-Augmented Generation (RAG), serverless cloud architecture, real-time product retrieval via shopping APIs, personalized product matching, and affiliate-ready recommendation flows — targeting the Philippine consumer market.

---

## 14. Branch Strategy

```
main  ← stable, always deployable, tagged at milestones
 └── dev ← active development, all feature work goes here
      └── feat/* ← optional feature branches off dev
```

**Merge rule:** Only merge `dev` → `main` when a week's work is complete and tested.

**Current state:** `dev` has all Day 1–10 work. Merge to `main` before starting Day 11.

---

## 15. Continuity Notes for New Claude Session

1. **Always ask to see the actual file before modifying it** — implementations drifted from guides during debugging. The file on disk is the source of truth, not this document.

2. **Gemini embedding uses direct REST fetch, not SDK** — the SDK routes to wrong API version. `embeddingService.js` uses `fetch()` to `v1beta` endpoint directly.

3. **Reranker field names are** `rerankScore`, `rerankReason`, `beginnerFriendly` — not `_score`/`_reason`/`_reranked`

4. **JSON parser in rerankService is called** `parseGeminiJson()` — not `safeParseJSON`

5. **Script is** `testReranker.js` — not `testRerank.js`

6. **Vector dimension is 3072** — not 768. Schema was updated during Day 4 when gemini-embedding-001 was discovered.

7. **SerpAPI quota is 250/month** — not 100. As of Day 10, ~238 remaining.

8. **Reranking is called inside** `searchProducts()` — not separately in `chat.js`. Products returned from `searchProducts` are already reranked.

9. **KISSS rule** — this developer prefers very short responses. Bullet points. No AI chatter. Get to the point.

---

*Generated after Day 10 completion. Week 1 + Week 2 fully implemented and tested.*