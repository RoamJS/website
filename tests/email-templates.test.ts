import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const templateNames = ["magic-link", "confirmation"];
describe("Supabase authentication emails", () => {
  it.each(templateNames)(
    "keeps %s authentication values intact and out of inbox previews",
    (name) => {
      const html = readFileSync(
        `supabase/email-templates/${name}.html`,
        "utf8",
      );
      const variables = [...html.matchAll(/{{\s*([^}]+)\s*}}/g)].map((match) =>
        match[1].trim(),
      );
      expect(variables.sort()).toEqual([".ConfirmationURL", ".Token"]);
      expect(html).toContain('href="{{ .ConfirmationURL }}"');
      const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const preheader = html.match(/<div[^>]*>([\s\S]*?)<\/div>/)?.[1];
      expect(title).toBeTruthy();
      expect(preheader).toBeTruthy();
      expect(`${title} ${preheader}`).not.toContain("{{");
      expect(html).not.toMatch(/<(script|form|iframe|svg)\b/i);
      expect(html).not.toMatch(/user_metadata|\.Data|\.Email/);
      expect(Buffer.byteLength(html)).toBeLessThan(15_000);
    },
  );

  it.each(templateNames)(
    "keeps %s usable without images and limits remote resources",
    (name) => {
      const html = readFileSync(
        `supabase/email-templates/${name}.html`,
        "utf8",
      );
      expect(html.match(/<img\b/g)).toHaveLength(1);
      expect(html.match(/<a\b/g)).toHaveLength(1);
      expect(html).toContain('src="https://roamjs.com/email/roamjs-mark.png"');
      const withoutImages = html.replace(/<img[^>]*>/g, "");
      expect(withoutImages).toContain("RoamJS");
      expect(withoutImages).toContain("{{ .Token }}");
      expect(withoutImages).toContain("If you didn’t request this email");
      expect(withoutImages).toContain("same browser where you requested it");
      expect(html).toContain('<html lang="en" dir="ltr">');
      expect(html).not.toMatch(
        /display:\s*(flex|grid)|data:image|@import|<link\b/i,
      );
    },
  );

  it("ships a small PNG logo with enough resolution for the email", () => {
    const png = readFileSync("public/email/roamjs-mark.png");
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(160);
    expect(png.readUInt32BE(20)).toBe(160);
    expect(png.length).toBeLessThan(20_000);
  });
});
