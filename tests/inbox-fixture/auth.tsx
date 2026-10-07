import { createContext, useContext } from "react";
type FixtureAuth = {
  user: { id: string } | null;
  isLoaded: boolean;
  enabled: boolean;
};
export const FixtureAuthContext = createContext<FixtureAuth>({
  user: { id: "fixture-owner" },
  isLoaded: true,
  enabled: true,
});
export const useAuth = (): FixtureAuth => useContext(FixtureAuthContext);
