-- 20260713140000_admin_role.sql
-- 'admin' läggs till som en tredje profiles.role: founder-only, sätts manuellt
-- (direkt SQL, inte via denna migration — inget konto identifieras här av
-- avsikt, git-historik ska inte innehålla vilket specifikt konto som är admin).
-- Semantiken: varje behörighetskontroll som skrivs framåt ska behandla admin
-- som wildcard (se lib/roles.ts) — det garanterar INTE automatiskt skydd i
-- kod som saknar en rollkontroll helt, bara i de gates som faktiskt frågar.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('reader', 'columnist', 'admin'));
