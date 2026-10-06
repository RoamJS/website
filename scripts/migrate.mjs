import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL before running migrations.");
const sql = neon(process.env.DATABASE_URL);
const migration = await readFile(
  new URL("../db/001-community.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  migration
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((statement) => sql.query(statement)),
);
console.log("Community tables are ready.");
