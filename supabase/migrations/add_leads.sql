-- Tabla de leads capturados desde la landing page (exit intent popup)
create table if not exists public.leads (
  id         uuid        primary key default gen_random_uuid(),
  nombre     text        not null,
  email      text        not null,
  edificio   text,
  interes    text        not null default 'demo',   -- 'demo' | 'pago'
  fuente     text        not null default 'exit_intent',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Cualquier visitante anónimo puede insertar un lead
create policy "leads_insert_public"
  on public.leads
  for insert
  with check (true);

-- Solo el service_role puede leer (administración interna)
create policy "leads_select_admin"
  on public.leads
  for select
  using (false);   -- bloqueado para anon; el dashboard de admin usa service_role
