## Architecture

### RAG Pipeline
```
POST /api/chat
  → embedText(query)          [gemini-embedding-001, 3072 dims]
  → retrieveContext(query)    [pgvector cosine search, threshold 0.70]
  → generateAnswer(query, chunks) [gemini-2.5-flash]
  → { reply, sources }
```

### Knowledge Base
- 11 topics chunked by markdown heading (~45 chunks)
- Categories: brew_guide, flavor, troubleshoot, grind_chart, budget_guide, gear
- Embeddings: gemini-embedding-001 (3072 dims) stored in Supabase pgvector

### Tech Stack
| Layer | Tool |
|-------|------|
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL + pgvector) |
| Embeddings | Gemini gemini-embedding-001 |
| Generation | gemini-2.5-flash |
| Cache | Upstash Redis |
| Deploy | Render / Railway |

## Deployment

### Render setup

1. Connect this GitHub repository to a new Render Web Service.
2. Set the start command to `npm start`.
3. Add the required environment variables from `.env.example` in the Render dashboard.
4. Leave `FRONTEND_URL` empty until the frontend is deployed on Day 4.

### Required environment variables

- `PORT`: Server port; Render provides this automatically.
- `NODE_ENV`: Runtime environment; use `production` on Render.
- `FRONTEND_URL`: Production frontend origin allowed by CORS; leave empty until the frontend is deployed.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_KEY`: Supabase service-role key used by backend services.
- `GEMINI_API_KEY`: Gemini API key used for embeddings and answer generation.
- `SERPAPI_KEY`: SerpAPI key used for product search.
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST endpoint.
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token.

Render free tier services sleep after 15 minutes of inactivity. The first request after sleep can take about 30 seconds while the service starts again.
