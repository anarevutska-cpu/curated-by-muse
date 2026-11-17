# Next steps — deliberately narrow MVP
Updated: 2026-11-17

1. **Safeguard data first.** Inspect current localStorage schema and implement Export Wishlist / Import Wishlist JSON with schema validation, duplicate handling, and no destructive overwrite by default. Back up user's existing list and verify restore. Do not touch localStorage until backup is tested.
2. **Stabilize code.** Reproduce and resolve GitHub CI failures, run syntax checks and unit tests; inspect recent changes before further patches.
3. **Improve core parsing.** Select 5 representative failing product URLs (Shypelyk, ÉTOILE, Beauty Time, Aromateque, ETNODIM); record actual name, exact variant, price, original price, stock and original high-resolution image; measure parser accuracy. Handle 403/429 transparently.
4. **Evaluate Firecrawl Free as fallback.** Test the same URLs against Firecrawl, verify exact variant and image fidelity, estimate credit usage. Keep current parser for successful stores. Do not commit API keys.
5. **Consider Netlify deployment** after data backup, smoke tests, and confirmation of account access. Explain that hosted URL alone does not sync wishlist between phone and laptop.
6. **Transfer to another ChatGPT account.** Connect GitHub in destination account; provide links to docs/PROJECT_HANDOVER.md, docs/KNOWN_ISSUES.md and this roadmap. Optionally export conversation history for archival reference.

## Explicitly deferred
- Supabase, authentication, accounts, multi-user permissions, cloud sync, public shared wishlists, automatic scheduled refresh, paid infrastructure. Reconsider only after parser reliability justifies expansion.

## Success criteria for current MVP
- Exact item/variant and original photo, not a visually similar substitute.
- Correct price and currency, distinguish genuine store sale from historical price movement.
- Correct stock or honest unknown status.
- Failed refresh never destroys existing verified user data.
- User can back up and restore Wishlist without technical intervention.
