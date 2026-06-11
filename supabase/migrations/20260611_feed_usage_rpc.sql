-- ─────────────────────────────────────────────────────────────────────────────
-- 20260611_feed_usage_rpc.sql
-- Free-tier dagskvot för feeden (20 items/dag). Server-enforced via /api/feed.
--
-- Idempotent: säker att köra även om tabell/RPC redan finns.
-- ─────────────────────────────────────────────────────────────────────────────

-- Tabell (matchar CLAUDE.md §8). clerk_user_id = 'anon::{ip_hash}' för ej inloggade.
create table if not exists public.user_feed_usage (
  clerk_user_id text not null,
  date          date not null default current_date,
  items_seen    int  not null default 0,
  primary key (clerk_user_id, date)
);

-- Atomisk upsert + increment. Returnerar nytt items_seen-värde.
-- p_delta default 1 → bakåtkompatibel med befintligt feed/seen-anrop (2 args).
drop function if exists public.increment_feed_usage(text, date);
drop function if exists public.increment_feed_usage(text, date, int);

create function public.increment_feed_usage(
  p_clerk_user_id text,
  p_date          date,
  p_delta         int default 1
)
returns int
language plpgsql
as $$
declare
  new_count int;
begin
  insert into public.user_feed_usage (clerk_user_id, date, items_seen)
  values (p_clerk_user_id, p_date, greatest(p_delta, 0))
  on conflict (clerk_user_id, date)
  do update set items_seen = public.user_feed_usage.items_seen + greatest(p_delta, 0)
  returning items_seen into new_count;
  return new_count;
end;
$$;
