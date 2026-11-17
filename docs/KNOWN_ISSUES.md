# Known issues and verification backlog
Updated: 2026-11-17. These are previously observed reports, **not confirmed current live failures**. Reproduce against latest code before patching.

## Parser / store-specific
- Shypelyk: correct price/availability sometimes extracted, but product photo missing; previous image URL returned broken. WooCommerce gallery fallback and image checks were attempted.
- ETNODIM: product displayed current and original sale prices, while tracker extracted only current price. A targeted `etnodimSale` parser was added, but its matching against real markup is not verified.
- Aromateque: price/name extracted but image appeared low resolution.
- Beauty Time: price/name extracted but image missing.
- Notino UA: server returned HTTP 403; Firecrawl is not guaranteed to solve this.
- ÉTOILE / Gunia / Manucurist: Shopify parsing and occasional HTTP 429/incomplete images; do not bypass access restrictions.
- Gushka `https://gushka.ua/product/zhiletka-chesana/702024?size=S`: previously unsupported/failed; check whether hostname allowance and variant handling exist in current code.
- CENDRÉ: a watch displayed 4860 UAH and a 30% price decrease; verify distinction between store compare-at price and historical price.
- Zara Home: official UA catalog API integration; Polish market configured but verify current operation. Never substitute UA price for PL.

## CI / development
- GitHub CI failure notifications were observed for commits `7cf0901`, `725fddc`, `86df2e8`. **Root cause not confirmed.**
- Inspect `.github/workflows/ci.yml` and run:
  ```bash
  node --check seed.js
  node --check netlify/functions/product.js
  node --check netlify/functions/fx.js
  node scripts/check-inline-js.cjs
  node --test tests/*.test.cjs
  ```
- Potential test/parser mismatch: ETNODIM sale text may contain a currency symbol on *both* prices (`2 500 ₴ / 2 000 ₴`). Confirm and fix only after reproducing.
- Keep Netlify Dev running in terminal for local site; stop with Ctrl+C. Refresh browser with Cmd+Shift+R after `git pull`.

## Data-loss risk
- Wishlist data currently stored per browser origin in localStorage; localhost and Netlify have separate storage.
- GitHub deployment does not preserve or sync browser data. Implement and test JSON export/import BEFORE migration/deployment. Do not clear browser storage.
