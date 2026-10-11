CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE private.newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND length(email) <= 254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  status text NOT NULL CHECK (status IN ('pending', 'subscribed', 'unsubscribed')),
  confirmation_hash text UNIQUE CHECK (confirmation_hash ~ '^[a-f0-9]{64}$'),
  confirmation_expires_at timestamptz,
  request_id uuid,
  requested_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  consent_version text NOT NULL DEFAULT 'roamjs-updates-v1'
);
CREATE TABLE private.newsletter_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES private.newsletter_subscriptions(id),
  choice text NOT NULL CHECK (choice IN ('requested', 'confirmed', 'unsubscribed')),
  consent_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX newsletter_events_subscription ON private.newsletter_consent_events(subscription_id);
CREATE TABLE private.newsletter_request_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  PRIMARY KEY (key, window_start)
);
ALTER TABLE private.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.newsletter_consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.newsletter_request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.newsletter_subscriptions, private.newsletter_consent_events, private.newsletter_request_limits FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT SELECT, INSERT, UPDATE ON private.newsletter_subscriptions, private.newsletter_request_limits TO service_role;
GRANT SELECT, INSERT ON private.newsletter_consent_events TO service_role;

CREATE FUNCTION private.consume_newsletter_limit(p_key text, p_max integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_attempts integer;
BEGIN
  INSERT INTO private.newsletter_request_limits(key, window_start, attempts)
  VALUES (p_key, date_trunc('hour', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC', 1)
  ON CONFLICT (key, window_start) DO UPDATE SET attempts = private.newsletter_request_limits.attempts + 1
  RETURNING attempts INTO v_attempts;
  IF v_attempts > p_max THEN RAISE EXCEPTION 'Too many newsletter requests' USING ERRCODE = 'NL429'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION private.consume_newsletter_limit(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.consume_newsletter_limit(text, integer) TO service_role;

CREATE FUNCTION public.request_newsletter_signup(p_email text, p_token_hash text, p_request_id uuid, p_client_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_row private.newsletter_subscriptions; v_email text := lower(btrim(p_email));
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' OR p_client_hash IS NULL OR p_client_hash !~ '^[a-f0-9]{64}$' OR p_request_id IS NULL OR v_email IS NULL OR length(v_email) > 254 OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Invalid newsletter request' USING ERRCODE = 'NL400';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_email, 0));
  PERFORM private.consume_newsletter_limit('client:' || p_client_hash, 20);
  PERFORM private.consume_newsletter_limit('email:' || v_email, 3);
  SELECT * INTO v_row FROM private.newsletter_subscriptions WHERE email = v_email FOR UPDATE;
  IF FOUND AND (v_row.status = 'subscribed' OR (v_row.status = 'pending' AND v_row.requested_at > now() - interval '60 seconds')) THEN
    RETURN jsonb_build_object('send', false);
  END IF;
  INSERT INTO private.newsletter_subscriptions(email, status, confirmation_hash, confirmation_expires_at, request_id, requested_at)
  VALUES (v_email, 'pending', p_token_hash, now() + interval '24 hours', p_request_id, now())
  ON CONFLICT (email) DO UPDATE SET status = 'pending', confirmation_hash = p_token_hash, confirmation_expires_at = now() + interval '24 hours', request_id = p_request_id, requested_at = now()
  RETURNING * INTO v_row;
  INSERT INTO private.newsletter_consent_events(subscription_id, choice, consent_version) VALUES (v_row.id, 'requested', v_row.consent_version);
  RETURN jsonb_build_object('send', true);
END;
$$;

CREATE FUNCTION public.confirm_newsletter_signup(p_token_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_row private.newsletter_subscriptions;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
  SELECT * INTO v_row FROM private.newsletter_subscriptions WHERE confirmation_hash = p_token_hash FOR UPDATE;
  IF NOT FOUND OR v_row.status = 'unsubscribed' OR v_row.confirmation_expires_at <= now() THEN RETURN NULL; END IF;
  IF v_row.status = 'pending' THEN
    UPDATE private.newsletter_subscriptions SET status = 'subscribed', confirmed_at = now(), unsubscribed_at = NULL WHERE id = v_row.id;
    INSERT INTO private.newsletter_consent_events(subscription_id, choice, consent_version) VALUES (v_row.id, 'confirmed', v_row.consent_version);
  END IF;
  RETURN jsonb_build_object('id', v_row.id);
END;
$$;

CREATE FUNCTION public.unsubscribe_newsletter(p_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_row private.newsletter_subscriptions;
BEGIN
  SELECT * INTO v_row FROM private.newsletter_subscriptions WHERE id = p_id FOR UPDATE;
  IF FOUND AND v_row.status <> 'unsubscribed' THEN
    UPDATE private.newsletter_subscriptions SET status = 'unsubscribed', unsubscribed_at = now(), confirmation_hash = NULL, confirmation_expires_at = NULL WHERE id = p_id;
    INSERT INTO private.newsletter_consent_events(subscription_id, choice, consent_version) VALUES (v_row.id, 'unsubscribed', v_row.consent_version);
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.request_newsletter_signup(text, text, uuid, text), public.confirm_newsletter_signup(text), public.unsubscribe_newsletter(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_newsletter_signup(text, text, uuid, text), public.confirm_newsletter_signup(text), public.unsubscribe_newsletter(uuid) TO service_role;
