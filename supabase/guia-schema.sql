-- Guia da Campanha: salvamento na nuvem
-- Rode este arquivo UMA vez no Supabase: SQL Editor > New query > colar > Run.
-- Antes de rodar, troque 'TROQUE-PELO-SEU-PIN' (última linha) pelo PIN que você quer usar.
--
-- Como funciona:
--   * Ler os dados é aberto (o site carrega sozinho em qualquer aparelho).
--   * Gravar exige o PIN, conferido aqui dentro do banco (guardado só como hash).
--   * As tabelas não têm nenhuma regra de acesso direto: só as funções abaixo funcionam.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.guia_dados (
  chave      text primary key,
  valor      jsonb not null,
  atualizado timestamptz not null default now()
);

create table if not exists public.guia_config (
  id       int primary key default 1 check (id = 1),
  pin_hash text not null
);

alter table public.guia_dados  enable row level security;
alter table public.guia_config enable row level security;
-- (sem policies de propósito: ninguém acessa as tabelas diretamente)

-- Lista só as chaves e a data da última gravação (leve).
create or replace function public.guia_listar()
returns table (chave text, atualizado timestamptz)
language sql security definer set search_path = public as $$
  select chave, atualizado from public.guia_dados;
$$;

-- Devolve o conteúdo de uma coleção.
create or replace function public.guia_ler_chave(p_chave text)
returns jsonb
language sql security definer set search_path = public as $$
  select valor from public.guia_dados where chave = p_chave;
$$;

-- Grava uma coleção, se o PIN estiver certo.
create or replace function public.guia_gravar(p_pin text, p_chave text, p_valor jsonb)
returns timestamptz
language plpgsql security definer set search_path = public, extensions as $$
declare
  t timestamptz;
begin
  if not exists (select 1 from public.guia_config where pin_hash = crypt(p_pin, pin_hash)) then
    raise exception 'PIN incorreto';
  end if;
  insert into public.guia_dados (chave, valor, atualizado)
  values (p_chave, p_valor, now())
  on conflict (chave) do update set valor = excluded.valor, atualizado = now()
  returning atualizado into t;
  return t;
end;
$$;

grant execute on function public.guia_listar()                       to anon, authenticated;
grant execute on function public.guia_ler_chave(text)                to anon, authenticated;
grant execute on function public.guia_gravar(text, text, jsonb)      to anon, authenticated;

-- Defina o PIN (troque o texto entre aspas). Para mudar depois, rode só esta linha de novo com outro PIN.
insert into public.guia_config (id, pin_hash)
values (1, crypt('TROQUE-PELO-SEU-PIN', gen_salt('bf')))
on conflict (id) do update set pin_hash = excluded.pin_hash;
