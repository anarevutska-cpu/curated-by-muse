# Decisions — Curated by Muse

Keep durable product and technical decisions here. Add new entries with date, context, decision and consequences.

## 2026-10-30 — GitHub as source of truth
**Decision:** Maintain the site in `anarevutska-cpu/curated-by-muse`, with a persistent local clone and Netlify Dev; stop relying on versioned ZIP folders for normal iteration.
**Why:** Reduce manual unpacking and avoid accidentally serving old versions.
**Consequence:** Code changes must be committed/pushed before `git pull` can retrieve them locally.

## 2026-10-29 — Group offers, refresh all countries
**Decision:** Same article/color across countries is one card, but each country's offer retains its own price, currency, stock and history. Card Refresh updates all offers.
**Why:** One product should be compared across markets without duplicate cards or manual per-country refresh.

## 2026-10-29 — Never substitute approximate product photos or prices
**Decision:** Only exact verified variant photos and grounded price/availability; otherwise show placeholder/unknown.
**Why:** Wrong color, hardware or country pricing makes a wishlist misleading.

## 2026-10-29 — Quiet reorder affordance
**Decision:** Drag handle appears on hover/focus (always on touch); neutral shadow/lift rather than pink outlines or insertion stripes.
**Why:** Preserve the restrained editorial visual system.

## 2026-10-30 — Documentation as part of change delivery
**Decision:** Update CURRENT_STATE, ARCHITECTURE, ROADMAP, PRODUCT_REQUIREMENTS, DECISIONS or CHANGELOG when their subject changes, ideally in the same PR/commit as the code.
**Why:** Prevent drift between implemented behavior and written plans.
