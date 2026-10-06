import Link from "next/link";
const NotFound = (): React.JSX.Element => (
  <main id="main" className="mx-auto max-w-3xl px-5 py-24">
    <p className="eyebrow">A LITTLE OFF THE PATH</p>
    <h1 className="mt-4 text-4xl font-medium">We couldn’t find that page.</h1>
    <Link href="/#plugins" className="mt-6 inline-block text-primary underline">
      Back to the plugin library
    </Link>
  </main>
);
export default NotFound;
