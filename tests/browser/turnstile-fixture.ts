import type { Page } from "@playwright/test";

const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const mockPassingTurnstile = async (page: Page): Promise<void> => {
  if (!process.env.NEXT_PUBLIC_AUTH_TURNSTILE_SITE_KEY) return;
  await page.route(TURNSTILE_SCRIPT, (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.turnstile = {
        render: function (_container, options) {
          this.options = options;
          setTimeout(function () { options.callback('fixture-token'); }, 0);
          return 'fixture-widget';
        },
        reset: function () {
          var options = this.options;
          setTimeout(function () { options.callback('next-fixture-token'); }, 0);
        },
        remove: function () {}
      };`,
    }),
  );
};
