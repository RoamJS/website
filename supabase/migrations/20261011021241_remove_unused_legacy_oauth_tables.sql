-- Owner approved removal after a verified private backup and rollback-only restore test.
-- RESTRICT stops this migration if another database object depends on either table.
DROP TABLE IF EXISTS public.oauth_clients RESTRICT;
DROP TABLE IF EXISTS public.apps RESTRICT;
