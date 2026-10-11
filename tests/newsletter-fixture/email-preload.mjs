import { mkdir, writeFile } from "node:fs/promises";
const originalFetch = globalThis.fetch;
if (
  process.env.ROAMJS_NEWSLETTER_FIXTURE === "true" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL === "http://127.0.0.1:43227"
) {
  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url === "https://api.resend.com/emails") {
      if (init?.method !== "POST")
        throw new Error("Unexpected fixture email method");
      const message = JSON.parse(init.body);
      await mkdir("local", { recursive: true });
      await writeFile(
        "local/newsletter-fixture-outbox.json",
        JSON.stringify(message, null, 2),
        { mode: 0o600 },
      );
      return Response.json({ id: "local-fixture-delivery" });
    }
    return originalFetch(input, init);
  };
}
