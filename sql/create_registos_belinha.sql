-- Correr no SQL Editor do projeto Supabase amphdsvvndofqmttpjdf
-- Tabela de registos diarios da Belinha (um registo por dia)

create table if not exists registos_belinha (
  data date primary key,
  dados jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table registos_belinha enable row level security;

-- Acesso por link privado, sem login (role anon).
-- Leitura e escrita abertas ao anon; a privacidade vem do URL nao ser publico.
drop policy if exists "ler_belinha" on registos_belinha;
create policy "ler_belinha" on registos_belinha
  for select using (true);

drop policy if exists "inserir_belinha" on registos_belinha;
create policy "inserir_belinha" on registos_belinha
  for insert with check (true);

drop policy if exists "atualizar_belinha" on registos_belinha;
create policy "atualizar_belinha" on registos_belinha
  for update using (true) with check (true);
