# Curated by Muse — project handover
Updated: 2026-11-17

## Product
A mobile-friendly, editorial-style personal wishlist and manual price tracker. Current priority: reliable extraction of the EXACT linked product/variant (name, original image, current price, currency, availability, original crossed-out price). Do not substitute unrelated photos or other variants, and do not invent prices or stock.

## Current MVP scope
- Personal wishlist; add a product URL, view cards, edit/delete, mark purchased.
- Manual per-item refresh and Refresh All; no automatic background monitoring.
- Country-specific offers can be grouped for the same product/article; keep separate prices/currencies/availability.
- Currency display UAH/EUR/USD with exchange-rate conversion, while retaining original store currency.
- Filters, tabs, card reorder, price observations/history.
- **Next: export/import wishlist JSON and backup existing local data.**
- **Out of scope for now:** user accounts, Supabase, cross-device syncing, multi-user SaaS, paid infrastructure.
- Netlify deployment is an option after backup, but deployment alone does NOT migrate browser data.

## Code and infrastructure
- GitHub: https://github.com/anarevutska-cpu/curated-by-muse
- Main frontend: `index.html` (single-file UI).
- Product parser: `netlify/functions/product.js`.
- Currency function: `netlify/functions/fx.js`.
- Static publishing and functions configured in `netlify.toml`.
- Tests: `tests/*.test.cjs`; inline JS check: `scripts/check-inline-js.cjs`; CI: `.github/workflows/ci.yml`.
- Local directory: `~/Documents/curated-by-muse`.
- Run: `cd ~/Documents/curated-by-muse && git pull && npx netlify-cli dev --dir . --functions netlify/functions`; visit http://localhost:8888.
- `git pull` downloads commits; running Netlify Dev alone does not update code.
- Before any risky code/data changes, back up browser localStorage; the project has historically used key `friday-list-v6` (verify current code before relying on it).
- Never put credentials/API keys into GitHub or chat documentation. Use Netlify environment variables for secrets.

## Parsing principles
1. Respect exact linked URL, color, size, article and country. No fallback to another product.
2. Keep last verified data if a refresh fails; show error/unknown rather than false success.
3. Prefer structured store APIs/JSON-LD/metadata and specialized adapters; validate image provenance and resolution.
4. Preserve distinct original price vs prior observed price; they are not the same.
5. Avoid bypassing rate limits or website access controls.
6. Firecrawl Free is being considered **only as a tested fallback** when the existing parser cannot extract complete data. Not integrated yet; evaluate costs and correctness with representative failing URLs.

## UX / brand
- Editorial, refined, minimal and mobile-friendly. Brand: “Curated by Muse”; title “The Wishlist”; tagline “Objects of desire. Collected with intention.”
- Dark narrow top strip with “Curated by Muse” left and “SINCE 2026” right.
- Edge-to-edge authentic product photos, delicate dividers/filters, understated controls; avoid bulky country toggles and overly bold tabs.
- Product card controls include visit store, refresh, edit/delete, purchased, drag reorder.

## Account transfer
Code and history stay in GitHub; connect GitHub in the destination ChatGPT account and read this file, KNOWN_ISSUES.md and NEXT_STEPS.md. ChatGPT memory and conversations do not automatically transfer. Exporting ChatGPT data is optional, not a substitute for project documentation. Netlify ownership/access and credentials must be configured separately. Browser localStorage does not move with GitHub, ChatGPT or Netlify deployment.

## Operating instructions for new assistant
Work in Ukrainian with the user. Prefer inspecting current GitHub files and tests before proposing patches. When authorized, commit changes directly to the connected repository; give exact local pull/test commands. Keep changes small, avoid destructive migrations, and verify CI/test failures before adding more code. The project is experimental; avoid unnecessary paid services or feature creep.
