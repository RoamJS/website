"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
type AuthState = { user: User | null; isLoaded: boolean; enabled: boolean };
const AuthContext = createContext<AuthState>({
  user: null,
  isLoaded: true,
  enabled: false,
});
export const useAuth = (): AuthState => useContext(AuthContext);
export const AuthProvider = ({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}): React.JSX.Element => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoaded: !enabled,
    enabled,
  });
  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    let active = true;
    let eventReceived = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Cached initialization must not override the fresh getUser check.
      if (event === "INITIAL_SESSION") return;
      eventReceived = true;
      if (active)
        setState({ user: session?.user ?? null, isLoaded: true, enabled });
    });
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active && !eventReceived)
          setState({ user: data.user, isLoaded: true, enabled });
      })
      .catch(() => {
        if (active && !eventReceived)
          setState({ user: null, isLoaded: true, enabled });
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [enabled]);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};
