# CLI 参考

## 选择命令

单独运行 `omp` 会进入一个交互式编码会话。当你需要非交互式结果或管理任务时，可以加一条提示词、用管道传入文本，或选择某个专用命令。

| 目标 | 最小的命令 |
| --- | --- |
| 在当前目录打开交互式 TUI | `omp` |
| 带一条请求启动 | `omp "Fix the failing tests"` |
| 为第一条请求附带上下文 | `omp @plan.md @screenshot.png "Implement this"` |
| 输出一次回答后退出 | `omp -p "Summarize this project"` |
| 把输入通过管道传入一次性运行 | `git diff \| omp -p "Review this diff"` |
| 继续该目录最近一次的会话 | `omp -c` |
| 选择或指定一个已保存的会话 | `omp -r` 或 `omp -r <id>` |
| 输出机器可读的事件 | `omp -p --mode json "Find every TODO"` |
| 启动一个协议服务器 | `omp --mode rpc` 或 `omp acp` |
| 了解某个命令及其 flag | `omp --help` 或 `omp <command> --help` |

## 命令行结构

```
omp [launch flags] [@files...] [messages...]
omp launch [launch flags] [@files...] [messages...]
omp <command> [arguments] [command flags]
```

`launch` 是默认命令。如果第一个非 flag 单词不是已注册的命令，omp 会把剩余单词当作初始请求。例如，`omp "fix the build"` 会启动一个会话，而 `omp models` 会列出模型。当请求以某个命令名开头时，请显式使用 `omp launch …`。

所有接受值的长选项都同时支持 `--flag value` 与 `--flag=value`。用 `--` 来停止解析 flag：

```
omp -- "Explain why --force is dangerous here"
```

已加载的扩展可以添加 launch flags。`omp --help` 会在下方内置 flag 之外一并显示这些参数。

## 启动输入与入口模式

### 提示词、文件、图片与 stdin

*   普通位置参数会拼接成初始请求。
*   用 `@` 前缀附加路径。文本会作为上下文包含进来；受支持的图片会作为图片输入发送。大小限制与受支持的来源见 [文件操作](../guide/files.md)。
*   当 stdin 不是 TTY 时，omp 会自动读取它，不需要 `-` 标记。
*   缺失或不可读的 `@file` 会让命令失败，而不是静默忽略。
*   `@file` 参数在 `rpc` 或 `rpc-ui` 模式下不会被展开；请改经该协议发送输入。

```
omp @requirements.md "Implement the first unchecked item"
omp @before.png @after.png "Match the second design"
printf '%s\n' 'Explain packages/core' | omp -p
```

### 输出与协议模式

| 入口 | 行为 |
| --- | --- |
| `omp` | 交互式文本模式：打开 TUI 并保持会话运行。 |
| `omp -p`、`omp --print` | 无头文本模式：处理请求、写出答案并退出。 |
| `omp -p --mode json` | 为自动化输出换行分隔的结构化事件流。 |
| `omp --mode rpc` | 通过 stdio 运行 JSON-RPC 服务器。参见 [RPC](../guide/rpc.md)。 |
| `omp --mode rpc-ui` | 运行 RPC 并启用 UI 扩展事件。 |
| `omp --mode acp`、`omp acp` | 通过 stdio 运行 Agent Client Protocol 服务器。参见 [ACP](../guide/acp.md)。 |

`--mode text` 是默认值。`--print` 控制 text/JSON 模式是否在处理完请求后退出；协议模式则始终作为服务器运行。

## 启动参数

本节中的 flag 适用于 `omp` 与 `omp launch`。`omp acp` 虽然强制使用 ACP 传输，但也会接受相关的 launch flags。

### 工作区与配置

| Flag | 作用 |
| --- | --- |
| `--cwd <dir>` | 在该目录启动，而不是 shell 的当前目录。 |
| `--add-dir <dir>` | 再添加一个工作区目录。可重复添加多个。 |
| `--allow-home` | 允许会话在 `~` 下启动；否则 omp 会防止把整个 home 目录误当成项目。 |
| `--profile <name>` | 为指定档案(profile)使用独立的认证、会话、设置与缓存。 |
| `--alias <command>` | 为所选的 `--profile` 创建 shell 快捷命令，然后退出。 |
| `--config <file>` | 为本次进程添加一个 YAML 设置覆盖层。可重复；后面的文件优先生效。 |

