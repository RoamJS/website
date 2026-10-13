CREATE FUNCTION public.release_failed_newsletter_delivery(p_request_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF p_request_id IS NULL THEN RETURN false; END IF;

  UPDATE private.newsletter_subscriptions
  SET requested_at = LEAST(requested_at, now() - interval '61 seconds')
  WHERE request_id = p_request_id AND status = 'pending';

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.release_failed_newsletter_delivery(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_failed_newsletter_delivery(uuid) TO service_role;
