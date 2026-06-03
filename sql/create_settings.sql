-- Cria a tabela `settings` para armazenar pares (key, value).
-- Uso: cole isto no SQL editor do Supabase e execute.

create table if not exists settings (
  key text primary key,
  value text
);

-- Exemplo: definir um PIN padrão inicial
insert into settings (key, value)
values ('default_caregiver_pin', '1234')
on conflict (key) do update set value = excluded.value;

-- Observação sobre RLS:
-- Se Row Level Security estiver ativa, adicione políticas adequadas.
-- Exemplo simples (permite leitura pública, escritas apenas por utilizadores autenticados):

-- enable row level security;

-- create policy "public_select_settings" on settings
--  for select using (true);

-- create policy "auth_insert_update_settings" on settings
--  for insert, update using (auth.role() = 'authenticated');

-- Ajuste as políticas conforme o seu modelo de segurança.
