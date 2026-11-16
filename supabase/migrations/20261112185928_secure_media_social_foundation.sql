-- Incremental security and media foundation. Apply after foundation_initial.sql.
-- Objects are private by default; no public bucket or client-chosen owner is used.

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  object_key text not null unique check (object_key !~ '(^/|\.\.|\\)'),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/avif')),
  file_size bigint not null check (file_size between 1 and 10485760),
  width integer check (width > 0 and width <= 12000),
  height integer check (height > 0 and height <= 12000),
  sort_order smallint not null check (sort_order between 0 and 4),
  created_at timestamptz not null default now(),
  unique(post_id, sort_order)
);
create index post_media_post_idx on public.post_media(post_id, sort_order);
alter table public.post_media enable row level security;

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  object_key text not null unique check (object_key !~ '(^/|\.\.|\\)'),
  media_type text not null check (media_type in ('image','video')),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm')),
  file_size bigint not null check (file_size between 1 and 10485760),
  width integer check (width > 0 and width <= 12000),
  height integer check (height > 0 and height <= 12000),
  duration_seconds numeric(5,2) check (duration_seconds > 0 and duration_seconds <= 30),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  check ((media_type = 'image' and mime_type like 'image/%' and file_size <= 2097152 and duration_seconds is null)
      or (media_type = 'video' and mime_type like 'video/%' and duration_seconds between 1 and 30))
);
create index stories_expiry_idx on public.stories(expires_at, author_id);
create table public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key(story_id, viewer_id)
);
create index story_views_viewer_idx on public.story_views(viewer_id, viewed_at desc);
alter table public.stories enable row level security;
alter table public.story_views enable row level security;

-- Likes/comments must follow the parent post's visibility policy. The posts RLS
-- policy also blocks access when either side has blocked the other.
drop policy if exists "likes visible" on public.post_likes;
create policy "likes visible through post" on public.post_likes
  for select to authenticated using (exists (select 1 from public.posts p where p.id = post_id));
drop policy if exists "comments visible" on public.post_comments;
create policy "comments visible through post" on public.post_comments
  for select to authenticated using (deleted_at is null and exists (select 1 from public.posts p where p.id = post_id));
drop policy if exists "comment as self" on public.post_comments;
create policy "comment as self on visible post" on public.post_comments
  for insert to authenticated with check (
    author_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id)
  );
drop policy if exists "delete own comments" on public.post_comments;
create policy "delete own comments" on public.post_comments
  for delete to authenticated using (author_id = (select auth.uid()));

-- A private profile cannot be bypassed by inserting a direct follow row, and
-- a public profile's followers-only post still requires an accepted follow.
drop policy if exists "posts visible to members" on public.posts;
create policy "posts visible to audience" on public.posts
  for select to authenticated using (
    deleted_at is null
    and not public.is_blocked_between((select auth.uid()), author_id)
    and (
      author_id = (select auth.uid())
      or exists (
        select 1 from public.profiles p
        where p.id = author_id and p.visibility = 'members' and posts.visibility = 'members'
      )
      or exists (
        select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = author_id
      )
    )
    and (visibility = 'members' or author_id = (select auth.uid()) or exists (
      select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = author_id
    ))
  );
drop policy if exists "follow self create" on public.follows;
create policy "follow public or accept request" on public.follows
  for insert to authenticated with check (
    not public.is_blocked_between(follower_id, followed_id)
    and (
      (follower_id = (select auth.uid()) and exists (
        select 1 from public.profiles p where p.id = followed_id and p.visibility = 'members'
      ))
      or (followed_id = (select auth.uid()) and exists (
        select 1 from public.follow_requests r where r.requester_id = follower_id and r.target_id = followed_id
      ))
    )
  );

create policy "media visible through post" on public.post_media
  for select to authenticated using (exists (select 1 from public.posts p where p.id = post_id));
create policy "media owner inserts" on public.post_media
  for insert to authenticated with check (
    owner_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
  );
create policy "media owner updates" on public.post_media
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));
create policy "media owner deletes" on public.post_media
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "stories visible to approved audience" on public.stories
  for select to authenticated using (
    expires_at > now()
    and not public.is_blocked_between((select auth.uid()), author_id)
    and (author_id = (select auth.uid()) or exists (
      select 1 from public.profiles p where p.id = author_id and p.visibility = 'members'
    ) or exists (
      select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = author_id
    ))
  );
create policy "story owner inserts" on public.stories
  for insert to authenticated with check (author_id = (select auth.uid()));
create policy "story owner deletes" on public.stories
  for delete to authenticated using (author_id = (select auth.uid()));
create policy "story author sees viewers" on public.story_views
  for select to authenticated using (exists (
    select 1 from public.stories s where s.id = story_id and s.author_id = (select auth.uid())
  ));
create policy "viewer records own view" on public.story_views
  for insert to authenticated with check (
    viewer_id = (select auth.uid()) and exists (select 1 from public.stories s where s.id = story_id)
  );

-- Registration metadata comes from user-editable auth metadata; these fields
-- remain profile attributes and must never be used to grant authorization.
-- Do not expose the SECURITY DEFINER block lookup to anonymous callers. Its
-- fixed search_path is inherited from the original migration.
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
    and ((select auth.uid()) = a or (select auth.uid()) = b)
    and exists (
      select 1 from public.blocked_users
      where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
    );
$$;
revoke all on function public.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;
-- Default Supabase grants can expose newly created public tables to anon.
-- Revoke anonymous access and grant authenticated access only where RLS applies.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on public.admin_roles, public.admin_audit_logs from anon, authenticated;
-- R2 credentials belong exclusively in server runtime secrets, never in SQL.
