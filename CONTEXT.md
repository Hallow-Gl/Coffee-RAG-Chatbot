# Coffee RAG Chatbot Context

## Project Overview

Coffee RAG Chatbot is a Node.js/Express backend for "BrewBuddy", an AI coffee recommendation assistant focused on the Philippines market. It answers coffee brewing, gear, troubleshooting, flavor, and budget questions by retrieving relevant coffee knowledge from Supabase pgvector and generating a concise answer with Gemini.

The current user-facing API is a single chat endpoint:

```text
POST /api/chat
body: { "message": "Why does my espresso taste sour?" }
response: { "reply": "...", "sources": [...] }
```

## Tech Stack and Dependencies

- Runtime: Node.js >= 18, ES modules (`"type": "module"`).
- API server: Express 5 with CORS and JSON body parsing.
- LLM generation: Google Gemini via `@google/generative-ai`, currently `gemini-2.5-flash`.
- Embeddings: Gemini REST API, `gemini-embedding-001`, expected 3072 dimensions.
- Database/vector search: Supabase PostgreSQL with pgvector.
- Cache: Upstash Redis REST client.
- External product search: SerpAPI Google Shopping through `axios` (present but not wired into the chat route yet).
- Dev tooling: `nodemon`, `eslint`, `prettier`.

Main dependencies are listed in `package.json`: `@google/generative-ai`, `@supabase/supabase-js`, `@upstash/redis`, `axios`, `cors`, `dotenv`, and `express`.

## Folder and File Structure

```text
src/
  App.js                         Express app entry point, health route, chat route registration
  config/
    Gemini.js                    Gemini API client and chat model
    Redis.js                     Upstash Redis client
    Supabase.js                  Supabase service-role client
  middleware/
    ErrorHandler.js              Express error response middleware
  routes/
    Chat.js                      POST /api/chat route
  services/
    EmbeddingService.js          Calls Gemini embedding REST endpoint
    RetrievalService.js          Embeds query and calls Supabase vector RPC
    GenerationService.js         Builds BrewBuddy prompt and calls Gemini chat model
    ProductService.js            SerpAPI shopping search with Redis cache
    cacheService.js              Safer Redis cache abstraction, currently not used elsewhere

scripts/
  KnowledgeEntries.js            Source coffee knowledge entries
  SeedKnowledge.js               Chunks markdown entries and upserts rows into Supabase
  generateEmbeddings.js          Embeds rows missing embeddings
  TestConnection.js              Checks Supabase coffee_knowledge access
  testEmbeddings.js              Tests retrieval quality for sample queries
  testDims.js                    Confirms embedding dimension count
  testCache.js                   Checks Upstash Redis TTL behavior
  listModels.js                  Lists Gemini models supporting generateContent

README.md                        Short architecture summary
.env.example                     Required environment variable names
```

## Architecture and Data Flow

1. `src/App.js` creates the Express app, enables CORS and JSON parsing, exposes `GET /health`, and mounts `chatRouter` at `/api/chat`.
2. `POST /api/chat` in `src/routes/Chat.js` validates `req.body.message`.
3. `retrieveContext(query, { topK: 5 })` in `src/services/RetrievalService.js` embeds the user query with `embedText`.
4. `embedText` in `src/services/EmbeddingService.js` calls Gemini `gemini-embedding-001:embedContent`.
5. Retrieval calls Supabase RPC `match_coffee_knowledge` with:
   - `query_embedding`
   - `match_count`
   - `filter_category`
6. If the RPC returns no results, retrieval falls back to the first 3 rows in `coffee_knowledge` with non-null embeddings and marks `similarity: null`.
7. `generateAnswer(query, chunks)` in `src/services/GenerationService.js` builds a grounded prompt and calls `gemini-2.5-flash`.
8. The route returns the generated `reply` plus a source list containing chunk `title`, `category`, and percentage `similarity` when available.

## Key Features

- RAG coffee Q&A: Answers are grounded in seeded coffee knowledge chunks.
- Philippines-specific guidance: Prompt and knowledge base include local prices, Shopee/Lazada availability, local beans, and beginner budgets.
- Source transparency: Chat responses include matched source titles/categories/similarity scores.
- Retrieval fallback: Broad or low-scoring queries still get limited context rather than failing empty.
- Knowledge seeding: Markdown knowledge entries are chunked by `##`/`###` headings and inserted into Supabase.
- Embedding generation: Separate script fills null `embedding` fields after seeding.
- Product search cache layer: SerpAPI + Upstash Redis code exists for shopping results, though it is not currently connected to the chat flow.

