"""Turn a decode-reading-list.py TSV dump into a {url: [tags]} map.

Usage: python3 scripts/seed-from-tsv.py list.tsv > seed/tags-seed.local.json
(*.tsv and seed/*.local.json are gitignored: they hold your browsing data.)
"""
import json, sys, re
rules = [  # (url regex, tags), first match wins. Edit these for your own list.
 (r"arxiv\.org|openreview\.net", ["next", "paper"]),
 (r"youtube\.com|youtu\.be", ["video"]),
 (r"medium\.com|substack\.com", ["blog"]),
]
out, miss = {}, []
for line in open(sys.argv[1]):
    if "\t" not in line: continue
    url = line.rsplit("\t",1)[1].strip()
    for pat, tags in rules:
        if re.search(pat, url): out[url] = tags; break
    else: miss.append(url)
print(json.dumps(out, indent=2, sort_keys=True))
print(f"{len(out)} mapped, unmatched: {miss}", file=sys.stderr)