配置按此顺序合并：内置默认值、全局配置、项目配置、来自 `PI_CONFIG_FILES` 的文件、重复的 `--config` 文件，以及 launch flags 之类的运行时覆盖。第一个存在的全局文件是 `~/.omp/agent/config.yml` 或 `~/.omp/agent/config.yaml`；项目原生设置位于 `.omp/config.yml`。环境变量的优先级因各解析器而异，并没有一条通用规则。参见 [设置](../guide/settings.md) 与 [环境变量](./env.md)。

### 已保存的会话

| Flag | 作用 |
| --- | --- |
| `-c`、`--continue` | 继续与当前项目关联的最近一次会话。 |
| `-r [id\|path]`、`--resume [id\|path]`、`--session [id\|path]` | 通过 ID 前缀或 JSONL 路径恢复。不带值时打开会话选择器。 |
| `--fork <id\|path>` | 把一个已保存的会话分叉为新会话。 |
| `--from-claude` | 导入 Claude Code 会话。 |
| `--from-codex` | 导入 Codex 会话。 |
| `--session-dir <dir>` | 覆盖会话存储与查找所使用的目录。 |
| `--no-session` | 让本次运行保持临时状态，不保存它。 |
| `--provider-session-id <id>` | 复用外部签发的 provider 会话 ID，以获得连续性与缓存作用域。 |
| `--no-title` | 跳过自动生成会话标题。 |
| `--export <session> [output.html]` | 把保存的 JSONL 会话渲染为 HTML 后退出。省略时，输出文件名由会话文件推导得出。 |

### 模型与推理

| Flag | 作用 |
| --- | --- |
| `--model <id-or-role>` | 通过模糊 ID、`provider/model` 或已配置的角色（如 `slow` 或 `@slow`）选择模型。 |
| `--provider <name>` | 旧的 provider 提示。优先使用 `--model`。 |
| `--api-key <key>` | 为本次运行提供所选 provider 的凭据；不会被持久化。 |
| `--smol <id>` | 覆盖快速/轻量模型角色。 |
| `--slow <id>` | 覆盖深度推理模型角色。 |
| `--plan <id>` | 覆盖规划模型角色。 |
| `--models <a,b,…>` | 限制可用于 `Ctrl+P` 循环切换的模型。模式可包含 effort，例如 `sonnet:high`。 |
| `--thinking <level>` | 设置为 `off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max` 或 `auto`。 |
| `--service-tier <tier>` | 覆盖 OpenAI 系列的服务层级：`none`、`auto`、`default`、`flex`、`scale` 或 `priority`。`none` 会省略请求字段。 |
| `--provider-session-id <id>` | 复用 provider 侧的会话 ID。 |
| `--prompt-cache-key <key>` | 覆盖本次会话的 provider prompt-cache key。 |
| `--hide-thinking` | 在 TUI 中隐藏思考块，而不改变模型的推理。 |
| `--print-thoughts` | 在 print 模式的文本输出中包含思考块。 |
| `--external-thinking` | 在禁用受支持的 provider 推理的同时使用私有草稿区。这种请求形态可能触发 provider 的滥用控制；请自行承担风险。 |

模型与凭据的解析见 [Providers](../guide/providers.md)，角色选择见 [模型角色](../guide/roles.md)。

### Prewalk 与计划执行

| Flag | 作用 |
| --- | --- |
| `--prewalk` | 在计划待办清单存在后，于第一次编辑或写入时切换到快速模型。默认关闭。 |
| `--no-prewalk` | 即使配置启用了 prewalk 也将其禁用。 |
| `--prewalk-into <id>` | 选择 prewalk 的目标模型；默认是 `smol` 角色。 |
| `--plan-yolo` | 以只读计划模式启动，自动审批第一个已解决的计划，然后执行它。 |
| `--plan-yolo-into <id>` | 选择执行 plan-yolo 计划的模型；默认是 `smol`。 |

参见 [Prewalk](../guide/prewalk.md) 与 [计划模式](../guide/plan.md)。

### 能力、审批与运行时

