# ZIP Extractor

Web app for browsing online zip files,
without having to download the complete file.

Run locally:
```shell
npx zip-extractor
```
or download and:
```shell
./zip-extractor.js
```

Online demo: https://www.ting.st/zip-extractor.html

It uses HTTP Range requests to fetch parts of the file, like:

```
0. HEAD ───────────────────────────────> file.zip
         <─────Content-Length─────────╯  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
                                         ┃ PK\3\4 Local file header 1  ┃<─╮
                                         ┃   2344 bytes                ┃  │
                                         ┃   chapter1.txt              ┃  │
                                         ┃   [compressed data]         ┃  │
1. GET ─────────────────────────────╮    ┠─────────────────────────────┨  │
   Range: last bytes before         │   ⎧┃ PK\3\4 Local file header 2  ┃<─│─╮
          content-length            │   ⎪┃   3210 bytes                ┃  │ │
                                  ╭─│──>⎨┃   chapter2.txt              ┃  │ │
                                  │ │   ⎩┃   [compressed data]         ┃  │ │
                                  │ │    ┠─────────────────────────────┨  │ │
2. GET ─────────────────────────╮ │ │    ┃ ...                         ┃  │ │
   Range: [central dir offset,  │ │ │    ┠─────────────────────────────┨  │ │
           offset + size]       │ │ │   ⎧┃ PK\1\2 Central dir header 1 ┃<─│─│─╮
                                │ │ │   ⎪┃   2344 bytes                ┃  │ │ │
                                ╰─│─│──>⎨┃   chapter1.txt offset───────╂──╯ │ │
                                  │ │   ⎪┃ PK\1\2 Central dir header 2 ┃    │ │
 O                                │ │   ⎪┃   3210 bytes                ┃    │ │
/|\                               │ │   ⎪┃   chapter2.txt offset───────╂────╯ │
/ \                               │ │   ⎩┃ ...                         ┃      │
                                  │ │    ┠─────────────────────────────┨      │
3. GET ───────────────────────────╯ │   ⎧┃ PK\5\6 End of central dir   ┃      │
   Range: [entry offset,            ╰──>⎨┃   Central dir entry count   ┃      │
           offset + size]               ⎪┃   Central dir size          ┃      │
                                        ⎩┃   Central dir offset────────╂──────╯
                                         ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

