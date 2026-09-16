// verify-docs.mjs — structural checks for the Chinese mirror of omp.sh/docs.
//
//   node .omp/skills/omp-docs-sync/scripts/verify-docs.mjs
//
// Checks (exit 1 if any fails):
//   1. every local page is listed in the VitePress sidebar (docs/.vitepress/config.mts)
//   2. every relative markdown link resolves to an existing file
//   3. no bare https://omp.sh/docs links survive in body text
//   4. no unescaped `|` inside a code span on a table row (splits the cell in VitePress)
//   5. no `{{` outside a code fence (Vue would parse it as interpolation)
//   6. heading parity with the scraped official page, when .cache/official/<slug>.md exists
//   7. the pinned upstream version in docs/index.md and README.md agree

import fs from "node:fs";
import path from "node:path";

function findRoot(start) {
  let dir = start;
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json")) && fs.existsSync(path.join(dir, "docs"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) throw new Error("repo root (package.json + docs/) not found");
    dir = up;
  }
}

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const root = findRoot(here);
const docs = path.join(root, "docs");
const official = path.join(root, ".cache", "official");

// slug -> local page. Slugs not listed here live in docs/reference/.
const REFERENCE_SLUGS = ["cli", "env", "secrets", "session-format", "approvals"];
const localFor = (slug) =>
  slug === "" || slug === "overview"
    ? path.join(docs, "guide", "overview.md")
    : REFERENCE_SLUGS.includes(slug)
      ? path.join(docs, "reference", `${slug}.md`)
      : path.join(docs, "guide", `${slug === "slash" ? "slash-commands" : slug}.md`);

const problems = [];
const warnings = [];
const note = (msg) => problems.push(msg);
const warn = (msg) => warnings.push(msg);

// Pages whose whole point is listing upstream URLs.
const OMP_SH_LINK_EXEMPT = new Set(["reference/source-map.md"]);

const pages = [];
for (const dir of ["guide", "reference"]) {
  for (const f of fs.readdirSync(path.join(docs, dir))) {
    if (f.endsWith(".md")) pages.push({ file: path.join(docs, dir, f), rel: `${dir}/${f}` });
  }
}

const sidebar = fs.readFileSync(path.join(docs, ".vitepress", "config.mts"), "utf8");
const linked = new Set([...sidebar.matchAll(/link:\s*"\/([^"]+)"/g)].map((m) => m[1]));

const linkRe = /\[[^\]]*\]\(([^)\s]+\.md)(#[^)]*)?\)/g;

for (const { file, rel } of pages) {
  const src = fs.readFileSync(file, "utf8");

  // 1. sidebar coverage (warning: local-only pages may be intentionally unreachable)
  const slugPath = rel.replace(/\.md$/, "");
  if (!linked.has(slugPath)) warn(`${rel}: not referenced by the VitePress sidebar`);

  // 2 + 5. links, fences, pipes
  let fence = false;
  src.split("\n").forEach((line, i) => {
    const at = `${rel}:${i + 1}`;
    if (/^\s*```/.test(line)) {
      fence = !fence;
      return;
    }
    if (fence) return;
    const withoutVPre = line.replace(/<code v-pre>[\s\S]*?<\/code>/g, "");
    if (withoutVPre.includes("{{")) note(`${at}: {{ outside a code fence (Vue interpolation) — wrap in <code v-pre>…</code>`);
    if (line.trim().startsWith("|")) {
      for (const span of line.matchAll(/`([^`]*)`/g)) {
        if (span[1].includes("|") && !span[1].includes("\\|")) note(`${at}: unescaped | in a code span on a table row — write \\|`);
      }
    }
  });

  for (const m of src.matchAll(linkRe)) {
    const target = m[1];
    if (/^(https?:)?\/\//.test(target)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) note(`${rel}: dead link -> ${target}`);
  }

  if (/https:\/\/omp\.sh\/docs/.test(src) && !OMP_SH_LINK_EXEMPT.has(rel))
    note(`${rel}: bare https://omp.sh/docs link survived translation`);
  if (!OMP_SH_LINK_EXEMPT.has(rel)) {
    const siteLinks = [...src.matchAll(/\]\((\/docs(?:\/[a-z0-9-]*)?)(?:#[^)]*)?\)/g)].map((m) => m[1]);
    if (siteLinks.length) note(`${rel}: ${siteLinks.length} site-relative link(s) not rewritten, e.g. ${siteLinks[0]} -> ./<slug>.md`);
  }
  if (!src.startsWith("# ")) note(`${rel}: does not start with an H1 title`);
}

// 6. heading parity against the scraped official page
let compared = 0;
if (fs.existsSync(official)) {
  for (const f of fs.readdirSync(official)) {
    if (!f.endsWith(".md")) continue;
    const slug = f.replace(/\.md$/, "");
    const local = localFor(slug);
    if (!fs.existsSync(local)) {
      note(`official page "${slug}" has no local translation (${path.relative(root, local)})`);
      continue;
    }
    const count = (p) => (fs.readFileSync(p, "utf8").match(/^#{2,3} /gm) || []).length;
    const [want, got] = [count(path.join(official, f)), count(local)];
    compared++;
    if (want !== got) note(`${path.relative(root, local)}: ${got} ## / ### headings, official ${slug} has ${want}`);
  }
} else {
  console.log("note: .cache/official/ not found — skipped heading parity (run fetch-pages.js first)");
}

// 7. pinned version
const pin = (p) => fs.readFileSync(p, "utf8").match(/`v?(\d+\.\d+\.\d+)`/)?.[1];
const inIndex = pin(path.join(docs, "index.md"));
const inReadme = pin(path.join(root, "README.md"));
if (!inIndex || !inReadme) note("docs/index.md or README.md is missing a `x.y.z` version pin");
else if (inIndex !== inReadme) note(`version pin mismatch: docs/index.md ${inIndex} vs README.md ${inReadme}`);

console.log(`pages: ${pages.length} | heading parity checked: ${compared} | version pin: ${inIndex ?? "?"}`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log("  " + w);
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log("all checks passed");
