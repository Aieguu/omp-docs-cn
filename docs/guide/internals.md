# 架构与运行时

本页面向需要理解内部实现、排查问题或贡献代码的读者。

## Monorepo 结构

主要 npm package：

| Package | 说明 |
| --- | --- |
| `@oh-my-pi/pi-ai` | 多 Provider LLM client，负责 streaming 和 provider integration。 |
| `@oh-my-pi/pi-agent-core` | Agent runtime、tool calling、状态管理。 |
| `@oh-my-pi/pi-coding-agent` | CLI、TUI、SDK、会话、配置、扩展。 |
| `@oh-my-pi/pi-tui` | 终端 UI 库，差量渲染。 |
| `@oh-my-pi/pi-natives` | N-API binding，暴露 Rust 原生能力。 |
| `@oh-my-pi/omp-stats` | 本地 AI 使用统计面板。 |
| `@oh-my-pi/pi-utils` | 共享工具、环境、路径、日志、进程 helper。 |
| `@oh-my-pi/swarm-extension` | Swarm orchestration 扩展包。 |

主要 Rust crate：

| Crate | 说明 |
| --- | --- |
| `pi-natives` | 核心 N-API `cdylib`。 |
| `pi-shell` | 嵌入式 shell / PTY / process 管理。 |
| `pi-ast` | tree-sitter 代码摘要和 AST 工具。 |
| `pi-iso` | task isolation backend resolver。 |
| `brush-core-vendored` | vendored brush-shell。 |
| `brush-builtins-vendored` | vendored bash builtins。 |

## Native addon loader

`pi-natives` 通过平台标签加载对应 N-API addon，支持：

- `linux-x64`
- `linux-arm64`
- `darwin-x64`
- `darwin-arm64`
- `win32-x64`

其目的是把热路径能力放在进程内：grep、glob、shell、AST、highlight、PTY、图片解码、token counting 等。

## Shell / PTY 运行时

`bash` 工具有两条主要路径：

- 非交互执行：通过 `executeBash`，支持 shell session 复用、timeout、取消、输出汇聚。
- 交互 PTY：通过 `runInteractiveBashPty`，用于 sudo、ssh 交互提示等需要 TTY 的情况。

输出统一由 sink 管理，必要时 spill 到 artifact。

## LSP / DAP

`lsp` 工具将 workspace 语言服务能力暴露给 agent：

- diagnostics。
- definition / type_definition / implementation。
- references。
- hover。
- document/workspace symbols。
- rename / rename_file。
- code_actions。
- raw request。

`debug` 工具通过 DAP 驱动调试器，支持断点、栈帧、线程、变量、evaluate、step 等操作。

## Schema normalization

不同模型 / Provider 对 tool schema 支持差异很大。omp 的 schema normalizer 会为 OpenAI strict mode、Google、CCA、MCP 等路径做清洗和转换，例如：

- 本地 `$ref` inline。
- 单元素 `allOf` collapse。
- `anyOf` wrapper description hoist。
- enum / const primitive type inference。
- 根据 provider dispatcher 输出兼容 schema。

这能降低工具 schema 被某些 API 拒绝的概率。

## Streaming 与 Provider 兼容

Provider 层需要处理：

- OpenAI Completions / Responses / Codex Responses。
- Azure OpenAI Responses。
- Anthropic Messages。
- Google Generative AI / Vertex。
- gateway routing。
- reasoning / thinking 字段差异。
- tool call / tool result message 格式差异。
- strict tool schema 支持差异。

这些差异通过 built-in catalog metadata、`compat` 和 schema normalizer 协同处理。

## TTSR：Time-traveling stream rules

TTSR 的核心思想是：规则平时不占上下文，直到模型输出触发匹配。触发后：

1. 中止当前 stream。
2. 注入对应 rule 作为系统提醒。
3. 从同一位置重试。
4. 注入记录写入 session，compaction 后仍能保留。

适合把“偶发但重要”的约束做成规则，而不是每轮都塞进系统提示。

## Artifact / blob 存储

- Blob store：全局、内容 hash、适合图片等大型二进制。
- Artifact：session-local、单调 ID、适合长工具输出和截断内容。
- `agent://<id>`：访问子代理结构化输出或路径字段。

这三者让工具结果可以被压缩、引用、恢复，而不是全部塞进模型上下文。

## Natives build / release

上游文档包含 native build、release debugging、binding contract、task cancellation、media/system utils 等内容。贡献 native 代码时重点关注：

- N-API ABI 与平台包。
- Rust cancellation / timeout。
- libuv worker pool 阻塞任务边界。
- Windows/macOS/Linux 行为差异。
- binary artifact 发布和加载 fallback。

## RPC / ACP

RPC 模式：

```sh
omp --mode rpc --no-session
```

输入输出为 NDJSON frame，可由非 Node 程序驱动。`rpc-ui` 会额外发出 UI request frame，宿主需要响应。

ACP 模式：

```sh
omp acp
```

通过 JSON-RPC 实现 Agent Client Protocol。编辑器可把文件读写、终端输出、权限请求接入自身 UI。
