# Changelog

## 0.1.0 — 2026-11-21

First version.

- Popup: tag the current page; adds it to the reading list if missing; tag suggestions.
- List page: search, AND tag filter, untagged/unread/read views, inline tag edit, mark read, two-click remove, live refresh.
- Export/Import tag map as JSON (merge); a "-tag" in an import removes that tag.
- List shows "(http)" next to non-https entries so duplicates are easy to spot.
- Background: drop tags when an entry is removed.
- Seeding scripts and a format example (`seed/example-seed.json`).
- Unit tests for the pure helpers (`node --test`).
