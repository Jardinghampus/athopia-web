-- S0: lock browser/anon out of gamification *user* tables.
-- Reads/writes go through athopia-web API routes (service role).
-- match_rounds stays publicly readable (round metadata; already has "public read").

DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_league_memberships',
    'user_football_iq',
    'user_season_streak',
    'match_cards',
    'user_badges',
    'round_ring_progress',
    'fan_leagues'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Remove any existing policies so anon/authenticated cannot read user rows.
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

COMMENT ON TABLE public.user_football_iq IS
  'Gamification IQ — browser access denied; use /api/gamification/* (service role).';
