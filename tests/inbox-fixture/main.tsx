import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { InboxDraftProvider } from "@/components/inbox-drafts";
import { SuggestionInbox } from "@/components/suggestion-inbox";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { AccountForm } from "@/components/account-form";
import { setFixtureUser, fixtureOwner } from "./supabase";
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
        ) : path === "/account" ? (
          <AccountForm />
        ) : (
          <h1>Home fixture</h1>
        )}
      </main>
    </>
  );
};
const FixtureControls = (): React.JSX.Element => {
  const { user } = useAuth();
  return (
    <button onClick={() => setFixtureUser(user ? null : fixtureOwner)}>
      {user ? "Sign out fixture" : "Sign in fixture"}
    </button>
  );
};
const Fixture = (): React.JSX.Element => (
  <AuthProvider enabled>
    <FixtureControls />
    <InboxDraftProvider>
      <Surface />
    </InboxDraftProvider>
  </AuthProvider>
);
createRoot(document.getElementById("root")!).render(<Fixture />);
