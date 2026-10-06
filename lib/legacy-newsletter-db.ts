import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
// Disabled newsletter persistence is retained until RJS-04/05.
export const database = (): NeonQueryFunction<false, false> =>
  neon(process.env.DATABASE_URL!);
