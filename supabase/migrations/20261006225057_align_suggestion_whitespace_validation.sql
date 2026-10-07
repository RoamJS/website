-- Match JavaScript String.trim() rather than PostgreSQL's ASCII-space-only default.
create function private.is_trimmed_suggestion_text(value text) returns boolean
language sql immutable security invoker set search_path = '' as $$
 select value = btrim(value, U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff');
$$;
revoke all on function private.is_trimmed_suggestion_text(text) from public, anon, authenticated;

create or replace function private.submit_suggestion(p_request_id uuid, p_plugin_slug text, p_title text, p_body text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare verified_email text; saved private.suggestions%rowtype;
begin
 verified_email := private.community_email();
 if p_request_id is null or p_title is null or p_body is null
 or char_length(p_title) not between 5 and 140
 or char_length(p_body) not between 20 and 5000
 or not private.is_trimmed_suggestion_text(p_title) or not private.is_trimmed_suggestion_text(p_body)
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
