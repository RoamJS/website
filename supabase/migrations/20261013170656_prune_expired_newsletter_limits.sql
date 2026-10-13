CREATE INDEX newsletter_request_limits_window_start
ON private.newsletter_request_limits(window_start);

GRANT DELETE ON private.newsletter_request_limits TO service_role;

CREATE OR REPLACE FUNCTION private.consume_newsletter_limit(p_key text, p_max integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_attempts integer;
  v_window_start timestamptz := date_trunc('hour', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  DELETE FROM private.newsletter_request_limits AS limits
  USING (
    SELECT key, window_start
    FROM private.newsletter_request_limits
    WHERE window_start < v_window_start - interval '1 hour'
    ORDER BY window_start
    LIMIT 64
    FOR UPDATE SKIP LOCKED
  ) AS expired
  WHERE limits.key = expired.key AND limits.window_start = expired.window_start;

  INSERT INTO private.newsletter_request_limits(key, window_start, attempts)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start) DO UPDATE
  SET attempts = private.newsletter_request_limits.attempts + 1
  RETURNING attempts INTO v_attempts;

  IF v_attempts > p_max THEN
    RAISE EXCEPTION 'Too many newsletter requests' USING ERRCODE = 'NL429';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.consume_newsletter_limit(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.consume_newsletter_limit(text, integer) TO service_role;
