// check-upstream.mjs — has omp.sh/docs been redeployed since our last sync?
//
//   node .omp/skills/omp-docs-sync/scripts/check-upstream.mjs           # report drift (exit 1 on drift)
//   node .omp/skills/omp-docs-sync/scripts/check-upstream.mjs --update  # adopt upstream state as new baseline
//
// Vite emits content-hashed asset names, so an unchanged asset name+hash means the
// deployed docs bundle is byte-identical to the baseline (nothing to re-translate).

import fs from "node:fs";
import crypto from "node:crypto";

const BASE = "https://omp.sh";
const BASELINE = new URL("../.sync-baseline.json", import.meta.url);

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

async function fetchText(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.text();
}

// entry script -> transitively referenced asset chunks (via vite's mapDeps tables)
async function collectAssets() {
  const html = await fetchText("/docs");
  const entry = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
  if (!entry) throw new Error("entry chunk not found in /docs HTML");

  const assets = new Map();
  const queue = [entry];
  while (queue.length) {
    const path = queue.shift();
    if (assets.has(path)) continue;
    const src = await fetchText(path);
    assets.set(path, { size: src.length, sha256: sha(src) });
    for (const m of src.matchAll(/__vite__mapDeps=\(i,m=__vite__mapDeps,d=\(m\.f\|\|\(m\.f=\[([^\]]*)\]\)\)\)/g)) {
      for (const a of m[1].matchAll(/"(assets\/[^"]+\.js)"/g)) queue.push("/" + a[1]);
    }
  }
  return assets;
}

// page slugs declared by the docs sidebar (Prose chunk)
function extractPages(byPath) {
  const prose = [...byPath].find(([p]) => /\/Prose-/.test(p));
  return prose ? [...prose[1].src.matchAll(/path:`([a-z0-9-]*)`/g)].map((m) => m[1]).sort() : [];
}

async function snapshot() {
  const assets = await collectAssets();
  const raw = new Map();
  for (const [p, meta] of assets) {
    if (/\/Prose-/.test(p)) raw.set(p, { ...meta, src: await fetchText(p) });
    else raw.set(p, meta);
  }
  return {
    fetchedAt: new Date().toISOString(),
    assets: Object.fromEntries([...assets].map(([p, m]) => [p, { size: m.size, sha256: m.sha256 }])),
    pages: extractPages(raw),
  };
}

const current = await snapshot();
const update = process.argv.includes("--update");

if (update || !fs.existsSync(BASELINE)) {
  fs.writeFileSync(BASELINE, JSON.stringify(current, null, 2) + "\n");
  console.log(`${update ? "baseline updated" : "baseline created"}: ${current.pages.length} pages, ${Object.keys(current.assets).length} assets`);
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const drift = [];

for (const [path, meta] of Object.entries(current.assets)) {
  const before = base.assets[path];
  if (!before) drift.push(`NEW      ${path}`);
  else if (before.sha256 !== meta.sha256) drift.push(`CHANGED  ${path} (${before.size} -> ${meta.size} bytes)`);
}
for (const path of Object.keys(base.assets)) {
  if (!current.assets[path]) drift.push(`REMOVED  ${path}`);
}

const addedPages = current.pages.filter((p) => !base.pages.includes(p));
const removedPages = base.pages.filter((p) => !current.pages.includes(p));

console.log(`baseline: ${base.fetchedAt}`);
console.log(`pages:    ${base.pages.length} -> ${current.pages.length}`);
for (const p of addedPages) console.log(`  + /docs/${p || "(overview)"}`);
for (const p of removedPages) console.log(`  - /docs/${p || "(overview)"}`);

if (!drift.length && !addedPages.length && !removedPages.length) {
  console.log("upstream docs unchanged — nothing to sync");
  process.exit(0);
}
console.log("upstream docs changed:");
for (const d of drift) console.log("  " + d);
process.exit(1);
