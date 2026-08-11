-- Garante coluna marca em ambientes que já aplicaram a 009 anterior

alter table public.veiculos_parceiros
  add column if not exists marca text;

update public.veiculos_parceiros
set marca = 'Não informado'
where marca is null or trim(marca) = '';

alter table public.veiculos_parceiros
  alter column marca set default 'Não informado';

do $$
begin
  alter table public.veiculos_parceiros
    alter column marca set not null;
exception
  when others then
    null;
end $$;

do $$
begin
  alter table public.veiculos_parceiros
    drop constraint if exists veiculos_parceiros_marca_check;
  alter table public.veiculos_parceiros
    add constraint veiculos_parceiros_marca_check check (char_length(trim(marca)) between 2 and 80);
exception
  when others then
    null;
end $$;

create or replace function public.veiculos_parceiros_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.marca := trim(regexp_replace(coalesce(new.marca, ''), '\s+', ' ', 'g'));
  new.modelo := trim(regexp_replace(coalesce(new.modelo, ''), '\s+', ' ', 'g'));
  new.cor := trim(regexp_replace(coalesce(new.cor, ''), '\s+', ' ', 'g'));
  new.rotas := trim(regexp_replace(coalesce(new.rotas, ''), '\s+', ' ', 'g'));
  if new.nome is not null then
    new.nome := nullif(trim(regexp_replace(new.nome, '\s+', ' ', 'g')), '');
  end if;
  if new.telefone is not null then
    new.telefone := nullif(trim(new.telefone), '');
  end if;
  if new.email is not null then
    new.email := nullif(lower(trim(new.email)), '');
  end if;
  if new.notas_master is not null then
    new.notas_master := nullif(trim(new.notas_master), '');
  end if;
  return new;
end;
$$;
