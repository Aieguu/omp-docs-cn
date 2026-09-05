# 记忆

记忆帮助 omp 继续工作，而无需你重复陈述仓库惯例、架构决策和代码审查偏好等持久事实。它与 [压缩（compaction）](./compaction.md) 相互独立：压缩缩短单个会话，而记忆可以影响未来的会话。

记忆**默认关闭**。如果你需要它，打开 `/settings`，选择 **Memory** 选项卡，然后选择一个后端。如果你的记忆需要可搜索并存储在本机，从 `mnemopi` 开始；需要自动生成项目摘要，用 `local`；如果你已经在运行 Hindsight 服务，则选 `hindsight`。

## 选择后端

| 后端 | 适用场景 | 存储与默认范围 | 重要的权衡 |
| --- | --- | --- | --- |
| `off`（默认） | 你不需要跨会话的知识。 | 没有记忆存储。 | 现有的会话记录不受影响；关闭记忆不会删除它们。 |
| `local` | 你希望 omp 定期将过去已持久化的会话提炼为项目指导。 | 本机上生成的文件，按工作目录隔离。 | 它是一个批量摘要流水线，而非可搜索的存储。你无法审查或遗忘某一条结构化事实。 |
| `mnemopi` | 你希望无需记忆服务器即可获得提示词驱动的记住、召回和遗忘行为。 | 本地 SQLite 数据库；默认 `per-project`。 | 数据库在本地，但默认的 `smol` LLM 模式可能会将提取工作发送给你配置的模型 Provider。 |
| `hindsight` | 你想要远程仓库、共享基础设施，或 Hindsight 的综合（synthesis）能力与心智模型。 | 你的 Hindsight 服务器；默认 `per-project-tagged`。 | 自动保留默认开启，因此对话文本会离开本机。 |

在 shell 中最小化的持久配置如下：

```
# Pick exactly one
omp config set memory.backend local
omp config set memory.backend mnemopi
omp config set memory.backend hindsight

# Confirm the effective setting
omp config get memory.backend
```

保存时，`/settings` 会写入全局配置并切换当前生效的后端。通过 shell 或 YAML 所做的更改只对新的 omp 进程生效。如果只想针对单个仓库生效，请把相同的键放入 `<repo>/.omp/config.yml`；项目设置会覆盖全局文件。路径和优先级请参阅 [设置](./settings.md)。

## 隐私、范围与默认行为

启用记忆会改变哪些内容会被持久化，并且（取决于后端）哪些内容可能跨越网络边界。

*   **Off 意味着不进行任何记忆处理。** 它不会禁用普通的会话持久化。记忆命令也不会删除 `~/.omp/agent/sessions/` 下的文件；请通过 [会话](./sessions.md) 另行管理。
*   **Local 在本地存储生成的制品**，默认存放在 `~/.omp/agent/memories/<encoded-project>/` 下。它的提取与整合（consolidation）步骤使用你配置的模型角色，因此过去的会话文本仍可能被发送给该模型 Provider。生成的输出会过滤常见的 token 与密钥模式，但请不要刻意要求 omp 记住机密信息。
*   **Mnemopi 在本地存储其 SQLite 仓库**，默认存放在 `~/.omp/agent/memories/mnemopi/` 下。本地嵌入可能会下载并运行一个嵌入模型。其默认的 `llmMode: smol` 使用你配置的在线 `tiny`/`smol` 模型进行基于 LLM 的提取；如果你不需要任何基于 LLM 的记忆处理，请使用 `llmMode: none`。
*   **Hindsight 在配置的服务器上存储持久记忆。** 在 `autoRetain: true`（默认值）下，omp 每隔三个用户轮次以及会话边界处发送用户和助手文本。它会省略工具调用、工具结果和思考块。召回与综合查询也会发送到该服务器。
*   **关闭某个后端不会删除其存储。** 这使得切换是可逆的；但如果你的目标是彻底移除数据，你必须另外清空或删除数据。

在积累敏感数据之前先选好范围：

