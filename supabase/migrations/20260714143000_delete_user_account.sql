-- App Store account deletion support.
-- Removes private user data and irreversibly anonymizes shared forum content.

create or replace function public.delete_user_account(p_clerk_user_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  anonymized_id text := 'deleted-' || gen_random_uuid()::text;
begin
  if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0 then
    raise exception 'clerk user id is required';
  end if;

  delete from public.forum_likes where user_id = p_clerk_user_id;
  delete from public.forum_reposts where user_id = p_clerk_user_id;
  delete from public.reactions where clerk_user_id = p_clerk_user_id;

  update public.forum_posts
  set
    author_id = anonymized_id,
    author_name = 'Raderad användare',
    author_avatar = null,
    content = 'Inlägget har raderats.',
    images = null,
    ai_summary = null,
    ai_summary_updated_at = null
  where author_id = p_clerk_user_id;

  update public.forum_replies
  set
    author_id = anonymized_id,
    author_name = 'Raderad användare',
    content = 'Inlägget har raderats.'
  where author_id = p_clerk_user_id;

  update public.forum_threads
  set
    author_id = anonymized_id,
    author_name = 'Raderad användare',
    content = 'Inlägget har raderats.'
  where author_id = p_clerk_user_id;

  update public.posts
  set
    clerk_user_id = anonymized_id,
    body = 'Inlägget har raderats.'
  where clerk_user_id = p_clerk_user_id;

  update public.threads
  set
    clerk_user_id = anonymized_id,
    body = 'Inlägget har raderats.',
    title = 'Raderad tråd'
  where clerk_user_id = p_clerk_user_id;

  delete from public.ai_summaries where clerk_user_id = p_clerk_user_id;
  delete from public.apns_subscriptions where clerk_user_id = p_clerk_user_id;
  delete from public.app_store_accounts where clerk_user_id = p_clerk_user_id;
  delete from public.chat_usage where user_id = p_clerk_user_id;
  delete from public.cookie_consents where clerk_user_id = p_clerk_user_id;
  delete from public.iq_history where clerk_user_id = p_clerk_user_id;
  delete from public.match_cards where clerk_user_id = p_clerk_user_id;
  delete from public.notifications where user_id = p_clerk_user_id;
  delete from public.push_subscriptions where clerk_user_id = p_clerk_user_id;
  delete from public.round_ring_progress where clerk_user_id = p_clerk_user_id;
  delete from public.user_badges where clerk_user_id = p_clerk_user_id;
  delete from public.user_feed_config where clerk_user_id = p_clerk_user_id;
  delete from public.user_feed_usage where clerk_user_id = p_clerk_user_id;
  delete from public.user_follows where user_id = p_clerk_user_id;
  delete from public.user_football_iq where clerk_user_id = p_clerk_user_id;
  delete from public.user_league_memberships where clerk_user_id = p_clerk_user_id;
  delete from public.user_season_streak where clerk_user_id = p_clerk_user_id;
  delete from public.profiles where clerk_user_id = p_clerk_user_id;
end;
$$;

revoke all on function public.delete_user_account(text) from public;
grant execute on function public.delete_user_account(text) to service_role;
