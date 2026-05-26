# CLI 参考

## 用法

```
omp [options] [@files...] [messages...]
omp <command> [args] [flags]
```

裸 `omp` 会在当前目录启动交互式会话。配合 `-p` 则输出一次回答后退出。子命令会跳过 agent 启动，直接调用对应工具。所有接受值的 flag 同时支持 `--flag=value` 形式。以 `@` 开头的参数均被视为文件，即使出现在 flag 之间也是如此。

## 优先级

CLI flag > 环境变量 > `~/.omp/agent/config.yml` > 内置默认值。`--api-key` 在单次运行中覆盖一切且不会被持久化；各 provider 如何解析密钥请参见 [Providers](../guide/providers.md)。大多数 flag 都有环境变量回退，详见 [环境变量](./env.md)。

## 模式

omp 支持五种输出协议。用 `--mode` 选择，或用 `-p` 走最常见场景（单次文本输出）。

| 选项 | 说明 | 默认 / 备注 |
| --- | --- | --- |
| `--print, -p` | 单次模式：发送 prompt，流式输出回答，然后退出。无 TUI。 |  |
| `--mode <mode>` | 输出协议。 | text \| json \| rpc \| acp \| rpc-ui |
| `--export <file> [out]` | 将录制的 jsonl 会话渲染为 HTML 后退出。可选的位置参数 out 为输出路径。 |  |
| `--allow-home` | 允许从 $HOME 启动而不自动切换到项目目录。 |  |

| 模式 | 说明 |
| --- | --- |
| `text` | 默认。纯文本流式输出到 stdout。配合 `-p` 适用于脚本。 |
| `json` | 换行分隔的 JSON 事件流。稳定结构，适合管道传入其他工具。 |
| `rpc` | 基于 stdio 的 JSON-RPC。供 SDK 和编程客户端使用。 |
| `rpc-ui` | 与 rpc 相同，但将 TUI 内的 tool-call UI 暴露给客户端。 |
| `acp` | 基于 stdio 的 Agent Client Protocol。与 omp acp 使用相同的线路格式。 |

`rpc`、`rpc-ui` 和 `acp` 的线路格式及 SDK 客户端，请参见 [RPC 模式](../guide/rpc.md) 和 [ACP](../guide/acp.md)。

## 模型

选择活跃模型和角色覆盖。角色语义详见 [模型角色](../guide/providers.md)；凭据和 OAuth 详见 [Providers](../guide/providers.md)。

| 选项 | 说明 | 默认 / 备注 |
| --- | --- | --- |
| `--model <id>` | 活跃模型。对注册表进行模糊匹配（如 sonnet、gpt-5-codex）。 | 上次使用值或 settings.activeModel |
| `--provider <name>` | Provider 提示。主要用于兼容；`--model` 通常就够了。 | — |
| `--smol <id>` | 覆盖 smol 角色（快速/低成本的辅助任务）。 | PI\_SMOL\_MODEL 或 settings |
| `--slow <id>` | 覆盖 slow 角色（深度推理、规划）。 | PI\_SLOW\_MODEL 或 settings |
| `--plan <id>` | 覆盖 plan 模式运行时使用的 plan 角色。 | PI\_PLAN\_MODEL 或 settings |
| `--models <p1,p2,…>` | 逗号分隔的角色循环模式。每项格式为 "id\[:effort\]"。 | 参见 /docs/roles。 |
| `--list-models [pattern]` | 打印已发现的模型后退出。可选的 pattern 过滤列表。 | 也可用作认证探测。 |
| `--thinking <level>` | 推理力度。 | off、minimal、low、medium、high、xhigh |
| `--api-key <key>` | 仅为本次运行使用此密钥。 | 不持久化。参见 /docs/providers。 |

## 会话

恢复、分支和隔离运行。会话交互体验详见 [Sessions](../guide/sessions.md)；JSONL 格式详见 [Session 格式](./session-format.md)。

| 选项 | 说明 | 默认 / 备注 |
| --- | --- | --- |
| `--continue, -c` | 打开当前目录下最近的会话。 |  |
| `--resume, -r [id\|path]` | 通过会话 ID 前缀或 jsonl 路径恢复。不指定值时打开交互式选择器。 |  |
| `--session <value>` | --resume 的别名。 |  |
| `--fork <message-id>` | 从指定的 message id 处分支已恢复的会话。 | 配合 -r 使用。 |
| `--no-session` | 不将本次运行持久化到 ~/.omp/agent/sessions/。 |  |
| `--session-dir <dir>` | 覆盖会话存储和查找的目录。 |  |
| `--provider-session-id <id>` | 将外部签发的 provider session id 透传到模型 API。 | 主要用于集成场景。 |
| `--no-title` | 跳过后台的"生成标题"模型调用。 |  |

## 工具与扩展

限制模型可调用的内置工具范围，以及启动时加载的扩展、技能和规则。`--no-extensions` 和 `--no-skills` 仅影响本次运行，不会修改保存的配置。

