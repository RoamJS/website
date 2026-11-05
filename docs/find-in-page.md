# Find In Page website content

The authoritative website checkout is `RoamJS/apps/website` (remote `RoamJS/website`). The saved `RoamJS/website` folder no longer exists.

Find In Page is included with launch-ready Roam Depot installation copy at `/plugins/find-in-page`, discoverable through the homepage catalog and Navigation category. Its metadata and website-authored guide live in `content/curated-plugins.json` and `content/curated-guides.json`. Public README snapshots and their private-repository import guard stay separate.

## Evidence checked November 4, 2026

- GitHub reports `RoamJS/find-in-page` as private.
- The complete, untruncated `Roam-Research/roam-depot` main tree at `11bf05c497a2d6de759eebef36987f21a15f3c96` contains no Find In Page entry.
- Product behavior and exact labels were checked against the clean local extension checkout at `bdc9140c7ba763c886cb07348222c16ce5ce9c9c`, README blob `e242c410a26d48cb55dd94269ddbb5ae63c65906`. The guide is edited website copy, not a public README snapshot.

Michael requested finished launch copy written as though Find In Page is already in Roam Depot, so the page and guide give normal Depot installation instructions with no coming-soon language. The curated `depotInstallation` flag controls this copy independently of verified snapshot metadata; no Depot ID, version, repository creation date, or download count is fabricated. The explicit `added` date records when the website listing was added; Newest uses it before falling back to historical creation dates. This copy change does not establish or perform publication. Source links and the standard Instructions / Suggest a change tabs are prepared for launch just like the other plugins. The curated content survives public README refreshes, so Depot publication requires no copy follow-up.

## Media

No candidate video is embedded or copied into the website. The narrated 39-second demo and prior promos remain review candidates; website work does not accept or publish them. The product report is `packages/product-videos/products/find-in-page/NARRATION-FINAL-REPORT.md` in the parent workspace. The subsequently completed `CTA-REVISION.md` records the latest candidate at `/Volumes/Seagate Backup Plus Drive/RoamJS-videos/product-videos/find-in-page/candidates/stylized-v3-learn-more-6251f687/video.mp4`, checksum `6251f687481024f6ced9aa0d5578a8a8d09bbca7029cfd56685559e43054dd0b`. It remains unaccepted and unpublished.

Michael’s confirmed video CTA is “Learn more at roamjs.com”. It does not imply installation availability. Video rendering, source edits, uploading, and acceptance are outside this website change.

## Local review

Run `npm ci`, `npm run build`, and `npm run start -- --port 3215`. Open `http://localhost:3215/plugins/find-in-page` or search for “Find In Page” on the homepage. Unit and browser regressions cover discovery, installation instructions, suggestion navigation, guide content, and existing published-plugin behavior. The additive `find_in_page_suggestions` migration registers the plugin in the private suggestion allowlist when deployed; it does not enable submissions globally or change access controls. Nothing in this change deploys or submits the extension to Roam Depot.
