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
html{overscroll-behavior-y:none}
.ptr{position:fixed;top:0;left:50%;z-index:9;width:36px;height:36px;margin-left:-18px;display:grid;place-items:center;border-radius:50%;
  background:var(--sheet);border:1.5px solid var(--rule);color:var(--rule);box-shadow:0 2px 8px rgba(31,42,68,.15);
  transform:translateY(-48px);opacity:0;pointer-events:none}
.ptr svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.ptr.back{transition:transform .25s,opacity .25s}
.ptr.loading svg{animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="ptr" id="ptr" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></svg></div>
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
// pull down from the top of the page to reload (also in home-screen apps, which have no browser reload)
{
  const ptr = document.getElementById("ptr"), icon = ptr.firstChild, THRESHOLD = 70;
  let startY = null, pull = 0;
  const show = (y, back) => {
    ptr.classList.toggle("back", back);
    ptr.style.transform = \`translateY(\${y - 48}px)\`;
    ptr.style.opacity = Math.min(1, y / THRESHOLD);
  };
  addEventListener("touchstart", e => {
    startY = scrollY <= 0 && e.touches.length === 1 && !ptr.classList.contains("loading") ? e.touches[0].clientY : null;
  }, { passive: true });
  addEventListener("touchmove", e => {
    if (startY === null) return;
    pull = Math.max(0, e.touches[0].clientY - startY);
    if (!pull) return;
    const y = Math.min(110, pull * 0.5);                                // resistance
    show(y, false);
    icon.style.transform = \`rotate(\${pull * 1.5}deg)\`;
    ptr.style.color = y >= THRESHOLD ? "#2f8f5b" : "";
  }, { passive: true });
  addEventListener("touchend", () => {
    if (startY === null) return;
    startY = null;
    if (Math.min(110, pull * 0.5) >= THRESHOLD) {
      show(THRESHOLD, true);
      icon.style.transform = "";
      ptr.classList.add("loading");
      setTimeout(() => location.reload(), 150);
    } else show(0, true);
    pull = 0;
  });
}
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
