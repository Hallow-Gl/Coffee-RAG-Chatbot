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
| Generation | Gemini 1.5 Flash |
| Cache | Upstash Redis |
| Deploy | Render / Railway |