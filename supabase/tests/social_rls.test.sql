begin;
create extension if not exists pgtap with schema extensions;
select plan(13);
create temp table rls_test_results (result text);
grant insert on rls_test_results to authenticated, anon;

-- Fixed synthetic identities; the entire test is rolled back by pg_prove.
insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-000000000001', 'rls-student-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'rls-student-b@example.invalid'),
  ('10000000-0000-4000-8000-000000000003', 'rls-student-c@example.invalid');

update public.profiles set username = 'rls_student_a', visibility = 'private'
where id = '10000000-0000-4000-8000-000000000001';
update public.profiles set username = 'rls_student_b', visibility = 'private'
where id = '10000000-0000-4000-8000-000000000002';
update public.profiles set username = 'rls_student_c', visibility = 'private'
where id = '10000000-0000-4000-8000-000000000003';

insert into public.posts (id, author_id, body, visibility) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'private test post', 'followers');
insert into public.conversations (id) values
  ('30000000-0000-4000-8000-000000000001');
insert into public.conversation_members (conversation_id, user_id) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003');
insert into public.messages (id, conversation_id, sender_id, body) values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'message visible to members');

-- Student A: own data and conversation access work; private content stays private.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
insert into rls_test_results select is((select count(*)::integer from public.profiles where id = auth.uid()), 1, 'student can read own profile');
insert into rls_test_results select is((select count(*)::integer from public.messages where conversation_id = '30000000-0000-4000-8000-000000000001'), 1, 'conversation member can read messages');
insert into rls_test_results select lives_ok($$insert into public.messages (conversation_id, sender_id, body) values ('30000000-0000-4000-8000-000000000001', auth.uid(), 'member send')$$, 'conversation member can send message');
insert into rls_test_results select is((select count(*)::integer from public.posts where id = '20000000-0000-4000-8000-000000000001'), 1, 'post author can read followers-only post');
insert into rls_test_results select throws_ok($$insert into public.admin_roles (user_id, role) values (auth.uid(), 'admin')$$, '42501', 'permission denied for table admin_roles', 'student cannot grant admin role');

-- Student B is not in A/C's conversation and has no accepted follow relationship.
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
insert into rls_test_results select is((select count(*)::integer from public.profiles where id = '10000000-0000-4000-8000-000000000001'), 0, 'student cannot read another private profile');
insert into rls_test_results select is((select count(*)::integer from public.posts where id = '20000000-0000-4000-8000-000000000001'), 0, 'student cannot read another followers-only post');
insert into rls_test_results select is((select count(*)::integer from public.conversations where id = '30000000-0000-4000-8000-000000000001'), 0, 'nonmember cannot read conversation');
insert into rls_test_results select is((select count(*)::integer from public.messages where conversation_id = '30000000-0000-4000-8000-000000000001'), 0, 'nonmember cannot read messages');
insert into rls_test_results select throws_ok($$insert into public.messages (conversation_id, sender_id, body) values ('30000000-0000-4000-8000-000000000001', auth.uid(), 'unauthorized send')$$, '42501', 'new row violates row-level security policy for table "messages"', 'nonmember cannot send message');
insert into rls_test_results select throws_ok($$select * from public.admin_roles$$, '42501', 'permission denied for table admin_roles', 'student cannot enumerate admin roles');

-- An unauthenticated request must not read protected data or create messages.
set local role anon;
set local request.jwt.claim.sub = '';
insert into rls_test_results select throws_ok($$select * from public.profiles$$, '42501', 'permission denied for table profiles', 'anonymous request cannot read profiles');
insert into rls_test_results select throws_ok($$insert into public.messages (conversation_id, sender_id, body) values ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'anonymous send')$$, '42501', 'permission denied for table messages', 'anonymous request cannot write messages');

reset role;
select result from rls_test_results union all select * from finish();
rollback;
