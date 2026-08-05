create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
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
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
