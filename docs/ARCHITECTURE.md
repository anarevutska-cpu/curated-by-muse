# Architecture — Curated by Muse

Last reviewed: 2026-10-30 (v26).

## Runtime and deployment
- Static HTML/CSS/vanilla JavaScript application in `index.html`.
- Netlify Dev serves the site and Netlify Functions locally; `netlify.toml` sets `publish = "."`, `functions = "netlify/functions"`, bundler `esbuild`.
- `netlify/functions/product.js`: server-side public product data fetch, allowlisted domains, Zara Home catalog integration, metadata fallback.
- `netlify/functions/fx.js`: NBU exchange rates, returned as UAH per currency unit; cached HTTP response for 30 minutes.
- `seed.js`: reference seed product URLs; `watermark-*.svg`: local placeholder artwork.

## Data flow
1. User adds an exact product URL; browser maintains product/offer data in localStorage (`friday-list-v6`).
2. On manual refresh, frontend calls `/.netlify/functions/product?url=...` for each offer in a grouped card.
3. Product function validates HTTPS URL and hostname against an allowlist.
4. For Zara Home, `zaraVariant()` extracts country from URL path, eight-digit article and three-digit `colorId`.
5. For configured markets, it requests `/itxrest/2/catalog/store/{store}/{catalog}/product/{article}{color}?languageId={language}&appId=2`.
6. It validates the returned color/reference, reads price and stock from sizes, and selects the official `p1` image only when URL matches the exact variant.
7. If a catalog request fails, it does not invent country-specific variant data; non-Zara sites use conservative HTML metadata parsing.
8. Browser persists successful updates and price observations, renders grouped cards and per-country offer details.
9. Currency display may call `/.netlify/functions/fx` for NBU rates; converted prices are indicative and exclude delivery/import costs.

## Configured Zara markets
| Region | Store | Catalog | Language | Currency |
| --- | --- | --- | --- | --- |
| ua | 85009963 | 80290099 | -47 | UAH |
| pl | 85009924 | 80290000 | -47 | PLN |

Other regions are not configured in the catalog integration. Never reuse UA prices for another region.

## Data and security constraints
- LocalStorage is the source of truth for user catalog and ordering; no backend database or authentication.
- Do not change the storage key or schema without a tested migration and backup strategy.
- Do not commit secrets or local `.env` files. Keep external URL allowlist strict to reduce SSRF risk.
- Product data and availability are best-effort snapshots, not purchase guarantees.

## Local development
```bash
cd ~/Documents/curated-by-muse
git pull
npx netlify-cli dev --dir . --functions netlify/functions
```
Open http://localhost:8888. If port 3999 is occupied, stop the previous Netlify Dev process before retrying.
