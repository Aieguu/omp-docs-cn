# Slash 命令

## 运行命令

在主提示词编辑器中，输入 `/` 打开自动补全。继续输入以过滤，使用方向键移动，按 Tab 或 Enter 接受补全。Escape 关闭菜单。

最小的实用检查是：

```
/context
```

按 Enter 运行它。参数跟在命令之后并以空格分隔；命令族则先接收子命令：

```
/rename investigate checkout timeout
/usage reset active
/mcp test github
```

在下面的形式中，`[value]` 为可选，`<value>` 为必填，`a|b` 表示二选一。带引号的参数会将空格保留在一起。冒号可以将顶层命令与其第一个参数分开，这就是为什么 `/force write` 和 `/force:write` 都有效。

没有内置的顶层 `/help`。通过 `/` 自动补全及其内联参数提示来了解命令。输入一个命令族并加一个空格即可查看其子命令。`/mcp help`、`/ssh help` 和 `/marketplace help` 会打印命令族各自的用法；`/hotkeys` 显示键盘快捷键。参数无效时也会打印可接受的格式。

本页描述的是交互式终端。命令只在主会话编辑器中运行，当子代理对话获得焦点时不会运行。在协作期间，访客只能在本地运行 `/dump`、`/export`、`/copy`、`/hotkeys`、`/settings`、`/leave`、`/collab`、`/exit` 和 `/quit`；其他所有斜杠命令都仅限主机使用。

## 内置命令

这些名称随核心注册表一起提供，优先于动态发现的命令。

### 模式、模型与轮次控制

| 命令 | 可见效果与可用性 |
| --- | --- |
| `/settings` | 打开设置菜单。 |
| `/setup [providers]` 别名：`/providers` | 为登录和 Web 搜索 Provider 打开 Provider 设置。不接受其他子命令。 |
| `/plan [prompt]` | 切换 Plan 模式；内联提示词会立即开始规划。需要 `plan.enabled`，不能在 goal 模式期间启动，并且与 vibe 模式互斥。参见 [Plan 模式](./plan.md)。 |
| `/plan-review` | 重新打开最近一次的计划审查。仅在 plan 模式处于活动状态时可用。 |
| `/vibe [prompt]` | 切换只读 vibe 模式，并可选用提示词启动它。它不能在 plan 或 goal 模式期间启动。参见 [Vibe 模式](./vibe.md)。 |
| `/goal [objective]` | 在未激活时打开 goal 编辑器，在激活时打开管理菜单；内联目标直接启动 goal。需要 `goal.enabled`，并且不能在 plan 或 vibe 模式期间启动。参见下方的子命令及 [Goal 模式](./goal.md)。 |
| `/guided-goal [rough objective]` | 在聊天中启动一次访谈，然后根据结果配置 goal 模式。它与 `/goal` 有相同的 `goal.enabled`、plan 模式和 vibe 模式约束。 |
| `/loop [count\|duration] [prompt]` | 切换在每次让出控制权后自动重新提交。正整数限制迭代次数；时长接受紧凑或带空格的形式，如 `90s`、`10 min` 或 `1h30m`。普通文本是无界内联提示词。再次运行 `/loop` 停止；Escape 取消当前迭代。 |
| `/queue <message>` | 在活动轮次让出控制权后发送后续消息；若空闲则立即开始。`-> message` 和 `=> message` 是等效的编辑器简写。 |
| `/model` 别名：`/models` | 打开模型中心以选择角色和 Provider。在 TUI 中，此命令不接受模型 ID 参数。 |
| `/switch` | 打开紧凑的仅会话模型选择器，与 Alt+P 的动作相同；它不会持久化角色设置。 |
| `/fast [on\|off\|status]` | 裸形式切换优先服务（OpenAI 的 `service_tier=priority` 或 Anthropic 的快速档）。当前模型可能无法启用。`toggle` 也被接受。 |
| `/extended-context [on\|off\|status]` | 裸形式切换持久化的高级长上下文设置；`toggle` 也被接受。 |
| `/computer [on\|off\|status]` | 裸形式切换本会话的原生 computer-use 工具。`status` 报告后端、权限、暴露范围和模型；在本会话中可能无法启用。`toggle` 也被接受。 |
| `/vision <on\|off\|auto\|status>` | 为 `inspect_image` 委托工具设置会话级覆盖。`auto` 遵循配置的模式，并为具有原生图像输入的模型隐藏委托。 |
| `/prewalk` | 为下一个受 todo 门控的编辑或写入启用已认证的 `@smol` 角色，即使 omp 不是以 `--prewalk` 启动的。参见 [Prewalk](./prewalk.md)。 |
| `/advisor [on\|off\|status\|dump [raw]\|configure]` | 裸形式切换 advisor；`/advisor toggle` 与之等效。显式形式为 `/advisor on`、`/advisor off`、`/advisor status`、`/advisor dump [raw]` 和 `/advisor configure`。`dump` 复制一份紧凑的记录，除非提供 `raw`；`configure` 打开 TUI 编辑器。已配置的 advisor 仍需要为 `advisor` 角色分配模型。参见 [Advisor](./advisor.md)。 |
| `/browser [headless\|visible]` | 裸形式在 headless 与 visible 之间切换浏览器并重启它。需要 `browser.enabled`。`hidden` 表示 headless；`show` 和 `headful` 表示 visible。 |
| `/force:<tool-name> [prompt]` 也支持 `/force <tool-name> [prompt]` | 为下一个 agent 轮次强制指定一种工具选择。内联提示词启动该轮次；没有提示词时，下一条消息使用该选择。该工具必须处于活动状态。 |
| `/live` | 启动由 Codex 支持的实时语音模式；再次运行以停止。仅交互式 TUI。 |
| `/pause` | 在主 agent、子代理和 advisor 的下一个安全边界将其冻结。进行中的调用会完成；按 Escape、Enter 或 Space 恢复。 |

