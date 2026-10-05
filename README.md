# DCG card images

A mirror of the Digimon Card Game card scans used by [dcg.web.app](https://dcg.web.app), so the
game doesn't depend on a third-party host staying where it is.

- **Source:** [TakaOtaku's Digimon Card App](https://github.com/TakaOtaku/Digimon-Card-App): the card
  list from its repo, the images from its CDN (`web-garage.takaotaku.de`).
- **Served by:** GitHub Pages, e.g. `https://facundo-villafane.github.io/dcg-cards/cards/BT1-084.webp`.
- **Updates:** the [Sync card images](.github/workflows/sync.yml) workflow runs every Monday (or by
  hand from the Actions tab) and downloads only the scans that are new. Cards that are only
  previewed have a `-Sample` scan, replaced by the real one once it's published.

Run it locally with `node scripts/sync.mjs` (Node 18+, no dependencies).

Card images © Bandai / Toei Animation. This is a non-commercial fan project.
