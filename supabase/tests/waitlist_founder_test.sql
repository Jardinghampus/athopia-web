-- Waitlist + Founder-pott: körbara tester mot en RIKTIG databas.
--
-- Varför SQL och inte en mockad unit-test: det som testas ÄR låsbeteendet.
-- `for update` går inte att mocka — en mock som låtsas serialisera bevisar bara
-- att mocken fungerar. Kör mot en branch eller efter migration mot prod (alla
-- tester städar efter sig och återställer potten till 0).
--
--   psql "$DATABASE_URL" -f supabase/tests/waitlist_founder_test.sql
--
-- Verifierat grönt 2026-08-17 mot fmwjmrtqvdxswlimroqx.

\echo '── 1. Race vid plats 500 ────────────────────────────────────────────────'
do $$
declare
  a uuid; b uuid; ca text; cb text;
  v_claimed int; v_founders int; v_regulars int;
begin
  update public.founder_offer_state set claimed = 499 where id = true;

  insert into public.waitlist (name, email, favorite_team, status)
  values ('', 'racetest-a@invalid.athopia', 'aik', 'pending_confirm') returning id into a;
  insert into public.waitlist (name, email, favorite_team, status)
  values ('', 'racetest-b@invalid.athopia', 'aik', 'pending_confirm') returning id into b;

  ca := public.claim_waitlist_cohort(a);
  cb := public.claim_waitlist_cohort(b);

  select claimed into v_claimed from public.founder_offer_state where id = true;
  select count(*) filter (where cohort = 'founder'), count(*) filter (where cohort = 'regular')
    into v_founders, v_regulars
    from public.waitlist where id in (a, b);

  assert v_claimed = 500, 'claimed skulle vara 500, blev ' || v_claimed;
  assert v_founders = 1, 'exakt en founder förväntades, blev ' || v_founders;
  assert v_regulars = 1, 'exakt en regular förväntades, blev ' || v_regulars;

  delete from public.waitlist where id in (a, b);
  update public.founder_offer_state set claimed = 0, paid = 0 where id = true;
  raise notice 'OK: 499 + två bekräftelser = en founder, en regular, claimed 500';
end $$;

\echo '── 2. Taket 500 betalda Founder ─────────────────────────────────────────'
do $$
declare ok1 boolean; ok2 boolean; ok3 boolean; v record;
begin
  update public.founder_offer_state set claimed = 499, paid = 499 where id = true;

  ok1 := public.reserve_founder_seat(true);   -- plats 500, walk-in
  ok2 := public.reserve_founder_seat(true);   -- 501 → nekas
  ok3 := public.reserve_founder_seat(false);  -- waitlist-founder, taket nått → nekas

  select cap, claimed, paid into v from public.founder_offer_state where id = true;
  assert ok1, 'plats 500 skulle gå att reservera';
  assert not ok2, 'plats 501 skulle NEKAS';
  assert not ok3, 'ingen får passera taket 500 betalda';
  assert v.paid = 500 and v.claimed = 500, 'räknarna skulle stanna på 500';

  perform public.release_founder_seat(true);
  select cap, claimed, paid into v from public.founder_offer_state where id = true;
  assert v.paid = 499 and v.claimed = 499, 'release skulle ge tillbaka en plats';

  update public.founder_offer_state set claimed = 0, paid = 0 where id = true;
  raise notice 'OK: 501:a nekas, release återlämnar platsen';
end $$;

\echo '── 3. Ingen e-postläcka: anon/authenticated ─────────────────────────────'
do $$
begin
  set local role anon;
  begin
    perform 1 from public.waitlist limit 1;
    reset role;
    raise exception 'LÄCKA: anon kunde SELECT:a waitlist';
  exception when insufficient_privilege then
    reset role;
    raise notice 'OK: anon SELECT waitlist nekas';
  end;

  set local role authenticated;
  begin
    perform 1 from public.waitlist limit 1;
    reset role;
    raise exception 'LÄCKA: authenticated kunde SELECT:a waitlist';
  exception when insufficient_privilege then
    reset role;
    raise notice 'OK: authenticated SELECT waitlist nekas';
  end;

  set local role anon;
  begin
    perform public.reserve_founder_seat(true);
    reset role;
    raise exception 'LÄCKA: anon kunde reservera en Founder-plats';
  exception when insufficient_privilege then
    reset role;
    raise notice 'OK: anon EXECUTE reserve_founder_seat nekas';
  end;
end $$;
