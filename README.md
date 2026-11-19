# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ujang201/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ujang201/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Bay is an offline cover art maker in the style of GTA 6 posters: load your own photos, arrange them in multi-panel layouts, write a bold caption, pick a Vice City sunset or neon colour grade, and export a PNG to share. Everything runs in the browser — your photos never leave your machine.

## What it does

- **Any photo:** pick your own photos from your machine, or use the two built-in samples. Click a panel to select it, drag to pan its photo, use the zoom slider to crop in, or fill every panel with one photo.
- **Four layouts:** Hero split, Comic trio, Four grid, and Solo — a multi-panel poster look throughout.
- **Caption:** bold display lettering (Anton, SIL Open Font License) with size, colour, top/bottom placement, tilt, and an optional dark bar.
- **Grades and effects:** Sunset, Neon night, Palm noir, or no grade; film grain, halftone dots, and vignette toggles.
- **Export:** PNG in 1080 × 1080, 1080 × 1350, and 1920 × 1080 — one click each, or all three at once. Live preview throughout.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `app/` is plain static files. To hand the entry in, `MAKEFUN_OUTPUT_DIR=out node main.ts` copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=wfjv7kgb&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
