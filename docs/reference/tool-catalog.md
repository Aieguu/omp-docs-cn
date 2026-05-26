# 内置工具目录

本目录按上游 README 和 `docs/tools/*` 整理。每个工具都有更详细的英文源文档，本页提供中文速查。

## 文件、编辑与搜索

| 工具 | 输入关注点 | 输出 / 行为 | 典型场景 |
| --- | --- | --- | --- |
| `read` | path、selector、limit、offset 等 | 文本、目录、文档、DB、URL、内部协议资源的结构化内容 | 读取源码、PDF、PR、SQLite、Notebook |
| `write` | path、content、archive/SQLite 目标 | 写入文件 / archive entry / SQLite row | 新建文件、覆盖配置、更新 DB |
| `edit` | hashline patch 或其他变体 | 应用内容 hash anchor 编辑，检测 stale | 精准修改已有文件 |
| `ast_edit` | ast-grep pattern、replacement | proposed 结构化替换，需 `resolve` | 批量 codemod |
| `ast_grep` | 语言、pattern、路径 | 结构化语法树匹配结果 | 查找特定 AST 形状 |
| `search` | regex、path/glob、flags | 内容匹配列表 | 查找符号、配置、错误文本 |
| `find` | glob / path pattern | 路径列表 | 快速定位文件 |

## 运行时

| 工具 | 说明 | 注意点 |
| --- | --- | --- |
| `bash` | 执行 shell 命令，支持 session、PTY、后台 job、artifact | 长输出会截断或 spill；危险命令可被扩展拦截 |
| `eval` | 持久 Python / JavaScript cell | 可复用状态，也可通过 bridge 调回 agent 工具 |
| `recipe` | 调用项目任务 runner | 适合 `make test`、`bun run build`、`cargo test` 等 |
| `ssh` | 对已配置 host 执行命令 | 适合受控远端环境 |

## 代码智能

| 工具 | 子能力 |
| --- | --- |
| `lsp` | diagnostics、definition、type_definition、implementation、references、hover、symbols、rename、rename_file、code_actions、status、reload、capabilities、request |
| `debug` | launch/attach、breakpoints、continue/pause/step、threads、stack、scopes、variables、evaluate、disconnect |

## 协作

| 工具 | 用途 |
| --- | --- |
| `task` | 启动子代理，支持 simple / schema-free / independent 模式。 |
| `irc` | 当前进程中的 agent 间短消息。 |
| `todo_write` | 对会话 todo list 做有序变更。 |
| `job` | 等待 / 取消后台 bash job。 |
| `ask` | 让 agent 发起结构化追问。 |

## 外部世界

| 工具 | 用途 |
| --- | --- |
| `browser` | 打开、关闭、执行浏览器脚本，可连接真实浏览器 / Electron app。 |
| `web_search` | 跨多个 search provider 查询，并保留 citation / URL。 |
| `github` | repo、PR、issue、code search、Actions run watch 等 GitHub CLI 操作。 |
| `inspect_image` | 视觉模型分析本地图片。 |
| `render_mermaid` | Mermaid 渲染为 ASCII / PNG。 |

## 记忆与上下文控制

| 工具 | 用途 |
| --- | --- |
| `checkpoint` | 标记状态。 |
| `rewind` | 删除探索上下文并保留摘要报告。 |
| `retain` | 写入持久记忆。 |
| `recall` | 检索原始记忆。 |
| `reflect` | 基于记忆综合回答。 |

## 其他

| 工具 | 用途 |
| --- | --- |
| `calc` | 确定性计算。 |
| `resolve` | 接受 / 丢弃 proposed action。 |
| `search_tool_bm25` | 在隐藏工具索引中检索并激活工具。 |

## 工具选择建议

- 改代码优先 `read` + `edit`，批量结构化替换用 `ast_edit`。
- 查引用、重命名和诊断优先 `lsp`，不要只靠文本搜索。
- 调运行时问题优先 `debug`，再补充 `bash`。
- 大任务优先 `task` 拆分，并要求结构化输出。
- 需要外部网页或 PDF 时，用 `web_search` 找，再用 `read` 读。
