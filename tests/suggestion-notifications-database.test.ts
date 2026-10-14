import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const first = "afc3b29d-c4c6-4ab2-8f79-b0cf2bf516dc";
const second = "bfc3b29d-c4c6-4ab2-8f79-b0cf2bf516dc";
const exhausted = "cfc3b29d-c4c6-4ab2-8f79-b0cf2bf516dc";
const following = "dfc3b29d-c4c6-4ab2-8f79-b0cf2bf516dc";

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
    CREATE SCHEMA private;
    CREATE TABLE private.suggestions (id uuid primary key, plugin_slug text);
  `);
  await db.exec(
    readFileSync(
      "supabase/migrations/20261014002133_suggestion_notification_outbox.sql",
      "utf8",
    ),
  );
}, 30000);
afterAll(async () => {
  await db.close();
});

describe("suggestion notification outbox", () => {
  it("atomically queues only new rows and denies public access", async () => {
    await db.query(
      "INSERT INTO private.suggestions(id,plugin_slug) VALUES ($1,'smartblocks')",
      [first],
    );
    expect(
      (
        await db.query(
          "SELECT suggestion_id FROM private.suggestion_notification_outbox",
        )
      ).rows,
    ).toHaveLength(1);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await expect(
        db.query("SELECT public.claim_suggestion_notification(NULL)"),
      ).rejects.toThrow(/permission denied/);
      await expect(
        db.query("SELECT * FROM private.suggestion_notification_outbox"),
      ).rejects.toThrow(/permission denied/);
      await db.exec("RESET ROLE");
    }
  });
  it("leases a row once, rejects stale acknowledgements and records delivery", async () => {
    await db.exec("SET ROLE service_role");
    const claim = async (id: string): Promise<{ lease_token: string } | null> =>
      (
        await db.query<{ job: { lease_token: string } | null }>(
          "SELECT public.claim_suggestion_notification($1) AS job",
          [id],
        )
      ).rows[0].job;
    const original = await claim(first);
    expect(original?.lease_token).toBeTruthy();
    expect(await claim(first)).toBeNull();
    await db.exec("RESET ROLE");
    await db.query(
      "UPDATE private.suggestion_notification_outbox SET lease_expires_at=now()-interval '1 second' WHERE suggestion_id=$1",
      [first],
    );
    await db.exec("SET ROLE service_role");
    const renewed = await claim(first);
    expect(renewed?.lease_token).not.toBe(original?.lease_token);
    const finish = async (token: string): Promise<boolean> =>
      (
        await db.query<{ done: boolean }>(
          "SELECT public.finish_suggestion_notification($1,$2,'sent','email_1') AS done",
          [first, token],
        )
      ).rows[0].done;
    expect(await finish(original!.lease_token)).toBe(false);
    expect(await finish(renewed!.lease_token)).toBe(true);
    expect(await claim(first)).toBeNull();
    await db.exec("RESET ROLE");
  });
  it("retries a transient failure without losing the queued suggestion", async () => {
    await db.query(
      "INSERT INTO private.suggestions(id,plugin_slug) VALUES ($1,NULL)",
      [second],
    );
    await db.exec("SET ROLE service_role");
    const job = (
      await db.query<{ job: { lease_token: string } }>(
        "SELECT public.claim_suggestion_notification($1) AS job",
        [second],
      )
    ).rows[0].job;
    expect(
      (
        await db.query<{ done: boolean }>(
          "SELECT public.finish_suggestion_notification($1,$2,'retry',NULL) AS done",
          [second, job.lease_token],
        )
      ).rows[0].done,
    ).toBe(true);
    await db.exec("RESET ROLE");
    const row = (
      await db.query<{ state: string; attempts: number }>(
        "SELECT state,attempts FROM private.suggestion_notification_outbox WHERE suggestion_id=$1",
        [second],
      )
    ).rows[0];
    expect(row).toMatchObject({ state: "pending", attempts: 1 });
  });
  it("retires an expired fifth lease without blocking the next job", async () => {
    await db.query(
      "INSERT INTO private.suggestions(id,plugin_slug) VALUES ($1,NULL),($2,'workbench')",
      [exhausted, following],
    );
    await db.query(
      "UPDATE private.suggestion_notification_outbox SET attempts=5, lease_expires_at=now()-interval '1 second' WHERE suggestion_id=$1",
      [exhausted],
    );
    await db.exec("SET ROLE service_role");
    const claimed = (
      await db.query<{ job: { suggestion_id: string } }>(
        "SELECT public.claim_suggestion_notification(NULL) AS job",
      )
    ).rows[0].job;
    await db.exec("RESET ROLE");
    expect(claimed.suggestion_id).toBe(following);
    const retired = (
      await db.query<{ state: string; attempts: number }>(
        "SELECT state,attempts FROM private.suggestion_notification_outbox WHERE suggestion_id=$1",
        [exhausted],
      )
    ).rows[0];
    expect(retired).toMatchObject({ state: "failed", attempts: 5 });
  });
});
