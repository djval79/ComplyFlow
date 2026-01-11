-- =====================================================
-- KNOWLEDGE BASE VECTORS (RAG)
-- =====================================================

-- Ensure pgvector is enabled (it likely is, but for safety)
create extension if not exists vector;

-- 1. Create table for document chunks (the vectors)
create table if not exists organization_document_chunks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  file_id uuid references organization_knowledge_base(id) on delete cascade,
  content text,
  metadata jsonb,
  embedding vector(768), -- Gemini embedding dimension
  created_at timestamptz default now()
);

-- Enable RLS
alter table organization_document_chunks enable row level security;

create policy "Users can view org chunks"
  on organization_document_chunks for select
  using (organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "Admins can manage org chunks"
  on organization_document_chunks for all
  using (organization_id in (
    select organization_id from profiles where id = auth.uid() and role in ('owner', 'admin')
  ));

-- Index for faster vector similarity search
create index on organization_document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);


-- 2. Create search function (Hybrid Search / Similarity Search)
-- It MUST filter by organization_id to prevent data leaks between tenants!
create or replace function match_org_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_org_id uuid
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    organization_document_chunks.id,
    organization_document_chunks.content,
    organization_document_chunks.metadata,
    1 - (organization_document_chunks.embedding <=> query_embedding) as similarity
  from organization_document_chunks
  where 
    organization_document_chunks.organization_id = filter_org_id
    and 1 - (organization_document_chunks.embedding <=> query_embedding) > match_threshold
  order by organization_document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Grant access
grant all on table organization_document_chunks to authenticated;
grant all on function match_org_documents to authenticated;
