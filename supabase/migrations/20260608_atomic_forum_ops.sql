-- Atomic toggle_like: prevents TOCTOU race condition and counter drift
CREATE OR REPLACE FUNCTION toggle_like(p_post_id uuid, p_user_id text)
RETURNS boolean AS $$
DECLARE
  was_liked boolean;
BEGIN
  DELETE FROM forum_likes WHERE post_id = p_post_id AND user_id = p_user_id RETURNING true INTO was_liked;
  IF was_liked THEN
    UPDATE forum_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = p_post_id;
    RETURN false;
  ELSE
    INSERT INTO forum_likes (post_id, user_id) VALUES (p_post_id, p_user_id);
    UPDATE forum_posts SET like_count = like_count + 1 WHERE id = p_post_id;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Atomic toggle_repost: same pattern as toggle_like
CREATE OR REPLACE FUNCTION toggle_repost(p_post_id uuid, p_user_id text)
RETURNS boolean AS $$
DECLARE
  was_reposted boolean;
BEGIN
  DELETE FROM forum_reposts WHERE post_id = p_post_id AND user_id = p_user_id RETURNING true INTO was_reposted;
  IF was_reposted THEN
    UPDATE forum_posts SET repost_count = GREATEST(0, repost_count - 1) WHERE id = p_post_id;
    RETURN false;
  ELSE
    INSERT INTO forum_reposts (post_id, user_id) VALUES (p_post_id, p_user_id);
    UPDATE forum_posts SET repost_count = repost_count + 1 WHERE id = p_post_id;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Atomic reply_count increment: prevents lost updates under concurrent requests
CREATE OR REPLACE FUNCTION increment_reply_count(row_id uuid)
RETURNS void AS $$
  UPDATE forum_posts SET reply_count = reply_count + 1 WHERE id = row_id;
$$ LANGUAGE sql;

-- Batch league rank update: replaces N individual round-trips
CREATE OR REPLACE FUNCTION update_league_ranks(user_ranks jsonb)
RETURNS void AS $$
BEGIN
  UPDATE user_football_iq
  SET league_rank = (user_ranks->>clerk_user_id)::int
  WHERE clerk_user_id = ANY(SELECT jsonb_object_keys(user_ranks));
END;
$$ LANGUAGE plpgsql;
