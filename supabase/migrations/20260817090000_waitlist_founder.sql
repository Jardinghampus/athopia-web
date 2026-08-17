-- Waitlist + Founder-pott (2026-08-17)
--
-- Additiv mot public.waitlist (0 rader vid körning). Tre saker händer här:
--   1. `name` slutar vara obligatoriskt — UI:t frågar inte längre efter namn.
--   2. Waitlist får kohort, status, dubbel opt-in-token, UTM och referral.
--   3. anon/authenticated förlorar SELECT på waitlist. Den granten fanns i prod
--      och exponerade varje e-postadress i listan för vem som helst med anon-
--      nyckeln (som ligger i klientbundlen). Det är en läcka, inte en design.
--
-- Founder-potten är en RAD, inte en boolean i kod: 500 platser, räknade i DB så
-- att två samtidiga bekräftelser vid plats 500 ger exakt en founder.

-- ── waitlist: namn blir valfritt ────────────────────────────────────────────
alter table public.waitlist alter column name drop not null;
alter table public.waitlist alter column name set default '';

-- ── waitlist: nya kolumner ──────────────────────────────────────────────────
alter table public.waitlist
  add column if not exists status text not null default 'pending_confirm',
  add column if not exists cohort text,
  add column if not exists clerk_waitlist_id text,
  add column if not exists clerk_user_id text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists invited_at timestamptz,
  add column if not exists consent_at timestamptz,
  add column if not exists policy_version text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists referred_by uuid references public.waitlist(id),
  add column if not exists confirm_token_hash text,
  add column if not exists confirm_expires_at timestamptz,
  add column if not exists confirm_sent_at timestamptz,
  add column if not exists referral_credits_granted int not null default 0;

alter table public.waitlist drop constraint if exists waitlist_status_check;
alter table public.waitlist add constraint waitlist_status_check
  check (status in ('pending_confirm','confirmed','invited','completed','revoked'));

alter table public.waitlist drop constraint if exists waitlist_cohort_check;
alter table public.waitlist add constraint waitlist_cohort_check
  check (cohort is null or cohort in ('founder','regular'));

create unique index if not exists waitlist_clerk_waitlist_id_uidx
  on public.waitlist (clerk_waitlist_id) where clerk_waitlist_id is not null;

-- Confirm slår upp på token-hash; utan index blir det en seq scan per klick.
create index if not exists waitlist_confirm_token_hash_idx
  on public.waitlist (confirm_token_hash) where confirm_token_hash is not null;

-- Admin filtrerar på kohort + status.
create index if not exists waitlist_cohort_status_idx on public.waitlist (cohort, status);

-- ── Founder-potten ──────────────────────────────────────────────────────────
create table if not exists public.founder_offer_state (
  id boolean primary key default true check (id),
  cap int not null default 500 check (cap = 500),
  claimed int not null default 0 check (claimed >= 0 and claimed <= cap),
  updated_at timestamptz not null default now()
);
insert into public.founder_offer_state (id, cap, claimed) values (true, 500, 0)
  on conflict (id) do nothing;

-- ── Läckage: e-post ska inte vara publikt läsbar ────────────────────────────
revoke select, insert, update, delete on public.waitlist from anon, authenticated;
revoke select, insert, update, delete on public.founder_offer_state from anon, authenticated;
grant all on public.waitlist to service_role;
grant all on public.founder_offer_state to service_role;

alter table public.waitlist enable row level security;
alter table public.founder_offer_state enable row level security;
-- Inga policies för anon/authenticated. All åtkomst går via service_role.

-- ── Atomär kohort-tilldelning ───────────────────────────────────────────────
--
-- `for update` på pottraden serialiserar samtidiga bekräftelser. Utan den
-- läser två parallella confirms samma `claimed` och båda blir founder — exakt
-- det race speccen kräver att vi stänger vid plats 500.
create or replace function public.claim_waitlist_cohort(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cohort text;
begin
  perform 1 from public.founder_offer_state where id = true for update;

  update public.waitlist w
  set
    status = 'confirmed',
    confirmed_at = now(),
    cohort = case
      when (select claimed from public.founder_offer_state where id = true) < s.cap
      then 'founder' else 'regular' end,
    confirm_token_hash = null,
    confirm_expires_at = null
  from public.founder_offer_state s
  where w.id = p_id
    and w.status = 'pending_confirm'
    and s.id = true
  returning w.cohort into v_cohort;

  if v_cohort is null then
    raise exception 'waitlist_confirm_failed';
  end if;

  if v_cohort = 'founder' then
    update public.founder_offer_state
    set claimed = claimed + 1, updated_at = now()
    where id = true and claimed < cap;
  end if;

  return v_cohort;
end;
$$;

revoke all on function public.claim_waitlist_cohort(uuid) from public, anon, authenticated;
grant execute on function public.claim_waitlist_cohort(uuid) to service_role;
