import { test } from "node:test";
import assert from "node:assert/strict";
import { UNTAGGED, filterEntries, mergeTagMaps, parseTags, pruneTagMap, setTags, tagCounts, validateTagMap } from "../lib/tags.js";

const entries = [
  { url: "https://a.com", title: "Attention paper", hasBeenRead: false, creationTime: 3 },
  { url: "https://b.com", title: "Kafka at scale", hasBeenRead: true, creationTime: 2 },
  { url: "https://c.com", title: "Untitled", hasBeenRead: false, creationTime: 1 },
];
const map = { "https://a.com": ["ml", "now"], "https://b.com": ["archive", "systems"] };

test("parseTags normalizes", () => {
  assert.deepEqual(parseTags(" Now, #ML  ml,,interp "), ["interp", "ml", "now"]);
  assert.deepEqual(parseTags(""), []);
  assert.deepEqual(parseTags(undefined), []);
  assert.deepEqual(parseTags("__untagged__"), ["untagged__"]);
});

test("filter by tags (AND), status, query, untagged", () => {
  const urls = (r) => r.map((e) => e.url);
  assert.deepEqual(urls(filterEntries(entries, map)), ["https://a.com", "https://b.com", "https://c.com"]);
  assert.deepEqual(urls(filterEntries(entries, map, { tags: ["ml", "now"] })), ["https://a.com"]);
  assert.deepEqual(urls(filterEntries(entries, map, { tags: ["ml", "archive"] })), []);
  assert.deepEqual(urls(filterEntries(entries, map, { status: "unread" })), ["https://a.com", "https://c.com"]);
  assert.deepEqual(urls(filterEntries(entries, map, { status: "read" })), ["https://b.com"]);
  assert.deepEqual(urls(filterEntries(entries, map, { query: "SYSTEMS" })), ["https://b.com"]);
  assert.deepEqual(urls(filterEntries(entries, map, { tags: [UNTAGGED] })), ["https://c.com"]);
});

test("tagCounts ignores URLs not in the list", () => {
  const m = { ...map, "https://gone.com": ["ml"] };
  assert.deepEqual(tagCounts(entries, m), [["archive", 1], ["ml", 1], ["now", 1], ["systems", 1]]);
});

test("merge unions, replace replaces, bad input throws", () => {
  assert.deepEqual(mergeTagMaps(map, { "https://a.com": ["Interp"], "https://c.com": ["x"] })["https://a.com"], ["interp", "ml", "now"]);
  assert.deepEqual(mergeTagMaps(map, { "https://c.com": ["x"] }, "replace"), { "https://c.com": ["x"] });
  assert.throws(() => validateTagMap([]));
  assert.throws(() => validateTagMap({ "https://a.com": "ml" }));
  assert.deepEqual(validateTagMap({ "https://a.com": [] }), {});
  assert.deepEqual(validateTagMap(JSON.parse('{"__proto__": ["x"], "javascript:alert(1)": ["x"], "https://a.com": ["ok", 5]}')), { "https://a.com": ["ok"] });
});

test("merge: -tag removes, empty result drops the URL", () => {
  const m = mergeTagMaps(map, { "https://a.com": ["-ml", "interp"], "https://b.com": ["-archive", "-systems"] });
  assert.deepEqual(m["https://a.com"], ["interp", "now"]);
  assert.equal("https://b.com" in m, false);
  assert.deepEqual(mergeTagMaps({}, { "https://c.com": ["-x", "y"] }, "replace"), { "https://c.com": ["y"] });
});

test("prune and setTags", () => {
  assert.deepEqual(Object.keys(pruneTagMap(map, ["https://a.com"])), ["https://a.com"]);
  assert.equal("https://a.com" in setTags(map, "https://a.com", []), false);
  assert.equal(map["https://a.com"].length, 2, "setTags must not mutate");
});
