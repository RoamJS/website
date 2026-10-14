-- An insert trigger queues one notice per new suggestion in the same transaction.
-- Existing suggestions are intentionally not backfilled.
create table private.suggestion_notification_outbox (
 suggestion_id uuid primary key references private.suggestions(id) on delete cascade,
 created_at timestamptz not null default now(),
 state text not null default 'pending' check (state in ('pending','sent','failed','skipped')),
 attempts integer not null default 0 check (attempts between 0 and 5),
 first_attempt_at timestamptz,
 next_attempt_at timestamptz not null default now(),
 lease_token uuid,
 lease_expires_at timestamptz,
 provider_id text,
 completed_at timestamptz
);
alter table private.suggestion_notification_outbox enable row level security;
revoke all on private.suggestion_notification_outbox from public, anon, authenticated;
grant usage on schema private to service_role;
create index suggestion_notification_due on private.suggestion_notification_outbox (next_attempt_at, created_at)
 where state = 'pending';

create function private.queue_suggestion_notification() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into private.suggestion_notification_outbox (suggestion_id) values (new.id);
 return new;
end;
$$;
revoke all on function private.queue_suggestion_notification() from public, anon, authenticated;
create trigger queue_suggestion_notification after insert on private.suggestions
 for each row execute function private.queue_suggestion_notification();

create function private.claim_suggestion_notification(p_suggestion_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare claimed record; claimed_token uuid;
begin
 -- A worker may stop after claiming its fifth attempt. Retire expired leases
 -- before selecting work so one exhausted row cannot block the whole queue.
 with expired as (
   select suggestion_id from private.suggestion_notification_outbox
   where state = 'pending' and attempts >= 5
     and (lease_expires_at is null or lease_expires_at < now())
     and (p_suggestion_id is null or suggestion_id = p_suggestion_id)
   order by created_at for update skip locked limit 64
 )
 update private.suggestion_notification_outbox
 set state = 'failed', completed_at = now(), lease_token = null, lease_expires_at = null
 where suggestion_id in (select suggestion_id from expired);
 select o.suggestion_id, o.created_at, s.plugin_slug into claimed
 from private.suggestion_notification_outbox o
 join private.suggestions s on s.id = o.suggestion_id
 where o.state = 'pending' and o.attempts < 5 and o.next_attempt_at <= now()
   and (o.lease_expires_at is null or o.lease_expires_at < now())
   and (p_suggestion_id is null or o.suggestion_id = p_suggestion_id)
 order by o.next_attempt_at, o.created_at
 for update of o skip locked limit 1;
 if not found then return null; end if;
 update private.suggestion_notification_outbox
 set attempts = attempts + 1, first_attempt_at = coalesce(first_attempt_at, now()),
     lease_token = gen_random_uuid(),
     lease_expires_at = now() + interval '2 minutes'
 where suggestion_id = claimed.suggestion_id
 returning lease_token into claimed_token;
 return jsonb_build_object('suggestion_id', claimed.suggestion_id,
   'created_at', claimed.created_at, 'plugin_slug', claimed.plugin_slug,
   'first_attempt_at', (select first_attempt_at from private.suggestion_notification_outbox
                        where suggestion_id = claimed.suggestion_id),
   'lease_token', claimed_token,
   'attempts', (select attempts from private.suggestion_notification_outbox
                where suggestion_id = claimed.suggestion_id));
end;
$$;
revoke all on function private.claim_suggestion_notification(uuid) from public, anon, authenticated;
grant execute on function private.claim_suggestion_notification(uuid) to service_role;
create function public.claim_suggestion_notification(p_suggestion_id uuid default null)
returns jsonb language sql security invoker set search_path = '' as $$
 select private.claim_suggestion_notification(p_suggestion_id);
$$;
revoke all on function public.claim_suggestion_notification(uuid) from public, anon, authenticated;
grant execute on function public.claim_suggestion_notification(uuid) to service_role;

create function private.finish_suggestion_notification(
 p_suggestion_id uuid, p_lease_token uuid, p_outcome text, p_provider_id text default null
) returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
 if p_outcome not in ('sent','retry','failed','skipped') or p_lease_token is null
   or (p_provider_id is not null and char_length(p_provider_id) > 200) then
   raise exception using errcode = 'RW400', message = 'Invalid notification result';
 end if;
 update private.suggestion_notification_outbox
 set state = case when p_outcome = 'retry' and attempts < 5
                   and first_attempt_at > now() - interval '20 hours' then 'pending'
                  when p_outcome = 'retry' then 'failed'
                  else p_outcome end,
     next_attempt_at = case when p_outcome = 'retry' then
       now() + least(interval '4 hours', interval '2 minutes' * power(2, attempts - 1))
       else next_attempt_at end,
     provider_id = case when p_outcome = 'sent' then p_provider_id else provider_id end,
     completed_at = case when p_outcome in ('sent','failed','skipped') or
       (p_outcome = 'retry' and (attempts >= 5 or first_attempt_at <= now() - interval '20 hours'))
       then now() else null end,
     lease_token = null, lease_expires_at = null
 where suggestion_id = p_suggestion_id and lease_token = p_lease_token and state = 'pending';
 get diagnostics changed = row_count;
 return changed = 1;
end;
$$;
revoke all on function private.finish_suggestion_notification(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function private.finish_suggestion_notification(uuid,uuid,text,text) to service_role;
create function public.finish_suggestion_notification(
 p_suggestion_id uuid, p_lease_token uuid, p_outcome text, p_provider_id text default null
) returns boolean language sql security invoker set search_path = '' as $$
 select private.finish_suggestion_notification(p_suggestion_id,p_lease_token,p_outcome,p_provider_id);
$$;
revoke all on function public.finish_suggestion_notification(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.finish_suggestion_notification(uuid,uuid,text,text) to service_role;
