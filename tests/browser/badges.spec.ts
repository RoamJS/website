import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

for (const badge of ["website", "deepwiki", "slack"]) {
  for (const font of ["Arial", "monospace"]) {
    test(`${badge} label retains padding with ${font}`, async ({ page }) => {
      const svg = await readFile(`public/badges/${badge}.svg`, "utf8");
      await page.setContent(
        `<style>text { font-family: ${font}; }</style>${svg}`,
      );
      await page.evaluate(() => document.fonts.ready.then(() => undefined));

      const frame = await page.locator("body > svg").boundingBox();
      const label = await page.locator("text").boundingBox();
      expect(frame).not.toBeNull();
      expect(label).not.toBeNull();
      if (!frame || !label) throw new Error("Badge or label did not render");

      const rightPadding = frame.x + frame.width - label.x - label.width;
      expect(rightPadding).toBeGreaterThanOrEqual(9.5);
      expect(rightPadding).toBeLessThanOrEqual(12.5);
      expect(label.y).toBeGreaterThanOrEqual(frame.y);
      expect(label.y + label.height).toBeLessThanOrEqual(frame.y + frame.height);
    });
  }
}
