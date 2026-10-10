import { defineConfig } from "vite";
import path from "node:path";
const repo = path.resolve(__dirname, "../..");
export default defineConfig({
  root: __dirname,
  resolve: {
    alias: [
      {
        find: "@/lib/supabase/client",
        replacement: path.resolve(__dirname, "supabase.ts"),
      },
      {
        find: "next/link",
        replacement: path.resolve(__dirname, "link.tsx"),
      },
      {
        find: "next/navigation",
        replacement: path.resolve(__dirname, "navigation.ts"),
      },
      { find: "@", replacement: repo },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 3216,
    strictPort: true,
    fs: { allow: [repo] },
  },
});
