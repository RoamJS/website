// This fixed destination hint never grants access or accepts a caller-provided URL.
export const INBOX_RETURN_COOKIE = "roamjs-inbox-return";
export const INBOX_RETURN_COOKIE_PATH = "/auth/callback";
export const setInboxReturnHint = (returnToInbox: boolean): void => {
  document.cookie = `${INBOX_RETURN_COOKIE}=${returnToInbox ? "1" : ""}; Path=${INBOX_RETURN_COOKIE_PATH}; Max-Age=${returnToInbox ? 3600 : 0}; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
};