#### `/goal` 子命令

| 形式 | 效果 |
| --- | --- |
| `/goal set <objective>` | 设置或替换持久化目标。`/goal` 后跟裸目标即为简写形式。 |
| `/goal show` | 显示目标、状态和预算。 |
| `/goal pause` | 暂停当前 goal。 |
| `/goal resume` | 恢复已暂停的 goal。 |
| `/goal drop` | 从本会话移除 goal。 |
| `/goal budget <N\|off>` | 更改或移除其 token 预算。 |

### 安全

`/security` 需要 `security.enabled`。裸 `/security` 列出已存储的扫描。该命令会将本地扫描作为后台操作启动，因此请使用 `status` 而不是在提示词处等待。云形式还需要存储的 OpenAI Codex OAuth 账户。关于扫描模型和产物，参见 [Security](./security.md)。

| 形式 | 效果 |
| --- | --- |
| `/security plan [options]` | 创建一个不可变的 plan，并打印其 ID 和指纹。选项：可重复的 `--path <path>`、`--exclude <path>` 和 `--knowledge-base <path>`；`--working-tree`；`--diff <base> <head>`；`--output <dir>`；`--archive-existing`；`--credential <id>`。 |
| `/security scan [<plan-id>\|options]` | 启动现有的 `secplan_…`，或用相同的选项创建 plan 并启动。打印扫描和操作 ID。 |
| `/security status [operation-id]` | 显示一个操作或列出操作。 |
| `/security cancel <operation-id>` | 请求取消正在运行的操作。 |
| `/security scans` | 列出已存储的项目扫描。 |
| `/security show <scan-id\|security://…>` | 呈现一次扫描或其他安全资源。 |
| `/security import <sarif-file\|bundle-directory>` | 将 SARIF 或 Codex Security bundle 导入项目存储。 |
| `/security export <scan-id> --output <path> [--format bundle\|sarif\|report]` | 写出规范的 bundle、SARIF 文档或报告。 |
| `/security validate <finding-uri>` 或 `/security validate <scan-id> <finding-id>` | 启动一个 agent 轮次，用原生安全工具验证一条 finding。 |
| `/security compare <before-scan-id> <after-scan-id>` | 打印 finding 溯源对比数据。 |
| `/security disposition <scan-id> <finding-id> <open\|false_positive\|accepted_risk\|fixed\|wont_fix> [rationale]` | 更新一条 finding。除 `open` 外的每个状态都需要 rationale。 |
| `/security cloud scans [--credential <id>]` | 列出 Codex Security 云配置。这个受支持的子命令目前未在嵌套自动补全中提供。 |
| `/security cloud start --repo-id <id> --repo-url <url> --environment <id> [--lookback <days\|all>] [--credential <id>]` | 启动云扫描并消耗云扫描配额。 |
| `/security cloud status <configuration-id> [--credential <id>]` | 显示云扫描统计信息。 |
| `/security cloud pull <configuration-id> [--credential <id>]` | 将云端 finding 导入本地项目存储。 |

