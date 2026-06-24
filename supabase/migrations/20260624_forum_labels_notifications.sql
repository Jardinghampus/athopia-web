-- Add label column to forum_posts
ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS label text CHECK (
    label IN ('transfer', 'taktik', 'match', 'rykte', 'diskussion')
  );

-- Notifications table for forum activity
CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text NOT NULL,       -- Clerk user ID of recipient
  type          text NOT NULL        CHECK (type IN ('reply', 'like', 'repost', 'mention')),
  actor_id      text NOT NULL,
  actor_name    text,
  post_id       uuid REFERENCES forum_posts(id) ON DELETE CASCADE,
  read          boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread
  ON notifications (user_id, read, created_at DESC);

-- Allow notifications to be inserted without auth (server uses service key)
-- RLS: users can only see their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Service role insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid()::text);
