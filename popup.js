import { parseTags, tagCounts } from "./lib/tags.js";
import { getTagMap, setTags } from "./lib/store.js";

const $ = (id) => document.getElementById(id);

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const url = tab?.url ?? "";
const title = tab?.title || url;
$("title").textContent = title;
$("title").title = url;

const canSave = /^https?:/.test(url);
const [existing] = canSave ? await chrome.readingList.query({ url }) : [];
const map = await getTagMap();
const current = map[url] ?? [];

$("tags").value = current.join(", ");
$("status").textContent = !canSave
  ? "Only http(s) pages can go in the reading list."
  : existing ? "In reading list" : "Not in reading list yet — Save adds it";
$("save").disabled = !canSave;
$("save").textContent = existing ? "Save tags" : "Add + tag";

// Suggest existing tags (most used first); click toggles it in the input.
const all = tagCounts(await chrome.readingList.query({}), map).slice(0, 20);
for (const [t] of all) {
  const chip = document.createElement("span");
  chip.className = "chip" + (current.includes(t) ? " on" : "");
  chip.textContent = t;
  chip.onclick = () => {
    const tags = new Set(parseTags($("tags").value));
    tags.has(t) ? tags.delete(t) : tags.add(t);
    $("tags").value = [...tags].sort().join(", ");
    chip.classList.toggle("on");
  };
  $("suggest").append(chip);
}

$("form").onsubmit = async (ev) => {
  ev.preventDefault();
  if (!canSave) return;
  try {
    if (!existing) await chrome.readingList.addEntry({ url, title, hasBeenRead: false });
    await setTags(url, parseTags($("tags").value));
    window.close();
  } catch (e) {
    $("status").textContent = `Error: ${e.message}`;
  }
};

$("open-list").onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL("list.html") });
