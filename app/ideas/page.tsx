import { CommunityForm } from "@/components/community-form";
import { isSuggestionsConfigured } from "@/lib/features";
export const metadata = { title: "Suggest an idea" };
const Ideas = (): React.JSX.Element => (
  <main id="main" className="mx-auto max-w-3xl px-5 py-16">
    <p className="eyebrow">BUILT WITH THE COMMUNITY</p>
    <h1 className="mt-4 text-4xl font-medium tracking-tight">
      What’s missing from your workflow?
    </h1>
    <p className="mb-9 mt-5 text-base leading-relaxed text-muted-foreground">
      A little improvement. A whole new app. Something you keep thinking should
      exist. Tell us about the problem you’d love to solve.
    </p>
    <CommunityForm enabled={isSuggestionsConfigured()} kind="idea" />
    <p className="mt-6 text-sm text-muted-foreground">
      Have an idea for a particular plugin? Open its page and choose “Suggest a
      change”.
    </p>
  </main>
);
export default Ideas;