### 会话、历史与上下文维护

| 命令 | 可见效果与可用性 |
| --- | --- |
| `/session [info]` | 在 TUI 中打开当前会话信息。 |
| `/session delete` | 删除当前已持久化的会话并返回选择器。流式传输期间或内存会话不可用。 |
| `/session pin [account]` | 将当前 Provider 固定到已存储的 OAuth 账户；不带账户时打开账户选择器。这与顶层 `/pin` 不同。 |
| `/new` | 启动新会话，不删除当前会话。 |
| `/fresh` | 关闭 Provider 侧的流状态并启动全新的 Provider 状态，而不改变本地记录。流式传输期间不可用。 |
| `/clear` | 原地清除对话上下文并保留会话。流式传输期间不可用。 |
| `/drop` | 删除当前会话并启动新会话。 |
| `/resume [session-id\|@claude\|@codex]` | 打开本地会话选择器、打开 Claude/Codex 导入选择器，或恢复匹配的会话 ID。仅交互式 TUI。 |
| `/pin [session-id]` | 将当前或指定的会话置顶在恢复列表顶部。 |
| `/rename <title>` | 为当前会话设置用户指定的标题。 |
| `/move <path>` | 将会话移动到另一个已存在的目录，重新加载目录级设置和已发现的能力，并将该路径设为工作目录。流式传输期间不可用。 |
| `/add-dir <path>` | 为本会话添加一个已存在的额外工作区根目录。流式传输期间不可用。 |
| `/remove-dir <path>` | 移除一个额外的工作区根目录。工作目录本身无法移除；请使用 `/move`。 |
| `/dirs` | 列出工作目录和所有额外工作区根目录。 |
| `/tree` | 打开原地会话树并切换到现有分支。 |
| `/branch` | 选择较早的消息并在同一会话文件中创建另一个分支。 |
| `/fork` | 选择较早的消息并从中创建独立的会话文件。 |
| `/compact [focus]` | 使用已配置的方法和可选的聚焦说明手动压缩上下文。参见 [压缩](./compaction.md)。 |
| `/compact soft [focus]` | 强制使用活动模型对本次运行进行本地摘要。 |
| `/compact remote [focus]` | 先尝试兼容 OpenAI 的服务器端压缩，再进行本地摘要。 |
| `/compact snapcompact` | 在不生成 LLM 摘要的情况下，将历史归档为稠密位图图像；它拒绝聚焦文本。 |
| `/shake [elide\|images\|thinking]` | 在不摘要的情况下移除重量级上下文。裸形式/`elide` 剥离工具结果和大块内容；其他模式剥离图像或 thinking 块。 |
| `/handoff [focus instructions]` | 生成交接文档，并将其作为压缩条目提交到同一会话。需要一个空闲且消息足够的会话；它不会自动结束轮次或创建新会话。参见 [Handoff](./handoff.md)。 |
| `/btw <question>` | 借助当前上下文提出临时旁路问题；该交流不会加入持久化对话。 |
| `/tan <work>` | 为旁支工作启动一个完整的后台 agent。仅交互式 TUI。 |
| `/retry` | 重试最近一次失败的 agent 轮次。仅在空闲且存在可重试的失败轮次时有效。 |
| `/omfg <complaint>` | 将对反复出现行为的不满转化为 TTSR 规则。仅交互式 TUI。 |
| `/cleanse [request] [--all]` | 使用加权并行子代理检测并修复项目诊断。仅交互式 TUI。 |

#### `/todo` 子命令

裸 `/todo` 显示当前分阶段的任务列表。

| 形式 | 效果 |
| --- | --- |
| `/todo edit` | 在 `$EDITOR` 中打开 Markdown 往返编辑。 |
| `/todo copy` | 以 Markdown 形式复制列表。 |
| `/todo export [path]` | 写出 Markdown；默认路径为 `TODO.md`。 |
| `/todo import [path]` | 从 Markdown 替换列表；默认路径为 `TODO.md`。 |
| `/todo append [phase] <task…>` | 追加任务；模糊匹配阶段，找不到则创建。 |
| `/todo start <task>` | 模糊匹配并将任务标记为进行中。 |
| `/todo done [task\|phase]` | 将模糊匹配标记为已完成；未指定目标则应用于全部。 |
| `/todo drop [task\|phase]` | 将模糊匹配标记为已放弃；未指定目标则应用于全部。 |
| `/todo rm [task\|phase]` | 移除模糊匹配；未指定目标则应用于全部。 |
| `/todo help` 别名：`/todo ?` | 打印 todo 用法。 |

