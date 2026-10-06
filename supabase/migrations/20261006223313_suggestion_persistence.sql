-- Suggestion data is deliberately outside the exposed public schema.
create schema if not exists private;
grant usage on schema private to authenticated;
create table private.website_plugins (slug text primary key);
insert into private.website_plugins (slug) values
 ('smartblocks'),
 ('query-builder'),
 ('workbench'),
 ('autotag'),
 ('todo-trigger'),
 ('google'),
 ('dropbox'),
 ('presentation'),
 ('otter'),
 ('mapbox'),
 ('slack'),
 ('hypothesis'),
 ('giphy'),
 ('breadcrumbs'),
 ('oura-ring'),
 ('stats'),
 ('tldraw'),
 ('sticky-notes'),
 ('custom-dark-mode'),
 ('quick-switcher'),
 ('pinned-blocks'),
 ('developer');
create table private.suggestions (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null,
 user_id uuid not null,
 email text not null,
 plugin_slug text references private.website_plugins(slug),
 title text not null check (char_length(title) between 5 and 140),
 body text not null check (char_length(body) between 20 and 5000),
 created_at timestamptz not null default now(),
 unique (user_id, request_id)
);
create table private.community_rate_limits (
 user_id uuid primary key,
 window_start timestamptz not null,
 attempts integer not null check (attempts between 1 and 10)
);
alter table private.website_plugins enable row level security;
alter table private.suggestions enable row level security;
alter table private.community_rate_limits enable row level security;
revoke all on private.website_plugins, private.suggestions, private.community_rate_limits from public, anon, authenticated;

-- Privilege is limited to deriving the current verified identity and atomic writes.
create function private.community_email() returns text
language plpgsql security definer set search_path = '' as $$
declare verified_email text;
begin
 select email into verified_email from auth.users
 where id = auth.uid() and email_confirmed_at is not null
 and not coalesce(is_anonymous, false);
 if verified_email is null then
   raise exception using errcode = 'RW403', message = 'Verified email required';
 end if;
 return verified_email;
end;
$$;
revoke all on function private.community_email() from public, anon, authenticated;

create function private.consume_community_rate_limit() returns boolean
language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
 perform private.community_email();
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 0));
 insert into private.community_rate_limits (user_id, window_start, attempts)
 values (auth.uid(), date_trunc('hour', now()), 1)
 on conflict (user_id) do update set window_start = excluded.window_start,
 attempts = case when community_rate_limits.window_start < excluded.window_start
 then 1 else community_rate_limits.attempts + 1 end
 where community_rate_limits.window_start < excluded.window_start
 or community_rate_limits.attempts < 10 returning true into allowed;
 return coalesce(allowed, false);
end;
$$;
revoke all on function private.consume_community_rate_limit() from public, anon;
grant execute on function private.consume_community_rate_limit() to authenticated;
create function public.consume_community_rate_limit() returns boolean
language sql security invoker set search_path = '' as $$
 select private.consume_community_rate_limit();
$$;
revoke all on function public.consume_community_rate_limit() from public, anon;
grant execute on function public.consume_community_rate_limit() to authenticated;

create function private.submit_suggestion(p_request_id uuid, p_plugin_slug text, p_title text, p_body text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare verified_email text; saved private.suggestions%rowtype;
begin
 verified_email := private.community_email();
 if p_request_id is null or p_title is null or p_body is null
 or char_length(p_title) not between 5 and 140
 or char_length(p_body) not between 20 and 5000
 or p_title <> btrim(p_title) or p_body <> btrim(p_body)
 or (p_plugin_slug is not null and not exists (
 select 1 from private.website_plugins where slug = p_plugin_slug)) then
   raise exception using errcode = 'RW400', message = 'Invalid suggestion';
 end if;
 -- Serialize retries and the shared hourly budget for this account.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 0));
 select * into saved from private.suggestions
 where user_id = auth.uid() and request_id = p_request_id;
 if found then
   if saved.plugin_slug is distinct from p_plugin_slug
   or saved.title <> p_title or saved.body <> p_body then
     raise exception using errcode = 'RW409', message = 'Request already used';
   end if;
   return jsonb_build_object('id', saved.id, 'duplicate', true);
 end if;
 if not private.consume_community_rate_limit() then
   raise exception using errcode = 'RW429', message = 'Hourly limit reached';
 end if;
 insert into private.suggestions (request_id, user_id, email, plugin_slug, title, body)
 values (p_request_id, auth.uid(), verified_email, p_plugin_slug, p_title, p_body)
 returning * into saved;
 return jsonb_build_object('id', saved.id, 'duplicate', false);
end;
$$;
revoke all on function private.submit_suggestion(uuid, text, text, text) from public, anon;
grant execute on function private.submit_suggestion(uuid, text, text, text) to authenticated;
create function public.submit_suggestion(p_request_id uuid, p_plugin_slug text, p_title text, p_body text)
returns jsonb language sql security invoker set search_path = '' as $$
 select private.submit_suggestion(p_request_id, p_plugin_slug, p_title, p_body);
$$;
revoke all on function public.submit_suggestion(uuid, text, text, text) from public, anon;
grant execute on function public.submit_suggestion(uuid, text, text, text) to authenticated;
