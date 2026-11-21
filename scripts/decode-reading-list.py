"""Dump a Chrome profile's reading list as "title<TAB>url" lines.

Usage: uv run --python 3.12 --with plyvel python scripts/decode-reading-list.py <COPY of "Sync Data/LevelDB"> > list.tsv

Run it on a COPY of the directory, never the live one: plyvel opens LevelDB
read-write and takes a lock, which can fail or damage a running profile.
"""
import sys, plyvel
if len(sys.argv) != 2 or "Sync Data" in sys.argv[1]:
    sys.exit(__doc__)
db = plyvel.DB(sys.argv[1])
def fields(b):
    # minimal protobuf decode: yield (field, wiretype, value)
    i=0
    while i<len(b):
        k=0;s=0
        while True:
            c=b[i];i+=1;k|=(c&0x7f)<<s;s+=7
            if c<0x80:break
        f,w=k>>3,k&7
        if w==0:
            while b[i]&0x80:i+=1
            i+=1
        elif w==2:
            l=0;s=0
            while True:
                c=b[i];i+=1;l|=(c&0x7f)<<s;s+=7
                if c<0x80:break
            yield f,w,b[i:i+l];i+=l
        elif w==1:i+=8
        elif w==5:i+=4
        else:return
for k,v in db:
    if not k.startswith(b'reading_list-dt-'):continue
    try:
        d={f:val for f,w,val in fields(v) if w==2}
        print(d.get(2,b'').decode(errors='replace'),'\t',d.get(3,b'').decode(errors='replace'))
    except Exception as e:
        print(k[16:].decode(errors='replace'),'\t(?)')