### 状态与检查

| 命令 | 可见效果与可用性 |
| --- | --- |
| `/jobs` | 显示正在运行和最近结束的后台任务。已结束的任务保留约五分钟。 |
| `/usage [show]` | 显示 Provider 用量、速率限制、重置与账户归属。 |
| `/usage reset [account\|active]` | 消耗一次已保存的 Codex 速率限制重置。不带参数时，TUI 打开账户选择器。 |
| `/stats [--port <port>] [--host <host>]` | 同步会话文件并启动本地统计仪表盘。 |
| `/context` | 按来源显示当前轮次的预计 token 预算。 |
| `/tools` | 显示当前对 agent 可见的工具，并区分活动工具与可用工具。 |
| `/changelog [full]` | 显示最近条目；`full` 显示完整变更日志。 |
| `/hotkeys` | 显示实时快捷键列表。完整的重映射参考参见 [快捷键](./keybindings.md)。 |
| `/extensions` 别名：`/status` | 打开扩展控制中心以检查并启用或禁用已发现的能力。仅交互式 TUI。 |
| `/agents` | 打开 agent 控制中心，配置任务 agent、模型、prewalk 和 advisor。仅交互式 TUI。 |
| `/debug` | 打开已配置的调试器选择器。仅交互式 TUI。 |

### 记忆

裸 `/memory` 即 `/memory view`。`mm` 命令族仅限交互式 TUI，并且需要一个启用了 mental models 的活动 Hindsight 后端。

| 形式 | 效果 |
| --- | --- |
| `/memory view` | 显示当前注入到会话中的记忆载荷。 |
| `/memory stats` | 在后端提供统计信息时显示后端统计信息。 |
| `/memory diagnose` | 在受支持时运行后端诊断。 |
| `/memory clear` 别名：`/memory reset` | 清除已持久化的记忆数据与产物，然后刷新系统提示词。 |
| `/memory enqueue` 别名：`/memory rebuild` | 将整合维护加入队列。 |
| `/memory mm [list]` | 列出活动库上的 mental models。 |
| `/memory mm show <id>` | 显示一个 mental model。 |
| `/memory mm refresh [id]` | 全库刷新自动刷新模型，或刷新单个 ID。 |
| `/memory mm history <id>` | 显示模型的变更历史。 |
| `/memory mm seed` | 创建缺失的内置 mental models。 |
| `/memory mm delete <id>` 别名：`/memory mm remove <id>` | 删除一个 mental model。 |
| `/memory mm reload` | 重新拉取缓存的 mental-model 注入块。 |

### 导出、共享与实时协作

| 命令 | 可见效果与可用性 |
| --- | --- |
| `/export [--themes] [path]` | 将会话写为 HTML。`--themes` 打包活动的 TUI 亮色/暗色主题；路径不能包含空格。 |
| `/dump` | 复制纯文本记录，并在可能时将当前 LLM 请求 JSON 写入临时文件。该 JSON 可能包含原始上下文或机密。 |
| `/share` | 使用配置的共享服务器/存储或 secret-gist 路径上传加密会话并打印共享 URL。大型会话可被裁剪。 |
| `/copy` | 打开对话复制选择器。 |
| `/copy code` | 复制最后一个代码块。 |
| `/copy cmd` 别名：`/copy command` | 复制最后一条 shell 命令或 Python 求值。 |
| `/collab [start] [relay-url]` | 启动实时托管，或显示现有的可写链接。未提供 URL 时使用 `collab.relayUrl`；无协议的 relay 默认为 `wss://`。仅交互式 TUI。 |
| `/collab view [relay-url]` | 在需要时启动托管并显示只读的观察者链接。 |
| `/collab status` | 显示活动链接和参与者，或访客状态。 |
| `/collab stop` | 停止托管。 |
| `/join <link>` | 加入可写或只读的协作链接。必须先停止托管或离开另一个房间。仅交互式 TUI。 |
| `/leave` | 以访客身份离开，或以主持人身份停止房间。 |

### Provider、MCP、SSH 与插件

| 命令 | 可见效果与可用性 |
| --- | --- |
| `/login [provider]` | 打开 OAuth Provider 选择，或启动指定的 Provider。在手动回调流程中，`/login <redirect-url>` 提交回调。仅交互式 TUI。 |
| `/logout [provider]` | 打开登出选择，或撤销指定的 OAuth Provider。仅交互式 TUI。 |