| Flag | 作用 |
| --- | --- |
| `--tools <a,b,…>` | 本次运行只允许列出的内置能力可用。 |
| `--no-tools` | 禁用所有内置能力。插件提供的能力仍可加载。 |
| `--no-lsp` | 禁用语言服务器功能、格式化与诊断。 |
| `--no-pty` | 禁用基于 PTY 的交互式 shell 执行。 |
| `--approval-mode <mode>` | 本次会话使用 `always-ask`、`write` 或 `yolo`。 |
| `--auto-approve`、`--yolo` | 跳过所有操作的审批提示。 |
| `--advisor` | 启用被动的逐轮审查并注入建议。参见 [Advisor](../guide/advisor.md)。 |
| `--max-time <duration>` | 在给定的秒数或时长（如 `5s`、`10m` 或 `1h`）后停止。 |

审批快捷方式会削弱交互式安全边界。参见 [工具审批](./approvals.md) 与 [安全扫描](../guide/security.md)。

### 扩展、Hook、技能与规则

| Flag | 作用 |
| --- | --- |
| `-e <path>`、`--extension <path>` | 加载一个扩展文件。可重复。 |
| `--hook <path>` | 通过同一个加载器加载 hook/扩展文件。可重复。 |
| `--trusted-extension <absolute-path>` | 从绝对路径加载受信任的扩展。可重复；不能与 `-e`、`--extension` 或 `--hook` 组合使用。 |
| `--plugin-dir <dir>` | 把本地插件目录加入发现范围。可重复。 |
| `--no-extensions` | 禁用扩展发现。显式给出的 `-e` 与 `--hook` 路径仍会加载。 |
| `--skills <glob,…>` | 只保留匹配这些逗号分隔 glob 模式的技能。 |
| `--no-skills` | 禁用技能的发现与加载。 |
| `--no-rules` | 禁用规则的发现与加载。 |

### 提示词与输出

| Flag | 作用 |
| --- | --- |
| `--system-prompt <text-or-file>` | 替换默认系统提示词。如果该值指向一个可读文件，omp 会读取它；否则该值按字面文本处理。 |
| `--append-system-prompt <text-or-file>` | 把可读文件的内容或字面文本追加到默认提示词之后。 |
| `-p`、`--print` | 不使用 TUI 处理请求，然后退出。 |
| `--mode <mode>` | 选择 `text`、`json`、`rpc`、`rpc-ui` 或 `acp`。 |
| `--print-thoughts` | 在 print 模式的文本中包含推理块。 |
| `--no-title` | 跳过后台的标题生成请求。 |
| `-h`、`--help` | 打印帮助后退出。 |
| `-v`、`--version` | 打印已安装的版本后退出。 |

## Shell 补全

补全脚本由实时命令注册表生成，包含嵌套动作与扩展提供的 launch flags。

```
# zsh: add to ~/.zshrc
eval "$(omp completions zsh)"

# bash: add to ~/.bashrc
eval "$(omp completions bash)"

# fish: install once
omp completions fish > ~/.config/fish/completions/omp.fish
```

运行 `omp completions bash`、`omp completions zsh` 或 `omp completions fish` 即可输出脚本。重启 shell 或 source 其启动文件，然后输入 `omp` 并按 Tab 验证。

## 子命令索引

每个公开子命令都支持 `--help`。别名显示在其规范命令旁边。命令专属的 flag 放在命令之后。

