-- 20260713120000_columnists.sql
-- Krönikörer (invite-only): profiles.role gate + columns-tabell för egna,
-- mänskligt skrivna texter. Separat från `articles` (AI-genererat original
-- med multi-source-grind) med avsikt — krönikor ska ALDRIG gå via
-- Sonnet-grinden eller behandlas som redaktionellt "vi tycker".
-- Rollen sätts manuellt (SQL) av founder tills vidare — ingen self-serve-
-- ansökan, ingen admin-UI i athopia-web (admin hör hemma i athopia-admin).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'reader'
    CHECK (role IN ('reader', 'columnist'));

CREATE TABLE IF NOT EXISTS public.columns (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_clerk_user_id  text NOT NULL,
  team_entity_id        uuid REFERENCES public.entities(id) ON DELETE SET NULL,
  sport                 text NOT NULL DEFAULT 'football',
  title                 text NOT NULL DEFAULT '',
  slug                  text,
  excerpt               text,
  content               jsonb NOT NULL DEFAULT '{}'::jsonb,  -- Tiptap-dokument (JSON)
  content_html          text NOT NULL DEFAULT '',            -- renderad snapshot för lässidan
  status                text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'published')),
  published_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS columns_slug_key ON public.columns (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS columns_author_idx ON public.columns (author_clerk_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS columns_published_idx ON public.columns (published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS columns_team_idx ON public.columns (team_entity_id) WHERE status = 'published';

CREATE TRIGGER trg_columns_updated_at
  BEFORE UPDATE ON public.columns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Slug autogen vid publicering (samma slugify-funktion som articles).
CREATE OR REPLACE FUNCTION public.columns_set_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := coalesce(public.athopia_slugify(NEW.title), 'kronika') || '-' || left(NEW.id::text, 8);
  END IF;
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_columns_set_slug ON public.columns;
CREATE TRIGGER trg_columns_set_slug
  BEFORE INSERT OR UPDATE ON public.columns
  FOR EACH ROW EXECUTE FUNCTION public.columns_set_slug();

-- RLS: servern (service role) bypassar och är den enda skrivvägen (ägarskap
-- kontrolleras i app-koden). Publikt läsbart är bara publicerade krönikor.
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published columns" ON public.columns
  FOR SELECT TO anon, authenticated USING (status = 'published');
