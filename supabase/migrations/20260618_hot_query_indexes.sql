-- 20260618_hot_query_indexes.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Index för hot queries inför 100K-skala. Utan dessa gör Postgres seq-scan på
-- varje forum-/feed-/sök-request → faller över vid hög samtidig last.
--
-- OBS om tabellerna redan är STORA i produktion: kör dessa som
-- `CREATE INDEX CONCURRENTLY ...` manuellt istället (CONCURRENTLY kan inte köras
-- i en transaktion, vilket migrationsverktyget wrappar). Vid nuvarande storlek
-- är vanlig CREATE INDEX (kort lås) helt OK.
-- ─────────────────────────────────────────────────────────────────────────────

-- Forum: trådlistor (sport+status), sortering, trädnavigering
CREATE INDEX IF NOT EXISTS forum_posts_sport_status_idx
  ON forum_posts (sport, status);
CREATE INDEX IF NOT EXISTS forum_posts_hot_idx
  ON forum_posts (sport, status, hot_score DESC);
CREATE INDEX IF NOT EXISTS forum_posts_created_idx
  ON forum_posts (sport, status, created_at DESC);
CREATE INDEX IF NOT EXISTS forum_posts_root_idx
  ON forum_posts (root_id);
CREATE INDEX IF NOT EXISTS forum_posts_parent_idx
  ON forum_posts (parent_id);
CREATE INDEX IF NOT EXISTS forum_posts_author_idx
  ON forum_posts (author_id);
CREATE INDEX IF NOT EXISTS forum_replies_thread_idx
  ON forum_replies (thread_id);
CREATE INDEX IF NOT EXISTS forum_replies_author_idx
  ON forum_replies (author_id);

-- NewsStream / content_queue: feed-läsning + signal-ranking
CREATE INDEX IF NOT EXISTS content_queue_feed_idx
  ON content_queue (sport, status, content_type, created_at DESC);
CREATE INDEX IF NOT EXISTS content_queue_signal_idx
  ON content_queue (sport, status, content_type, signal_score DESC);

-- Artiklar: senaste först (förstasida/feed)
CREATE INDEX IF NOT EXISTS articles_published_idx
  ON articles (published_at DESC);

-- Profiler: unik nickname-koll (case-insensitivt) + uppslag på user
CREATE INDEX IF NOT EXISTS profiles_clerk_idx
  ON profiles (clerk_user_id);
CREATE INDEX IF NOT EXISTS profiles_nickname_lower_idx
  ON profiles (lower(nickname));

-- Push: uppslag per användare
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON push_subscriptions (user_id);
