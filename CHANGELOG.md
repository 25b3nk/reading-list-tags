# Changelog

## 0.1.2 — 2026-11-21

- Popup: *Mark read* / *Mark unread* button for pages already in the reading list (one click, then the popup closes); status shows "· read" for read pages.

## 0.1.1 — 2026-11-21

UI polish; no change to storage, permissions or tag logic.

- New calm blue/slate palette as CSS custom properties, with a dark-mode override; text, chips, buttons and focus rings checked for WCAG AA in both themes.
- Popup: page title and status on the left, *Open list ↗* top-right; Save stays the main action; "Your tags" section; status dot (in list / not yet / error).
- List page: title + summary header, grouped Export/Import, entries as cards, read entries dimmed, subtle tag-count badges, clear active filter chips (✓), red filled "Sure?" remove state, empty state when nothing matches, single-column layout under 560px.
- Chips are now buttons (keyboard reachable, `aria-pressed` on toggles); visible focus outlines for keyboard users.
- Extension icon (16/32/48/128 PNG from `icons/icon.svg`).

## 0.1.0 — 2026-11-21

First version.

- Popup: tag the current page; adds it to the reading list if missing; tag suggestions.
- List page: search, AND tag filter, untagged/unread/read views, inline tag edit, mark read, two-click remove, live refresh.
- Export/Import tag map as JSON (merge); a "-tag" in an import removes that tag.
- List shows "(http)" next to non-https entries so duplicates are easy to spot.
- Background: drop tags when an entry is removed.
- Seeding scripts and a format example (`seed/example-seed.json`).
- Unit tests for the pure helpers (`node --test`).
