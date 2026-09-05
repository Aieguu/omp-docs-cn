# 设置

omp 无需配置文件即可运行：已识别的设置会回退到内置默认值（部分可选值默认处于未设置状态）。当你想查看当前目录下的**生效**值、按名称搜索并修改带有交互控件的设置时，启动一个会话并运行 `/settings`。面板会标记出与内置默认值不同的值。

面板会把改动保存到当前生效的全局或命名 Profile 配置中，并立即应用大部分 UI 与会话行为。使用 **Enter** 或 **Space** 修改某个值，输入文字可在各标签页中搜索，按 **Esc** 关闭。如需精确重置、只想改动项目范围，或设置项未在面板中展示，请按下文所述使用 `omp config` 或 YAML。

全新安装后几个实用的默认值是：

*   深色主题 `titanium` 与浅色主题 `light`
*   思考级别 `high`
*   引导消息与后续消息按 `one-at-a-time`（一次一条）投递
*   当你引导正在运行的一轮时会立即中断
*   已启用 Compaction 与图片自动缩放
*   命名模型角色的改动全局保存（`modelRoleStorage: global`）
*   工具审批模式为 `yolo`，除非启动模式或运行时标志覆盖它；在更改策略前请先阅读 [Approvals](../reference/approvals.md)

默认值会随版本演变。`omp config list` 是你当前运行版本中各键与生效值的权威视图。

## 在 Shell 中查看、修改与重置

请在要纳入其项目设置的那个目录下运行这些命令：

```
omp config list                              # every effective setting, type, and allowed enum values
omp config list --json                       # machine-readable inventory
omp config get theme.dark                    # one effective value
omp config set theme.dark catppuccin-macchiato
omp config set compaction.enabled false
omp config reset theme.dark                  # write the built-in default to global config
omp config path                              # print the active agent directory
```

`set` 与 `reset` 写入的是当前生效 Profile 的全局配置，而不是项目文件。`reset` 写入的是 schema 默认值；它**不会**删除该键。如果你希望该键从其他层继承，请改而从 YAML 文件中移除它。

值按设置类型解析：

| Type | Shell input |
| --- | --- |
| Boolean | `true` / `false`、`yes` / `no`、`on` / `off` 或 `1` / `0` |
| Number | 有限数字 |
| Enum | `omp config list` 列出的一个精确值 |
| Array | JSON，例如 `omp config set disabledProviders '["ollama"]'` |
| Record | JSON，例如 `omp config set providers.maxInFlightRequests '{"anthropic":2}'` |
| String | 剩余的参数字符串，已去除首尾空白 |

键必须是完整的点分路径：请使用 `theme.dark`，而不是 `theme`。未知的键与无效的 CLI 值会失败且不会被保存。面向人阅读的 `config list` 输出会对已配置的凭据打码；`--json` 会省略其值并标记为已编辑（redacted）。`config get` 是对单个值的显式请求，因此**不会**对凭据打码。

## 文件与作用域

| 作用域 | 位置 | 用途 | 如何写入 |
| --- | --- | --- | --- |
| 全局 | `~/.omp/agent/config.yml` | 你在各项目间通用的常规默认值 | `/settings`、`omp config set`、`omp config reset`，或编辑器 |
| 命名 Profile | `~/.omp/profiles/<name>/agent/config.yml` | 为某个工作/身份 Profile 隔离的设置、认证、会话与缓存 | 在 `omp --profile <name>` 下运行，或设置 `OMP_PROFILE`，然后使用同样的命令 |
| 项目 | `<cwd>/.omp/config.yml` | 仓库特定的覆盖项，可与项目共享 | 直接编辑该 YAML 文件；设置发现只检查当前目录，不检查上级目录 |
| 配置覆盖层 | 通过 `--config` 传入或在 `PI_CONFIG_FILES` 中命名的任意 YAML 文件 | 临时的、CI、机密或实验特定的覆盖项 | 仅该进程的只读层；绝不会复制进持久化配置 |
| 运行时 | CLI 标志与功能特定的环境变量覆盖 | 仅限一次启动 | 绝不持久化 |

`omp config path` 会打印当前生效的 **agent 目录**，因此打开该文件时要补上 `config.yml`。已存在的 `config.yaml` 同样会被接受并在原地更新。`PI_CODING_AGENT_DIR` 可重定位默认 Profile 的 agent 目录；`PI_CONFIG_DIR` 可改变常规的 `.omp` 根目录名称。

