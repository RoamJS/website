import { AccountForm } from "@/components/account-form";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
const Account = (): React.JSX.Element => (
  <main
    id="main"
    className="mx-auto max-w-lg px-5 py-16"
    data-ph-no-autocapture
  >
    <p className="eyebrow">YOUR ROAMJS ACCOUNT</p>
    <h1 className="mb-8 mt-4 text-4xl font-medium tracking-tight">
      A place for your ideas.
    </h1>
    <AccountForm />
  </main>
);
export default Account;
