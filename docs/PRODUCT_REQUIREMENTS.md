# Product Requirements — Curated by Muse

Last reviewed: 2026-10-30.

## Purpose
A personal editorial wishlist and manual price tracker for products from multiple stores/countries, especially ahead of Black Friday.

## Core requirements
- Add an exact product URL quickly; keep its original link and selected options such as color/size when known.
- Display an exact verified product image, name, selected variant, availability and price. If the correct image is unavailable, show the branded placeholder rather than a similar image.
- Group identical article+color offers across countries into one card, with individual store/country price and availability in details.
- One card Refresh updates all its country offers independently; failure of one must not overwrite successful data for another.
- Display selected currency (UAH/EUR/USD) with original store currency visible in offer details; clarify that converted prices exclude shipping and duties.
- Maintain Wishlist/Purchased tabs, filters and a clean four-column editorial grid where titles do not misalign prices.
- Reorder whole product cards by a drag handle; hover-only on pointer devices, visible on touch; persist order on reload.
- Refresh when user visits or clicks; no required background schedule.
- Preserve user catalog, purchase state and price history across code upgrades. Avoid destructive storage resets.

## Acceptance criteria for changes
- Exact article/color and country remain correctly associated with each offer.
- Price/currency/stock remain per-offer; never copy another country's value as a fallback.
- All visible product cards maintain consistent layout with one- and two-line names.
- Refresh, drag-and-drop, modal links, filters and purchased state still work after change.
- Existing localStorage data survives reload and deployment.
