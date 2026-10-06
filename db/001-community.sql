CREATE TABLE IF NOT EXISTS suggestions (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id uuid NOT NULL,
 user_id text NOT NULL,
 email text NOT NULL,
 plugin_slug text,
 title text NOT NULL CHECK (length(title) BETWEEN 5 AND 140),
 body text NOT NULL CHECK (length(body) BETWEEN 20 AND 5000),
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','planned','complete','declined')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (user_id, request_id)
);
CREATE TABLE IF NOT EXISTS subscriptions (
 user_id text PRIMARY KEY,
 email text NOT NULL,
 subscribed boolean NOT NULL,
 consent_version text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS community_rate_limits (
 user_id text PRIMARY KEY,
 window_start timestamptz NOT NULL,
 attempts integer NOT NULL
);
CREATE INDEX IF NOT EXISTS suggestions_status_created ON suggestions (status,created_at DESC);
