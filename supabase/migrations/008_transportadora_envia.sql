-- Transportadora Envia Rápido na cobertura manual (redespacho)

insert into public.transportadoras_cobertura (id, nome, sigla, ativo, ordem)
values ('envia', 'Envia Rápido', 'ER', true, 3)
on conflict (id) do update
set
  nome = excluded.nome,
  sigla = excluded.sigla,
  ativo = excluded.ativo,
  ordem = excluded.ordem,
  updated_at = now();
