#!/usr/bin/env node
// 合并 .cache/release-summaries/*.md 的版本段落，生成 docs/releases.md。
//
//   node .omp/skills/omp-docs-sync/scripts/build-releases.mjs [选项]
//
// 选项：
//   --src <dir>    新增/全量版本段落目录（默认 .cache/release-summaries）
//   --base <file>  已有发布公告页，作为合并基数（默认 docs/releases.md，存在才读）
//   --out <file>   输出文件（默认 docs/releases.md）
//   --open <n>     默认展开的最近版本数（默认 5）
//   --dry          只打印统计，不写文件
//
// 段落格式（每个版本一段）：
//   ## vX.Y.Z（YYYY-MM-DD）
//
//   - 要点…

import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(new URL("../../../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const RELEASES_URL = "https://github.com/can1357/oh-my-pi/releases";

function parseArgs(argv) {
  const args = {
    src: path.join(REPO, ".cache/release-summaries"),
    base: path.join(REPO, "docs/releases.md"),
    out: path.join(REPO, "docs/releases.md"),
    open: 5,
    dry: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--src") args.src = path.resolve(argv[++i]);
    else if (a === "--base") args.base = path.resolve(argv[++i]);
    else if (a === "--out") args.out = path.resolve(argv[++i]);
    else if (a === "--open") args.open = Number(argv[++i]);
    else if (a === "--dry") args.dry = true;
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

const HEADING = /^##\s+(v?\d+\.\d+\.\d+[^\s（(]*)[（(](\d{4}-\d{2}-\d{2})[）)]\s*$/;

function parseSummaryFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const out = [];
  let cur = null;
  for (const line of text.split("\n")) {
    const m = line.match(HEADING);
    if (m) {
      if (cur) out.push(cur);
      cur = { tag: m[1].startsWith("v") ? m[1] : `v${m[1]}`, date: m[2], body: [] };
      continue;
    }
    if (cur) cur.body.push(line);
  }
  if (cur) out.push(cur);
  return out.map((s) => ({ ...s, body: trimBlank(s.body) }));
}

// 从已有 docs/releases.md 读回各版本段落（<details> 折叠块）。
function parseBuiltFile(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const out = [];
  const re = /<details(?:\s+open)?>\s*\n<summary>([^（(]+)（(\d{4}-\d{2}-\d{2})）\s*·\s*\d{4}-\d{2}-\d{2}<\/summary>\n\n([\s\S]*?)\n\n<\/details>/g;
  for (const m of text.matchAll(re)) {
    out.push({ tag: m[1].trim(), date: m[2], body: m[3].split("\n") });
  }
  return out;
}

function trimBlank(lines) {
  const copy = [...lines];
  while (copy.length && !copy[0].trim()) copy.shift();
  while (copy.length && !copy[copy.length - 1].trim()) copy.pop();
  return copy;
}

function semverKey(tag) {
  const m = tag.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return [0, 0, 0];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareDesc(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  const av = semverKey(a.tag);
  for (let i = 0; i < 3; i++) if (av[i] !== semverKey(b.tag)[i]) return av[i] < semverKey(b.tag)[i] ? 1 : -1;
  return 0;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const sections = new Map();
  for (const s of parseBuiltFile(args.base)) sections.set(s.tag, s); // 基数在前，新增段落覆盖同名版本
  const before = sections.size;
  if (fs.existsSync(args.src)) {
    const files = fs.readdirSync(args.src).filter((f) => f.endsWith(".md")).sort();
    for (const f of files) for (const s of parseSummaryFile(path.join(args.src, f))) sections.set(s.tag, s);
  } else if (before === 0) {
    console.error(`nothing to build: ${args.src} 不存在且基数 ${args.base} 无版本段落`);
    process.exit(1);
  }

  const list = [...sections.values()].sort(compareDesc);
  // list[0] 是最新版本（已按日期+语义化版本倒序），最旧版本需单独找。
  // compareDesc > 0 表示 s 排在 acc 之后（更旧），故取到最旧版本。
  const oldest = list.reduce((acc, s) => (compareDesc(s, acc) > 0 ? s : acc), list[0]);

  const head = [
    "# 发布公告",
    "",
    `> 归纳自 [oh-my-pi 官方 GitHub Releases](${RELEASES_URL})，覆盖 ${oldest.tag} – ${list[0].tag} 共 ${list.length} 个版本。要点式中文总结，完整细节请查看对应官方发布页。`,
  ].join("\n");

  const blocks = list.map((s, i) => {
    const open = i < args.open ? " open" : "";
    return `<details${open}>\n<summary>${s.tag}（${s.date}） · ${s.date}</summary>\n\n${s.body.join("\n")}\n\n</details>`;
  });

  const output = `${head}\n\n${blocks.join("\n\n")}\n`;

  const added = list.length - before;
  const stats = `${args.out.replace(REPO + path.sep, "")}: ${list.length} versions (${args.open} open)${added > 0 ? `, +${added} new` : ""}`;
  if (args.dry) {
    console.log(`dry: ${stats}`);
    return;
  }
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, output, "utf8");
  console.log(`wrote ${stats}`);
}

main();
