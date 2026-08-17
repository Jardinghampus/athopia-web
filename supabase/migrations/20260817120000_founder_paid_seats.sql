-- Founder: betalda platser (2026-08-17)
--
-- `claimed` räknar BEKRÄFTADE waitlist-platser. Det är inte samma sak som
-- BETALDA prenumerationer, och speccen har två separata tak:
--   * potten (500) styr om Founder syns som erbjudande i UI
--   * betalda Founder (500) styr att den 501:e prenumerationen aldrig får 69 kr
--
-- Utan en egen räknare skulle checkout behöva räkna Clerk-användare med
-- `publicMetadata.founder` per anrop — ett API-svep i betalvägen, och ändå
-- inte atomärt.
--
-- Platsen reserveras när checkout-sessionen SKAPAS, inte när den lyckas.
-- Motsatsen läcker: tio samtidiga checkouts läser alla `paid = 499`, alla får
-- 69 kr i Stripe, och taket är passerat innan första webhooken landar. Priset
-- för reservationen är att en övergiven checkout håller en plats tills Stripe
-- fyrar `checkout.session.expired` (24 h), då den släpps tillbaka.

alter table public.founder_offer_state
  add column if not exists paid int not null default 0 check (paid >= 0);

-- ── Reservera en betald Founder-plats ───────────────────────────────────────
--
-- p_claim_pot: walk-in som köper medan potten är öppen tar också en POTT-plats,
-- så "X av 500 platser" på /vaenta speglar verkligheten. En waitlist-founder
-- har redan sin pott-plats och skickar false.
--
-- Returnerar true bara om platsen faktiskt gick att ta. false → 89 kr, tyst.
create or replace function public.reserve_founder_seat(p_claim_pot boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state public.founder_offer_state%rowtype;
begin
  select * into v_state from public.founder_offer_state where id = true for update;
  if not found then
    return false;
  end if;

  if v_state.paid >= v_state.cap then
    return false;
  end if;

  -- Walk-in kräver en ledig POTT-plats också: potten är slut = Founder finns
  -- inte som erbjudande, och då får ingen walk-in 69 kr.
  if p_claim_pot and v_state.claimed >= v_state.cap then
    return false;
  end if;

  update public.founder_offer_state
  set
    paid = paid + 1,
    claimed = case when p_claim_pot then claimed + 1 else claimed end,
    updated_at = now()
  where id = true;

  return true;
end;
$$;

-- ── Släpp en reservation (övergiven/utgången checkout) ──────────────────────
create or replace function public.release_founder_seat(p_release_pot boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.founder_offer_state
  set
    paid = greatest(0, paid - 1),
    claimed = case when p_release_pot then greatest(0, claimed - 1) else claimed end,
    updated_at = now()
  where id = true;
end;
$$;

revoke all on function public.reserve_founder_seat(boolean) from public, anon, authenticated;
revoke all on function public.release_founder_seat(boolean) from public, anon, authenticated;
grant execute on function public.reserve_founder_seat(boolean) to service_role;
grant execute on function public.release_founder_seat(boolean) to service_role;
