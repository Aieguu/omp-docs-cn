#!/usr/bin/env node
// 抓取 can1357/oh-my-pi 的 GitHub release notes，按片写入切片 JSON，供子代理归纳。
//
//   node .omp/skills/omp-docs-sync/scripts/fetch-releases.mjs [选项]
//
// 选项：
//   --since <tag>    只取比该版本更新的 release（如 --since v18.12.6）；省略则全量抓取
//   --slice-size <n> 每片版本数（默认 25）
//   --out <dir>      切片输出目录（默认 .cache/release-slices，会先清空同名旧切片）
//   --pages <n>      GitHub API 最多翻页数（每页 100 条，默认 3）
//
// 每个切片是 JSON 数组，元素形如 { "tag": "v18.12.6", "date": "2026-10-21", "body": "..." }，
// 按发布时间倒序排列，slice-00 最新。

import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(new URL("../../../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const API = "https://api.github.com/repos/can1357/oh-my-pi/releases";

function parseArgs(argv) {
  const args = { since: null, sliceSize: 25, out: path.join(REPO, ".cache/release-slices"), pages: 3 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--since") args.since = argv[++i];
    else if (a === "--slice-size") args.sliceSize = Number(argv[++i]);
    else if (a === "--out") args.out = path.resolve(argv[++i]);
    else if (a === "--pages") args.pages = Number(argv[++i]);
    else if (a === "--help" || a === "-h") {
      console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"));
      process.exit(0);
    } else {
      console.error(`unknown option: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

const semver = (tag) => {
  const m = String(tag).replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
};

const newerThan = (tag, base) => {
  const a = semver(tag);
  const b = semver(base);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
};

async function fetchAll(pages) {
  const all = [];
  for (let page = 1; page <= pages; page++) {
    const res = await fetch(`${API}?per_page=100&page=${page}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "omp-docs-cn-sync" },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const releases = await fetchAll(args.pages);

  let items = releases
    .filter((r) => !r.draft)
    .map((r) => ({ tag: r.tag_name, date: (r.published_at || r.created_at).slice(0, 10), body: (r.body || "").trim() }));

  if (args.since) items = items.filter((r) => newerThan(r.tag, args.since));
  // API 默认倒序，再按日期兜底排一次（同日多版本按语义化版本倒序）。
  items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    const av = semver(a.tag);
    const bv = semver(b.tag);
    for (let i = 0; i < 3; i++) if (av[i] !== bv[i]) return av[i] > bv[i] ? -1 : 1;
    return 0;
  });

  if (!items.length) {
    console.log(args.since ? `no new releases since ${args.since}` : "no releases found");
    return;
  }

  fs.mkdirSync(args.out, { recursive: true });
  for (const f of fs.readdirSync(args.out)) if (f.startsWith("slice-") && f.endsWith(".json")) fs.rmSync(path.join(args.out, f));

  let slices = 0;
  for (let i = 0; i < items.length; i += args.sliceSize) {
    const name = `slice-${String(slices).padStart(2, "0")}.json`;
    fs.writeFileSync(path.join(args.out, name), JSON.stringify(items.slice(i, i + args.sliceSize), null, 2), "utf8");
    slices++;
  }

  const first = items[0];
  const last = items[items.length - 1];
  console.log(`wrote ${slices} slice(s) → ${path.relative(REPO, args.out)}/ : ${items.length} releases (${last.tag} – ${first.tag})`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
