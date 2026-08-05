alter table public.profiles
  add column if not exists nome_completo text,
  add column if not exists endereco text,
  add column if not exists cpf text,
  add column if not exists cnpj text,
  add column if not exists telefone text,
  add column if not exists whatsapp text;

notify pgrst, 'reload schema';
