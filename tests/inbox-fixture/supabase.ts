import type { User } from "@supabase/supabase-js";
export const fixtureOwner: User = {
  id: "fixture-owner",
  email: "owner@example.invalid",
  email_confirmed_at: "2026-10-06T00:00:00Z",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-06T00:00:00Z",
};
let user: User | null = fixtureOwner;
type Listener = (event: string, session: { user: User } | null) => void;
const listeners = new Set<Listener>();
export const setFixtureUser = (next: User | null): void => {
  user = next;
  for (const listener of listeners)
    listener(next ? "SIGNED_IN" : "SIGNED_OUT", next ? { user: next } : null);
};
export const createClient = () => ({
  auth: {
    onAuthStateChange: (listener: Listener) => {
      listeners.add(listener);
      return {
        data: {
          subscription: { unsubscribe: () => listeners.delete(listener) },
        },
      };
    },
    getUser: async () => {
      sessionStorage.setItem(
        "fixture-auth-checks",
        String(Number(sessionStorage.getItem("fixture-auth-checks")) + 1),
      );
      if (sessionStorage.getItem("fixture-session-expired")) user = null;
      return { data: { user }, error: null };
    },
    signInWithOtp: async () => ({ error: null }),
    verifyOtp: async () => {
      sessionStorage.removeItem("fixture-session-expired");
      setFixtureUser(fixtureOwner);
      return { error: null };
    },
    signOut: async () => {
      setFixtureUser(null);
      return { error: null };
    },
  },
});
