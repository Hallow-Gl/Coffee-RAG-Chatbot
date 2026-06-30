# Coffee RAG Chatbot

AI coffee recommendation assistant for the Philippines market, powered by RAG over a Supabase pgvector knowledge base.

## Live Demo

- Frontend URL: https://coffee-rag-chatbot.vercel.app
- Backend health check: https://coffee-rag-chatbot.onrender.com/health

## Architecture

### RAG Pipeline

```text
POST /api/chat
  -> embedText(query)             [gemini-embedding-001, 3072 dims]
  -> retrieveContext(query)       [pgvector cosine search, threshold 0.70]
  -> generateAnswer(query, chunks) [gemini-2.5-flash]
  -> { reply, sources }
```

### Knowledge Base

- 11 topics chunked by markdown heading (~45 chunks)
- Categories: brew_guide, flavor, troubleshoot, grind_chart, budget_guide, gear
- Embeddings: gemini-embedding-001 (3072 dims) stored in Supabase pgvector

### Tech Stack

| Layer | Tool |
|-------|------|
| Backend | Node.js + Express 5 |
| Database | Supabase PostgreSQL |
| Vector Search | pgvector |
| Embeddings | Gemini gemini-embedding-001 |
| Generation | Gemini gemini-2.5-flash |
| Cache | Upstash Redis |
| Product Search | SerpAPI |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

## Local Setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in the required environment variables.
4. Start the development server:

   ```bash
   npm run dev
   ```

## Deployment

### Render setup

1. Connect this GitHub repository to a new Render Web Service.
2. Set the start command to `npm start`.
3. Add the required environment variables from `.env.example` in the Render dashboard.
4. Set `FRONTEND_URL` to `https://coffee-rag-chatbot.vercel.app` after the frontend is deployed.

### Required environment variables

- `PORT`: Server port; Render provides this automatically.
- `NODE_ENV`: Runtime environment; use `production` on Render.
- `FRONTEND_URL`: Production frontend origin allowed by CORS.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_KEY`: Supabase service-role key used by backend services.
- `GEMINI_API_KEY`: Gemini API key used for embeddings and answer generation.
- `SERPAPI_KEY`: SerpAPI key used for product search.
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST endpoint.
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token.

Render free tier sleeps after 15 minutes of inactivity. First request after sleep may take ~30 seconds.

Supabase free tier pauses projects after inactivity. If the backend returns 500 errors on retrieval, check the Supabase dashboard and resume the project first.
