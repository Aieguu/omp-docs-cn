// fetch-pages.js — render every official omp.sh/docs page and save clean markdown.
//
// Run it from the omp eval kernel (JS). It uses the managed browser, so the result is
// the page as actually rendered — no scraping proxy, no parsing of the site bundles.
//
//   const { pathToFileURL } = await import("node:url");
//   const { fetchPages } = await import(pathToFileURL(".omp/skills/omp-docs-sync/scripts/fetch-pages.js").href);
//   console.log(await fetchPages());                     // every page from the live sidebar
//   console.log(await fetchPages({ slugs: ["prewalk"] }));  // a subset after an update
//
// Output: .cache/official/<slug>.md (the overview page, whose sidebar path is empty,
// is written as overview.md). Slugs come from the live sidebar unless you pass a subset.

import fs from "node:fs";
import path from "node:path";

const BASE = "https://omp.sh";

// DOM -> markdown. The site renders docs as <article class="prose"> with plain
// h2/h3, p, ul/ol, pre>code, table and dl — everything else is decoration.
const CONVERT = `(() => {
  const inline = (node) => {
    let out = "";
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { out += n.textContent.replace(/\\s+/g, " "); continue; }
      if (n.nodeType !== 1) continue;
      const t = n.tagName;
      if (t === "CODE") out += "\`" + n.textContent + "\`";
      else if (t === "STRONG" || t === "B") out += "**" + inline(n) + "**";
      else if (t === "EM" || t === "I") out += "*" + inline(n) + "*";
      else if (t === "DEL" || t === "S") out += "~~" + inline(n) + "~~";
      else if (t === "BR") out += "  \\n";
      else if (t === "A") out += "[" + inline(n) + "](" + (n.getAttribute("href") || "") + ")";
      else out += inline(n);
    }
    return out;
  };
  const blocks = (root) => {
    const out = [];
    for (const el of root.children) {
      const t = el.tagName;
      if (/^H[1-4]$/.test(t)) { out.push("#".repeat(+t[1]) + " " + inline(el).trim()); continue; }
      if (t === "P") { out.push(inline(el).trim()); continue; }
      if (t === "PRE") {
        const code = el.querySelector("code") || el;
        const cls = (code.className || "").match(/language-([\\w-]+)/);
        out.push("\`\`\`" + (cls ? cls[1] : "") + "\\n" + code.textContent.replace(/\\n+$/, "") + "\\n\`\`\`");
        continue;
      }
      if (t === "UL" || t === "OL") {
        const items = [...el.children].filter((li) => li.tagName === "LI");
        items.forEach((li, i) => {
          const nested = [...li.children].filter((c) => c.tagName === "UL" || c.tagName === "OL");
          const clone = li.cloneNode(true);
          [...clone.children].filter((c) => c.tagName === "UL" || c.tagName === "OL").forEach((c) => c.remove());
          out.push((t === "OL" ? (i + 1) + ". " : "- ") + inline(clone).trim());
          for (const sub of nested) for (const l of blocks(sub)) out.push("  " + l);
        });
        continue;
      }
      if (t === "TABLE") {
        const rows = [...el.querySelectorAll("tr")].map((tr) =>
          [...tr.children].map((td) => inline(td).trim().replace(/\\|/g, "\\\\|")));
        if (rows.length) {
          out.push("| " + rows[0].join(" | ") + " |");
          out.push("| " + rows[0].map(() => "---").join(" | ") + " |");
          for (const r of rows.slice(1)) out.push("| " + r.join(" | ") + " |");
        }
        continue;
      }
      if (t === "DL") {
        for (const ch of el.children) out.push(ch.tagName === "DT" ? "**" + inline(ch).trim() + "**" : inline(ch).trim());
        continue;
      }
      if (t === "BLOCKQUOTE") { out.push("> " + inline(el).trim()); continue; }
      if (t === "HR") { out.push("---"); continue; }
      if (el.children.length) { out.push(...blocks(el)); continue; }
      const txt = inline(el).trim();
      if (txt) out.push(txt);
    }
    return out;
  };
  const art = document.querySelector("article");
  if (!art) return "";
  const h1 = document.querySelector("h1");
  const body = blocks(art).join("\\n\\n").replace(/\\n{3,}/g, "\\n\\n").trim();
  return (h1 ? "# " + h1.innerText.trim() + "\\n\\n" : "") + body + "\\n";
})()`;

async function liveSlugs() {
  const html = await (await fetch(`${BASE}/docs`)).text();
  const entry = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
  const index = await (await fetch(BASE + entry)).text();
  const prose = index.match(/"(assets\/Prose-[^"]+\.js)"/)?.[1];
  const src = await (await fetch(`${BASE}/${prose}`)).text();
  return [...src.matchAll(/path:`([a-z0-9-]*)`/g)].map((m) => m[1]);
}

export async function fetchPages(opts = {}) {
  const browser = globalThis.browser ?? opts.browser;
  if (!browser) throw new Error("no browser available — run this from the omp eval kernel");

  const root = opts.root ?? process.cwd();
  const outDir = path.join(root, ".cache", "official");
  fs.mkdirSync(outDir, { recursive: true });

  const slugs = opts.slugs ?? (await liveSlugs());
  const tab = await browser.open({ name: "omp-docs-fetch", url: `${BASE}/docs`, timeout: 60 });
  const results = [];
  try {
    for (const slug of slugs) {
      const url = `${BASE}/docs${slug ? "/" + slug : ""}`;
      await tab.goto(url);
      let md = "";
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 400));
        try {
          md = String((await tab.evaluate(CONVERT)) ?? "");
        } catch {
          md = ""; // page still navigating: the evaluation context is being replaced
        }
        if (md.length > 200) break;
      }
      const name = slug || "overview";
      if (md.length <= 200) {
        results.push({ slug: name, status: "empty", chars: md.length });
        continue;
      }
      fs.writeFileSync(path.join(outDir, `${name}.md`), md);
      const count = (re) => (md.match(re) || []).length;
      results.push({
        slug: name,
        status: "ok",
        chars: md.length,
        h2: count(/^## /gm),
        h3: count(/^### /gm),
        fences: count(/^```/gm) / 2,
        tableRows: count(/^\| /gm),
      });
    }
  } finally {
    await tab.close();
  }
  return { outDir, fetchedAt: new Date().toISOString(), pages: results };
}