| 范围 | Mnemopi | Hindsight |
| --- | --- | --- |
| `global` | 每个项目都能看到同一个本地仓库。 | 每个项目都能看到同一个远程仓库。 |
| `per-project` | 由绝对工作目录派生出的独立仓库。这是默认值。 | 每个仓库名称（Git 之外则取 cwd 名称）一个独立仓库。同一仓库的关联工作树（linked worktrees）共享主检出（checkout）的名称。 |
| `per-project-tagged` | 写入项目仓库；召回时将其与共享的全局仓库合并。 | 将带项目标签的数据写入一个共享仓库；召回时将该项目的带标签记忆与无标签的全局记忆合并。这是默认值。 |

对于客户项目或其它严格的隔离边界，优先选择 `per-project`。`per-project-tagged` 很方便，但它会刻意让无标签的全局知识与项目知识一起可见。

## 在对话中使用记忆

启用 Mnemopi 或 Hindsight 后，直接使用普通的提示词即可。你无需了解 omp 内部如何执行记忆操作。

```
Remember that this repository uses pnpm and Node 22.
```

```
Before changing authentication, recall why we rejected session cookies.
```

```
What durable preferences have you learned about how I review pull requests?
```

Mnemopi 还可以编辑、遗忘或使某条可编辑的记忆失效：

```
Forget the memory that says releases happen on Fridays; that policy was retired.
```

```
Update the stored release convention to say that releases happen after CI is green.
```

当描述可能匹配多条记录时，请先让 omp 显示候选记忆，再对其进行修改。Mnemopi 提取出的事实表行是只读的；提示词应指明一条可编辑的记忆，或者当需要彻底移除时，你可以清空对应范围的仓库。Hindsight 不通过 omp 暴露单条记录的编辑功能；如需记录级别的查看或删除，请使用 Hindsight 服务的 UI。

local 后端的工作方式不同。它会自动摘要符合条件且已持久化的会话，并在启动时注入一个静态的 **Memory Guidance** 块。像“记住这个”这样的请求并不保证产生一次独立的写入。它最合适的用途，是让反复出现的项目知识从已完成的工作中自然浮现。

召回或摘要出来的记忆是背景上下文，而非指令。当它与当前提示词、当前仓库状态冲突时，以后两者为准。

## 你可以检查和控制的内容

在会话中运行以下斜杠命令：

| 命令 | 可见结果 |
| --- | --- |
| `/memory` 或 `/memory view` | 打开当前的记忆注入载荷。空警告表示后端已关闭、不可用，或尚未召回/生成任何内容。 |
| `/memory stats` | 当当前后端支持时，显示后端统计信息。 |
| `/memory diagnose` | 当受支持时，显示后端特定的诊断信息。 |
| `/memory enqueue` | 请求当前后端执行更强的维护/保留动作；不同后端的细节见下文。 |
| `/memory clear` | 清空当前后端可以清空的内容。Hindsight 是一个重要的例外：远程仓库不会被删除。 |

`/memory reset` 是 `clear` 的别名；`/memory rebuild` 是 `enqueue` 的别名。

### enqueue 和 clear 的含义

| 后端 | `/memory enqueue` | `/memory clear` |
| --- | --- | --- |
| Local | 标记下一次启动时执行的整合工作。它不会立即重建指导面板。 | 移除该项目的生成制品，并重置本地流水线共享的提取/整合索引。它不会删除会话记录。 |
| Mnemopi | 强制保留当前会话，排空待处理的提取任务，并整合符合条件的工作记忆。新行在通过 Mnemopi 的时间门槛（在默认 24 小时工作记忆生命周期下为 12 小时）之前不会被提升。 | 删除当前范围的 SQLite 数据库及 WAL/SHM 附属文件，然后重新启动一个空的后端。 |
| Hindsight | 刷新排队的写入并强制保留当前会话。 | 刷新待处理的写入，然后仅清空本会话的本地召回状态。它**不会**删除服务端的记忆或仓库；如需删除请使用 Hindsight UI。 |

### 查看本地生成的文件

local 后端将可读的生成制品保存在 `~/.omp/agent/memories/<encoded-project>/` 之下：

*   `memory_summary.md` —— 由 `/memory view` 显示并在启动时注入的紧凑指导
*   `MEMORY.md` —— 更长的整合后的项目记忆
*   `learned.md` —— 启用可选的自动学习后显式捕获的经验教训
*   `skills/` —— 生成的程序性行动手册

