-- Reforça aprovar/recusar (master) e exclusão de conta no banco.

-- Master precisa poder atualizar status de outros perfis
drop policy if exists profiles_update_master on public.profiles;
create policy profiles_update_master
  on public.profiles
  for update
  using (public.is_master())
  with check (public.is_master());

-- Usuário atualiza só o próprio cadastro (campos protegidos pelo trigger)
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if not public.is_master() then
    new.status := old.status;
    new.role := old.role;
    new.approved_at := old.approved_at;
    new.approved_by := old.approved_by;
    new.email := old.email;
    new.id := old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Exclusão da própria conta (cascade em profiles/cotacoes/coletas)
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  master_account boolean := false;
begin
  if uid is null then
    raise exception 'Não autenticado';
  end if;

  select role = 'master' into master_account
  from public.profiles
  where id = uid;

  if coalesce(master_account, false) then
    raise exception 'A conta master não pode ser excluída por aqui.';
  end if;

  delete from auth.users where id = uid;

  if not found then
    raise exception 'Conta não encontrada para exclusão.';
  end if;
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;

-- Master exclui usuário (não master)
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_role text;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  if not public.is_master() then
    raise exception 'Apenas o master pode excluir usuários.';
  end if;

  if target_id is null or target_id = auth.uid() then
    raise exception 'Não é possível excluir esta conta por aqui.';
  end if;

  select role into target_role
  from public.profiles
  where id = target_id;

  if target_role is null then
    raise exception 'Usuário não encontrado.';
  end if;

  if target_role = 'master' then
    raise exception 'Não é possível excluir uma conta master.';
  end if;

  delete from auth.users where id = target_id;

  if not found then
    raise exception 'Falha ao excluir o usuário no Auth.';
  end if;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
revoke all on function public.admin_delete_user(uuid) from anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

notify pgrst, 'reload schema';
