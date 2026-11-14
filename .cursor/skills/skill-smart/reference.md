# SIHU Agent Reference

## Supabase Schema

### Enable pgvector
```sql
create extension if not exists vector;
```

### `knowledge_base`
```sql
create table if not exists knowledge_base (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  type text not null default 'note',
  source text,
  embedding vector(384),
  created_at timestamptz not null default now()
);
```

### `chat_history`
```sql
create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_message text not null,
  bot_response text not null,
  intent text,
  timestamp timestamptz not null default now()
);
```

## Vector Search RPC
Use a Postgres function for top-k retrieval:

```sql
create or replace function match_knowledge_base (
  query_embedding vector(384),
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  type text,
  source text,
  created_at timestamptz,
  similarity float
)
language sql
as $$
  select
    kb.id,
    kb.content,
    kb.type,
    kb.source,
    kb.created_at,
    1 - (kb.embedding <=> query_embedding) as similarity
  from knowledge_base kb
  where kb.embedding is not null
  order by kb.embedding <=> query_embedding
  limit match_count;
$$;
```

## Recommended App Layout
```text
src/
  app/
    api/
      ai/
      keys/
  lib/
    agent/
    ai/
    crypto/
    supabase/
```

## Embedding Defaults
- Model family: `sentence-transformers`
- Good first choice: `all-MiniLM-L6-v2`
- Dimension target in schema above: `384`

## Retrieval Rules
- Embed incoming user query.
- Retrieve top 3-5 results.
- Drop low-similarity results if clearly irrelevant.
- Prefer factual knowledge rows over chat memory.

## Memory Rules
- Keep the last 10 turns by default.
- Use `session_id` consistently across frontend and backend.
- Store assistant outputs after every successful response.

## Next.js Endpoint Contract
### `POST /chat`
Request:
```json
{
  "session_id": "abc123",
  "message": "What is SIHU Agent?"
}
```

Response:
```json
{
  "reply": "SIHU Agent is ...",
  "intent": "knowledge_query",
  "sources": []
}
```

### `POST /add-knowledge`
Request:
```json
{
  "content": "SIHU Agent is a retrieval-first assistant.",
  "type": "product",
  "source": "internal-prd"
}
```

### `GET /history/{session_id}`
Returns the latest conversation entries for that session.

## Current Project Integration
- Admin dashboard manages encrypted provider settings in Supabase.
- `/ai` uses the built-in Next.js retrieval-first SIHU agent.
- Optional provider APIs can boost responses after retrieval.

## Production Recommendation
Do not keep provider secrets in temporary local storage for production.
Upgrade to one of:
- Vercel environment variables
- encrypted Supabase-backed storage
- dedicated secret manager