命名 Profile 会取代常规的全局作用域，而不是继承其设置。想在不进入会话的情况下查看某个 Profile，请把 profile 标志放在子命令之前：

```
omp --profile work config path
omp --profile work config list
omp --profile work config set theme.dark titanium
```

`OMP_PROFILE` 是与之等效的持久化环境变量；`PI_PROFILE` 仍是遗留回退项。快捷键（Keybindings）单独存储，并有自己的一套 Profile 继承规则；参见 [快捷键](./keybindings.md#remap-shortcuts)。

### 项目设置

在启动 omp 的确切目录中创建 `.omp/config.yml`：

已启用的兼容 Provider 也可以用自己的格式贡献项目级设置。它们共享项目这一层；请使用 `omp config get <key>` 查看合并结果，用 [上下文文件](./context-files.md) 控制发现来源。

```
# <repo>/.omp/config.yml
modelRoles:
  default: anthropic/claude-sonnet-4-5

disabledProviders:
  - ollama

compaction:
  enabled: true
  thresholdPercent: 80
```

`omp config set` 不会写入任意的项目设置。请直接编辑这个文件。唯一一种交互式项目写入是当 `modelRoleStorage` 为 `project` 时的模型选择器角色分配；那里只会更新 `modelRoles`，缺失的项目角色仍会回退到全局 Profile。

请勿让凭据进入已提交的项目 YAML。优先使用已存储的登录凭据、环境变量、[secret 引用](../reference/secrets.md)，或不受版本控制的覆盖层。

### 一次性覆盖层

```
omp --config ./local/ci.yml "diagnose this failure"
omp --config ./base.yml --config ./experiment.yml "try this configuration"
```

覆盖层路径从工作目录解析，且会展开 `~`。允许重复使用 `--config`；后面的文件优先。`PI_CONFIG_FILES` 接受平台路径列表（Unix 上用 `:`，Windows 上用 `;`），并会先于显式的 `--config` 文件加载这些文件。

覆盖层是严格的：文件缺失、YAML 格式错误，或顶层不是映射（mapping）的文档都会阻止启动。它们不会被隔离，也不会被静默忽略。

## 优先级与合并

按优先级从低到高：

```
built-in defaults
  < active global/profile config
  < project config
  < PI_CONFIG_FILES overlays, in listed order
  < --config overlays, in command-line order
  < runtime flags and feature-specific environment overrides
```

运行时覆盖的例子包括 `--model`、`--smol`、`--slow`、`--plan` 等模型角色标志、审批标志、`--hide-thinking`、`--advisor`、`--no-pty` 与 `--api-key`。环境变量并不是一个统一的设置层：每个所属功能自行决定其变量是覆盖项还是回退项。参见[环境变量参考](../reference/env.md)。

映射会深度合并；标量与数组则直接替换：

```
# global
statusLine:
  preset: default
  transparent: false
disabledProviders: [anthropic, openai]

# project
statusLine:
  transparent: true
disabledProviders: [groq]
```

在项目内，`statusLine.preset` 仍是 `default`，`transparent` 变为 `true`，而 `disabledProviders` 恰好是 `[groq]`。更高级的数组绝不会追加到更低级的数组上。这条替换规则同样适用于 `enabledModels`、`cycleOrder`、`extensions` 以及其他所有数组型设置。

## 校验、保存与重新加载

*   `/settings` 会把可选范围限制在当前构建所支持的控件与值内。它的改动会更新正在运行的会话，并在后台保存。
*   `omp config set` 会先检查键是否存在，并在原子写入前解析布尔值、数字、枚举、数组与记录。
*   手工编辑的 YAML 文件根层必须是映射。YAML 解析并不保证能捕获每个语义错误的值，因此请尽可能使用 `/settings` 或 `omp config set`，并用 `omp config get <key>` 检查结果。
*   在可写启动时，无效的持久化全局 YAML 或原生项目 YAML 会以 `*.broken-<timestamp>-<pid>-<id>` 的形式移到原文件旁边，随后启动失败并报告这两个路径。请修复或还原被移走的文件；omp 不会丢弃它。
*   运行中的会话一般不会监听配置文件。`/settings` 的改动是即时生效的，但由另一个 `omp config` 进程或文本编辑器做出的改动只会在下次启动时可靠生效。把会话移到另一个工作目录会重新加载该目录的项目层；当模型/Provider 发现已经初始化过时请重启。
*   并发保存会在锁的保护下重新读取文件，并保留无关的外部改动。

没有通用的 `/reload-settings` 命令。`/reload-plugins` 会刷新扩展与发现状态，而不是任意的设置。

## 常用配置配方

### 设置模型角色

如需引导式选择，请使用 `/settings` 或模型选择器；角色行为参见 [模型角色](./roles.md)。当多个角色一起变更时，用 YAML 会更方便：

```
modelRoles:
  default: anthropic/claude-sonnet-4-5
  smol: anthropic/claude-haiku-4-5
  slow: anthropic/claude-opus-4-6:high
  plan: openai/gpt-5.3-codex:high
  commit: anthropic/claude-haiku-4-5
```

运行 `omp --list-models` 查看当前 Provider 与凭据下可用的模型。

### 修改消息队列行为

```
steeringMode: one-at-a-time  # or all
followUpMode: one-at-a-time  # or all
interruptMode: immediate     # or wait
```

引导（steering）与后续（follow-up）提示词的区别参见 [使用 omp](./using.md)。

### 设置主题与终端行为

```
theme:
  dark: catppuccin-macchiato
  light: light
terminal:
  showImages: true
tui:
  hyperlinks: auto
```

内置与自定义配色参见 [主题](./themes.md)。

### 限制仓库可用的 Provider

```
# <repo>/.omp/config.yml
disabledProviders:
  - ollama
  - openrouter
```

这个项目数组会替换全局数组。Provider 的 id 与认证见 [Providers](./providers.md)。

### 配置涉及安全的特性

请从交互式控件入手，再遵循对应的专项指南，而不是盲目照搬一份宽泛的策略：

*   工具权限策略：[Approvals](../reference/approvals.md)
*   advisor 审查：[Advisor](./advisor.md)
*   桌面自动化：[Computer](./computer.md)
*   安全审查：[Security](./security.md)
*   提示词触发的模式：[Magic keywords](./magic-keywords.md)
*   执行前的仓库遍历：[Prewalk](./prewalk.md)

### 配置 Compaction 与记忆

```
compaction:
  enabled: true
  thresholdPercent: 80
memory:
  backend: off
```

Compaction 有多种策略、阈值与后台模式；参见 [Compaction](./compaction.md)。记忆后端与保留策略见 [记忆](./memory.md)。

## 完整的设置组

`/settings` 按以下当前的标签页与区块组织。若你并不知道某个键名，这里是最好的浏览入口。

| 标签页 | 区块 |
| --- | --- |
| 外观 | 主题；Composer；状态栏；显示；图片 |
| 模型 | 思考；采样；提示词；重试与回退；Advisor；Prewalk；视觉 |
| 交互 | 输入；审批；通知；语音；协作；Magic Keywords；启动与更新；电源（macOS）；Agent；Git |
| 上下文 | 常规；Compaction；规则（TTSR）；实验性 |
| 记忆 | 常规；Auto-Learn；Mnemopi；Hindsight |
| 文件 | 编辑；读取；读取摘要；LSP |
| Shell | Bash；Eval 与运行时 |
| 工具 | 可用工具；Todos；Grep 与浏览器；Computer；GitHub；输出上限；执行；发现与 MCP；扩展；开发者 |
| 任务 | 模式；子代理；隔离；命令与技能 |
| Providers | 服务；Fireworks；Tiny Model；协议；超时；隐私 |

如需精确查找键，下面的家族索引把当前各命名空间映射到用户通常会遇到它们的位置。有些家族横跨多个标签页。独立的键与命名空间一起列出。请使用 `omp config list` 查看每个叶子键、生效值、类型与枚举选项；需要机器可读的描述时加上 `--json`。

*   **外观：**`theme`、`symbolPreset`、`colorBlindMode`、`composer`、`statusLine`、`terminal`、`images`、`tui`、`display`、`showHardwareCursor`。
*   **模型：**`modelRoles`、`modelTags`、`modelProviderOrder`、`cycleOrder`、`modelRoleStorage`、`enabledModels`、`defaultThinkingLevel`、`hideThinkingBlock`、`proseOnlyThinking`、`omitThinking`、`externalThinking`、`model`、`inlineToolDescriptors`、`includeModelInPrompt`、`includeWorkspaceTree`、`personality`、采样键（`temperature`、`topP`、`topK`、`minP`、`presencePenalty`、`repetitionPenalty`、`textVerbosity`）、`tier`、`retry`、`advisor`、`prewalk`，以及模型请求的 `images` / `providers` 选项。
*   **交互：**`autoResume`、`power`、`git`、`steeringMode`、`followUpMode`、`interruptMode`、`loop`、`doubleEscapeAction`、`treeFilterMode`、`autocompleteMaxVisible`、`spelling`、`emojiAutocomplete`、`paste`、`startup`、`update`、`marketplace`、`magicKeywords`、`completion`、`error`、`ask`、`recap`、`collab`、`share`、`stt`，以及与交互相关的 `tools` / `features`。
*   **上下文：**`workspace`、`contextPromotion`、`extendedContext`、`compaction`、`snapcompact`、`branchSummary`、`ttsr`，外加与上下文相关的 `tools` 选项。
*   **记忆：**`memory`、`autolearn`、`memories`、`mnemopi`、`hindsight`，以及 `providers` 下的记忆模型设置。
*   **文件：**`edit`、`readLineNumbers`、`read`、`lsp`。
*   **Shell：**`shellPath`、`bash`、`bashInterceptor`、`shellMinimizer`、`eval`、`python`、`ruby`、`julia`。
*   **工具：**`tools`、`todo`、`glob`、`grep`、`astGrep`、`astEdit`、`debug`、`launch`、`speechgen`、`generate_image`、`inspect_image`、`computer`、`checkpoint`、`fetch`、`vault`、`github`、`web_search`、`security`、`browser`、`async`、`irc`、`mcp`、`tasks`、`extensionHandlers`，以及 `dev` 下的开发者选项。
*   **任务：**`plan`、`goal`、`title`、`task`、`worktree`、`skills`、`commands`。
*   **Provider 与服务：**`providers`、`provider`、`disabledProviders`、`secrets`、`live`、`tts`、`speech`、`codexResets`、`exa`、`searxng`，以及 `auth` 下的认证代理（auth-broker）设置。
*   **高级 CLI/YAML 专属家族：**`extensions`、`disabledExtensions`、`commit`、`gc`、`thinkingBudgets`，外加 `statusLine`、`images`、`tui`、`retry`、`compaction`、`memories`、`autolearn`、`mnemopi`、`hindsight`、`bashInterceptor`、`shellMinimizer`、`eval`、`task`、`skills` 下的高级叶子设置。

快捷键重映射不保存在这个文件里：请按 [快捷键](./keybindings.md#remap-shortcuts) 中所述使用 `keybindings.yaml`。

## 故障排查

### 项目值没有生效

1. 在包含 `.omp/config.yml` 的目录下运行 `omp config get <key>`。
2. 确认项目文件位于进程的确切工作目录中；omp 不会向上搜索父目录来寻找原生项目设置。
3. 检查是否有后置的 `--config` 覆盖层、`PI_CONFIG_FILES`、CLI 标志或功能环境变量占了上风。
4. 记住：项目中的数组会替换整个全局数组。
5. 如果 Provider/模型/工具发现已经初始化过，请重启。

### `omp config set` 改了错误的文件

它总是写入当前生效的全局/Profile 配置。请运行 `omp config path` 找出那个 agent 目录。需要项目级覆盖时，请直接编辑 `<repo>/.omp/config.yml`。

### `omp config reset` 似乎没有任何效果

`reset` 会把内置默认值写入全局文件。项目、覆盖层或运行时值仍然可能胜出。请用 `omp config get <key>` 检查，然后移除或修改更高的那一层。如果想继承而非固定全局默认值，请手动删除全局 YAML 中的该键。

### 启动时报告 YAML 损坏

请阅读报告的错误与备份路径。持续存在的格式错误 YAML 会在启动停止前被移到一个唯一的 `.broken-*` 同级文件，原内容得以保留。请把那个备份修复成映射后，作为 `config.yml` 还原。覆盖层的错误不会被移走；请就地修复覆盖层。

### 键未知或值被拒绝

请运行 `omp config list`，复制确切的点分键，并使用显示出的枚举值之一。传给 `set` 的数组与记录必须是合法 JSON，尽管持久化文件使用的是 YAML。

### 改动在现有会话中不可见

独立的 shell 命令或编辑器不会把设置推送到已运行的会话中。请启动一个新会话。如果你用了 `/settings`，请检查是否有项目、覆盖层或运行时覆盖项拥有比你修改的全局值更高的优先级。
