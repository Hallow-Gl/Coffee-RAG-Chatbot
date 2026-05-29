-- Enable pgvector
create extension if not exists vector;

-- Knowledge base
create table if not exists coffee_knowledge (
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

-- Product cache (fallback)
create table if not exists product_cache (
  id         bigint primary key generated always as identity,
  query_hash text not null unique,
  query_text text,
  results    jsonb default '[]',
  cached_at  timestamptz default now(),
  expires_at timestamptz default (now() + interval '48 hours')
);
create index if not exists idx_product_cache_hash on product_cache(query_hash);

-- Chat sessions
create table if not exists chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  session_key text not null unique,
  messages    jsonb default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);