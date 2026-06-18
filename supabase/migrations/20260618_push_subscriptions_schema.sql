-- 20260618_push_subscriptions_schema.sql
-- Komplettera push_subscriptions så schemat matchar subscribe/send-routerna.
-- Tabellen hade: id, clerk_user_id, sport, endpoint, p256dh, auth, created_at.
-- Routerna förväntade sig även team_ids, is_active, updated_at (saknades → insert/select felade).
-- Routerna använder nu clerk_user_id (ej user_id) för konsekvens med övriga appen.

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS team_ids   text[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active  boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions (clerk_user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_active_idx ON public.push_subscriptions (is_active);
CREATE INDEX IF NOT EXISTS push_subscriptions_team_ids_idx ON public.push_subscriptions USING gin (team_ids);
