import { CommunityForm } from "@/components/community-form";
import { isCommunityConfigured } from "@/lib/features";
export const metadata = { title: "Keep in the loop" };
const Updates = (): React.JSX.Element => (
  <main id="main" className="mx-auto max-w-3xl px-5 py-16">
    <p className="eyebrow">A NOTE, EVERY NOW AND THEN</p>
    <h1 className="mt-4 text-4xl font-medium tracking-tight">
      A little more possibility, in your inbox.
    </h1>
    <p className="mb-9 mt-5 text-base leading-relaxed text-muted-foreground">
      Occasional announcements when there’s a new plugin or something useful has
      changed. Signing in or suggesting an idea never subscribes you
      automatically.
    </p>
    <CommunityForm enabled={isCommunityConfigured()} kind="subscription" />
  </main>
);
export default Updates;