#### `/mcp` 子命令

裸 `/mcp` 显示其帮助。不带参数的 `/mcp add` 向导仅限交互式 TUI。

| 形式 | 效果 |
| --- | --- |
| `/mcp add` | 打开服务器设置向导。 |
| `/mcp add <name> [--scope project\|user] [--url <url> --transport http\|sse] [--token <token>] [-- <command…>]` | 只提供名称时会打开预填好的向导。提供 `--url` 或 `-- <command…>` 可快速添加远程 HTTP/SSE 或本地 stdio 服务器。 |
| `/mcp list` | 列出已配置和已发现的服务器。 |
| `/mcp remove <name> [--scope project\|user]` 别名：`/mcp rm <name> [--scope project\|user]` | 默认移除项目条目。 |
| `/mcp test <name>` | 测试连接。 |
| `/mcp reauth <name>` | 再次运行 OAuth 授权。 |
| `/mcp unauth <name>` | 移除已存储的 OAuth 状态。 |
| `/mcp enable <name>` | 启用一个服务器。 |
| `/mcp disable <name>` | 禁用一个服务器。 |
| `/mcp smithery-search <keyword> [--scope project\|user] [--limit <1-100>] [--semantic]` | 搜索 Smithery 并打开部署选择。 |
| `/mcp smithery-login` | 登录并缓存 Smithery API 密钥。 |
| `/mcp smithery-logout` | 移除缓存的 Smithery 密钥。 |
| `/mcp reconnect <name>` | 重新连接一个服务器。 |
| `/mcp reload` | 重新加载服务器配置并重新绑定运行时工具。 |
| `/mcp resources` | 列出已连接服务器的资源。 |
| `/mcp prompts` | 列出已连接服务器的提示词。提示词以 `/<server>:<prompt> [name=value…]` 形式调用。 |
| `/mcp notifications` | 显示通知能力与订阅状态。 |
| `/mcp help` | 打印 MCP 用法。 |

#### `/ssh` 子命令

裸 `/ssh` 显示其帮助。

| 形式 | 效果 |
| --- | --- |
| `/ssh add <name> --host <host> [--user <user>] [--port <port>] [--key <key-path>] [--desc <description>] [--compat] [--scope project\|user]` | 添加 SSH 主机。`--compat` 选择兼容模式。 |
| `/ssh list` | 列出已配置的主机。 |
| `/ssh remove <name> [--scope project\|user]` 别名：`/ssh rm <name> [--scope project\|user]` | 默认移除项目条目。 |
| `/ssh help` | 打印 SSH 用法。 |

#### `/marketplace` 与 `/plugins`

| 形式 | 效果 |
| --- | --- |
| `/marketplace` 或 `/marketplace install` | 打开交互式安装浏览器。在 TUI 之外，需要显式的 `name@marketplace`。 |
| `/marketplace add <source>` | 添加诸如 `owner/repo` 的源。 |
| `/marketplace remove <name>` 别名：`/marketplace rm <name>` | 移除一个源。 |
| `/marketplace update [name]` | 刷新一个目录或所有目录。 |
| `/marketplace list` | 列出已配置的源。 |
| `/marketplace discover [marketplace]` | 列出可用的插件，可选仅来自一个源。 |
| `/marketplace install [--force] [--scope user\|project] <name@marketplace>` | 安装并重新加载所选插件。 |
| `/marketplace uninstall` | 打开 TUI 卸载选择器。 |
| `/marketplace uninstall [--scope user\|project] <name@marketplace>` | 卸载一个插件。 |
| `/marketplace installed` | 列出已安装的插件、作用域和遮蔽状态。 |
| `/marketplace upgrade` | 升级所有过时的插件。 |
| `/marketplace upgrade [--scope user\|project] <name@marketplace>` | 升级一个插件。 |
| `/marketplace help` | 打印 marketplace 用法。 |
| `/plugins [list]` | 列出 npm 和市场插件及其启用状态。 |
| `/plugins enable [--scope user\|project] <name@marketplace>` | 启用已安装的市场插件。 |
| `/plugins disable [--scope user\|project] <name@marketplace>` | 禁用已安装的市场插件。 |
| `/reload-plugins` | 刷新活动会话中的发现缓存、技能、文件斜杠命令、任务 agent、能力状态和 MCP 服务器。参见下方的重载限制。 |

### 退出

