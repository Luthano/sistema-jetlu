create table if not exists public.cotacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cnpj_pagador text,
  cnpj_remetente text,
  cnpj_destinatario text,
  cep_origem text,
  cep_destino text,
  valor_nf numeric,
  quantidade integer,
  peso numeric,
  volume numeric,
  total_frete numeric,
  prazo text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.coletas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  numero_coleta text,
  solicitante text,
  cep_coleta text,
  cep_entrega text,
  quantidade integer,
  peso numeric,
  limite_coleta timestamptz,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cotacoes_user_created_idx on public.cotacoes (user_id, created_at desc);
create index if not exists coletas_user_created_idx on public.coletas (user_id, created_at desc);

alter table public.cotacoes enable row level security;
alter table public.coletas enable row level security;

drop policy if exists cotacoes_select_own on public.cotacoes;
drop policy if exists cotacoes_insert_own on public.cotacoes;
drop policy if exists coletas_select_own on public.coletas;
drop policy if exists coletas_insert_own on public.coletas;

create policy cotacoes_select_own
  on public.cotacoes
  for select
  using (auth.uid() = user_id);

create policy cotacoes_insert_own
  on public.cotacoes
  for insert
  with check (auth.uid() = user_id);

create policy coletas_select_own
  on public.coletas
  for select
  using (auth.uid() = user_id);

create policy coletas_insert_own
  on public.coletas
  for insert
  with check (auth.uid() = user_id);
