export const metadata = { title: "Privacy note" };
const Privacy = (): React.JSX.Element => (
  <main id="main" className="prose mx-auto max-w-3xl px-5 py-16">
    <p className="eyebrow">THE WEBSITE, PLAINLY EXPLAINED</p>
    <h1>Privacy note</h1>
    <p>
      You can browse the plugin library and instructions without an account.
      Theme preference is saved in your browser.
    </p>
    <h2>Website analytics</h2>
    <p>
      We use PostHog to understand page visits, plugin links, carousel use, and
      other clicks on this website. A random identifier saved in your browser
      helps us understand visits over time. Preview traffic is labeled
      separately. We don’t connect analytics to your account or send your email,
      suggestion text, search terms, or sign-in details. Session recordings are
      disabled. We respect your browser’s Do Not Track and Global Privacy
      Control signals.
    </p>
    <h2>Accounts and suggestions</h2>
    <p>
      When website submissions are enabled, Clerk handles sign-in and email
      verification. RoamJS stores your account ID, verified primary email,
      suggestion text, and submission time so we can review and follow up on
      your idea. Suggestions are private to RoamJS. Please don’t submit
      sensitive information or private graph content.
    </p>
    <h2>Announcements are optional</h2>
    <p>
      Creating an account or submitting a suggestion does not subscribe you to
      announcements. Subscribing records your email, account ID, consent choice,
      and the time of that choice. You can withdraw consent on the Updates page.
      We keep your current preference so it can be respected in future mailings.
    </p>
    <h2>Third-party services</h2>
    <p>
      Clerk processes account and sign-in information. The hosting provider
      processes normal web requests. Documentation links may take you to GitHub
      or other services, which have their own privacy practices. Individual Roam
      plugins can have different data practices; check each plugin’s
      documentation.
    </p>
    <h2>Questions or data requests</h2>
    <p>
      Use the website’s suggestion form, when available, to request access to or
      deletion of information connected to your verified account. If sign-in is
      unavailable, open a{" "}
      <a href="https://github.com/RoamJS/website/issues/new">
        website support issue
      </a>{" "}
      without including personal details and ask for a private follow-up
      channel.
    </p>
    <p className="text-xs text-muted-foreground">
      Last updated October 5, 2026.
    </p>
  </main>
);
export default Privacy;
