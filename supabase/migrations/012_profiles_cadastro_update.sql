-- Garante colunas de cadastro + permissão de o próprio usuário atualizar o perfil.
-- Sem profiles_update_own, o update parece "ok" no app mas não grava nenhuma linha.

alter table public.profiles
  add column if not exists nome_completo text,
  add column if not exists endereco text,
  add column if not exists cpf text,
  add column if not exists cnpj text,
  add column if not exists telefone text,
  add column if not exists whatsapp text;

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

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, update on public.profiles to authenticated;

notify pgrst, 'reload schema';
