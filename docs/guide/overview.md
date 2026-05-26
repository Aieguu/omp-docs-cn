# 项目概览

Oh My Pi（命令名通常为 `omp`）是一个面向真实编码工作的 agent surface。它源自 Mario Zechner 的 Pi / pi-mono，并在其基础上补齐了模型路由、工具系统、会话树、子代理、扩展、MCP、记忆和原生运行时等能力。

一句话理解：**omp 不是只会调用 shell 的聊天 CLI，而是把 IDE 能力、终端、调试器、浏览器、搜索、文件系统和多模型路由统一给 agent 使用的编码环境。**

## 适合什么场景

- 在终端里进行长期、多轮的代码修改和排查。
- 让 agent 直接使用 LSP 完成引用查找、重命名、诊断、代码动作。
- 让 agent 驱动 DAP 调试器，而不是只靠打印日志。
- 通过子代理并行拆解任务，再把结构化结果合并回来。
- 在同一套工具表面中读取文件、目录、SQLite、压缩包、PDF、Notebook、URL、PR、Issue 和内部协议资源。
- 通过扩展、技能、MCP、自定义工具把团队流程接进去。

## 关键特性

### 1. 多入口运行

omp 提供四类主要入口：

| 入口 | 用途 |
| --- | --- |
| `omp` | 默认交互式 TUI。适合日常编码。 |
| `omp -p` | one-shot 模式。适合脚本化调用。 |
| `omp --mode rpc` / `rpc-ui` | 通过 stdio NDJSON 由外部程序驱动。 |
| `omp acp` | 实现 Agent Client Protocol，可被编辑器驱动。 |

Node / TypeScript 项目还可以通过 `@oh-my-pi/pi-coding-agent` SDK 直接嵌入。

![官方 TUI ask 示例](https://omp.sh/captures/ask.webp)

### 2. 模型与 Provider 路由

omp 支持四十多个 Provider / coding plan / 本地模型入口。模型可以按角色配置：

- `default`：日常交互。
- `smol`：便宜、快速的子任务。
- `slow`：深度推理。
- `plan`：计划模式。
- `vision`、`designer`、`commit`、`task`：专用角色。

通过 `models.yml` 可以注册 OpenAI-compatible、Anthropic Messages、Google Gemini / Vertex、Azure OpenAI Responses 等接口，也可以设置 fallback、上下文溢出 promotion、Provider 顺序和本地 Ollama / LM Studio / llama.cpp 发现。

### 3. 工具系统

上游 README 标注内置 32 个工具，覆盖：

- 文件与搜索：`read`、`write`、`edit`、`ast_edit`、`search`、`find`。
- 运行时：`bash`、`eval`、`recipe`、`ssh`。
- 代码智能：`lsp`、`debug`。
- 协作：`task`、`irc`、`todo_write`、`job`、`ask`。
- 外部世界：`browser`、`web_search`、`github`、`inspect_image`、`render_mermaid`。
- 记忆与状态：`retain`、`recall`、`reflect`、`checkpoint`、`rewind`。
- 辅助：`calc`、`resolve`、`search_tool_bm25`。

工具不是简单“插件列表”，而是 agent prompt、运行时、TUI 渲染、权限、会话持久化和扩展拦截共同组成的执行层。

![官方 eval 示例：Python 与 JavaScript cell](https://omp.sh/captures/eval.webp)

### 4. 会话树与分支

会话以 JSONL 持久化，非线性结构由 `id` / `parentId` 表达。`/tree` 可以在当前会话文件内部移动 leaf，回到任意历史节点继续生成分支。`/branch`、`/fork`、`/resume` 则用于会话文件级别的分支、复制和切换。

### 5. 原生 Rust 能力

项目包含 `pi-natives`、`pi-shell`、`pi-ast`、`pi-iso` 等 Rust crate，提供 in-process 的 grep、glob、bash/PTY、AST、文本渲染、图片处理、token 计数、缓存与隔离支持。这样可以减少在 Windows/macOS/Linux 上对外部二进制工具的依赖。

![官方浏览器工具示例](https://omp.sh/captures/browser.webp)

## 与其他 agent CLI 的区别

| 维度 | 常见 CLI agent | Oh My Pi |
| --- | --- | --- |
| 文件读取 | 读文本或 shell cat | 统一读取文件、目录、压缩包、SQLite、PDF、Notebook、URL、内部协议 |
| 编辑 | replace / patch 为主 | hashline、结构化 AST edit、预览后 accept |
| IDE 能力 | 通常弱或缺失 | LSP 深度接入 |
| 调试 | 打印日志 | DAP 调试器操作 |
| 搜索 | shell out rg | 原生 grep / cache / glob |
| 子任务 | 文本子代理 | schema 结果、隔离 worktree、IRC 协调 |
| 扩展 | 旁路脚本 | 扩展、技能、MCP、工具、Hook、渲染统一接入 |

## 阅读路径

新用户建议：

1. 读 [安装与升级](./install.md)。
2. 读 [快速上手](./quickstart.md)。
3. 根据需求阅读 [配置体系](./settings.md)、[模型与 Provider](./providers.md)、[工具系统](./tools.md)。
4. 做团队集成时再读 [扩展、技能、MCP 与 Hook](./skills.md)。
