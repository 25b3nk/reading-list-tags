// Pure helpers (no chrome.* calls) so they can be tested with plain node.

export const UNTAGGED = "__untagged__";

/** "Now, #ml  interp" -> ["interp", "ml", "now"] (lowercased, deduped, sorted). */
export function parseTags(input) {
  const parts = String(input ?? "")
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase().replace(/^[#_]+/, "").slice(0, 64))
    .filter(Boolean);
  return [...new Set(parts)].sort();
}

/** Tag counts over entries that are actually in the reading list. */
export function tagCounts(entries, tagMap) {
  const counts = new Map();
  for (const e of entries) {
    for (const t of tagMap[e.url] ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/**
 * Filter + sort entries.
 * tags: AND match; include UNTAGGED to show only entries with no tags.
 * query: substring over title, url and tags.
 * status: "all" | "unread" | "read".
 */
export function filterEntries(entries, tagMap, { tags = [], query = "", status = "all" } = {}) {
  const q = query.trim().toLowerCase();
  const wantUntagged = tags.includes(UNTAGGED);
  const required = tags.filter((t) => t !== UNTAGGED);
  return entries
    .filter((e) => {
      const et = tagMap[e.url] ?? [];
      if (status === "unread" && e.hasBeenRead) return false;
      if (status === "read" && !e.hasBeenRead) return false;
      if (wantUntagged && et.length) return false;
      if (!required.every((t) => et.includes(t))) return false;
      if (q && !`${e.title} ${e.url} ${et.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => (b.creationTime ?? 0) - (a.creationTime ?? 0));
}

/** Validate an imported {url: [tags]} object; throws on bad shape. */
export function validateTagMap(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("expected an object of url -> [tags]");
  const out = {};
  for (const [url, tags] of Object.entries(obj)) {
    if (!/^https?:\/\//i.test(url)) continue; // only http(s) URLs; also skips "__proto__" etc.
    if (!Array.isArray(tags)) throw new Error(`tags for ${url} must be an array`);
    const clean = parseTags(tags.filter((t) => typeof t === "string").join(","));
    if (clean.length) out[url] = clean;
  }
  return out;
}

/**
 * Union-merge incoming tags into current (or replace when mode === "replace").
 * In merge mode a tag written as "-name" removes "name" from that URL.
 */
export function mergeTagMaps(current, incoming, mode = "merge") {
  const inc = validateTagMap(incoming);
  const split = (tags) => ({
    add: tags.filter((t) => !t.startsWith("-")),
    remove: new Set(tags.filter((t) => t.startsWith("-")).map((t) => t.slice(1))),
  });
  if (mode === "replace") {
    return Object.fromEntries(
      Object.entries(inc).map(([u, t]) => [u, split(t).add]).filter(([, t]) => t.length),
    );
  }
  const out = { ...current };
  for (const [url, tags] of Object.entries(inc)) {
    const { add, remove } = split(tags);
    const next = [...new Set([...(out[url] ?? []), ...add])].filter((t) => !remove.has(t)).sort();
    if (next.length) out[url] = next;
    else delete out[url];
  }
  return out;
}

/** Drop tags for URLs no longer in the reading list. */
export function pruneTagMap(tagMap, urls) {
  const keep = new Set(urls);
  return Object.fromEntries(Object.entries(tagMap).filter(([u]) => keep.has(u)));
}

export function setTags(tagMap, url, tags) {
  const out = { ...tagMap };
  if (tags.length) out[url] = tags;
  else delete out[url];
  return out;
}