| 命令 | 用途与嵌套动作 |
| --- | --- |
| `launch` | 启动编码会话；这是默认命令。 |
| `acp` | 通过 stdio 运行 ACP 服务器。 |
| `agents` | `unpack` 内置的任务 agent 定义。 |
| `auth-broker` | `serve`、`token`、`login`、`logout`、`import`、`migrate`、`status`、`list`。 |
| `auth-gateway` | `serve`、`token`、`status`、`check`。 |
| `bench` | 对一个或多个模型进行基准测试。 |
| `browser-relay` | `serve` Chrome 中继，或 `install` 其扩展。 |
| `cleanse` | 发现项目诊断，并用文件不相交的 worker 修复它们。 |
| `commit` | 生成提交消息、更新 changelog 并提交。参见 [创建提交](../guide/commit.md)。 |
| `completions` | 为 `bash`、`zsh` 或 `fish` 生成补全脚本。 |
| `compress` | 压缩（densify）一个或多个文本文件。 |
| `config` | `list`、`get`、`set`、`reset`、`path`、`init-xdg`。 |
| `dry-balance` | 模拟跨会话 ID 的 OAuth 账户选择。 |
| `gallery` | 预览终端渲染器与生命周期状态。 |
| `gc` | 检查或执行存储垃圾回收。 |
| `grep` | 在 shell 中运行 omp 的独立正则搜索。 |
| `grievances` | `list`、`clean` 或 `push` 自动 QA 报告。 |
| `images`、`img` | `status`、`doctor`、`probe` 或 `purge` 图片发布状态。 |
| `install` | 安装或链接扩展；是 `plugin install`/`plugin link` 的简写。 |
| `join` | 加入协作链接。参见 [Collab](../guide/collab.md)。 |
| `models` | `ls`、`find`、`refresh`，或列出指定的 provider。 |
| `plugin` | 安装、配置、启用、禁用、发现并升级插件与市场。 |
| `ps` | `list`、`info`、`logs`、`stop`、`kill` 或 `restart` 受监管的进程。 |
| `read` | 输出本地路径、URL、归档成员、数据库行或内部 URI。 |
| `render` | 通过生产级终端渲染器渲染完整的已保存记录。 |
| `say` | 在本地朗读文本，或把它写入 WAV 文件。 |
| `search`、`q` | 使用已配置的搜索 provider 进行网络搜索。 |
| `setup` | 运行引导流程，或配置 `python` 或 `speech`。 |
| `share` | 通过分享服务或 secret gist 分享已保存的会话。 |
| `shell` | 打开交互式 shell 控制台。 |
| `ssh` | `add`、`remove` 或 `list` 已保存的 SSH 主机。 |
| `stats` | 打开统计仪表盘或打印统计信息。 |
| `tiny-models` | `download` 或 `list` 本地 tiny 模型。 |
| `token` | 输出或检查某个 provider 已存储的凭据。 |
| `ttsr` | `test`、`list` 或 `scan` TTSR 规则。 |
| `update` | 检查或安装 omp 与插件的更新。 |
| `usage` | 显示 provider 限额，或 `invalidate` 缓存的用量报告。 |
| `worktree`、`wt` | `list` 或 `clear` agent 管理的工作树。 |

## 子命令参考

### 会话、协作与本地服务

