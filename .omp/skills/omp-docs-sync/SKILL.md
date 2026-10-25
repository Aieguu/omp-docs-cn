---
description: Use when syncing this Chinese mirror of omp.sh/docs with upstream — checking whether omp.sh has been redeployed, re-fetching official pages, translating new or changed pages, fixing VitePress rendering, verifying the build, and re-pinning the upstream version. Triggers on "文档同步", "omp 更新了", "docs need updating", "同步官方文档".
---

# omp 中文文档同步

本仓库（`omp-docs-cn`）是 `omp.sh/docs` 官方英文文档的 1:1 中文镜像，VitePress 构建。
本技能给出从「怀疑上游更新」到「推送同步结果」的完整流程、脚本与硬性规则。

## 何时使用

- 上游 omp 发布了新版本（用户说「omp 更新到 vX.Y.Z 了」）。
- 用户问「文档站有需要同步的信息吗 / 需要更新吗」。
- 需要补页、改页、修渲染问题、更新版本标注。
- 需要更新发布公告页 `docs/releases.md`（`npm run releases:fetch` → 归纳 → `npm run releases:build` 流程，见下）。

## 仓库地图

| 路径 | 作用 |
| --- | --- |
| `docs/guide/*.md` | 官方 guide 页的中文页（52 页） |
| `docs/reference/*.md` | 官方 reference 页的中文页（cli / env / secrets / approvals / session-format） |
| `docs/index.md` | 首页；含**上游版本标注**（必须与 README 一致） |
| `docs/releases.md` | 发布公告页：200 个版本的中文要点（本仓库自有页，非官方 1:1 内容） |
| `docs/.vitepress/config.mts` | 侧边栏；新页面必须登记，否则构建报死链/不可达 |
| `.omp/skills/omp-docs-sync/references/translation-spec.md` | 标题表、链接改写表、术语表、渲染规则——翻译的唯一口径 |
| `.omp/skills/omp-docs-sync/references/release-summary-spec.md` | 发布公告的段落格式、归纳规则与禁止项——归纳的唯一口径 |
| `.omp/skills/omp-docs-sync/scripts/fetch-releases.mjs` | 抓取 GitHub release notes，切片写入 `.cache/release-slices/` |
| `.omp/skills/omp-docs-sync/scripts/build-releases.mjs` | 合并版本段落 → `docs/releases.md`（以现有页面为基数，可增量） |
| `.cache/official/<slug>.md` | 抓取到的官方英文页（gitignored，可随时重抓） |
| `.cache/release-slices/`、`.cache/release-summaries/` | 发布页的切片与归纳中间产物（gitignored，用完即删） |
| `.omp/skills/omp-docs-sync/.sync-baseline.json` | 已同步的上游资源哈希基线 |

`package.json` 提供四个快捷入口：`npm run sync:check`、`npm run sync:verify`、`npm run releases:fetch`、`npm run releases:build`。

## 流程

### 1. 判断上游有没有更新（10 秒）

```sh
node .omp/skills/omp-docs-sync/scripts/check-upstream.mjs
```

- 退出码 0 + `upstream docs unchanged` → **上游没动，到此为止**，不要改任何文件。
- 退出码 1 → 打印 `CHANGED / NEW / REMOVED` 资源与新增/删除的页面，继续第 2 步。
- 采纳当前状态为新基线（仅在完成同步后）：

```sh
node .omp/skills/omp-docs-sync/scripts/check-upstream.mjs --update
```

原理：omp.sh 是 Vite SPA，资源名带内容哈希。同样的资源名+sha256 ⇒ 部署包逐字节相同 ⇒ 没有需要重译的内容。

### 2. 抓取官方页面

在 omp 的 eval（JS）内核里运行（需要托管浏览器）：

```js
const { pathToFileURL } = await import("node:url");
const { fetchPages } = await import(pathToFileURL(".omp/skills/omp-docs-sync/scripts/fetch-pages.js").href);
console.log(await fetchPages());                          // 全部页面
console.log(await fetchPages({ slugs: ["prewalk"] }));    // 只抓变化的页
```

- 页面集合的唯一权威是**线上侧边栏**（脚本自动读取；新增页面会被自动纳入）。
- 输出写入 `.cache/official/<slug>.md`，正文以 `# <English title>` 开头，来源为浏览器实际渲染结果。
- 不要用 r.jina.ai 之类的抓取代理：匿名额度会被拒（401），且渲染结果与站点不一致。

### 3. 翻译增量

- 对照 `.cache/official/<slug>.md` 与 `docs/guide/<slug>.md`（或 `docs/reference/…`），只改差异部分。
- 多页互不相干 → 每页一个子代理并行；每个子代理的指令里必须给出：官方源文件路径、目标文件路径、`references/translation-spec.md` 路径、中文标题。
- 子代理只做翻译：不跑构建、不跑格式化、不动别的文件。
- 术语、标题、链接改写一律以 spec 为准；**不要新增官方没有的小节**，也不要删官方有的大节。
- 官方页面结构变化（合并/重命名章节）时按官方新版结构重写该页，而不是保留旧结构。

### 4. 验证

