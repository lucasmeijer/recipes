# Agent instructions

This repo is a collection of recipes, each a self-contained HTML page in `recipes/`.

- Skills live in `skills/`. Read the relevant `SKILL.md` before doing recipe, batch-cooking or grocery work.
- Save every recipe as `recipes/<name>.html`, using a short lowercase-hyphenated name like `chili-sin-carne.html`. The file name becomes its URL.
- `recipes/toolchart.css` and `recipes/toolchart.js` are shared by every recipe page. Only change them to change the look or behavior of all recipes.
- Don't edit `dist/`; `node build.mjs` generates it. The site publishes when changes are pushed to `main`.
