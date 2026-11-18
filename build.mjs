// Builds the site into dist/: copies everything in recipes/ (pages, toolchart.css, toolchart.js)
// and writes an index page listing the recipe pages.
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

for (const f of readdirSync(SRC)) copyFileSync(`${SRC}/${f}`, `${OUT}/${f}`);

const recipes = readdirSync(SRC).filter(f => f.endsWith(".html")).map(f => {
  const html = readFileSync(`${SRC}/${f}`, "utf8");
  const header = html.match(/<header>([\s\S]*?)<\/header>/)?.[1] ?? "";
  const title = text(header.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? "") || text(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? f);
  const facts = [...header.matchAll(/<span>([\s\S]*?)<\/span>/g)].map(m => text(m[1])).filter(s => !/^Equipment/i.test(s));
  const ingredients = [...html.matchAll(/<div class="ing">[\s\S]*?<span>([\s\S]*?)<\/span>/g)].map(m => text(m[1]));
  return { href: f.replace(/\.html$/, ""), title, facts, date: added(`${SRC}/${f}`), search: [title, ...ingredients].join(" ").toLowerCase() };
}).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

// copied to the clipboard by the button on the home page
const AGENT_INSTRUCTIONS = "Fork github.com/lucasmeijer/recipes into my own GitHub account. " +
  "Ask me whether I want to keep the existing recipes or start without any. " +
  "To have the results published automatically, set up something like GitHub Pages or Cloudflare Pages, like the original repo does. " +
  "Then explain to me that I can start an agent in a clone of my new repo and ask it to make batch-cooking recipes, " +
  "and that they'll automatically be added to my new website.";

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
<script src="toolchart.js" defer></script>
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
.agent{display:block;margin:20px auto 0;padding:4px 6px;font:inherit;font-size:.85em;color:var(--muted);background:none;border:0;cursor:pointer;
  text-decoration:underline dotted;text-underline-offset:3px;transition:color .2s}
.agent:hover{color:var(--ink)}
.agent .done{display:none;color:#2f8f5b;text-decoration:none}
.agent.copied{text-decoration:none}
.agent.copied .idle{display:none}
.agent.copied .done{display:inline;animation:fade .3s ease-out}
@keyframes fade{from{opacity:0;transform:translateY(3px)}}
@media (prefers-reduced-motion:reduce){.agent .done{animation:none}}
</style>
</head>
<body>
<h1>Recipes</h1>
<input id="q" type="search" placeholder="Search by name or ingredient…" autocomplete="off">
<ul id="list">${items}
</ul>
<p class="empty" id="empty">No recipes match.</p>
<button class="agent" id="agent" type="button"><span class="idle">Agent instructions for getting your own version of this recipe website</span><span class="done" aria-live="polite">✓ Copied to clipboard</span></button>
<script>
const q = document.getElementById("q"), lis = [...document.querySelectorAll("#list li")];
q.oninput = () => {
  const words = q.value.toLowerCase().split(/\\s+/).filter(Boolean);
  let shown = 0;
  for (const li of lis) { const ok = words.every(w => li.dataset.search.includes(w)); li.hidden = !ok; shown += ok; }
  document.getElementById("empty").style.display = shown ? "none" : "block";
};
const agent = document.getElementById("agent"), instructions = ${JSON.stringify(AGENT_INSTRUCTIONS)};
let timer;
agent.onclick = async () => {
  try { await navigator.clipboard.writeText(instructions); }
  catch {
    const t = Object.assign(document.createElement("textarea"), { value: instructions });
    document.body.append(t); t.select(); document.execCommand("copy"); t.remove();
  }
  agent.classList.remove("copied"); void agent.offsetWidth; agent.classList.add("copied");
  clearTimeout(timer); timer = setTimeout(() => agent.classList.remove("copied"), 2000);
};
</script>
</body>
</html>
`);

console.log(`Built ${recipes.length} recipes into ${OUT}/`);
