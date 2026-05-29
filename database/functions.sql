
create or replace function match_coffee_knowledge(
  query_embedding  vector(3072),
  match_count      int default 5,
  filter_category  text default null
)
returns table (
  id         bigint,
  title      text,
  category   text,
  content    text,
  metadata   jsonb,
  similarity float
)
language plpgsql as $$
begin
  return query
  select
    ck.id,
    ck.title,
    ck.category,
    ck.content,
    ck.metadata,
    1 - (ck.embedding <=> query_embedding) as similarity
  from coffee_knowledge ck
  where
    ck.embedding is not null
    and (filter_category is null or ck.category = filter_category)
    and 1 - (ck.embedding <=> query_embedding) > 0.70
  order by ck.embedding <=> query_embedding
  limit match_count;
end;
$$;