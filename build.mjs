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
.agent{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin:28px 0 0;padding:14px;
  font:600 1em/1.3 Nunito,system-ui,sans-serif;color:var(--rule);background:var(--sheet);border:1.5px dashed var(--rule);cursor:pointer;
  transition:transform .15s,color .3s,border-color .3s}
.agent:hover{background:color-mix(in srgb,var(--line) 18%,var(--sheet))}
.agent:active{transform:scale(.98)}
.agent::before{content:"";position:absolute;inset:0;background:#2f8f5b;transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.agent > span{position:relative;display:flex;align-items:center;gap:10px;transition:opacity .2s,transform .3s}
.agent .done{position:absolute;opacity:0;transform:translateY(14px)}
.agent svg{width:22px;height:22px;flex:none;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.agent .tick{stroke-dasharray:24;stroke-dashoffset:24}
.agent.copied{color:#fff;border-color:#2f8f5b;border-style:solid;animation:pop .45s cubic-bezier(.3,1.6,.5,1)}
.agent.copied::before{transform:scaleX(1)}
.agent.copied .idle{opacity:0;transform:translateY(-14px)}
.agent.copied .done{opacity:1;transform:none;transition-delay:.15s}
.agent.copied .tick{animation:draw .4s .3s ease-out forwards}
@keyframes pop{40%{transform:scale(1.03)}}
@keyframes draw{to{stroke-dashoffset:0}}
@media (prefers-reduced-motion:reduce){.agent,.agent *,.agent::before{animation:none!important;transition:none!important}.agent.copied .tick{stroke-dashoffset:0}}
</style>
</head>
<body>
<h1>Recipes</h1>
<input id="q" type="search" placeholder="Search by name or ingredient…" autocomplete="off">
<ul id="list">${items}
</ul>
<p class="empty" id="empty">No recipes match.</p>
<button class="agent" id="agent" type="button">
  <span class="idle"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2"/></svg>Agent instructions for getting your own version of this recipe website</span>
  <span class="done" aria-live="polite"><svg viewBox="0 0 24 24"><path class="tick" d="M5 12.5l4.5 4.5L19 7.5"/></svg>Copied! Paste it into your coding agent</span>
</button>
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
  clearTimeout(timer); timer = setTimeout(() => agent.classList.remove("copied"), 2600);
};
</script>
</body>
</html>
`);

console.log(`Built ${recipes.length} recipes into ${OUT}/`);
