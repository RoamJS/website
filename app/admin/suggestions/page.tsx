import { SuggestionInbox } from "@/components/suggestion-inbox";
export const metadata = {
  title: "Suggestion inbox",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
const Inbox = (): React.JSX.Element => (
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
      Review ideas, plan what’s next, and follow up with the people behind them.
    </p>
    <SuggestionInbox />
  </main>
);
export default Inbox;
