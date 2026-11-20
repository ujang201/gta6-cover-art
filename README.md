# Neon Bay — GTA 6 Cover Art Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ujang201/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ujang201/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Bay turns your photos and a caption into GTA-style cover art in the
browser, offline, and exports it as a PNG to share. Pick a photo (yours, or
one of the two built-in samples), arrange it across four multi-panel poster
layouts, write a bold caption, pick a Vice City sunset or neon grade, and
export in 1080×1080, 1080×1350 or 1920×1080.

## What it does

- **Any photo:** load your own photos from your machine (read locally, never
  uploaded) or use the two built-in samples. Click a panel to select it, drag
  to pan its photo, use the zoom slider to crop in, or fill every panel with
  one photo.
- **Four layouts:** Hero split (one large panel + two small), Comic trio,
  Four grid (2×2), Solo (one full-bleed photo).
- **Caption:** bold Anton display lettering (SIL Open Font License, shipped
  under `app/fonts/`) with size, colour, top/bottom placement, tilt, and an
  optional dark bar behind it.
- **Grades & finish:** Sunset, Neon night, Palm noir, or no grade — plus
  film grain, halftone dots and vignette toggles.
- **Export:** one click per size, or all three at once, as PNG files.
- **Live preview:** everything you change shows in the preview at once.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` from any static file server. No build step, no
network requests — every script, font and image loads from `app/`.

The app also takes a query boot for screenshots:
`?shot=editor|cover&photo=&caption=&layout=&grade=&size=`.

---

Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.
https://make.fun/bounty/gta6-cover-art-01?ref=wfjv7kgb
