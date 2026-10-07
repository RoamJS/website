-- Fetch one current review for explicit stale-edit reconciliation.
create function private.get_suggestion_review(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 perform private.require_website_owner();
 if p_id is null then raise exception using errcode = 'RW400', message = 'Invalid suggestion'; end if;
 select jsonb_build_object('id', id, 'status', status, 'follow_up_note', follow_up_note,
 'followed_up_at', followed_up_at, 'updated_at', updated_at, 'version', version)
 into result from private.suggestions where id = p_id;
 if result is null then raise exception using errcode = 'RW404', message = 'Suggestion not found'; end if;
 return result;
end;
$$;
revoke all on function private.get_suggestion_review(uuid) from public, anon;
grant execute on function private.get_suggestion_review(uuid) to authenticated;
create function public.get_suggestion_review(p_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
 select private.get_suggestion_review(p_id);
$$;
revoke all on function public.get_suggestion_review(uuid) from public, anon;
grant execute on function public.get_suggestion_review(uuid) to authenticated;
