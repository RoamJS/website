import { NewsletterChoice } from "@/components/newsletter-choice";
import { isNewsletterPersistenceConfigured } from "@/lib/newsletter-config";
export const metadata = {
  title: "Unsubscribe from RoamJS updates",
  robots: { index: false, follow: false },
};
const Unsubscribe = async ({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.JSX.Element> => {
  const { token } = await searchParams;
  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-16">
      <h1 className="text-3xl font-medium">Unsubscribe from RoamJS updates</h1>
      <NewsletterChoice
        action="unsubscribe"
        token={typeof token === "string" && token.length <= 200 ? token : ""}
        enabled={isNewsletterPersistenceConfigured()}
      />
    </main>
  );
};
export default Unsubscribe;
