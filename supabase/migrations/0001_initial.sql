-- Initial BVMConnection schema. Apply with Supabase CLI after reviewing the security notes.
create extension if not exists pgcrypto;
create type public.profile_visibility as enum ('private','members');
create type public.post_visibility as enum ('members','followers');
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text unique,
 full_name text not null default '',
 branch text,
 semester smallint check (semester between 1 and 10),
 enrollment_year smallint,
 bio text check (char_length(bio)<=280),
 avatar_url text,
 cover_url text,
 visibility public.profile_visibility not null default 'private',
 onboarding_complete boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check (char_length(body) between 1 and 2000),
 visibility public.post_visibility not null default 'members',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create index posts_feed_idx on public.posts(created_at desc) where deleted_at is null;
create index posts_author_idx on public.posts(author_id,created_at desc) where deleted_at is null;
create table public.follows (
 follower_id uuid not null references public.profiles(id) on delete cascade,
 followed_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(follower_id,followed_id), check(follower_id<>followed_id)
);
create table public.follow_requests (
 id uuid primary key default gen_random_uuid(), requester_id uuid not null references public.profiles(id) on delete cascade,
 target_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), unique(requester_id,target_id), check(requester_id<>target_id)
);
create table public.blocked_users (blocker_id uuid not null references public.profiles(id) on delete cascade, blocked_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), primary key(blocker_id,blocked_id),check(blocker_id<>blocked_id));
create table public.post_likes(user_id uuid not null references public.profiles(id) on delete cascade,post_id uuid not null references public.posts(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,post_id));
create table public.post_comments(id uuid primary key default gen_random_uuid(),post_id uuid not null references public.posts(id) on delete cascade,author_id uuid not null references public.profiles(id) on delete cascade,body text not null check(char_length(body) between 1 and 1000),created_at timestamptz not null default now(),deleted_at timestamptz);
create table public.bookmarks(user_id uuid not null references public.profiles(id) on delete cascade,post_id uuid not null references public.posts(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,post_id));
create table public.blogs(id uuid primary key default gen_random_uuid(),author_id uuid not null references public.profiles(id) on delete cascade,title text not null check(char_length(title) between 1 and 180),body text not null,slug text not null unique,status text not null default 'draft' check(status in ('draft','published')),visibility public.post_visibility not null default 'members',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),published_at timestamptz);
create table public.conversations(id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now());
create table public.conversation_members(conversation_id uuid not null references public.conversations(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,joined_at timestamptz not null default now(),last_read_at timestamptz,primary key(conversation_id,user_id));
create table public.messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.conversations(id) on delete cascade,sender_id uuid not null references public.profiles(id) on delete cascade,body text not null check(char_length(body) between 1 and 4000),created_at timestamptz not null default now(),deleted_at timestamptz);
create index messages_conversation_idx on public.messages(conversation_id,created_at desc);
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,actor_id uuid references public.profiles(id) on delete set null,kind text not null,entity_id uuid,read_at timestamptz,created_at timestamptz not null default now());
create index notifications_user_idx on public.notifications(user_id,created_at desc);
create table public.reports(id uuid primary key default gen_random_uuid(),reporter_id uuid not null references public.profiles(id) on delete cascade,target_user_id uuid references public.profiles(id) on delete set null,post_id uuid references public.posts(id) on delete set null,reason text not null,details text check(char_length(details)<=3000),status text not null default 'open' check(status in ('open','reviewing','actioned','dismissed','appealed')),created_at timestamptz not null default now());
create table public.admin_roles(user_id uuid primary key references public.profiles(id) on delete cascade,role text not null check(role in ('moderator','admin','super_admin')),created_at timestamptz not null default now());
create table public.admin_audit_logs(id uuid primary key default gen_random_uuid(),actor_id uuid references public.profiles(id) on delete set null,action text not null,target_id uuid,metadata jsonb not null default '{}',created_at timestamptz not null default now());
create table public.notification_preferences(user_id uuid primary key references public.profiles(id) on delete cascade,follow_requests boolean not null default true,messages boolean not null default true,community boolean not null default true,updated_at timestamptz not null default now());
create table public.relationship_status(user_id uuid primary key references public.profiles(id) on delete cascade,status text,visibility text not null default 'private' check(visibility in ('private','followers','members')),updated_at timestamptz not null default now());
create table public.consent_records(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,consent_type text not null,version text not null,granted_at timestamptz not null default now(),withdrawn_at timestamptz);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name,branch) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'branch'); insert into public.notification_preferences(user_id) values(new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.is_blocked_between(a uuid,b uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.blocked_users where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a)); $$;
-- Enable RLS on every user or administrative table.
do $$ declare t text; begin foreach t in array array['profiles','posts','follows','follow_requests','blocked_users','post_likes','post_comments','bookmarks','blogs','conversations','conversation_members','messages','notifications','reports','admin_roles','admin_audit_logs','notification_preferences','relationship_status','consent_records'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
-- Profiles: only authenticated members see directory fields; private accounts are limited to owner/followers.
create policy "profile member visibility" on public.profiles for select to authenticated using (auth.uid()=id or (visibility='members' and not public.is_blocked_between(auth.uid(),id)) or exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.followed_id=id));
create policy "profile owner update" on public.profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);
create policy "profile owner insert" on public.profiles for insert to authenticated with check(auth.uid()=id);
create policy "posts visible to members" on public.posts for select to authenticated using(deleted_at is null and not public.is_blocked_between(auth.uid(),author_id) and (visibility='members' or author_id=auth.uid() or exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.followed_id=author_id)));
create policy "create own posts" on public.posts for insert to authenticated with check(author_id=auth.uid());
create policy "edit own posts" on public.posts for update to authenticated using(author_id=auth.uid()) with check(author_id=auth.uid());
create policy "delete own posts" on public.posts for delete to authenticated using(author_id=auth.uid());
create policy "follow participants read" on public.follows for select to authenticated using(follower_id=auth.uid() or followed_id=auth.uid());
create policy "follow self create" on public.follows for insert to authenticated with check(follower_id=auth.uid() and not public.is_blocked_between(follower_id,followed_id));
create policy "follow participants remove" on public.follows for delete to authenticated using(follower_id=auth.uid() or followed_id=auth.uid());
create policy "follow request participants" on public.follow_requests for select to authenticated using(requester_id=auth.uid() or target_id=auth.uid());
create policy "request own follow" on public.follow_requests for insert to authenticated with check(requester_id=auth.uid() and not public.is_blocked_between(requester_id,target_id));
create policy "request participants delete" on public.follow_requests for delete to authenticated using(requester_id=auth.uid() or target_id=auth.uid());
create policy "blocker manages blocks" on public.blocked_users for all to authenticated using(blocker_id=auth.uid()) with check(blocker_id=auth.uid());
create policy "likes visible" on public.post_likes for select to authenticated using(true);
create policy "like as self" on public.post_likes for insert to authenticated with check(user_id=auth.uid());
create policy "unlike as self" on public.post_likes for delete to authenticated using(user_id=auth.uid());
create policy "comments visible" on public.post_comments for select to authenticated using(deleted_at is null);
create policy "comment as self" on public.post_comments for insert to authenticated with check(author_id=auth.uid());
create policy "delete own comments" on public.post_comments for delete to authenticated using(author_id=auth.uid());
create policy "bookmarks private" on public.bookmarks for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "blogs visible" on public.blogs for select to authenticated using(author_id=auth.uid() or (status='published' and not public.is_blocked_between(auth.uid(),author_id)));
create policy "blog author writes" on public.blogs for all to authenticated using(author_id=auth.uid()) with check(author_id=auth.uid());
create policy "conversation member read" on public.conversations for select to authenticated using(exists(select 1 from public.conversation_members m where m.conversation_id=id and m.user_id=auth.uid()));
create policy "member list visible to members" on public.conversation_members for select to authenticated using(exists(select 1 from public.conversation_members m where m.conversation_id=conversation_id and m.user_id=auth.uid()));
create policy "messages member read" on public.messages for select to authenticated using(exists(select 1 from public.conversation_members m where m.conversation_id=conversation_id and m.user_id=auth.uid()));
create policy "send as member" on public.messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.conversation_members m where m.conversation_id=conversation_id and m.user_id=auth.uid()));
create policy "notifications private" on public.notifications for select to authenticated using(user_id=auth.uid());
create policy "notifications mark read" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "submit report" on public.reports for insert to authenticated with check(reporter_id=auth.uid());
create policy "reporter sees own reports" on public.reports for select to authenticated using(reporter_id=auth.uid());
create policy "preferences private" on public.notification_preferences for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "relationship privacy" on public.relationship_status for select to authenticated using(user_id=auth.uid() or (visibility='members' and not public.is_blocked_between(auth.uid(),user_id)) or (visibility='followers' and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.followed_id=user_id)));
create policy "relationship owner edit" on public.relationship_status for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "consent private" on public.consent_records for select to authenticated using(user_id=auth.uid());
create policy "consent own write" on public.consent_records for insert to authenticated with check(user_id=auth.uid());
-- Admin role/audit tables are intentionally inaccessible from member clients. Add hardened admin RPCs after role provisioning.
