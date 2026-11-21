# Reading List Tags

A Chrome extension (Manifest V3) that adds **tags** to Chrome's built-in Reading List, then lets you search and filter by them. Chrome's own reading list only knows read/unread.

## Features

- **Popup** (toolbar icon or `Alt+Shift+R`): tag the current page. If it isn't in the reading list yet, it's added. Your most-used tags appear as clickable suggestions.
- **List page** (popup → *Open list*):
  - search over title, URL and tags
  - filter by one or more tags (AND), plus an **untagged** view (an inbox for items saved from your phone)
  - unread / all / read views
  - inline tag editing, mark read/unread, remove (two clicks, no dialog)
  - live refresh when the list or tags change anywhere
- **Export / Import** tags as JSON (import merges), for backup or moving to another machine.
- **Cleanup:** removing an entry from the reading list anywhere drops its tags.

## How sync works

| What | Where it lives | Syncs across devices? |
|------|----------------|-----------------------|
| Reading-list entries | Chrome's own reading list (`chrome.readingList`) | Yes, via Chrome Sync |
| Tags | `chrome.storage.local`, as `{url: [tags]}` | No; use Export/Import |

The extension never keeps its own copy of the list. It reads and writes Chrome's real list. Chrome on mobile doesn't run extensions, so items saved there show up as *untagged*.

Tags use `storage.local` because `storage.sync` caps at 512 keys / 100 KB.

## Install (unpacked)

1. Open `chrome://extensions` in the Chrome profile whose reading list you want, and turn on **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Optional: *Open list* → **Import** a tag map (see [Seeding tags](#seeding-tags), or try `seed/example-seed.json`).

Requires Chrome 120+.

## Permissions

| Permission | Why |
|------------|-----|
| `readingList` | read, add, update and remove reading-list entries |
| `storage` | store tags locally |
| `activeTab` | read the current tab's URL and title when you open the popup |

No network requests, no analytics, and no host permissions.

## Project layout

```
manifest.json      MV3 manifest
background.js      service worker: drops tags when an entry is removed
popup.html/.js     tag the current page
list.html/.js      full list: search, filter, edit, export/import
style.css          shared styles (light/dark)
lib/tags.js        pure helpers (parse, filter, merge, prune); unit-tested
lib/store.js       chrome.storage.local wrapper
test/              node --test unit tests
scripts/           one-off helpers for seeding tags from an existing list
seed/              example-seed.json (format example)
```

## Development

```
npm test           # node --test test/*.mjs (Node 20+), no dependencies
```

After editing, reload the extension on `chrome://extensions` (↻). Manual checks:

- [ ] popup on a new page → *Add + tag* → it appears in the list with its tags
- [ ] a tag filter shows only matching items; *untagged* shows items with no tags
- [ ] *Mark read* moves an item out of the Unread view
- [ ] *Remove* (twice) deletes the entry, and its tags are gone after a re-import check or Export
- [ ] Export → Import round-trips

## Seeding tags

To tag an existing reading list in bulk:

1. Copy (don't open in place) `<chrome profile>/Sync Data/LevelDB` somewhere, then dump the entries:
   ```
   uv run --python 3.12 --with plyvel python scripts/decode-reading-list.py <copy-dir> > list.tsv
   ```
2. Edit the URL-pattern rules in `scripts/seed-from-tsv.py`, then:
   ```
   python3 scripts/seed-from-tsv.py list.tsv > seed/tags-seed.local.json
   ```
3. *Open list* → **Import** → `seed/tags-seed.local.json`.

`*.tsv` and `seed/*.local.json` are gitignored because they contain your browsing data. `seed/example-seed.json` shows the format.

The tag map format is plain JSON: `{"https://example.com/post": ["next", "ml"]}`. On import, a tag written as `"-ml"` removes `ml` from that URL. Tags key on the exact URL Chrome stores, including the hash and query string, so `http://` and `https://` variants are separate.

## Roadmap

- Optional tag sync via `storage.sync`
- Side panel view
- Context-menu "Save to reading list with tags"

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
