import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
let db: PGlite;
const hash = "a".repeat(64),
  client = "b".repeat(64);
const requestId = "aa43e4d7-1585-4ab7-bd9e-9c0449857fdd";
const signup = async (
  email: string,
  token = hash,
): Promise<{ send: boolean }> =>
  (
    await db.query<{ result: { send: boolean } }>(
      "SELECT public.request_newsletter_signup($1,$2,$3,$4) AS result",
      [email, token, requestId, client],
    )
  ).rows[0].result;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;",
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261011025930_newsletter_double_opt_in.sql",
      "utf8",
    ),
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
describe("real PostgreSQL consent transitions and role permissions", () => {
  it("protects tables and RPCs from anonymous and signed-in callers", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await expect(signup("blocked@example.invalid")).rejects.toThrow(
        /permission denied/,
      );
      await expect(
        db.query("SELECT * FROM private.newsletter_subscriptions"),
      ).rejects.toThrow(/permission denied/);
      await expect(
        db.query("SELECT public.confirm_newsletter_signup($1)", [hash]),
      ).rejects.toThrow(/permission denied/);
      await expect(
        db.query("SELECT public.unsubscribe_newsletter($1)", [requestId]),
      ).rejects.toThrow(/permission denied/);
      await db.exec("RESET ROLE");
    }
  });
  it("records consent only on confirmation, prevents replay after opt-out, and permits freshly confirmed resubscription", async () => {
    await db.exec("SET ROLE service_role");
    expect(await signup("person@example.invalid")).toEqual({ send: true });
    expect(await signup("person@example.invalid")).toEqual({ send: false });
    const row = (
      await db.query<{ id: string; status: string }>(
        "SELECT id,status FROM private.newsletter_subscriptions WHERE email='person@example.invalid'",
      )
    ).rows[0];
    expect(row.status).toBe("pending");
    await db.query("SELECT public.confirm_newsletter_signup($1)", [hash]);
    await db.query("SELECT public.confirm_newsletter_signup($1)", [hash]);
    expect(
      (
        await db.query(
          "SELECT choice FROM private.newsletter_consent_events WHERE subscription_id=$1 ORDER BY created_at,id",
          [row.id],
        )
      ).rows,
    ).toHaveLength(2);
    await db.query("SELECT public.unsubscribe_newsletter($1)", [row.id]);
    expect(
      (
        await db.query<{ result: unknown }>(
          "SELECT public.confirm_newsletter_signup($1) AS result",
          [hash],
        )
      ).rows[0].result,
    ).toBeNull();
    const fresh = "c".repeat(64);
    expect(await signup("person@example.invalid", fresh)).toEqual({
      send: true,
    });
    expect(
      (
        await db.query<{ status: string }>(
          "SELECT status FROM private.newsletter_subscriptions WHERE id=$1",
          [row.id],
        )
      ).rows[0].status,
    ).toBe("pending");
    await db.query("SELECT public.confirm_newsletter_signup($1)", [fresh]);
    expect(
      (
        await db.query<{ status: string }>(
          "SELECT status FROM private.newsletter_subscriptions WHERE id=$1",
          [row.id],
        )
      ).rows[0].status,
    ).toBe("subscribed");
    await db.exec("RESET ROLE");
  });
  it("expires confirmation links and enforces shared database quotas", async () => {
    await db.exec("SET ROLE service_role");
    const token = "d".repeat(64);
    await signup("expiry@example.invalid", token);
    await db.exec(
      "UPDATE private.newsletter_subscriptions SET confirmation_expires_at=now()-interval '1 second' WHERE email='expiry@example.invalid'",
    );
    expect(
      (
        await db.query<{ result: unknown }>(
          "SELECT public.confirm_newsletter_signup($1) AS result",
          [token],
        )
      ).rows[0].result,
    ).toBeNull();
    await signup("expiry@example.invalid", token);
    await signup("expiry@example.invalid", token);
    await expect(signup("expiry@example.invalid", token)).rejects.toThrow(
      /Too many newsletter requests/,
    );
    await db.exec("RESET ROLE");
  });
  it("requires empty search paths, invoker execution and RLS", async () => {
    const funcs = await db.query<{ prosecdef: boolean; proconfig: string[] }>(
      "SELECT prosecdef,proconfig FROM pg_proc WHERE proname IN ('request_newsletter_signup','confirm_newsletter_signup','unsubscribe_newsletter','consume_newsletter_limit')",
    );
    expect(funcs.rows).toHaveLength(4);
    for (const row of funcs.rows) {
      expect(row.prosecdef).toBe(false);
      expect(row.proconfig.join()).toContain("search_path=");
    }
    expect(
      (
        await db.query<{ relrowsecurity: boolean }>(
          "SELECT relrowsecurity FROM pg_class WHERE relname IN ('newsletter_subscriptions','newsletter_consent_events','newsletter_request_limits')",
        )
      ).rows.every((row) => row.relrowsecurity),
    ).toBe(true);
  });
});
