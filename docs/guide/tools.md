# 工具系统

omp 的工具系统目标是让 agent 使用稳定、结构化、可渲染、可持久化的能力，而不是把所有事情都压到 shell 字符串里。

## 工具调用生命周期

一次典型工具调用大致经过：

1. 模型生成 tool call。
2. runtime 校验参数 schema。
3. 扩展 / Hook 有机会在 `tool_call` 阶段拦截或阻止。
4. 工具执行，支持取消、超时、流式更新。
5. 长输出可能截断并写入 artifact。
6. 扩展 / Hook 在 `tool_result` 阶段可修改内容 / details。
7. TUI / RPC / headless 模式按各自路径渲染或输出。
8. 结果写入 session entry，必要时外部化 blob。

## 文件与搜索工具

| 工具 | 用途 |
| --- | --- |
| `read` | 统一读取文件、目录、压缩包、SQLite、PDF、Notebook、图片、URL、内部协议。支持 selector。 |
| `write` | 创建或覆盖文件，也支持压缩包条目与 SQLite 行/表操作。 |
| `edit` | hashline 编辑，使用内容 hash anchor 降低误改概率，并能检测 stale anchors。 |
| `ast_edit` | 基于 ast-grep 的结构化替换；先生成 proposed 结果，再通过 `resolve` 接受。 |
| `ast_grep` | 基于 tree-sitter 语法树的结构查询。 |
| `search` | 正则内容搜索，支持 glob、内部 URL、缓存与原生 grep。 |
| `find` | 路径 / glob 查找。需要内容匹配时用 `search`。 |

## 运行时工具

| 工具 | 用途 |
| --- | --- |
| `bash` | 工作区 shell，支持非交互、PTY、后台 job、会话复用和输出 artifact。 |
| `eval` | 持久 Python / JavaScript cell。两个 kernel 可通过 loopback bridge 调用 agent 工具。 |
| `recipe` | 调用探测到的任务 runner，如 bun、just、make、cargo。 |
| `ssh` | 对配置好的远端执行一次命令。 |

## 代码智能工具

| 工具 | 用途 |
| --- | --- |
| `lsp` | diagnostics、definition、references、hover、symbols、rename、rename_file、code_actions、raw request 等。 |
| `debug` | DAP 调试：launch/attach、breakpoints、step、threads、stack、scopes、variables、evaluate。 |

## 协作与任务工具

| 工具 | 用途 |
| --- | --- |
| `task` | 启动子代理，可隔离 workspace，返回 schema 化结果。 |
| `irc` | 同进程 agent 间短消息。 |
| `todo_write` | 修改会话 todo list，带状态转换。 |
| `job` | 等待或取消后台 job。 |
| `ask` | 交互式结构化提问；TUI 和 ACP 可渲染选项。 |

## 外部工具

| 工具 | 用途 |
| --- | --- |
| `browser` | Puppeteer / CDP 驱动浏览器或 Electron app。 |
| `web_search` | 多 provider 搜索，并把结果交给 `read` 做结构化抽取。 |
| `github` | 调用 GitHub CLI 做 repo、PR、issue、code search、Actions watch 等操作。 |
| `inspect_image` | 用视觉模型分析本地图片。 |
| `render_mermaid` | 将 Mermaid 渲染为终端 ASCII 或 PNG。 |

![官方 Web 搜索示例](https://omp.sh/clips/web-poster.webp)

## 记忆与状态工具

| 工具 | 用途 |
| --- | --- |
| `checkpoint` | 标记对话状态，便于之后 collapse/report。 |
| `rewind` | 剪掉探索性上下文，保留报告。 |
| `retain` | 写入 Hindsight durable facts。 |
| `recall` | 搜索 Hindsight raw memories。 |
| `reflect` | 让 Hindsight 根据记忆综合回答。 |

## 辅助工具

| 工具 | 用途 |
| --- | --- |
| `calc` | 确定性算术，避免模型心算。 |
| `resolve` | 接受或丢弃 queued preview action，例如 `ast_edit` 的 proposed change。 |
| `search_tool_bm25` | 在隐藏工具索引中做 BM25 检索，并按 discoveryMode 激活相关工具。 |

## 默认关闭的工具

上游 README 标注以下工具受设置控制，默认关闭：

```text
github, calc, inspect_image, render_mermaid,
checkpoint, rewind, search_tool_bm25,
retain, recall, reflect
```

启用时建议按项目或用户作用域开启，避免无关项目获得过宽工具面。

## Bash 工具重点

`bash` 不是简单 `child_process.exec`：

- 会合并输入参数和 shell 配置。
- 可选 blocked-command interception。
- 校验 cwd，并 clamp timeout。
- 根据需求选择 PTY 或非 PTY。
- 非交互路径支持 shell session 复用。
- 输出通过 `OutputSink` 流式处理、截断、artifact spill。
- 后台任务可由 `job` 管理。

## Read 工具重点

`read` 是“文件系统形状”的统一入口。它可以读取：

- 本地文本和目录。
- 压缩包内部条目。
- SQLite DB、表、行和查询结果。
- PDF / 文档。
- Jupyter Notebook。
- 图片元数据 / 内容。
- Web URL。
- `pr://`、`issue://`、`agent://`、`skill://`、`rule://` 等内部 URL。

这也是上游设计里“GitHub is just another filesystem”的基础。

![官方 PR 虚拟文件系统示例](https://omp.sh/captures/pr.webp)
