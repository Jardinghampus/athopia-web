create table if not exists public.apns_subscriptions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  device_token text not null unique,
  team_ids text[] not null default '{}',
  sport text not null default 'football',
  environment text not null default 'production'
    check (environment in ('sandbox', 'production')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists apns_subscriptions_user_idx
  on public.apns_subscriptions (clerk_user_id);

create index if not exists apns_subscriptions_active_idx
  on public.apns_subscriptions (sport, is_active);

alter table public.apns_subscriptions enable row level security;

revoke all on public.apns_subscriptions from anon, authenticated;
grant all on public.apns_subscriptions to service_role;
