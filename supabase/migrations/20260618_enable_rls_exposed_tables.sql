-- 20260618_enable_rls_exposed_tables.sql
-- Aktivera RLS på de 8 publika tabeller som saknade det (Supabase advisor-fynd).
-- Servern använder service-role → bypassar RLS, så server-reads påverkas ej.
-- Anon-klienten läser bara match_rounds bland dessa (via useGamification) +
-- ev. iOS-app läser sportinnehåll → publik SELECT-policy där, hård lås på interna.

-- Rena interna tabeller: RLS på, INGEN policy → endast service-role.
ALTER TABLE public.chat_cache         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_version       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sm_normalize_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sm_sync_state      ENABLE ROW LEVEL SECURITY;

-- Publikt sportinnehåll: RLS på + endast SELECT för anon/authenticated.
ALTER TABLE public.fixtures        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_rounds    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON public.fixtures        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read" ON public.live_scores     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read" ON public.match_summaries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read" ON public.match_rounds    FOR SELECT TO anon, authenticated USING (true);
