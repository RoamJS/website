-- Transactional fixtures: no emails, lasting users, owner grants, or suggestions.
begin;
create temporary table inbox_fixture (owner_id uuid, reader_id uuid, suggestion_id uuid);
insert into inbox_fixture values (gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
insert into auth.users (id,email,email_confirmed_at,is_anonymous)
select owner_id,'rjs03-owner-'||owner_id||'@example.invalid',now(),false from inbox_fixture
union all select reader_id,'rjs03-reader-'||reader_id||'@example.invalid',now(),false from inbox_fixture;
insert into private.website_owners select email from auth.users where id=(select owner_id from inbox_fixture);
insert into private.suggestions(id,request_id,user_id,email,title,body)
select suggestion_id,gen_random_uuid(),reader_id,'rjs03-reader-'||reader_id||'@example.invalid','RJS03 transactional fixture','Private body for security testing.' from inbox_fixture;
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from inbox_fixture;
set local role authenticated;
do $$
declare rows jsonb; receipt jsonb; sid uuid;
begin
 rows:=public.list_suggestion_inbox(null,'RJS03 transactional fixture',0);
 if jsonb_array_length(rows->'items') <> 1 then raise exception 'Owner cannot retrieve fixture'; end if;
 sid:=(rows->'items'->0->>'id')::uuid;
 receipt:=public.update_suggestion_review(sid,1,'reviewing','Checking this idea',false);
 if receipt->>'version' <> '2' or receipt->>'followed_up_at' is not null then raise exception 'Review incorrectly records contact'; end if;
 receipt:=public.update_suggestion_review(sid,2,'completed','Replied manually',true);
 if public.get_suggestion_review(sid) <> receipt then raise exception 'Current review mismatch'; end if;
 begin perform public.get_suggestion_review(gen_random_uuid()); raise exception 'Missing row accepted'; exception when sqlstate 'RW404' then null; end;
 if receipt->>'followed_up_at' is null then raise exception 'Contact timestamp not recorded'; end if;
 begin perform public.update_suggestion_review(sid,2,'planned','stale',false); raise exception 'Stale write accepted'; exception when sqlstate 'RW409' then null; end;
 begin perform public.update_suggestion_review(sid,3,'invalid','',false); raise exception 'Invalid status accepted'; exception when sqlstate 'RW400' then null; end;
 begin perform public.update_suggestion_review(sid,3,'new',repeat('x',2001),false); raise exception 'Oversized note accepted'; exception when sqlstate 'RW400' then null; end;
 begin perform public.list_suggestion_inbox(null,'',-1); raise exception 'Invalid page accepted'; exception when sqlstate 'RW400' then null; end;
 begin perform 1 from private.suggestions; raise exception 'Direct table access allowed'; exception when insufficient_privilege then null; end;
 begin insert into private.website_owners values ('attacker@example.invalid'); raise exception 'Self-promotion allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',reader_id,'role','authenticated','user_metadata',jsonb_build_object('owner',true,'email','owner@example.invalid'))::text,true) from inbox_fixture;
set local role authenticated;
do $$ begin
 begin perform public.get_suggestion_review(gen_random_uuid()); raise exception 'Nonowner can read review'; exception when sqlstate 'RW403' then null; end;
 begin perform public.list_suggestion_inbox(null,'',0); raise exception 'Nonowner can list'; exception when sqlstate 'RW403' then null; end;
 begin perform public.update_suggestion_review(gen_random_uuid(),1,'new','',false); raise exception 'Nonowner can update'; exception when sqlstate 'RW403' then null; end;
end $$;
reset role;
update auth.users set email_confirmed_at=null where id=(select owner_id from inbox_fixture);
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from inbox_fixture;
set local role authenticated;
do $$ begin
 begin perform public.get_suggestion_review(gen_random_uuid()); raise exception 'Unverified owner can read review'; exception when sqlstate 'RW403' then null; end;
 begin perform public.list_suggestion_inbox(null,'',0); raise exception 'Unverified owner can list'; exception when sqlstate 'RW403' then null; end;
end $$;
reset role;
update auth.users set email_confirmed_at=now(),is_anonymous=true where id=(select owner_id from inbox_fixture);
set local role authenticated;
do $$ begin
 begin perform public.get_suggestion_review(gen_random_uuid()); raise exception 'Anonymous owner can read review'; exception when sqlstate 'RW403' then null; end;
 begin perform public.list_suggestion_inbox(null,'',0); raise exception 'Anonymous owner can list'; exception when sqlstate 'RW403' then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.get_suggestion_review(gen_random_uuid()); raise exception 'Anon review RPC granted'; exception when insufficient_privilege then null; end;
 begin perform public.list_suggestion_inbox(null,'',0); raise exception 'Anon RPC granted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: owner read/update, manual contact, stale edits, validation, direct access denial, self-promotion denial, nonowner/unverified/anonymous denial; fixtures rolled back' as verification;
