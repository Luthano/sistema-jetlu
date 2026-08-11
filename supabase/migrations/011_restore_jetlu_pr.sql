-- Restaura cobertura Jetlu (JL) em PR — lista recuperada do cadastro anterior (23 cidades)

insert into public.cobertura_cidades (transportadora_id, uf, cidade)
select 'jetlu', 'PR', cidade
from (
  values
    ('Apucarana'),
    ('Arapongas'),
    ('Aricanduva'),
    ('Cambira'),
    ('Céu Azul'),
    ('Cianorte'),
    ('Ibiporã'),
    ('Jandaia do Sul'),
    ('Londrina'),
    ('Mandaguari'),
    ('Marialva'),
    ('Maringá'),
    ('Matelândia'),
    ('Medianeira'),
    ('Palotina'),
    ('Pirapó'),
    ('Rolândia'),
    ('Santa Tereza do Oeste'),
    ('Santa Terezinha de Itaipu'),
    ('São Miguel do Iguaçu'),
    ('Sarandi'),
    ('Toledo'),
    ('Umuarama')
) as t(cidade)
on conflict (transportadora_id, uf, cidade_norm) do update
set cidade = excluded.cidade,
    updated_at = now();
