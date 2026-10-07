-- PostgREST's caller-selected timezone must not reset the shared hourly budget.
alter function private.consume_community_rate_limit() set timezone = 'UTC';