| 选项 | 说明 | 默认 / 备注 |
| --- | --- | --- |
| `--tools <a,b,…>` | 仅允许这些内置工具。未知名称会发出警告并被忽略。 | 参见 /docs/tools。 |
| `--no-tools` | 禁用所有内置工具。插件工具仍然加载。 |  |
| `--no-lsp` | 跳过为 lsp 工具启动语言服务器。 |  |
| `--no-pty` | 不使用 PTY 运行 bash。等同于 PI\_NO\_PTY=1。 |  |
| `--extension <path>, -e` | 加载扩展文件。可重复使用。 |  |
| `--hook <path>` | 加载 hook/扩展文件。可重复使用；与 -e 使用同一加载器。 |  |
| `--plugin-dir <path>` | 将目录视为插件根目录。可重复使用。 |  |
| `--no-extensions` | 禁用扩展自动发现。显式指定的 -e 路径仍然加载。 |  |
| `--no-skills` | 禁用技能发现和加载。 |  |
| `--skills <p1,p2,…>` | 逗号分隔的 glob 模式，仅保留匹配的技能。 |  |
| `--no-rules` | 禁用 RULES.md 的发现和注入。 |  |
| `--system-prompt <text\|@file>` | 替换系统 prompt。支持内联文本或 @file 路径。 |  |
| `--append-system-prompt <text\|@file>` | 追加到默认系统 prompt 末尾，而非替换。 |  |

## 输出

单次输出和会话导出。`-p` 会将 STDIN 读入 prompt，因此 `cat README.md | omp -p "Summarise"` 可以直接使用。`--export` 将录制的 JSONL 会话转为独立 HTML 页面。`--allow-home` 允许从 `$HOME` 启动而不自动切换到项目目录。

## 上下文

任何以 `@` 开头的位置参数都会在发送 prompt 前解析。omp 通过内容而非扩展名检测图片。

- **文本文件** 以 UTF-8 解码并作为 `<file name="/abs/path">…</file>` 块内联到用户消息顶部。超过 5 MB 的文件仅保留路径存根。
- **图片**（PNG/JPEG/WebP/GIF/…）作为原生多模态部件附加。当 `images.autoResize` 开启（默认）时自动调整大小。图片上限：25 MB。
- **缺失或不可读的文件** 会以非零退出码中止运行，不会静默跳过。

> `@files` 不支持在 `--mode rpc` 或 `rpc-ui` 下使用；请通过 RPC 协议传递内容。

## 其他

| 选项 | 说明 |
| --- | --- |
| `--help, -h` | 打印帮助信息和环境变量 / 工具参考。 |
| `--version, -v` | 打印版本后退出。 |

## 子命令

子命令会跳过 agent 启动器，直接运行专用工具。每个子命令都接受 `--help`。

| 命令 | 说明 |
| --- | --- |
| `acp` | 通过 stdio 运行 Agent Client Protocol。供编辑器集成（Zed、Neovim）嵌入 omp 使用。 |
| `agents` | 管理 agent 定义。`omp agents unpack` 将内置子 agent 解压到 ~/.omp/agent/agents/（使用 --project 则解压到 ./.omp/agents/）。 |
| `auth-broker` | 运行或管理远端凭据保险库：serve、token、login、logout、import、status。参见 [Providers](../guide/providers.md)。 |
| `auth-gateway` | 正向代理，为 OpenAI Chat、Anthropic Messages 和 OpenAI Responses 请求注入 broker 凭据。serve、token、status。参见 [Providers](../guide/providers.md)。 |
| `commit` | 根据暂存区 diff 生成提交消息并更新 CHANGELOG.md。Flag：--push、--dry-run、--no-changelog、--legacy、--context、--model。 |
| `config` | 读写设置：list、get、set、reset、path、init-xdg。权威来源为 settings schema。 |
| `grep` | 独立运行原生 grep 包装器。Flag：--glob、--limit、--context、--files、--count、--no-gitignore。 |
| `grievances` | 查看由 report\_tool\_issue 写入的自动 QA 工具问题日志。list / clean。 |
| `plugin` | 插件和市场生命周期管理：install、uninstall、list、link、doctor、features、config、enable、disable、marketplace、discover、upgrade。 |
| `read` | 从 shell 调用 read 工具，支持任意路径或 \*:// URI。适用于归档文件和工具输出。 |
| `search (q)` | 通过已配置的 provider 栈运行网络搜索。`omp q` 是其短别名。Flag：--provider、--recency、--limit、--compact。 |
| `setup` | 安装可选组件。`omp setup python` 配置 Python 内核；`omp setup stt` 配置语音转文字。传入 --check 仅探测不安装。 |
| `shell` | 进入交互式 REPL，后端为 bash 工具使用的同一 brush-core shell。Flag：--cwd、--timeout、--no-snapshot。 |
| `ssh` | 管理 ssh 工具使用的 SSH 主机定义：add、remove、list。 |
| `stats` | 查看使用统计（费用、高级请求数、token 数）。Flag：--summary、--json、--port。 |
| `update` | 自更新。优先使用 bun，否则拉取发布二进制。Flag：--force、--check。 |

## 用法示例

```
# 继续当前目录最近的会话
omp -c

# 交互式选择会话
omp -r

# 通过 ID 前缀恢复并从指定消息分支
omp -r 1f9d2a --fork msg_8c1e "Try a different approach"

# 单次模式，无 TUI
omp -p "Summarise CHANGELOG.md since the last release"

# 只读审计：禁用编辑、shell 和 LSP
omp --tools read,grep,find,search --no-lsp -p "Find dead code in src/"

# 角色循环：sonnet 用于 slow/plan，haiku 用于 smol
omp --models 'sonnet:high,haiku:low'

# 一次附带文件和图片
omp @prompt.md @screenshot.png "Implement what's drawn"

# 将旧会话渲染为独立 HTML
omp --export ~/.omp/agent/sessions/proj/2026-05-01.jsonl out.html

# 管道 stdin：stdin 上的任何内容成为 prompt
git diff | omp "review this diff and flag risky changes"

# CI 用 JSON 事件流
omp --mode json --no-session -p "$PROMPT" > events.jsonl
```
