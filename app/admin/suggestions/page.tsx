import { redirect, notFound } from "next/navigation";
import { requireVerifiedIdentity } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { inboxSchema } from "@/lib/suggestion-inbox";
import { SuggestionInbox } from "@/components/suggestion-inbox";
export const metadata = {
  title: "Suggestion inbox",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
const Inbox = async (): Promise<React.JSX.Element> => {
  const identity = await requireVerifiedIdentity();
  if (identity instanceof Response) {
    if (identity.status === 401 || identity.status === 403)
      redirect("/account?next=inbox");
    throw new Error("Unable to verify page access. Please try again.");
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_suggestion_inbox", {
    p_status: null,
    p_search: "",
    p_page: 0,
  });
  if (error?.code === "RW403" || error?.code === "42501") notFound();
  if (error || !inboxSchema.safeParse(data).success)
    throw new Error("Unable to verify page access. Please try again.");
  return (
    <main
      id="main"
      className="mx-auto max-w-5xl px-5 py-12"
      data-ph-no-autocapture
    >
      <p className="eyebrow">OWNER WORKSPACE</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">
        Suggestion inbox
      </h1>
      <p className="mt-3 mb-8 text-muted-foreground">
        Review ideas, plan what’s next, and follow up with the people behind
        them.
      </p>
      <SuggestionInbox />
    </main>
  );
};
export default Inbox;
