# Roadmap — Curated by Muse

Last reviewed: 2026-10-30. Planning document; not a promise of delivery dates.

## Now — reliability and maintainability
- [ ] Regression test v26 drag-and-drop, hover handle, card alignment, grouped refresh and localStorage persistence.
- [ ] Add lightweight automated tests for Zara URL/variant parsing, API response handling, grouping and sorting.
- [ ] Add CI workflow to run syntax checks/tests on pull requests.
- [ ] Clean README entry point and keep documentation updated with code changes.

## Next — price tracking value
- [ ] Add a clear price-history chart with original-currency labels and observation dates.
- [ ] Show exchange-rate source and timestamp in the comparison UI.
- [ ] Improve price/stock status transparency and graceful failure per country.
- [ ] Evaluate additional Zara Home markets (e.g. Spain) only after verifying official catalog identifiers.

## Later — scale and resilience
- [ ] Evaluate adapters for additional supported stores with exact-image verification.
- [ ] Consider optional cloud sync/backup across devices; do not replace local data without migration.
- [ ] Consider accessibility and mobile reordering improvements.
- [ ] Consider a deployment preview workflow via Netlify.

## Non-goals for now
- No automatic daily background scraping.
- No guessed prices, stock or substitute product photos.
- No mandatory login or account system.

Move completed items into CHANGELOG and update CURRENT_STATE when shipped.
