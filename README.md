# Curated by Muse — v23

Built from v20. Existing localStorage data is preserved. No UI redesign.

## Run

```bash
npx netlify-cli dev --dir . --functions netlify/functions
```

## Zara Home integration

For Ukrainian Zara Home product links containing an eight-digit article (`-l41193121`) and three-digit `colorId` (`251`), the Netlify function first requests the observed public catalog API endpoint. It matches the returned color and product reference, selects the official `p1` image, and reads prices and size-level availability. Other countries continue to use the previous best-effort extraction; **UA prices are never substituted for other markets**.

If Zara Home blocks Netlify's server-side requests, the function returns a safe fallback rather than guessing photos/prices. The browser Network response (`/.netlify/functions/product?url=...`) includes `diagnostics.catalogError` for debugging.

Price conversion uses 100 minor units per currency unit, based on the catalog's integer price representation. Confirm against the displayed store price before relying on it.


## v22
- Refresh on a grouped product card checks **every offer** in that product group, rather than only the currently displayed offer.
- Each offer retains its own price, currency and stock. No country prices are copied between offers.
- A verified photo for an identical Zara article+color can be displayed for the group; unknown photos remain placeholders.
- Country catalogs other than UA are not configured: their results remain unknown rather than displaying UA prices.
- Existing localStorage key is unchanged; do not clear browser storage.


## v23 — multi-market groundwork + price history
- Ukrainian Zara catalog integration is unchanged and remains the known working market.
- Added per-market catalog configuration for Poland, with environment variables `ZARA_PL_STORE_ID`, `ZARA_PL_CATALOG_ID`, `ZARA_PL_LANGUAGE_ID`. **Not prefilled**: these must be verified from a real Polish Network request. Without them, PL offers remain unknown rather than receiving Ukrainian prices.
- The product details modal shows the three most recent saved price observations for each store, in that store's original currency. Observations are appended when a price changes; older history is preserved.
- One Refresh continues checking all offers in a group; existing localStorage data and UI layout remain intact.
- Currency conversion uses the existing NBU rate endpoint; delivery, taxes and duties are not included.

### To activate Poland
Open a product on `www.zarahome.com/pl/`, find its `/itxrest/2/catalog/store/<store>/<catalog>/product/<article><color>?languageId=<lang>&appId=2` request in Network, and set the three corresponding Netlify environment variables. Restart `netlify dev`. Do not copy the UA identifiers into these fields.


## v24: Poland Zara Home API

Added Polish catalog identifiers captured from the Zara Home PL Network request: store 85009924, catalog 80290000, language -47. Refresh still requests each grouped country offer separately. Currency for PL is PLN. Polish product response and Netlify live fetch still require testing. No existing localStorage data is reset.


## v25 — consistent cards and drag & drop
- Product titles reserve exactly two lines, truncate long names with an ellipsis, and keep details/prices aligned in the editorial grid.
- Use the six-dot handle at the bottom left of a product image to drag a card to a new position (mouse or touch).
- A grouped product is moved as a unit; country-specific offers remain together.
- Order persists using the existing `friday-list-v6` localStorage data array; no data reset or migration is required.
- Reordering is available in Wishlist and Purchased tabs. When a filter is active, hidden products retain their relative order.

## v26 — quieter drag & drop
- Six-dot handle is visible on card hover or keyboard focus; always visible on touch devices.
- Removed the thick rose drop outline and insertion stripe. Subtle lift and neutral shadow now signal dragging and drop targets.
- Reordering, product data, storage key and Zara integrations are unchanged.
