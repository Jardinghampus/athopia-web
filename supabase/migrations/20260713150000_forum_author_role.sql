-- 20260713150000_forum_author_role.sql
-- Denormaliserad snapshot av profiles.role på varje forum_posts-rad, samma
-- mönster som author_team/author_avatar (sätts vid insert, uppdateras inte
-- retroaktivt om rollen ändras senare — matchar hur author_team redan funkar).
-- Driver krönikör-badgen på avataren i forumet.
ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS author_role text;
