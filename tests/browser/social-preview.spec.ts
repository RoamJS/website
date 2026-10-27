import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

const slackbot = "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)";

for (const path of ["/", "/plugins/smartblocks"]) {
  test(`serves a public social preview to Slack for ${path}`, async ({
    request,
    page,
  }) => {
    const response = await request.get(path, {
      headers: { "User-Agent": slackbot },
    });
    expect(response.ok()).toBeTruthy();
    // Parse the actual server response with no page JavaScript or hydration.
    const html = await response.text();
    await page.setContent(html);
    const meta = async (property: string): Promise<string | null> =>
      page
        .locator(
          `head meta[property="${property}"], head meta[name="${property}"]`,
        )
        .getAttribute("content");
    expect(await meta("og:title")).toContain(
      path === "/" ? "RoamJS" : "SmartBlocks",
    );
    expect(await meta("og:description")).toBeTruthy();
    expect(await meta("og:site_name")).toBe("RoamJS");
    expect(await meta("og:image:width")).toBe("1200");
    expect(await meta("og:image:height")).toBe("630");
    expect(await meta("og:image:alt")).toContain("RoamJS");
    expect(await meta("twitter:card")).toBe("summary_large_image");
    const imageUrl = new URL((await meta("og:image"))!);
    expect(imageUrl.origin).toBe("https://roamjs.com");
    expect(await meta("twitter:image")).toBe(imageUrl.href);
    const image = await request.get(imageUrl.pathname + imageUrl.search, {
      headers: {
        "User-Agent": "Slack-ImgProxy 0.19 (+https://api.slack.com/robots)",
      },
    });
    expect(image.ok()).toBeTruthy();
    expect(image.headers()["content-type"]).toContain("image/png");
    const png = await image.body();
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    const logoPixels = await page.evaluate(async (encoded): Promise<number> => {
      const image = new Image();
      image.src = `data:image/png;base64,${encoded}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 90;
      canvas.height = 90;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 76, 64, 90, 90, 0, 0, 90, 90);
      const { data } = context.getImageData(0, 0, 90, 90);
      let coloredPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (
          Math.max(data[i], data[i + 1], data[i + 2]) -
            Math.min(data[i], data[i + 1], data[i + 2]) >
          100
        )
          coloredPixels++;
      }
      return coloredPixels;
    }, png.toString("base64"));
    // Valid PNG responses can still hide SVGs whose color syntax is unsupported.
    expect(logoPixels).toBeGreaterThan(1000);
  });
}
