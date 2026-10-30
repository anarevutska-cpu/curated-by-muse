# Current State — Curated by Muse

Last reviewed: 2026-10-30. Baseline: v26 on `main`.

## Working in the current code
- Static Ukrainian-language wishlist with Wishlist and Purchased views, cards, filters, currency display and manual refresh.
- Product offers from multiple countries can be grouped into one card; refreshing a group checks its offers individually.
- Zara Home UA and PL catalog endpoint configurations are present in `netlify/functions/product.js`; real-world success was observed for the UA/PL nightgown in local testing. Other markets use conservative metadata fallback.
- Official variant images only when verified; do not replace a missing exact image with a similar product.
- Price conversion uses the National Bank of Ukraine endpoint through `netlify/functions/fx.js`; shipping, duties and taxes are not included.
- Price observations are stored per offer and surfaced in Product Details (recent three observations).
- Drag-and-drop product ordering with hover-only handle (touch-visible) and neutral lift/shadow. Product title area reserves two lines.
- Data persists in browser localStorage (key `friday-list-v6`); there is no user account or cloud sync.

## Known limitations / risks
- Store HTML/API requests may fail or be blocked; unknown values must remain unknown.
- API identifiers and response schemas are third-party dependencies and may change.
- No scheduled background refresh; user initiates refresh.
- Price history is local to the browser/device and may be lost if site data is cleared.
- No automated test suite or CI verified yet; UI interactions should be regression-tested in browser.
- README heading currently says v23 although it includes v26 notes; documentation cleanup is needed.

## Next verification checklist
- Confirm drag-and-drop on desktop and touch; check that no pink drop indicators remain.
- Check long titles, aligned prices and grouped card behavior across viewport widths.
- Refresh UA and PL variants; verify price, currency, stock and image against source pages.
- Verify that reload preserves product order, price history and purchased status.

Update this document whenever functionality or known limitations change.