这些是生成的文件，不是原始会话历史。编辑它们并非持久有效的工作流，因为后续的整合会替换它们。请改为清空过期输出并重新排队一次重建。

### 管理 Hindsight 心智模型

Hindsight 心智模型是经过策划的摘要，例如用户偏好、项目惯例和项目决策。它们默认启用并自动播种。在交互式 TUI 中使用：

| 命令 | 效果 |
| --- | --- |
| `/memory mm list` | 列出当前仓库中的模型。 |
| `/memory mm show <id>` | 显示某个模型。 |
| `/memory mm refresh [id]` | 刷新某个模型；未提供 `id` 时刷新所有自动刷新的模型。 |
| `/memory mm history <id>` | 以 diff 形式显示该模型的修订历史。 |
| `/memory mm seed` | 创建任何缺失的内置模型。 |
| `/memory mm delete <id>` | 删除某个心智模型。这不会删除其来源记忆。 |
| `/memory mm reload` | 重新加载当前会话使用的心智模型块。 |

心智模型命令仅限 TUI 使用，并且需要一个处于活动状态的 Hindsight 后端。它们不是 Mnemopi 的控制命令。

## 配置 local 后端

`~/.omp/agent/config.yml` 中最小的全局 YAML：

```
memory:
  backend: local
```

当 omp 启动时，该流水线会在后台启动。它会跳过子代理以及未被持久化的会话。默认情况下，它会忽略最近 12 小时内仍处于活动状态的会话，以及超过 30 天的会话，因此新启用的后端最初可能显示空的载荷。逐会话提取使用 `default` 模型角色；整合使用 `smol`（带后备角色）。

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `memories.maxRolloutAgeDays` | `30` | 忽略早于该值的会话。 |
| `memories.minRolloutIdleHours` | `12` | 忽略比该值更新、仍处于活动状态的会话。 |
| `memories.maxRolloutsPerStartup` | `64` | 单次启动时处理的最大会话数。 |
| `memories.threadScanLimit` | `300` | 扫描的最大近期会话记录数。 |
| `memories.maxRawMemoriesForGlobal` | `200` | 传给整合步骤的最大已提取会话记忆条数。 |
| `memories.stage1Concurrency` | `8` | 并行的逐会话提取任务数。 |
| `memories.stage1LeaseSeconds` | `120` | 提取任务租约。 |
| `memories.stage1RetryDelaySeconds` | `120` | 重试失败的提取前的延迟。 |
| `memories.phase2LeaseSeconds` | `180` | 整合任务租约。 |
| `memories.phase2RetryDelaySeconds` | `180` | 重试失败的整合前的延迟。 |
| `memories.phase2HeartbeatSeconds` | `30` | 整合租约心跳。 |
| `memories.rolloutPayloadPercent` | `0.7` | 可分配给会话载荷的模型上下文预算比例。 |
| `memories.phase1InputTokenLimit` | `4000` | 逐会话提取的输入上限。 |
| `memories.fallbackTokenLimit` | `16000` | 当模型没有声明有限的上下文窗口时的后备预算。 |
| `memories.summaryInjectionTokenLimit` | `5000` | 启动时注入的摘要与捕获经验教训共享的近似上限。 |

可选的 `autolearn.enabled: true` 允许 omp 将显式的经验教训捕获到 `learned.md`；它属于实验性功能，默认关闭。`autolearn.autoContinue` 也默认为 `false`，它控制 omp 是否在停止后运行一次私有的捕获轮次。

## 配置 Mnemopi

默认配置足以创建一个按项目隔离的本地仓库：

```
memory:
  backend: mnemopi
```

一个注重隐私、仅使用 FTS（全文搜索）、避免基于 LLM 提取的配置如下：

```
memory:
  backend: mnemopi
mnemopi:
  scoping: per-project
  noEmbeddings: true
  llmMode: none
```