## APIs, Services, and Models

### Express API

- `GET /health`: returns `{ status: "ok", project: "coffee-rag-chatbot" }`.
- `POST /api/chat`: accepts `{ message: string }`; returns `{ reply, sources }`; returns `400` if message is missing or empty.

### Supabase Database Assumptions

The app expects a `coffee_knowledge` table with at least:

- `id`
- `title`
- `category`
- `content`
- `metadata`
- `embedding`

The app also expects an RPC function named `match_coffee_knowledge` that accepts query embedding, match count, and optional category filter, and returns rows containing `title`, `category`, `content`, `metadata`, and `similarity`. README notes a cosine similarity threshold of `0.70`, likely implemented inside this RPC.

No SQL migration/schema file is currently present in the repo, so future agents must inspect Supabase or add migrations before changing schema.

### Gemini

- `src/config/Gemini.js`: initializes `GoogleGenerativeAI` with `GEMINI_API_KEY`.
- Chat model: `gemini-2.5-flash`.
- Embedding model: `gemini-embedding-001` through direct REST `fetch`.

### Redis and Product Search

- `src/config/Redis.js`: creates an Upstash Redis client.
- `src/services/ProductService.js`: searches SerpAPI Google Shopping for `query + " Philippines"` and caches top 5 results for 24 hours.
- `src/services/cacheService.js`: provides `buildCacheKey`, `getCached`, and `setCached` with a 48-hour default TTL. This is a better abstraction than direct Redis use but is not currently integrated into `ProductService`.

## Environment Variables

From `.env.example`:

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
```

Actually used by current code:

- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GEMINI_API_KEY`
- `SERPAPI_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Currently unused but reserved:

- `SUPABASE_ANON_KEY`
- `LAZADA_APP_KEY`
- `LAZADA_APP_SECRET`

## Build, Run, and Test

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Run production server:

```bash
npm start
```

Seed knowledge:

```bash
npm run seed
node scripts/generateEmbeddings.js
```

Useful diagnostics:

```bash
node scripts/TestConnection.js
node scripts/testDims.js
node scripts/testEmbeddings.js
node scripts/testCache.js
node scripts/listModels.js
```

Lint command:

```bash
npm run lint
```

Note: there is no test framework or automated test suite configured yet.

## Current Development Status

- Core RAG chat route exists and is conceptually complete.
- Knowledge base content exists in `scripts/KnowledgeEntries.js`.
- Seeding and embedding scripts exist.
- Redis/product search code exists but is not part of the chat endpoint.
- README is minimal; this `CONTEXT.md` is now the main onboarding document.
- No migrations, deployment config, API docs, or automated tests are present.

## Known Issues and Technical Debt
- CURRENT:

- FIXED:
- File casing is inconsistent. Files are named `App.js`, `Chat.js`, `Supabase.js`, etc., while imports/scripts use lowercase paths like `src/app.js`, `./routes/chat.js`, and `../config/supabase.js`. This works on case-insensitive Windows filesystems but can fail on Linux deployment. - done
- Some regexes likely contain typos from escaped whitespace loss: `replace(/s+/g, '-')` and `split(/s+/)` should probably be `\s+`. - done
- Product cache logic is duplicated between `ProductService.js` and `cacheService.js`; `ProductService` should use `cacheService`.
- `ProductService` cache key currently uses `replace(/s+/g, '-')`, so whitespace normalization is probably broken.
- `cacheService.getCached` parses strings as JSON, but Upstash may already return objects depending on how values were stored.
- `errorHandler` returns raw error messages to clients, which is useful during development but risky in production.
- The package scripts reference lowercase script names (`scripts/seedKnowledge.js`, `src/app.js`) while files are PascalCase on disk.
- `README.md` says Gemini 1.5 Flash in the table, but code uses `gemini-2.5-flash`.  - done
- Supabase schema/RPC SQL is missing from the repository.
- ESLint is installed, but no explicit ESLint config is visible.

## Coding Patterns and Conventions

- ES modules are used throughout (`import`/`export`).
- Services are small named-export modules under `src/services`.
- Config clients live under `src/config` and read from `process.env`.
- Route handlers use `try/catch` and forward failures to `next(err)`.
- Chat validation is done at the route boundary before service calls.
- The RAG prompt explicitly tells Gemini to answer from context, be honest about missing context, include Philippine peso prices when relevant, and stay concise.
- Knowledge entries are authored as markdown strings, chunked by headings, then stored as rows with metadata.
- Cache failures are intended to be non-fatal: log a warning and fall back to the real API.

