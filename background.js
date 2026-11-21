import { getTagMap, saveTagMap } from "./lib/store.js";
import { setTags } from "./lib/tags.js";

// Removing an entry from Chrome's reading list (anywhere) drops its tags.
chrome.readingList.onEntryRemoved.addListener(async (entry) => {
  const map = await getTagMap();
  if (entry.url in map) await saveTagMap(setTags(map, entry.url, []));
});
