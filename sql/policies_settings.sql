-- Habilita Row Level Security e cria política para permitir SELECT público
-- Execute este ficheiro no SQL editor do Supabase.

-- Habilitar RLS (opcional, se ainda não estiver ativado)
alter table settings enable row level security;

-- Permitir leitura pública (SELECT) na tabela settings
create policy "allow_select_settings" on settings
  for select using (true);

-- Nota de segurança:
-- - Inserts/updates/deletes permanecem negados por RLS, a menos que políticas sejam adicionadas.
-- - O `SERVICE_ROLE_KEY` do Supabase ignora RLS, por isso o script server-side pode executar upserts sem políticas adicionais.
-- - Se preferir que apenas utilizadores autenticados (não anónimos) leiam, ajuste a policy para: using (auth.role() = 'authenticated')
