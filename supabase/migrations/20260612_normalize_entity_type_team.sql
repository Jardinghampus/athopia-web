-- Normalisera entity-typ: konsolidera 'club' → 'team'
-- Kontext: koden använde tidigare blandat 'team' (hub, onboarding, forum) och
-- 'club' (jämför-sida, podcast, lagväljare). All kod är nu standardiserad på 'team'.
-- Denna migration foldar in eventuella kvarvarande 'club'-rader så datan matchar.
--
-- KÖR när Supabase data-plane är nåbar igen (522/pooler-incident pågick 2026-06-12).

UPDATE entities SET type = 'team' WHERE type = 'club';

-- Verifiering (förväntat: 0 rader med 'club')
-- SELECT type, count(*) FROM entities GROUP BY type;
