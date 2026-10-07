// Requires disposable, administrator-provisioned test sessions; never requests email.
import { readFile, writeFile } from "node:fs/promises";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const deployment = process.env.SUGGESTION_TEST_DEPLOYMENT;
if (!deployment)
  throw new Error(
    "Set SUGGESTION_TEST_DEPLOYMENT to the protected preview URL",
  );
const fixture = JSON.parse(
  await readFile(
    process.env.SUGGESTION_TEST_SESSIONS ?? "local/test-session.private.json",
    "utf8",
  ),
);
const [author, other] = fixture.accounts;
if (
  !author.email.endsWith("@example.invalid") ||
  !other.email.endsWith("@example.invalid")
)
  throw new Error("Only disposable example.invalid test accounts are allowed");
const cookies = [];
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    cookies: {
      getAll: () => cookies,
      setAll: (values) => {
        cookies.push(...values);
      },
    },
  },
);
const { error } = await supabase.auth.setSession(author.session);
assert.equal(error, null);
const cookie = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
const checks = [];
const post = (input, expected, authCookie = cookie, origin = deployment) => {
  const raw = execFileSync(
    "npx",
    [
      "vercel",
      "curl",
      "/api/suggestions",
      "--deployment",
      deployment,
      "--scope",
      "michael-gartner-projects",
      "--",
      "--silent",
      "--request",
      "POST",
      "--header",
      `Origin: ${origin}`,
      "--header",
      "Content-Type: application/json",
      "--cookie",
      authCookie,
      "--data",
      JSON.stringify(input),
      "--write-out",
      "\n%{http_code}",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const split = raw.lastIndexOf("\n");
  const status = Number(raw.slice(split + 1));
  const data = JSON.parse(raw.slice(0, split));
  assert.equal(status, expected, JSON.stringify({ status, expected, data }));
  return data;
};
const general = {
  requestId: randomUUID(),
  pluginSlug: null,
  title: "RJS-02 synthetic general idea",
  body: "Disposable hosted integration evidence: a general app suggestion.",
};
post(general, 401, "");
checks.push("signed out: 401");
post(general, 403, cookie, "https://other.example.invalid");
checks.push("other origin: 403");
const saved = post(general, 201);
checks.push("general: 201");
const plugin = {
  ...general,
  requestId: randomUUID(),
  pluginSlug: "smartblocks",
  title: "RJS-02 synthetic plugin idea",
  body: "Disposable hosted integration evidence: a SmartBlocks suggestion.",
};
const pluginSaved = post(plugin, 201);
checks.push("plugin: 201");
assert.equal(post(general, 200).id, saved.id);
checks.push("retry: same receipt");
post({ ...general, title: "Changed idea with the same request" }, 409);
checks.push("UUID conflict: 409");
post({ ...general, requestId: randomUUID(), pluginSlug: "unknown" }, 400);
checks.push("invalid plugin: 400");
post({ ...general, requestId: randomUUID(), title: "ab👍c" }, 400);
checks.push("short Unicode title: 400");
const direct = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    global: {
      headers: { Authorization: `Bearer ${author.session.access_token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
// Two saved ideas and eight shared RPC attempts exhaust the same account budget.
for (let i = 0; i < 8; i++) {
  const result = await direct.rpc("consume_community_rate_limit");
  assert.equal(result.error, null);
  assert.equal(result.data, true);
}
post({ ...general, requestId: randomUUID() }, 429);
checks.push("shared database quota: 429");
assert.equal(post(general, 200).id, saved.id);
checks.push("retry after quota: same receipt");
const otherClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    global: {
      headers: { Authorization: `Bearer ${other.session.access_token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
const isolated = await otherClient.rpc("submit_suggestion", {
  p_request_id: general.requestId,
  p_plugin_slug: null,
  p_title: general.title,
  p_body: general.body,
});
assert.equal(isolated.error, null);
assert.notEqual(isolated.data.id, saved.id);
checks.push("another account cannot obtain the author's receipt");
for (const client of [direct, otherClient]) {
  const read = await client.from("suggestions").select("*");
  assert.ok(read.error);
}
checks.push("private records unavailable through Data API");
const evidence = {
  deployment,
  checkedAt: new Date().toISOString(),
  run: fixture.run,
  users: fixture.accounts.map((a) => a.id),
  general: { ...general, ...saved },
  plugin: { ...plugin, ...pluginSaved },
  isolatedId: isolated.data.id,
  checks,
};
await writeFile(
  "local/suggestion-hosted-evidence.json",
  JSON.stringify(evidence, null, 2),
);
console.log(
  JSON.stringify(
    { checks, savedIds: [saved.id, pluginSaved.id, isolated.data.id] },
    null,
    2,
  ),
);
