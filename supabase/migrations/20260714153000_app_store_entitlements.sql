create table if not exists public.app_store_accounts (
  clerk_user_id text primary key,
  app_account_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.app_store_entitlements (
  original_transaction_id text primary key,
  transaction_id text not null unique,
  clerk_user_id text not null references public.app_store_accounts(clerk_user_id) on delete cascade,
  app_account_token uuid not null,
  product_id text not null,
  plan text not null check (plan in ('pro', 'elite')),
  environment text not null check (environment in ('Sandbox', 'Production', 'sandbox', 'production')),
  purchased_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists app_store_entitlements_user_idx
  on public.app_store_entitlements (clerk_user_id);

alter table public.app_store_accounts enable row level security;
alter table public.app_store_entitlements enable row level security;

revoke all on public.app_store_accounts from anon, authenticated;
revoke all on public.app_store_entitlements from anon, authenticated;
grant all on public.app_store_accounts to service_role;
grant all on public.app_store_entitlements to service_role;
