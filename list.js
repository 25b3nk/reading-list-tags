import { UNTAGGED, filterEntries, mergeTagMaps, parseTags, pruneTagMap, tagCounts } from "./lib/tags.js";
import { getTagMap, onTagMapChanged, saveTagMap, setTags } from "./lib/store.js";

const $ = (id) => document.getElementById(id);
const state = { entries: [], map: {}, tags: [], query: "", status: "unread" };

// Remember filters across opens (per-browser convenience only).
try {
  const saved = JSON.parse(localStorage.getItem("filters") ?? "{}");
  if (Array.isArray(saved.tags)) state.tags = saved.tags.filter((t) => typeof t === "string");
  if (["all", "unread", "read"].includes(saved.status)) state.status = saved.status;
} catch {}
const persist = () => {
  try { localStorage.setItem("filters", JSON.stringify({ tags: state.tags, status: state.status })); } catch {}
};

async function load() {
  [state.entries, state.map] = await Promise.all([chrome.readingList.query({}), getTagMap()]);
  render();
}

function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
}

function renderFilter() {
  const box = $("tag-filter");
  box.replaceChildren();
  const untaggedN = state.entries.filter((e) => !(state.map[e.url] ?? []).length).length;
  const counts = [...tagCounts(state.entries, state.map), [UNTAGGED, untaggedN]];
  // Keep active-but-now-empty tags visible so they can be switched off.
  for (const t of state.tags) if (!counts.some(([c]) => c === t)) counts.push([t, 0]);
  for (const [t, n] of counts) {
    if (t === UNTAGGED && !n && !state.tags.includes(UNTAGGED)) continue;
    const chip = el("span", { className: "chip" + (state.tags.includes(t) ? " on" : "") },
      t === UNTAGGED ? "untagged" : t, el("span", { className: "n", textContent: n }));
    chip.onclick = () => {
      state.tags = state.tags.includes(t) ? state.tags.filter((x) => x !== t) : [...state.tags, t];
      persist();
      render();
    };
    box.append(chip);
  }
}

function renderEntry(e) {
  const tags = state.map[e.url] ?? [];
  const host = (() => { try { return new URL(e.url).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  const added = e.creationTime ? new Date(e.creationTime).toISOString().slice(0, 10) : "";

  const link = /^https?:/i.test(e.url)
    ? el("a", { href: e.url, target: "_blank", rel: "noopener", textContent: e.title || e.url })
    : el("span", { textContent: e.title || e.url });
  const meta = el("div", { className: "meta muted", textContent: `${host}${e.url.startsWith("http:") ? " (http)" : ""} · added ${added}` });

  const tagChips = el("div", { className: "chips" });
  for (const t of tags) {
    const c = el("span", { className: "chip", textContent: t, title: "Filter by this tag" });
    c.onclick = () => { if (!state.tags.includes(t)) state.tags = [...state.tags, t]; persist(); render(); };
    tagChips.append(c);
  }
  const edit = el("input", { type: "text", className: "tag-edit", value: tags.join(", "), placeholder: "add tags…" });
  edit.onchange = () => setTags(e.url, parseTags(edit.value));

  const readBtn = el("button", { type: "button", textContent: e.hasBeenRead ? "Mark unread" : "Mark read" });
  readBtn.onclick = () => chrome.readingList.updateEntry({ url: e.url, hasBeenRead: !e.hasBeenRead });

  // Two-click remove instead of confirm() so no modal dialog blocks the page.
  const rm = el("button", { type: "button", className: "danger", textContent: "Remove" });
  rm.onclick = () => {
    if (rm.dataset.armed) return chrome.readingList.removeEntry({ url: e.url });
    rm.dataset.armed = "1";
    rm.textContent = "Sure?";
    setTimeout(() => { delete rm.dataset.armed; rm.textContent = "Remove"; }, 3000);
  };

  return el("li", { className: "entry" + (e.hasBeenRead ? " read" : "") },
    link, el("div", { className: "actions" }, readBtn, rm), meta, tagChips, edit);
}

function render() {
  $("q").value = state.query;
  $("status").value = state.status;
  renderFilter();
  const shown = filterEntries(state.entries, state.map, state);
  $("entries").replaceChildren(...shown.map(renderEntry));
  const unread = state.entries.filter((e) => !e.hasBeenRead).length;
  $("summary").textContent = `${shown.length} shown · ${state.entries.length} total · ${unread} unread`;
}

$("q").oninput = (ev) => { state.query = ev.target.value; render(); };
$("status").onchange = (ev) => { state.status = ev.target.value; persist(); render(); };

$("export").onclick = async () => {
  const map = pruneTagMap(await getTagMap(), state.entries.map((e) => e.url));
  const blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
  const a = el("a", { href: URL.createObjectURL(blob), download: `reading-list-tags-${new Date().toISOString().slice(0, 10)}.json` });
  a.click();
  URL.revokeObjectURL(a.href);
};

$("import").onclick = () => $("import-file").click();
$("import-file").onchange = async (ev) => {
  const file = ev.target.files[0];
  ev.target.value = "";
  if (!file) return;
  try {
    const incoming = JSON.parse(await file.text());
    const merged = mergeTagMaps(await getTagMap(), incoming, "merge");
    await saveTagMap(merged);
    const inList = new Set(state.entries.map((e) => e.url));
    const missing = Object.keys(incoming).filter((u) => !inList.has(u)).length;
    $("summary").textContent = `Imported tags for ${Object.keys(incoming).length} URLs` +
      (missing ? ` (${missing} not in this reading list; kept but hidden)` : "");
  } catch (e) {
    $("summary").textContent = `Import failed: ${e.message}`;
  }
};

// Live refresh on changes from the popup, Chrome's own UI, or other tabs.
onTagMapChanged((map) => { state.map = map; render(); });
for (const ev of ["onEntryAdded", "onEntryRemoved", "onEntryUpdated"]) chrome.readingList[ev].addListener(load);

load();