```sh
node .omp/skills/omp-docs-sync/scripts/verify-docs.mjs
npm run docs:build
```

`verify-docs.mjs` 检查：侧边栏登记、相对链接可达、无残留 `https://omp.sh/docs` 与 `/docs/<slug>` 链接、表格行内代码 span 的 `|` 未转义、代码围栏外无 `{{`、与官方页的 `##`/`###` 数量一致、版本标注两处一致。**退出码 1 必须修到 0**。

`npm run docs:build` 必须出现 `build complete`；构建会额外捕获死链与 Vue 模板错误。

### 5. 收尾

- 更新版本标注：`docs/index.md` 与 `README.md` 中的 `` `X.Y.Z` ``（两处必须一致，verifier 会校验）。
- 上游资源已变 → `check-upstream.mjs --update` 刷新基线。
- 提交并推送（用户明确要求时）。

## 流程：发布公告页（docs/releases.md）

`docs/releases.md` 是官方 GitHub Releases 的中文要点公告（本仓库自有页，不参与 1:1 镜像校验）。nav「公告」与侧边栏「发布公告」组已登记，**新增版本不需要改 `config.mts`**。段落格式与归纳口径以 `references/release-summary-spec.md` 为准。

当前页面覆盖 `v16.1.7 – v18.12.6` 共 200 个版本；上游 GitHub Releases 实际有 300 个（最早到 `v15.0.0`），更早版本尚未收录——需要回补历史时用全量重建流程，多切片并行归纳。

### 1. 抓取切片

```sh
npm run releases:fetch                      # 全量（重建时用）
npm run releases:fetch -- --since v18.12.6  # 只取更新的版本（日常增量）
```

写入 `.cache/release-slices/slice-NN.json`（JSON 数组，`{tag, date, body}`，倒序，每片默认 25 个）。

### 2. 并行归纳

每个切片起一个子代理，子代理**只产出自己的输出文件**：不跑构建、不动其他文件。指令必须给出：切片路径、输出路径、`references/release-summary-spec.md` 路径、格式与规则要点。产物写入 `.cache/release-summaries/slice-NN.md`。

### 3. 合并

```sh
npm run releases:build
```

以现有 `docs/releases.md` 为基数合并，同名版本覆盖；排序、顶部覆盖范围（`覆盖 vX – vY 共 N 个版本`）与「最近 5 版默认展开」由脚本重算。全量重建时先让 `--base` 指向不存在的文件。

### 4. 验证与收尾

```sh
npm run sync:verify   # 退出码 0
npm run docs:build    # build complete
```

通过后删除 `.cache/release-slices` 与 `.cache/release-summaries`（`releases.json` 之类的临时抓取文件一并清理），只提交 `docs/releases.md` 与本技能的改动。

## 硬性规则（踩过的坑）

1. **表格里的 `|`**：表格行中代码 span 内的 `|` 必须写成 `\|`（例如 `` `[--scope project\|user]` ``）。否则 VitePress 会把单元格截断，渲染出半个 code span，甚至因裸 `<id>` 之类的文本让构建报 `Element is missing end tag`。
2. **`{{ }}`**：代码围栏之外出现 `{{` 会被 Vue 当插值解析，构建直接失败。翻译 Handlebars/模板类内容时写成 `<code v-pre>{{args}}</code>`。
3. **死链即构建失败**：新页面写进 `docs/` 后必须同时登记到 `docs/.vitepress/config.mts` 侧边栏，并确保被引用的页面存在。
4. **版本标注是两处**：`docs/index.md` 的「文档版本」框与 `README.md` 的「文档来源」。
5. **不要用系统临时目录**：`$TEMP` 会被清理，中间产物一律放仓库内 `.cache/`（已 gitignore）。
6. **页面集合以线上侧边栏为准**：本地多出的 `guide/faq.md`、`guide/install.md`、`reference/source-map.md` 是本仓库自有页（非官方页），同步时不要动它们。`reference/source-map.md` 是页面映射表，允许出现 omp.sh 链接。
7. **删/改页面时同步链接**：官方若删除某页，本仓库对应中文页与之的入链要一起处理（否则 verifier 报死链）。
8. **不要臆造内容**：官方页面没有的内容不写；官方新版删掉的内容要一并删除（干净切换，不留旧段落）。
9. **发布公告同样受 1、2 条约束**：`docs/releases.md` 的要点里出现 `{{`、裸尖括号或外链会让 `docs:build` 直接失败，归纳子代理的指令里必须带上 `references/release-summary-spec.md` 的禁止项。

## 完成定义

- `check-upstream.mjs` 显示无漂移（或用 `--update` 明确采纳了本次变化）。
- `verify-docs.mjs` 退出码 0（warning 可以有，problem 必须为 0）。
- `npm run docs:build` 输出 `build complete`。
- 新版页面的 `##`/`###` 与官方一致，正文无英文残留段落（代码、命令、路径、专有名词除外）。
- 版本标注已更新且两处一致。
- 发布公告页：`releases:build` 输出的版本数与切片总数一致，顶部覆盖范围正确，最近 5 版默认展开，`docs:build` 通过。
