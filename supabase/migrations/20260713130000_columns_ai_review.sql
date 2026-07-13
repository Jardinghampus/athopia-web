-- 20260713130000_columns_ai_review.sql
-- AI-genererad SEO-beskrivning + kort kvalitetsfeedback per krönika.
-- Haiku (kort extraktionsuppgift, inte narrativ syntes) — se CLAUDE.md §4:
-- Sonnet kräver grind, default är Haiku.
ALTER TABLE public.columns
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS ai_feedback text,
  ADD COLUMN IF NOT EXISTS ai_reviewed_at timestamptz;
