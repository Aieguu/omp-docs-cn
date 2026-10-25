# 发布要点归纳规范

`docs/releases.md` 的版本段落由 release notes 归纳而来。本文件是归纳与合并的唯一口径：子代理的指令里必须给出本文件路径。

## 段落格式

每个版本一段，段落之间空一行，段内要点紧挨：

```
## vX.Y.Z（YYYY-MM-DD）

- 要点（中文，每条 15–50 字，以「- 」开头）
- 要点…
```

- 日期用切片 JSON 里的 `date`（YYYY-MM-DD）。
- `tag` 保留原样（通常带 `v`）。
- 文件内容就是版本段落本身：**不要前言、不要总结、不要标题层级以外的任何修饰**。
- 一个切片一个输出文件：`.cache/release-summaries/slice-NN.md`。

## 归纳规则

- 只提炼**用户可见**变化：新命令、新设置/配置、行为变更、新功能、重要修复、模型/目录更新。
- 忽略：纯内部重构、构建/打包、性能微调、依赖升级、PR 列表与署名。
- 保留必要英文专有名词（命令名、设置名、包名、模型名），不翻译成音译。
- 同版本内相同主题合并成一条；概括归纳，不要逐条直译。
- 每版本 3–8 条；body 几乎全是内部细节时写 1–3 条并在末尾注明「(主要为内部变更)」。
- 中文标点与英文标点按切片原有习惯保留即可，不要统一改写。

## 禁止项（会直接导致构建失败或渲染错乱）

| 禁止 | 原因 |
| --- | --- |
| `{{` | VitePress/Vue 当模板插值解析，构建失败 |
| 裸 `<id>`、`<tag>` 之类尖括号 | Vue 当标签解析，报 `Element is missing end tag` |
| 表格竖线 | 本文件不是表格；要点文本里出现竖线时写成 `\|`，否则表格/渲染会被截断 |
| 外链 `http(s)://…` | 公告页只在顶部给一次官方 Releases 地址 |
| 跑构建、格式化、改动其他文件 | 子代理只产出自己的 `slice-NN.md` |

## 合并与验证

```sh
npm run releases:build    # 合并 .cache/release-summaries/*.md → docs/releases.md
npm run sync:verify       # 退出码必须为 0
npm run docs:build        # 必须出现 build complete
```

`build-releases.mjs` 以 `docs/releases.md` 为合并基数（`--base`），所以**增量更新只需把新版本的段落放进 `--src` 目录**：同名版本会被新段落覆盖，其余保持不变；排序、顶部覆盖范围说明与「最近 5 版默认展开」由脚本统一重算。`--base` 指向一个不存在的文件即可做全量重建。

## 收尾

- 中间产物都在 `.cache/`（已 gitignore），确认提交内容只含 `docs/releases.md` 后一并删除：`release-slices`、`release-summaries`。
- `docs/releases.md` 无需登记侧边栏：nav「公告」与侧边栏「发布公告」组已在 `docs/.vitepress/config.mts` 中登记。