| 命令 | 效果 |
| --- | --- |
| `/exit` | 退出交互式应用程序。 |
| `/quit` 别名：`/q` | 退出交互式应用程序。 |

## 非核心内置的命令

自动补全会合并多个命令系统。它们的图标和来源标签标示了它们来自何处。

### 内置工作流命令

有三个实用的命令随附于核心注册表之外，因此它们可以被覆盖：

| 命令 | 来源与效果 |
| --- | --- |
| `/review [GitHub PR URL\|pr://owner/repo/number] [instructions]` | 内置 TypeScript 命令。PR 引用直接启动该审查；否则 TUI 提供基准分支、未提交、提交或自定义审查。参见 [Review](./review.md)。 |
| `/green` | 内置 TypeScript 命令，展开为监视并修复 CI 直至当前分支变绿的工作流。 |
| `/init [request]` | 内置 Markdown 文件命令，展开为仓库初始化工作流。名为 `init` 的已发现文件命令会取代它。 |

### 技能

当 `skills.enabled` 和 `skills.enableSkillCommands` 开启时，每个已发现的技能都会显示为：

```
/skill:<name> [arguments]
```

该命令会在当前轮次加载该技能的指令。技能命令是归属于用户的提示词，而非核心内置。使用 `/extensions` 查看它们的来源与状态。参见 [技能](./skills.md)。

### 扩展与可执行命令

扩展可以使用自己的 UI 或程序逻辑注册会话内命令。用户/项目 TypeScript 命令模块从活动 agent/config 目录下的 `commands/<name>/index.{ts,js,mjs,cjs}` 中被发现，MCP 提示词命令由已连接的服务器以 `/<server>:<prompt>` 形式添加。内置名称是保留的。omp 自带的 `/review` 和 `/green` 是优先级最低的可执行命令；同名的用户或项目命令模块会取代内置命令。参见 [编写扩展](./extension-authoring.md)。

### 文件斜杠命令

已发现的 `commands/` 能力目录下的 Markdown 会变成 `/<filename>` 并展开为提示词。原生位置是当前项目的 `.omp/commands/*.md` 和活动 profile 的 agent `commands/*.md`；兼容的 Claude Code、agent-dir、Codex、OpenCode 以及已安装插件的 Provider 也会被发现。

对于重名的文件命令，优先级更高的能力 Provider 胜出。原生 `.omp` 命令拥有最高的 Provider 优先级，项目 `.omp/commands` 胜过活动 profile 的用户目录。插件与兼容性 Provider 随后。内置的 `/init` 仅在发现过程尚未占用 `init` 时使用。

### 提示词模板

Markdown 提示词模板也会以 `/<filename>` 出现，但它们是独立的、最后手段式的展开系统。项目模板位于 `.omp/prompts/**/*.md`；用户模板位于活动 agent profile 的 `prompts/**/*.md`。用户模板先于项目模板加载，因此同名的用户模板胜过项目模板。关于参数与插值，参见 [提示词模板](./prompt-templates.md)。

### 解析顺序

当同一 token 存在于多个系统中时，omp 按以下顺序解析：

1.  核心内置名称或别名；
2.  `/skill:<name>`；
3.  扩展注册的命令；
4.  TypeScript 自定义命令，然后是 MCP 提示词命令；
5.  已发现的 Markdown 文件斜杠命令；
6.  提示词模板。

自动补全会省略已被占用的低优先级提示词模板。请使用有区分度的名称，而不是依赖遮蔽。

### 更改命令后的重载

`/reload-plugins` 会刷新活动 TUI 中的技能、Markdown 文件斜杠命令、任务 agent 定义、能力缓存和 MCP 连接。在添加或更改提示词模板、可执行命令模块、扩展模块、Hook 或自定义工具后重启 omp；这些已初始化的面不会在原地被完全重建。用 `/move` 移动会话会刷新目录级能力，但要加载更改后的提示词模板或可执行代码，新会话仍是可靠的方式。

## 斜杠命令与魔法关键词

魔法关键词（[Magic keywords](./magic-keywords.md)）是提示词中的普通词语，会为那一轮添加隐藏的引导；它们不是 `/` 命令，也不会出现在命令自动补全中。同样，`/review` 是内置工作流命令而非核心内置。对于其专注的工作流，请使用 [Review](./review.md)、[Advisor](./advisor.md)、[Vibe](./vibe.md)、[Security](./security.md) 和 [Prewalk](./prewalk.md)；本页是清单与语法参考。
