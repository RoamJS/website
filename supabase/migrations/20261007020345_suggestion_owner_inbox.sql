-- The owner allowlist is administered privately, never through the website.
create table private.website_owners (
 email text primary key check (email = lower(email) and email <> '')
);
alter table private.website_owners enable row level security;
revoke all on private.website_owners from public, anon, authenticated;

alter table private.suggestions
 add column status text not null default 'new' check (status in ('new','reviewing','planned','completed')),
 add column follow_up_note text not null default '' check (char_length(follow_up_note) <= 2000),
 add column followed_up_at timestamptz,
 add column updated_at timestamptz not null default now(),
 add column version integer not null default 1;
create index suggestions_inbox_order on private.suggestions (created_at desc, id desc);

-- Resolve the current verified email from auth.users, never editable JWT metadata.
create function private.require_website_owner() returns void
language plpgsql security definer set search_path = '' as $$
declare owner_email text;
begin
 owner_email := private.community_email();
 if not exists (select 1 from private.website_owners where email = lower(owner_email)) then
   raise exception using errcode = 'RW403', message = 'Owner access required';
 end if;
end;
$$;
revoke all on function private.require_website_owner() from public, anon, authenticated;

create function private.list_suggestion_inbox(p_status text, p_search text, p_page integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 perform private.require_website_owner();
 if p_page is null or p_page < 0 or p_page > 100000 or p_search is null or char_length(p_search) > 200
 or (p_status is not null and p_status not in ('new','reviewing','planned','completed')) then
   raise exception using errcode = 'RW400', message = 'Invalid filter';
 end if;
 select jsonb_build_object('items', coalesce(jsonb_agg(to_jsonb(rows)), '[]'::jsonb)) into result
 from (
   select id, email, plugin_slug, title, body, created_at, status, follow_up_note, followed_up_at, updated_at, version
   from private.suggestions
   where (p_status is null or status = p_status)
   and (p_search = '' or strpos(lower(title || ' ' || body || ' ' || email || ' ' || coalesce(plugin_slug,'')), lower(p_search)) > 0)
   order by created_at desc, id desc limit 26 offset (p_page * 25)
 ) rows;
 return result;
end;
$$;
revoke all on function private.list_suggestion_inbox(text,text,integer) from public, anon;
grant execute on function private.list_suggestion_inbox(text,text,integer) to authenticated;
create function public.list_suggestion_inbox(p_status text default null, p_search text default '', p_page integer default 0)
returns jsonb language sql security invoker set search_path = '' as $$
 select private.list_suggestion_inbox(p_status,p_search,p_page);
$$;
revoke all on function public.list_suggestion_inbox(text,text,integer) from public, anon;
grant execute on function public.list_suggestion_inbox(text,text,integer) to authenticated;

create function private.update_suggestion_review(p_id uuid, p_version integer, p_status text, p_note text, p_record_follow_up boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare saved private.suggestions%rowtype;
begin
 perform private.require_website_owner();
 if p_id is null or p_version is null or p_version < 1 or p_status is null
 or p_status not in ('new','reviewing','planned','completed') or p_note is null
 or char_length(p_note) > 2000 or p_record_follow_up is null then
   raise exception using errcode = 'RW400', message = 'Invalid review';
 end if;
 select * into saved from private.suggestions where id = p_id for update;
 if not found then raise exception using errcode = 'RW404', message = 'Suggestion not found'; end if;
 if saved.version <> p_version then
   raise exception using errcode = 'RW409', message = 'Suggestion changed; reload before saving';
 end if;
 update private.suggestions set status = p_status, follow_up_note = p_note,
 followed_up_at = case when p_record_follow_up then now() else followed_up_at end,
 updated_at = now(), version = version + 1 where id = p_id returning * into saved;
 return jsonb_build_object('id', saved.id, 'status', saved.status, 'follow_up_note', saved.follow_up_note,
 'followed_up_at', saved.followed_up_at, 'updated_at', saved.updated_at, 'version', saved.version);
end;
$$;
revoke all on function private.update_suggestion_review(uuid,integer,text,text,boolean) from public, anon;
grant execute on function private.update_suggestion_review(uuid,integer,text,text,boolean) to authenticated;
create function public.update_suggestion_review(p_id uuid, p_version integer, p_status text, p_note text, p_record_follow_up boolean)
returns jsonb language sql security invoker set search_path = '' as $$
 select private.update_suggestion_review(p_id,p_version,p_status,p_note,p_record_follow_up);
$$;
revoke all on function public.update_suggestion_review(uuid,integer,text,text,boolean) from public, anon;
grant execute on function public.update_suggestion_review(uuid,integer,text,text,boolean) to authenticated;
