import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { InboxDraftProvider } from "@/components/inbox-drafts";
import { SuggestionInbox } from "@/components/suggestion-inbox";
import { FixtureAuthContext } from "./auth";
import Link from "./link";
const Surface = (): React.JSX.Element => {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const update = (): void => setPath(location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return (
    <>
      <nav>
        <Link href="/home">Home</Link>{" "}
        <Link href="/admin/suggestions">Inbox</Link>
      </nav>
      <main>
        {path === "/admin/suggestions" ? (
          <SuggestionInbox />
        ) : (
          <h1>Home fixture</h1>
        )}
      </main>
    </>
  );
};
const Fixture = (): React.JSX.Element => {
  const [user, setUser] = useState<{ id: string } | null>({
    id: "fixture-owner",
  });
  return (
    <FixtureAuthContext.Provider
      value={{ user, isLoaded: true, enabled: true }}
    >
      <button onClick={() => setUser(user ? null : { id: "fixture-owner" })}>
        {user ? "Sign out fixture" : "Sign in fixture"}
      </button>
      <InboxDraftProvider>
        <Surface />
      </InboxDraftProvider>
    </FixtureAuthContext.Provider>
  );
};
createRoot(document.getElementById("root")!).render(<Fixture />);
