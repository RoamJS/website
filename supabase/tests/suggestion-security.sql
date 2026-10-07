-- Run with the authorized SQL connector. Everything is rolled back, including Auth fixtures.
begin;
do $$
declare
 test_user uuid := gen_random_uuid();
 request_id uuid := gen_random_uuid();
 saved jsonb;
 retried jsonb;
 budget integer;
begin
 insert into auth.users (id, email, email_confirmed_at, is_anonymous)
 values (test_user, 'rjs02-sql-' || test_user::text || '@example.invalid', now(), false);
 perform set_config('request.jwt.claims', jsonb_build_object('sub', test_user, 'role', 'authenticated')::text, true);
 perform set_config('TimeZone', 'UTC', true);
 for attempt in 1..10 loop
   if not private.consume_community_rate_limit() then raise exception 'Early quota rejection'; end if;
 end loop;
 perform set_config('TimeZone', 'Asia/Kathmandu', true);
 if private.consume_community_rate_limit() then raise exception 'Caller timezone bypassed quota'; end if;
 perform set_config('TimeZone', 'Asia/Kolkata', true);
 if private.consume_community_rate_limit() then raise exception 'Second timezone bypassed quota'; end if;
 update private.community_rate_limits set window_start = window_start - interval '1 hour' where user_id = test_user;
 if not private.consume_community_rate_limit() then raise exception 'Next hour did not reset quota'; end if;
 saved := public.submit_suggestion(request_id, null, 'ab👍cd', repeat('x',19) || '👍');
 retried := public.submit_suggestion(request_id, null, 'ab👍cd', repeat('x',19) || '👍');
 if saved->>'id' <> retried->>'id' or retried->>'duplicate' <> 'true' then raise exception 'Retry lost receipt'; end if;
 select attempts into budget from private.community_rate_limits where user_id = test_user;
 if budget <> 2 then raise exception 'Retry consumed quota'; end if;
 begin
   perform public.submit_suggestion(request_id, null, 'Different title', repeat('x',20));
   raise exception 'Changed payload reused receipt';
 exception when sqlstate 'RW409' then null;
 end;
 begin
   perform public.submit_suggestion(gen_random_uuid(), 'unknown-plugin', 'Valid title', repeat('x',20));
   raise exception 'Unknown plugin accepted';
 exception when sqlstate 'RW400' then null;
 end;
 begin
   perform public.submit_suggestion(gen_random_uuid(), null, repeat(chr(9),5), repeat('x',20));
   raise exception 'Whitespace-only title accepted';
 exception when sqlstate 'RW400' then null;
 end;
 begin
   perform public.submit_suggestion(gen_random_uuid(), null, 'Valid title', repeat(chr(65279),20));
   raise exception 'Unicode-whitespace-only body accepted';
 exception when sqlstate 'RW400' then null;
 end;
 update auth.users set email_confirmed_at = null where id = test_user;
 begin
   perform public.submit_suggestion(gen_random_uuid(), null, 'Valid title', repeat('x',20));
   raise exception 'Unverified email accepted';
 exception when sqlstate 'RW403' then null;
 end;
 if has_table_privilege('anon','private.suggestions','SELECT')
 or has_table_privilege('authenticated','private.suggestions','SELECT')
 or has_table_privilege('authenticated','private.suggestions','INSERT')
 or has_function_privilege('anon','public.submit_suggestion(uuid,text,text,text)','EXECUTE') then
   raise exception 'Suggestion privileges too broad';
 end if;
end;
$$;
rollback;
select 'PASS: timezone-independent quota, reset, Unicode, retry budget, conflict, plugin validation, unverified identity and private grants; fixtures rolled back' as verification;