### 存储、范围与自动化

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `mnemopi.dbPath` | Agent 记忆目录 | 可选的 SQLite 路径。 |
| `mnemopi.bank` | 未设置（`default`） | 共享仓库的基础名称；项目范围会从它派生出项目仓库。 |
| `mnemopi.scoping` | `per-project` | `global`、`per-project` 或 `per-project-tagged`。 |
| `mnemopi.autoRecall` | `true` | 在会话的第一个轮次进行召回。 |
| `mnemopi.autoRetain` | `true` | 自动保留已完成的对话轮次。 |
| `mnemopi.retainEveryNTurns` | `4` | 两次自动写入之间的最小用户轮次数。 |
| `mnemopi.recallLimit` | `8` | 召回上下文中所包含的最大记忆条数。 |
| `mnemopi.recallContextTurns` | `3` | 召回查询中纳入的先前用户轮次数。 |
| `mnemopi.recallMaxQueryChars` | `4000` | 构造的召回查询的最大长度。 |
| `mnemopi.injectionTokenLimit` | `5000` | 记忆上下文的大致预算。 |

### 检索、嵌入与 LLM 处理

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `mnemopi.polyphonicRecall` | `false` | 组合向量、图谱、事实和时间维度的召回。 |
| `mnemopi.enhancedRecall` | `false` | 缓存重复及相似的召回查询。 |
| `mnemopi.proactiveLinking` | `false` | 将新记忆链接到相关的图谱实体与记忆。 |
| `mnemopi.noEmbeddings` | `false` | 仅使用确定性的全文搜索。 |
| `mnemopi.embeddingVariant` | `en` | 本地模型系列：`en` 或 `multilingual`。更改它会在下一次可写入的启动时重建嵌入。 |
| `mnemopi.embeddingModel` | 系列默认 | 显式的嵌入模型 id；覆盖系列设置。 |
| `mnemopi.embeddingApiUrl` | 环境变量/默认 | 可选的 OpenAI 兼容嵌入端点。 |
| `mnemopi.embeddingApiKey` | 环境变量/默认 | 该嵌入端点的凭据。 |
| `mnemopi.llmMode` | `smol` | `smol` 使用配置的 `tiny`/`smol` 角色，`remote` 使用下面的端点，`none` 则禁用 LLM 调用。 |
| `mnemopi.llmBaseUrl` | 环境变量/默认 | 用于 `remote` 模式的 OpenAI 兼容 LLM 端点。 |
| `mnemopi.llmApiKey` | 环境变量/默认 | 远程 LLM 的凭据。 |
| `mnemopi.llmModel` | 环境变量/默认 | 远程 LLM 模型 id。 |
| `mnemopi.debug` | `false` | 启用后端的调试日志。 |

## 配置 Hindsight