| 命令 | 语法、动作与 flag |
| --- | --- |
| `omp acp [launch flags]` | 通过 stdio 启动 ACP。没有 ACP 专属的公开 flag；请使用适用的 [启动参数](#启动参数)。 |
| `omp agents unpack [flags]` | 写入内置的 agent 定义。`--user` 指向 `~/.omp/agent/agents`（默认）；`--project` 指向 `./.omp/agents`；`--dir <path>` 覆盖两者；`-f`、`--force` 覆盖写入；`--json` 输出 JSON。 |
| `omp browser-relay [serve\|install] [flags]` | 默认执行 `serve`。`-p`、`--port <n>` 选择端口；`--token <value>` 需要一个扩展 token；`--dir <path>` 选择安装目录；`--no-group` 让 Chrome 标签页保持未分组；`-v`、`--verbose` 记录流量摘要。参见 [计算机控制](../guide/computer.md)。 |
| `omp join <link>` | 加入由主机提供的加密协作链接。没有命令专属的 flag。 |
| `omp ps [action] [name] [flags]` | `list`（默认）显示进程；`info` 显示单个进程；`logs` 读取输出；`stop` 请求正常关闭；`kill` 立即终止；`restart` 重新启动。`-a`、`--all`；`-j`、`--json`；`--plain`；`--dir <path>`；`--global <scope>`；`-f`、`--follow`；`--head`；`-n`、`--lines <n>`（最多 1000）；`--grep <regex>`；`--timeout <seconds>` 用于 `stop`。 |
| `omp share <session> [--gist]` | 分享一个会话 ID 前缀或 JSONL 路径。`--gist` 使用 secret GitHub gist 而不是分享服务器。 |
| `omp shell [flags]` | 打开交互式控制台。`-C`、`--cwd <dir>` 选择其目录；`-t`、`--timeout <ms>` 设置每条命令的超时；`--no-snapshot` 跳过用户的 shell 快照。 |
| `omp stats [flags]` | 打开用量仪表盘。`-p`、`--port <n>` 与 `--host <host>` 绑定服务器；`-j`、`--json` 打印 JSON；`-s`、`--summary` 打印控制台摘要。 |
| `omp worktree [list\|clear] [flags]` | `list` 是默认动作。`clear` 移除受管理的条目；`-n`、`--dry-run` 预览；`--all` 包含进行中的 PR 检出工作树；`-j`、`--json` 输出 JSON。`wt` 是其别名。 |

### 认证与 Provider 检查

| 命令 | 语法、动作与 flag |
| --- | --- |
| `omp auth-broker [action] [source] [flags]` | `serve` 启动凭据保险库；`token` 输出或轮换其 bearer token；`login [provider]`；`logout [provider]`；`list` 列出 OAuth provider；`import <path>` 导入凭据；`migrate` 上传本地凭据；`status` 检查已配置的 broker。Flag：`--json`；`-b`、`--bind <host:port>`；`--regenerate`；`--via <user@host>`；`--provider <id>`（用于 import）；`--include-disabled`；`--from-local`；`--include-env`；`--include-oauth`；`--dry-run`。 |
| `omp auth-gateway [serve\|token\|status\|check] [flags]` | `serve` 启动正向代理；`token` 输出或轮换其 bearer token；`status` 显示网关/broker 配置；`check` 探测凭据。Flag：`--json`；`-b`、`--bind <host:port>`；`--regenerate`；`--no-auth` 允许任何本地调用者；`--strict` 执行实时的 provider 检查并消耗少量配额。 |
| `omp dry-balance [model] [flags]` | 不运行会话即可测试账户选择。`--model <selector>`；`--count <n>`；`--concurrency <n>`；`--json`；`--bench` 为每个 OAuth 账户发送一次实时基准测试请求。 |
| `omp models [action] [pattern] [flags]` | 裸命令或 `ls` 列出模型；给出 provider 名称则列出该 provider；`find <text>` 搜索；`refresh` 刷新目录。Flag：`--json`；`-e`、`--extension <path>` 可重复；`--no-extensions`；`--config <file>` 可重复。 |
| `omp token <provider> [flags]` | 输出所选 provider 的 API key 或 OAuth 访问 token。`--raw` 避免解包嵌套的凭据 JSON；`--force-refresh` 刷新 OAuth；`-l`、`--list` 列出账户；`-a`、`--account <n>` 选择从 1 开始的账户。请把输出当作密钥对待。 |
| `omp usage [invalidate] [flags]` | 裸命令显示实时的 provider 限额；`invalidate` 清除缓存的报告。`-j`、`--json`；`-p`、`--provider <id>`；`-r`、`--redact`；`--history`；`-d`、`--days <n>`。 |

### 插件、市场与配置

| 命令 | 语法、动作与 flag |
| --- | --- |
| `omp config list [--json]` | 列出每一项设置及其当前值。凭据字段会在列表中脱敏。 |
| `omp config get <key> [--json]` | 打印一项设置。对凭据显式 `get` 会返回其值，因此请保护它的输出。 |
| `omp config set <key> <value> [--json]` | 设置一个全局值。布尔值接受 `true/false`、`yes/no`、`on/off` 或 `1/0`；数组与记录使用 JSON。 |
| `omp config reset <key> [--json]` | 恢复架构默认值。 |
| `omp config path` | 打印当前激活的 agent/config 目录。 |
| `omp config init-xdg` | 初始化 XDG Base Directory 布局。 |
| `omp install <target…> [flags]` | 安装 npm/git/市场目标，或链接本地目录。`--json`；`--force`；`--dry-run`；市场安装使用 `--scope user\|project`。 |
| `omp update [flags]` | 安装当前频道的更新。`-f`、`--force`；`-c`、`--check`；`-l`、`--plugins`；`--canary`；`--stable`。 |

`omp plugin` 有自己的一套嵌套命令：

共享 flag 有 `--json`、`--force`、`--dry-run`、`--scope user\|project`，以及 `-l`、`--local`（作用于项目本地的插件目录）；各动作的专属用法如下所列。

| 命令 | 作用与相关 flag |
| --- | --- |
| `omp plugin list [--json]` | 列出 npm/link 与市场插件。裸 `omp plugin` 也会列出。 |
| `omp plugin install <target…> [flags]` | 安装 npm spec、git URL、`name@marketplace`，或链接本地路径。功能语法为 `pkg[one,two]`、`pkg[*]` 或 `pkg[]`。Flag：`--json`、`--force`、`--dry-run`、`--scope user\|project`。 |
| `omp plugin uninstall <name…> [flags]` | 移除插件。Flag：`--json`、`--dry-run`、`--scope user\|project`。 |
| `omp plugin link <path> [--json]` | 为开发创建指向本地插件的符号链接。 |
| `omp plugin doctor [--fix] [--json]` | 检查插件健康状态；`--fix` 尝试修复。 |
| `omp plugin features <plugin> [flags]` | 显示可选功能。`--enable <a,b>`、`--disable <a,b>` 或 `--set <a,b>` 可修改它们；`--json` 输出 JSON。 |
| `omp plugin config list <plugin> [--json]` | 列出插件设置。 |
| `omp plugin config get <plugin> <key> [--json]` | 读取一项插件设置。secret 字段在显示输出中会被掩码处理。 |
| `omp plugin config set <plugin> <key> <value>` | 解析、校验并写入一项插件设置。 |
| `omp plugin config delete <plugin> <key>` | 删除一项插件设置。 |
| `omp plugin config validate [--json]` | 校验所有已安装插件的设置。 |
| `omp plugin enable <name…> [--scope user\|project] [--json]` | 启用已安装的插件。scope 适用于市场安装。 |
| `omp plugin disable <name…> [--scope user\|project] [--json]` | 禁用插件而不卸载。 |
| `omp plugin marketplace list` | 列出已配置的市场来源；这是市场命令的默认动作。 |
| `omp plugin marketplace add <source>` | 添加一个市场来源。 |
| `omp plugin marketplace remove <name>` | 移除一个来源。也接受 `rm`。 |
| `omp plugin marketplace update [name]` | 更新一个市场；未提供名称时更新全部。 |
| `omp plugin discover [marketplace]` | 列出可用的市场插件，可选地只列出来自某一个来源的。 |
| `omp plugin upgrade [name@marketplace] [--scope user\|project]` | 跨作用域（或单个所选作用域）升级一个市场插件；省略时升级所有插件。 |

并不存在顶层的 `omp marketplace`、`omp discover`、`omp enable`、`omp disable` 或 `omp upgrade` 管理命令；请使用上面的 `omp plugin …` 形式。

### 项目维护与诊断

| 命令 | 语法与 flag |
| --- | --- |
| `omp bench <model…> [flags]` | 对 TTFT/prefill 与生成吞吐量进行基准测试。`--runs <n>`；`--max-tokens <n>`；`--prompt <text>`；`--profile mix\|chat\|prefill\|generation`；`--prefill-bytes <n>`；`--service-tier <tier>`；`--json`；`--par <n>`；`--cache`；`--cache-prefix-file <path>`；`--cache-prefix-bytes <n>`；`--cache-pairs <n>`；`--cache-concurrency <n>`。 |
| `omp cleanse [request] [flags]` | 发现请求（如 `"ts errors"`）所隐含的检查器。`-n`、`--agents <n>`；`-m`、`--model <selector>`；`-t`、`--tests`；`-a`、`--all`。 |
| `omp commit [flags]` | 生成提交消息、更新 changelog 并提交暂存的 diff。`--push`；`--dry-run`；`--no-changelog`；`--legacy`；`-c`、`--context <text>`；`-m`、`--model <selector>`。 |
| `omp compress <file-or-glob…> [flags]` | 把文本改写为密集的提示词寄存器。`-o`、`--out <path>` 用于单个文件；`-i`、`--inPlace`；`-r`、`--rounds <n>`；`-n`、`--agents <n>`；`-m`、`--model <selector>`。 |
| `omp gc [flags]` | 除非给出 `--apply`，否则只预演存储维护。Flag：`--apply`；`--json`；`--agent-dir <path>`；`--blobs`；`--archive`；`--wal`；`--cold-archive-after-days <n>`；`--retain-newest-global <n>`；`--retain-newest-per-cwd <n>`。 |
| `omp grievances [list\|clean\|push] [flags]` | `list` 是默认动作；`clean` 删除选中的报告；`push` 提交排队的报告。`-n`、`--limit <n>`；`-t`、`--tool <name>`；`-j`、`--json`；`--id <n>`；`--all`。 |
| `omp images [status\|doctor\|probe\|purge] [flags]` | `status` 是默认动作；`doctor` 诊断；`probe` 检查外部健康状态；`purge` 默认为预演。`--json`；`--apply`；`--all`；`--dir <project>`；`--timeout <seconds>`。别名：`img`。 |
| `omp ttsr [test\|list\|scan] [input] [flags]` | `list` 显示规则；`test` 检查一段内联片段、路径或 `--file`；`scan [dir]` 检查文件。`--file <path\|->`；`-r`、`--rule <file>`；`--source text\|thinking\|tool`；`--tool <name>`；`-p`、`--path <path>`；`-v`、`--verbose`；`--json`；`--no-gitignore`；`--max-bytes <n>`（`0` 表示不设限）。 |

### 独立检查与媒体命令

这些是 shell 命令。它们的参数是普通 CLI 语法；并不是模型函数调用的配方。

| 命令 | 语法与 flag |
| --- | --- |
| `omp gallery [flags]` | 预览渲染器。`-t`、`--tool <name>`；`-s`、`--state <state>` 可重复（`streaming`、`progress`、`success` 或 `error`；显示标签别名同样有效）；`-w`、`--width <columns>`；`-e`、`--expanded`；`--plain`；`--screenshot`；`-o`、`--out <path>`；`--font <family>`；`--font-size <points>`。截图模式需要 `vhs`。 |
| `omp grep [pattern] [path] [flags]` | 使用正则搜索。`-g`、`--glob <pattern>`；`-l`、`--limit <n>`；`-C`、`--context <n>`；`-f`、`--files`；`-c`、`--count`；`--no-gitignore`。 |
| `omp read <path-or-uri>` | 输出文件、URL、内部 URI、归档成员或 SQLite 选择的内容。支持 `src/a.ts:50-100`、`src/a.ts:raw` 之类的选择器。 |
| `omp render [session] [flags]` | 默认渲染当前目录下最近一次的会话。`-w`、`--width <columns>`；`--height <rows>`；`-t`、`--timing`；`--repaint <n>`；`--plain`；`-q`、`--quiet`。 |
| `omp say [text] [flags]` | 在本地朗读文本。`--voice <id>`；`--model <key>`；`-f`、`--file <path>`；`-o`、`--out <wav>` 写入文件而不是播放。 |
| `omp search [query…] [flags]` | 进行网络搜索。`--provider <name>` 接受 `auto`、`perplexity`、`gemini`、`anthropic`、`codex`、`xai`、`zai`、`exa`、`tinyfish`、`jina`、`kagi`、`tavily`、`firecrawl`、`brave`、`kimi`、`parallel`、`synthetic`、`searxng`、`startpage`、`duckduckgo`、`ecosia`、`google`、`mojeek` 或 `public`；`--recency day\|week\|month\|year`；`-l`、`--limit <n>`；`--compact`。别名：`q`。 |

### Setup、SSH 与本地模型资源

| 命令 | 语法、动作与 flag |
| --- | --- |
| `omp setup` | 运行交互式引导向导，需要 TTY。 |
| `omp setup python [--check] [--json]` | 安装或探测 Python 内核依赖。 |
| `omp setup speech [--check] [--json]` | 安装或探测语音依赖。 |
| `omp ssh add <name> [flags]` | 添加主机。选项：`--host <address>`、`--user <name>`、`--port <n>`、`--key <path>`、`--desc <text>`、`--compat`、`--scope project\|user`、`--json`。 |
| `omp ssh remove <name> [--scope project\|user] [--json]` | 移除已保存的主机。 |
| `omp ssh list [--json]` | 列出已保存的主机。 |
| `omp tiny-models list [--json]` | 列出用于会话标题与记忆的本地 tiny 模型。 |
| `omp tiny-models download <model\|all> [--json]` | 下载一个模型或所有受支持的 tiny 模型。 |

## 实用示例

```
# Start in another directory with an additional workspace root
omp --cwd apps/web --add-dir packages/ui "Fix the broken component test"

# Resume a session and keep the result as a separate fork
omp --fork 01JZ8Y2A "Try the smaller design"

# Bounded one-shot run for CI
omp -p --mode json --no-session --max-time 10m \
  "Check whether generated files are current" > omp-events.jsonl

# Restrict the session and require approval for writes
omp --tools read,grep,glob --approval-mode write \
  "Audit the migration without changing files"

# Inspect available models, then benchmark two choices
omp models find sonnet
omp bench sonnet gpt-5.6 --runs 3

# Manage a project-scoped marketplace plugin
omp plugin marketplace add https://example.com/marketplace.json
omp plugin install widget@example --scope project
omp plugin list

# Check configuration and storage without applying destructive work
omp config get defaultThinkingLevel
omp gc --json
omp worktree clear --dry-run
```

如果某个命令拒绝了某个动作或 flag，请运行当前安装版本的 `omp <command> --help`。该输出由用于分发与补全的同一份实时命令注册表生成。
