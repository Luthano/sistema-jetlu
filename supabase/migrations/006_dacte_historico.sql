-- Histórico de consultas DACTE / CT-e por usuário
create table if not exists public.dacte_consultas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cnpj_remetente text not null,
  nro_nf text not null,
  remetente text,
  destinatario text,
  pedido text,
  localizado boolean not null default false,
  mensagem text,
  consulted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, cnpj_remetente, nro_nf)
);

create index if not exists dacte_consultas_user_consulted_idx
  on public.dacte_consultas (user_id, consulted_at desc);

alter table public.dacte_consultas enable row level security;

drop policy if exists dacte_consultas_select_own on public.dacte_consultas;
drop policy if exists dacte_consultas_insert_own on public.dacte_consultas;
drop policy if exists dacte_consultas_update_own on public.dacte_consultas;
drop policy if exists dacte_consultas_delete_own on public.dacte_consultas;

create policy dacte_consultas_select_own
  on public.dacte_consultas
  for select
  using (auth.uid() = user_id);

create policy dacte_consultas_insert_own
  on public.dacte_consultas
  for insert
  with check (auth.uid() = user_id);

create policy dacte_consultas_update_own
  on public.dacte_consultas
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy dacte_consultas_delete_own
  on public.dacte_consultas
  for delete
  using (auth.uid() = user_id);
