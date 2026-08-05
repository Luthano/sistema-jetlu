create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  role text not null default 'user' check (role in ('user', 'master')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users (id)
);

create index if not exists profiles_status_idx on public.profiles (status, created_at desc);

create or replace function public.is_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'master'
      and status = 'approved'
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'approved'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  master_email text := 'luthanogomes@gmail.com';
begin
  insert into public.profiles (id, email, status, role, approved_at)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    case when lower(coalesce(new.email, '')) = master_email then 'approved' else 'pending' end,
    case when lower(coalesce(new.email, '')) = master_email then 'master' else 'user' end,
    case when lower(coalesce(new.email, '')) = master_email then now() else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, email, status, role, approved_at)
select
  id,
  lower(coalesce(email, '')),
  case when lower(coalesce(email, '')) = 'luthanogomes@gmail.com' then 'approved' else 'pending' end,
  case when lower(coalesce(email, '')) = 'luthanogomes@gmail.com' then 'master' else 'user' end,
  case when lower(coalesce(email, '')) = 'luthanogomes@gmail.com' then now() else null end
from auth.users
on conflict (id) do update
set
  email = excluded.email,
  role = excluded.role,
  status = case
    when excluded.role = 'master' then 'approved'
    else public.profiles.status
  end,
  approved_at = case
    when excluded.role = 'master' then coalesce(public.profiles.approved_at, now())
    else public.profiles.approved_at
  end;

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own_or_master on public.profiles;
drop policy if exists profiles_update_master on public.profiles;

create policy profiles_select_own_or_master
  on public.profiles
  for select
  using (auth.uid() = id or public.is_master());

create policy profiles_update_master
  on public.profiles
  for update
  using (public.is_master())
  with check (public.is_master());

drop policy if exists cotacoes_select_own on public.cotacoes;
drop policy if exists cotacoes_insert_own on public.cotacoes;
drop policy if exists coletas_select_own on public.coletas;
drop policy if exists coletas_insert_own on public.coletas;

create policy cotacoes_select_own
  on public.cotacoes
  for select
  using (auth.uid() = user_id and public.is_approved());

create policy cotacoes_insert_own
  on public.cotacoes
  for insert
  with check (auth.uid() = user_id and public.is_approved());

create policy coletas_select_own
  on public.coletas
  for select
  using (auth.uid() = user_id and public.is_approved());

create policy coletas_insert_own
  on public.coletas
  for insert
  with check (auth.uid() = user_id and public.is_approved());
