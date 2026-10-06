# Website analytics

PostHog project: [RoamJS / Default project (648202)](https://us.posthog.com/project/648202).

The browser SDK initializes in `instrumentation-client.ts`. The checked-in token is a public, write-only project ingestion token, not a personal API credential. Analytics is enabled on RoamJS and Vercel hosts and disabled on localhost unless `NEXT_PUBLIC_POSTHOG_ENABLED=true` is set at build time. Set it to `false` to disable tracking. An optional `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` overrides the destination project for isolated testing.

Every event includes `site=roamjs-website`, `environment` (`preview`, `production`, or `development`), and `analytics_version=1`. Vercel's build-time environment takes precedence over hostname detection. Filter on `environment=production` for public-site reporting; use `preview` when testing this branch. Local automated tests intercept ingestion requests and do not send them to PostHog.

## Events

| Event                | Meaning                                                                     | Useful properties                                                                                                           |
| -------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `$pageview`          | Initial visit and subsequent pathname changes, including Next.js navigation | `$pathname`, `$current_url`, browser/device properties                                                                      |
| `$pageleave`         | Page departure and time-on-page context                                     | SDK page and duration properties                                                                                            |
| `plugin clicked`     | Opening a plugin from a featured card or catalog card                       | `plugin_slug`, `source` (featured/catalog), `placement` (lead/secondary/catalog), carousel slide and position when featured |
| `carousel navigated` | Previous/next, a page indicator, or arrow-key navigation                    | `from_slide`, `to_slide`, one-based positions, `control`, `input_method`, `changed`                                         |
| `site link clicked`  | Other internal or external links                                            | `source` (header/footer/catalog/content), query-free `destination`, `current_plugin_slug` on plugin pages                   |
| `catalog filtered`   | Category choice                                                             | `category`                                                                                                                  |
| `catalog sorted`     | Sort choice                                                                 | `sort`, `category`                                                                                                          |
| `catalog searched`   | Submitting search with Enter                                                | `query_length`, `result_count`, `category`, `sort`; never the query text                                                    |
| `$autocapture`       | Other public button/link/control clicks                                     | Element ancestry and stable `data-attr` markers, such as `theme-toggle` or `carousel-next`                                  |

Custom events and autocapture deliberately overlap. Use `plugin clicked` for plugin interest and `carousel navigated` for carousel usage; do not sum them with `$autocapture` as if they were independent clicks. A plugin click is not a plugin installation. `changed=false` means someone selected the already-active carousel page.

Useful starting analyses:

- Page views and visitors by page and environment in Web analytics.
- `plugin clicked` broken down by `plugin_slug`, then by `source` to compare carousel and catalog discovery.
- `carousel navigated` broken down by `to_slide`, filtered to `changed=true`.
- Funnel from homepage `$pageview` to `plugin clicked` to `site link clicked` with a GitHub repository destination.
- Category and sort preferences from `catalog filtered` and `catalog sorted`.

## Collection boundaries

No Clerk identity, email, suggestion content, or search terms are attached. Element text is masked; input fields, editable content, community forms, and Clerk UI are excluded from click capture. OAuth/API/unknown routes are excluded, including their credentials. URL query strings and fragments are removed before sending; campaign parameters and referrer persistence are disabled. Analytics uses a random browser identifier in local storage and respects Do Not Track and Global Privacy Control. IP-based enrichment is disabled in the SDK. Session replay, console recording, surveys, exception capture, heatmaps, and remote feature flags are explicitly disabled, even if project defaults enable them.

The Privacy page describes collection. No researcher accounts or sharing permissions are created by this integration. Browser privacy settings, blockers, or disabled JavaScript can prevent collection.

## Verification

Run `npm test` and `npm run lint`, then build with `NEXT_PUBLIC_POSTHOG_ENABLED=true npm run build`, start on port 3215, and run `npx playwright test`. Analytics tests intercept and inspect actual SDK payloads, verify one pageview per route change, distinguish carousel/catalog clicks, and ensure test secrets and search text are absent. Automated-browser detection is disabled only inside the analytics test context, not in site code.

Integration references: [Next.js](https://posthog.com/docs/libraries/next-js), [SDK configuration](https://posthog.com/docs/libraries/js/config), [autocapture](https://posthog.com/docs/product-analytics/autocapture).
