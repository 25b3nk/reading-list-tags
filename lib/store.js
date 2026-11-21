// Tag storage: one key in chrome.storage.local holding {url: [tags]}.
// local, not sync: sync caps at 512 keys / 100 KB. Use export/import to move tags.
import { setTags as setTagsPure } from "./tags.js";

const KEY = "tags";

export async function getTagMap() {
  const r = await chrome.storage.local.get(KEY);
  return r[KEY] ?? {};
}

export async function saveTagMap(map) {
  await chrome.storage.local.set({ [KEY]: map });
}

export async function setTags(url, tags) {
  await saveTagMap(setTagsPure(await getTagMap(), url, tags));
}

export function onTagMapChanged(cb) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && KEY in changes) cb(changes[KEY].newValue ?? {});
  });
}
