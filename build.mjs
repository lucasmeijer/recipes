// Builds the site into dist/: copies every recipes/*.html and writes an index page listing them.
// No dependencies. Run with: node build.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const SRC = "recipes", OUT = "dist";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

const text = html => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// date a recipe was first added, from git; falls back to today
function added(file) {
  try {
    const out = execFileSync("git", ["log", "--diff-filter=A", "--follow", "--format=%cs", "--", file], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (out) return out.split("\n").pop();
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

const recipes = readdirSync(SRC).filter(f => f.endsWith(".html")).map(f => {
  const html = readFileSync(`${SRC}/${f}`, "utf8");
  copyFileSync(`${SRC}/${f}`, `${OUT}/${f}`);
  const header = html.match(/<header>([\s\S]*?)<\/header>/)?.[1] ?? "";
  const title = text(header.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? "") || text(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? f);
  const facts = [...header.matchAll(/<span>([\s\S]*?)<\/span>/g)].map(m => text(m[1])).filter(s => !/^Equipment/i.test(s));
  const ingredients = [...html.matchAll(/<div class="ing">[\s\S]*?<span>([\s\S]*?)<\/span>/g)].map(m => text(m[1]));
  return { href: f.replace(/\.html$/, ""), title, facts, date: added(`${SRC}/${f}`), search: [title, ...ingredients].join(" ").toLowerCase() };
}).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

const items = recipes.map(r => `
    <li data-search="${esc(r.search)}"><a href="${esc(r.href)}">
      <span class="t">${esc(r.title)}</span>
      <span class="f">${r.facts.map(esc).join(" · ")}</span>
      <time>${r.date}</time>
    </a></li>`).join("");

writeFileSync(`${OUT}/index.html`, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-title" content="Recipes">
<title>Recipes</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Kalam:wght@700&display=swap");
:root{--paper:#fdfcf3;--sheet:#fffef8;--ink:#1f2a44;--muted:#6a7593;--rule:#3a5a9a;--line:#a9bbdf}
*{box-sizing:border-box}
body{margin:0 auto;max-width:760px;font:16px/1.4 Nunito,system-ui,sans-serif;color:var(--ink);
  background:linear-gradient(rgba(58,90,154,.12) 1px,transparent 1px) 0 0/100% 28px,var(--paper);
  padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 48px max(16px,env(safe-area-inset-left))}
h1{font:700 2em/1.1 Kalam,cursive;margin:8px 0 14px}
input{width:100%;font:inherit;padding:12px 14px;border:1.5px solid var(--rule);background:var(--sheet);color:inherit;border-radius:0;-webkit-appearance:none}
input:focus{outline:2px solid var(--line)}
ul{list-style:none;margin:14px 0 0;padding:0;border:1.5px solid var(--rule);background:var(--sheet)}
li + li{border-top:1px solid var(--line)}
a{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:14px;color:inherit;text-decoration:none}
a:hover,a:active{background:color-mix(in srgb,var(--line) 18%,var(--sheet))}
.t{font:700 1.3em/1.15 Kalam,cursive}
.f{grid-column:1;color:var(--muted);font-size:.9em}
time{grid-column:2;grid-row:1;color:var(--muted);font-size:.8em;align-self:center}
.empty{color:var(--muted);padding:14px;display:none}
</style>
</head>
<body>
<h1>Recipes</h1>
<input id="q" type="search" placeholder="Search by name or ingredient…" autocomplete="off">
<ul id="list">${items}
</ul>
<p class="empty" id="empty">No recipes match.</p>
<script>
const q = document.getElementById("q"), lis = [...document.querySelectorAll("#list li")];
q.oninput = () => {
  const words = q.value.toLowerCase().split(/\\s+/).filter(Boolean);
  let shown = 0;
  for (const li of lis) { const ok = words.every(w => li.dataset.search.includes(w)); li.hidden = !ok; shown += ok; }
  document.getElementById("empty").style.display = shown ? "none" : "block";
};
</script>
</body>
</html>
`);

console.log(`Built ${recipes.length} recipes into ${OUT}/`);
