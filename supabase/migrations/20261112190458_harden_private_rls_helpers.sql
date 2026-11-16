-- Keep SECURITY DEFINER helpers out of the PostgREST-exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
    and ((select auth.uid()) = a or (select auth.uid()) = b)
    and exists (
      select 1 from public.blocked_users
      where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
    );
$$;
revoke all on function private.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function private.is_blocked_between(uuid, uuid) to authenticated;

create or replace function private.is_conversation_member(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.conversation_members m
    where m.conversation_id = p_conversation_id and m.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_conversation_member(uuid) from public, anon;
grant execute on function private.is_conversation_member(uuid) to authenticated;

drop policy "profile member visibility" on public.profiles;
create policy "profile member visibility" on public.profiles for select to authenticated using (
  (select auth.uid()) = id
  or (visibility = 'members' and not private.is_blocked_between((select auth.uid()), id))
  or exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = id)
);

drop policy "posts visible to audience" on public.posts;
create policy "posts visible to audience" on public.posts for select to authenticated using (
  deleted_at is null
  and not private.is_blocked_between((select auth.uid()), author_id)
  and (
    author_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = author_id and p.visibility = 'members' and posts.visibility = 'members')
    or exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = author_id)
  )
  and (visibility = 'members' or author_id = (select auth.uid()) or exists (
    select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = author_id
  ))
);

drop policy "follow public or accept request" on public.follows;
create policy "follow public or accept request" on public.follows for insert to authenticated with check (
  not private.is_blocked_between(follower_id, followed_id)
  and (
    (follower_id = (select auth.uid()) and exists (
      select 1 from public.profiles p where p.id = followed_id and p.visibility = 'members'
    ))
    or (followed_id = (select auth.uid()) and exists (
      select 1 from public.follow_requests r where r.requester_id = follower_id and r.target_id = followed_id
    ))
  )
);

drop policy "request own follow" on public.follow_requests;
create policy "request own follow" on public.follow_requests for insert to authenticated with check (
  requester_id = (select auth.uid()) and not private.is_blocked_between(requester_id, target_id)
);

drop policy "blogs visible" on public.blogs;
create policy "blogs visible" on public.blogs for select to authenticated using (
  author_id = (select auth.uid())
  or (status = 'published' and not private.is_blocked_between((select auth.uid()), author_id))
);

drop policy "relationship privacy" on public.relationship_status;
create policy "relationship privacy" on public.relationship_status for select to authenticated using (
  user_id = (select auth.uid())
  or (visibility = 'members' and not private.is_blocked_between((select auth.uid()), user_id))
  or (visibility = 'followers' and exists (
    select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = user_id
  ))
);

drop policy "stories visible to approved audience" on public.stories;
create policy "stories visible to approved audience" on public.stories for select to authenticated using (
  expires_at > now()
  and not private.is_blocked_between((select auth.uid()), author_id)
  and (author_id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = author_id and p.visibility = 'members'
  ) or exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = author_id))
);

drop policy "conversation member read" on public.conversations;
create policy "conversation member read" on public.conversations for select to authenticated using (private.is_conversation_member(id));
drop policy "member list visible to members" on public.conversation_members;
create policy "member list visible to members" on public.conversation_members for select to authenticated using (private.is_conversation_member(conversation_id));
drop policy "messages member read" on public.messages;
create policy "messages member read" on public.messages for select to authenticated using (private.is_conversation_member(conversation_id));
drop policy "send as member" on public.messages;
create policy "send as member" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and private.is_conversation_member(conversation_id)
);

-- Admin data is denied both by missing table grants and an explicit deny policy.
create policy "deny client admin roles" on public.admin_roles for all to anon, authenticated using (false) with check (false);
create policy "deny client admin audit logs" on public.admin_audit_logs for all to anon, authenticated using (false) with check (false);

revoke all on function public.is_blocked_between(uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_conversation_member(uuid) from public, anon, authenticated;
drop function public.is_blocked_between(uuid, uuid);
drop function public.is_conversation_member(uuid);
