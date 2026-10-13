import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
await db.exec(
  "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;",
);
await db.exec(
  await readFile(
    "supabase/migrations/20261011025930_newsletter_double_opt_in.sql",
    "utf8",
  ),
);
await db.exec(
  await readFile(
    "supabase/migrations/20261013165138_release_failed_newsletter_delivery.sql",
    "utf8",
  ),
);
await db.exec(
  await readFile(
    "supabase/migrations/20261013170656_prune_expired_newsletter_limits.sql",
    "utf8",
  ),
);
await db.exec("SET ROLE service_role");
const methods = {
  request_newsletter_signup: [
    "p_email",
    "p_token_hash",
    "p_request_id",
    "p_client_hash",
  ],
  confirm_newsletter_signup: ["p_token_hash"],
  unsubscribe_newsletter: ["p_id"],
  release_failed_newsletter_delivery: ["p_request_id"],
};
const api = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  const name = request.url?.split("/").pop();
  if (
    request.method !== "POST" ||
    !methods[name] ||
    request.headers.apikey !== "sb_secret_local_fixture"
  ) {
    response.writeHead(403);
    response.end(JSON.stringify({ code: "fixture-denied" }));
    return;
  }
  try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const args = methods[name];
    const result = await db.query(
      `SELECT public.${name}(${args.map((_, index) => `$${index + 1}`).join(",")}) AS result`,
      args.map((key) => input[key]),
    );
    response.end(JSON.stringify(result.rows[0].result));
  } catch (error) {
    response.writeHead(400);
    response.end(
      JSON.stringify({
        code: error.code ?? "fixture-error",
        message: "Local fixture failure",
      }),
    );
  }
});
await new Promise((resolve) => api.listen(43227, "127.0.0.1", resolve));
const fixtureEnv = {
  ...process.env,
  ROAMJS_NEWSLETTER_FIXTURE: "true",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:43227",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  SUPABASE_NEWSLETTER_SECRET_KEY: "sb_secret_local_fixture",
  NEWSLETTER_LINK_SECRET: "local-fixture-only-never-use-on-hosted-sites",
  NEWSLETTER_SITE_URL: "http://localhost:3226",
  NEWSLETTER_SIGNUP_ENABLED: "true",
  RESEND_API_KEY: "fixture-key-not-valid-at-resend",
  NEXT_PUBLIC_POSTHOG_ENABLED: "false",
  NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --import ${new URL("./email-preload.mjs", import.meta.url).href}`,
};
const run = (args) =>
  spawn(process.execPath, ["node_modules/next/dist/bin/next", ...args], {
    stdio: "inherit",
    env: fixtureEnv,
  });
const build = run(["build"]);
const exit = await new Promise((resolve) => build.on("exit", resolve));
if (exit !== 0) {
  api.close();
  await db.close();
  process.exit(exit ?? 1);
}
const app = run(["start", "-p", "3226"]);
console.log(
  "Newsletter fixture: localhost:3226/updates. No real provider, account or hosted database is used.",
);
const close = async () => {
  app.kill("SIGTERM");
  api.close();
  await db.close();
  process.exit(0);
};
process.on("SIGTERM", close);
process.on("SIGINT", close);
app.on("exit", async () => {
  api.close();
  await db.close();
  process.exit(0);
});