请先运行一个可访问的 [Hindsight](https://hindsight.vectorize.io/) 服务器。内置 URL 是 `http://localhost:8888`，因此本地无认证的服务器只需要：

```
memory:
  backend: hindsight
```

对于 Hindsight Cloud 或需要认证的部署：

```
memory:
  backend: hindsight
hindsight:
  apiUrl: https://api.hindsight.vectorize.io
  scoping: per-project
```

尽可能把令牌放在文件之外：

```
export HINDSIGHT_API_TOKEN='replace-me'
omp
```

`HINDSIGHT_*` 环境变量会覆盖对应的 `hindsight.*` 设置。覆盖名称与解析规则请参阅 [环境变量](../reference/env.md)。

### 连接、仓库与保留

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `hindsight.apiUrl` | `http://localhost:8888` | Cloud 或自托管服务器的 URL。 |
| `hindsight.apiToken` | 未设置 | 用于需要认证的服务器的 Bearer 令牌。 |
| `hindsight.bankId` | `omp` | 基础仓库 id。在 `per-project` 模式下会追加项目名。 |
| `hindsight.bankIdPrefix` | 未设置 | 可选的、加在基础仓库 id 之前的前缀。 |
| `hindsight.scoping` | `per-project-tagged` | `global`、`per-project` 或 `per-project-tagged`。 |
| `hindsight.bankMission` | 未设置 | 可选的 mission（使命）；当 omp 创建仓库时应用。 |
| `hindsight.retainMission` | 未设置 | 可选的保留指令。 |
| `hindsight.autoRecall` | `true` | 在第一个模型轮次之前召回。 |
| `hindsight.autoRetain` | `true` | 按节奏并在会话边界处保留对话记录文本。仅希望由提示词驱动写入时设为 `false`。 |
| `hindsight.retainMode` | `full-session` | `full-session` 会 upsert（插入或更新）一个会话文档；`last-turn` 存储以轮次为界的块。 |
| `hindsight.retainEveryNTurns` | `3` | 两次自动保留之间的用户轮次数。 |
| `hindsight.retainOverlapTurns` | `2` | `last-turn` 模式下保留块之间的重叠轮次数。 |
| `hindsight.retainContext` | `omp` | 随保留数据发送的上下文标签。 |

### 召回、心智模型与超时

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `hindsight.recallBudget` | `mid` | 召回力度：`low`、`mid` 或 `high`。 |
| `hindsight.recallMaxTokens` | `1024` | 召回的最大 token 数。 |
| `hindsight.recallContextTurns` | `1` | 召回查询中纳入的先前用户轮次数。 |
| `hindsight.recallMaxQueryChars` | `800` | 召回查询的最大长度。 |
| `hindsight.recallTypes` | `["world", "experience"]` | 可参与召回的 Hindsight 记忆类型。 |
| `hindsight.mentalModelsEnabled` | `true` | 将策划的心智模型加载到新会话中。 |
| `hindsight.mentalModelAutoSeed` | `true` | 在启动时创建缺失的内置用户偏好、项目惯例和项目决策模型。 |
| `hindsight.mentalModelRefreshIntervalMs` | `300000` | 符合条件的心智模型的刷新间隔。 |
| `hindsight.mentalModelMaxRenderChars` | `16000` | 渲染出的心智模型文本的最大长度。 |
| `hindsight.requestTimeoutMs` | `30000` | 默认请求截止时间。 |
| `hindsight.recallTimeoutMs` | `30000` | 召回截止时间。 |
| `hindsight.retainTimeoutMs` | `60000` | 保留截止时间。 |
| `hindsight.reflectTimeoutMs` | `120000` | 综合（synthesis）截止时间。 |
| `hindsight.debug` | `false` | 启用请求与后端的调试日志。 |

## 故障排查

**启用 local 记忆后，`/memory view` 是空的。** local 记忆只处理已持久化的主会话，默认跳过最近 12 小时内仍处于活动状态的会话，并在启动时执行维护。先运行 `/memory enqueue`，正常退出，待存在符合条件的会话后再重新启动 omp。同时请确保 `default` 和 `smol` 模型角色拥有可用的凭据。

**Mnemopi 已启用但不记住也不召回。** 运行 `/memory diagnose` 和 `/memory stats`。启动是尽力而为的：数据库、嵌入模型或 LLM 初始化失败时，编码会话仍可使用，但记忆会处于无效状态。可尝试 `mnemopi.noEmbeddings: true` 来隔离嵌入问题，并使用 `mnemopi.llmMode: none` 来隔离 LLM 配置。

**Hindsight 已启用但什么都没有出现。** 先确认生效的后端和端点：

```
omp config get memory.backend
omp config get hindsight.apiUrl
```

然后运行 `/memory diagnose`。检查服务器是否可访问，以及 `HINDSIGHT_API_TOKEN` 或 `hindsight.apiToken` 是否有效。请求失败不会中断编码会话；当你需要后端日志时，可启用 `hindsight.debug`。

**一个项目看到了另一个项目的知识。** 检查 `mnemopi.scoping` 或 `hindsight.scoping`。如需隔离，请切换到 `per-project`，然后单独清空旧的本地仓库，或移除旧的 Hindsight 仓库/数据；更改范围不会抹除之前存储的知识。

**记忆已过期。** 让 omp 对照当前仓库对其进行核实。对于某一条 Mnemopi 事实，要求它更新或遗忘即可。对于 local 摘要，先使用 `/memory clear`，再执行 `/memory enqueue`，之后重新启动。对于 Hindsight，请在 Hindsight 中删除或更正远程记录；`/memory clear` 只会清空当前会话的本地召回状态。

会话内的上下文管理请参阅 [压缩](./compaction.md)；配置位置、项目覆盖与优先级请参阅 [设置](./settings.md)。
