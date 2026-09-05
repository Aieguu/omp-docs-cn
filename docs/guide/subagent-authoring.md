# 编写子代理

当你反复执行同一种委派时,自定义子代理(subagent)就很有用:例如审查某个 API、检查迁移、调研某个依赖,或做一类范围严密的修改。你只需为这类工作一次性赋予一个稳定的名称和指令,以后每当需要时,就让 omp 调用这位专家即可。

## 创建最小的实用 Agent

要创建一个面向特定项目、只读的 API 审查者,请创建 `.omp/agents/api-reviewer.md`:

```
---
name: api-reviewer
description: Review API changes for compatibility, missing tests, and contract drift.
tools: [read, grep, glob]
---

Review the assigned API change.

Check exported types, HTTP behavior, tests, and documented contracts. Report only concrete findings with file and line references. Do not edit files.
```

只有 `name` 和 `description` 是必填的。Markdown 正文是该 Agent 的持久指令。这个示例显式授予了一套只读工具,而不是继承当前会话可用的全部工具。

保存文件,打开 `/agents`,然后按 Ctrl+R。搜索 `api-reviewer`,确认详情面板中显示的是预期的文件路径。如果它处于禁用状态,请按空格键(Space)启用它。

然后自然地提问,并使用确切的名称:

```
Use the api-reviewer subagent to review the current branch. Keep it read-only and report actionable findings.
```

你不需要特殊的请求格式。直呼该 Agent 的名称是最清晰的选中方式;它的 `description` 也会告诉 omp 何时适合调用这位专家。

## 选择存放位置

| 作用域 | 存放位置 | 用途 |
| --- | --- | --- |
| 项目 | `<project>/.omp/agents/<name>.md` | 随项目一起流动的仓库专属约定。omp 会从当前目录逐级向上查找,并使用最近的 `.omp/agents` 目录。 |
| 用户 | `~/.omp/agent/agents/<name>.md` | 可跨项目使用的个人专家。使用命名档案(profile)时,路径为 `~/.omp/profiles/<profile>/agent/agents/`。 |
| OMP 扩展 | `<extension-root>/agents/<name>.md` | 随 OMP 扩展包一起分发的 Agent。 |
| Claude 市场插件 | `<plugin-root>/agents/<name>.md` | 由已启用的 Claude 市场插件提供的 Agent。 |

对于给定的 `name`,按以下顺序,第一个定义胜出:

1. 最近的 `.omp/agents` 项目目录
2. 当前活动用户的 agents 目录
3. OMP 扩展根目录,按其配置的来源排序:命令行扩展、项目扩展、用户扩展,然后是已安装的 npm/link 插件
4. Claude 市场插件,项目范围优先于用户范围
5. 随 omp 内置的 Agent

名称按精确匹配,区分大小写。建议使用小写 kebab-case 风格(如 `api-reviewer`)的名称。同一目录内,文件按文件名顺序依次考虑,因此不要保留两个 `name` 相同的定义。项目或用户定义可以通过复用某个名称,有意替换掉插件或内置 Agent;`/agents` 会显示胜出的是哪个文件。

直接位于 `.claude/agents`、`.codex/agents` 等目录下的跨工具目录不会被扫描。它们的 frontmatter 约定与 omp 的并不互通。

## 编写高效的指令

让正文聚焦于可复用的角色。写明:

* 该 Agent 负责什么、绝不能做什么
* 它应当遵循的检查项或工作流程
* 它的回答中需要给出的证据
* 它是否可以编辑文件
* 任何在一次次委派中始终成立的项目边界

把每次都会变化的工作放进你的请求里,而不是写进定义。例如,把“审查 API 兼容性”留在文件中,把“审查本分支上的分页改动”放进提示词。避免把通用的项目指令复制到每个 Agent 里;常规的项目上下文仍然会生效。

`description` 只是选中的提示线索,不是第二个系统提示词。请使用具体的动词、主题和边界:“Review database migrations for unsafe locks and rollback gaps”比“A helpful database expert.”有用得多。

## 安全地授予工具

显式的 `tools` 列表就是一条能力边界。从能够完成该工作的最小集合开始:

* 调研通常需要 `read`、`grep` 和 `glob`
* 当语义化的代码导航有用时,再加入 `lsp`
* 仅当该 Agent 需要修改文件时,才加入 `edit` 或 `write`
* 仅当它必须运行命令时,才加入 `bash`;shell 访问同样可以修改工作区
* 仅当外部访问本就是该角色的一部分时,才加入 `web_search`、`browser`、`github` 或插件/MCP 工具
* 仅当这位专家必须继续向下委派时,才加入 `task`,并同样限制 `spawns`

省略 `tools` 时,该 Agent 会继承父会话可用的工具。这对通用型执行者很方便,但对审查者来说通常过于宽泛。omp 会自动添加 Agent 所需的私有补全能力;请勿自行添加。

隔离(isolation)是针对单次委派的选择,而不是写在 Agent frontmatter 里。当该 Agent 会做出有风险或相对独立的改动时,请明确要求:

```
Use the migration-fixer subagent in an isolated worktree to fix the failing migration test.
```

隔离需要受支持的 Git 检出以及已配置的任务隔离。它只隔离文件系统的改动;并不会让网络、shell 或凭据访问变得无害,因此请尽量收窄工具授权。

## Frontmatter 参考

Frontmatter 键可以使用 camelCase 或 kebab-case。以下是当前的公共字段:

| 字段 | 含义 |
| --- | --- |
| `name` | **必填。** 用于选中该 Agent 的精确、区分大小写的标识符。 |
| `description` | **必填。** 简要说明何时应使用该 Agent。 |
| `tools` | 允许使用的工具名称,以 CSV 字符串或 YAML 列表形式给出。省略则以继承当前会话的工具。 |
| `model` | 按顺序依次尝试的单个模型选择器、CSV 字符串或 YAML 列表。它可以是具体的选择器,如 `openai/gpt-5-mini`,也可以是角色别名,如 `"@review"`。省略则使用常规的继承选择。 |
| `thinking-level` | `inherit`、`off`、`auto`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max`。较旧的 `thinking` 键同样被接受。实际支持程度取决于模型。 |
| `spawns` | 该 Agent 可向下委派的 Agent 名称,以 CSV 字符串或列表形式给出;`*` 表示允许任何已发现的 Agent。省略则为无。出于兼容性,授予 `task` 工具却未设置此字段时,等同于 `*`,因此请显式设置此字段。 |
| `autoload-skills` | 在第一次委派之前要加载的技能名称,以 CSV 或列表形式给出。未知名称会被忽略。 |
| `read-summarize` | 当 `read` 必须返回逐字代码而不是结构化摘要时,设为 `false`。通常请保持启用。 |
| `output` | 用于结构化结果的 JSON Schema。当普通的文字报告更为合适时,省略它。 |
| `blocking` | 当即使启用了异步委派,调用方也应等待该 Agent 完成时,设为 `true`。通常省略它。 |
| `prewalk` | 设为 `true` 时,会在第一次 edit 或 write 时把工作交给 `smol` 角色下的模型;模型选择器或角色别名可选择其他目标。当更强的模型应在更便宜的模型实现之前先行检查或规划时,请使用它。 |
| `advisor` | 设为 `true` 时使用已配置的 `advisor` 模型角色;模型选择器或角色别名可指定特定的 advisor。除此之外,子代理运行时不会带 advisor。 |

这里没有单独的 `role` 字段。把角色别名放进 `model`,然后在你的用户或项目配置中映射该别名。这样既能保持 Agent 指令稳定,又能让每个环境自行选择具体的模型:

```
---
name: api-reviewer
description: Review API changes for compatibility, missing tests, and contract drift.
tools: [read, grep, glob]
model: "@review"
thinking-level: high
---

Review the assigned API change and report concrete findings with file and line references.
```

```
# ~/.omp/agent/config.yml, or the active profile's config.yml
modelRoles:
  review: openai/gpt-5.4
```

你可以在 `/models` 中的 Roles(角色)视图里分配或修改自定义模型角色。`/agents` 中心(hub)也允许你在不编辑共享定义的情况下,覆盖某个已发现 Agent 的模型、prewalk 目标或 advisor;这些按 Agent 设置的配置优先于其 frontmatter。

## 重新加载与维护定义

每次委派开始前都会重新读取 Agent 定义,因此保存后的编辑会应用到下一次使用。`/agents` 界面展示的是它自己的一份快照;在添加、重命名或编辑某个文件后,请在那里按 Ctrl+R。

对于由扩展或插件提供的 Agent,在安装或更改包之后请运行 `/reload-plugins`,让 omp 重新加载整个插件面。普通的项目和用户 Markdown 编辑不需要重启 omp。

请像对待代码一样对待项目 Agent:审查改动、保持描述准确,并删除过时重复的文件。如果你想以 omp 内置定义的可编辑副本作为起点,可运行 `omp agents unpack --project`,或在用户范围运行 `omp agents unpack`;只自定义你打算覆盖的那些文件。

## 故障排查

**Agent 从 `/agents` 中缺失。** 请按 Ctrl+R,检查文件以 `.md` 结尾,并确认它直接位于某个 `agents` 目录之内。验证 frontmatter 中 `name` 和 `description` 都含非空的字符串值。无效的 YAML 或缺失必填字段会跳过该文件,但发现过程会继续。

**错误的定义胜出了。** 请在 `/agents` 中查看来源路径,然后在更高优先级的项目或用户目录里检查是否存在完全相同的 `name`(大小写也相同)。在 monorepo 中,请记住最近的 `.omp/agents` 目录才是项目来源。

**omp 没有选中该 Agent。** 请用确切的名称去请求它。在 `description` 中写清能把它与其他 Agent 区分开来的任务、主题和边界。还要在 `/agents` 中确认该 Agent 已启用。

**请求的模型无法解析。** 请打开 `/models`,确认具体的模型或角色别名已配置并通过认证。若要获得回退行为,请在 `model` 下列出多个选择器。

**某个工具不可用。** 请把它的确切注册名加入 `tools`;只有当继承父级完整工具集确实是你的本意时,才删除这个显式列表。插件提供的工具还要求该插件已启用并已重新加载。

**某次编辑似乎没有生效。** 实际的委派会读取最新的定义,但 `/agents` 清单可能仍显示之前的快照。请重新加载该中心界面。对于扩展或插件包,还请同时使用 `/reload-plugins`。

## 相关

* [子代理与 Agent Hub](./subagents.md) — 委派工作并观察正在运行的 Agent。
* [Agent 与模型角色](./agents-and-roles.md) — 决定是改变行为、路由,还是底层的模型。
* [技能](./skills.md) — Agent 可以自动加载的可复用操作手册。
* [插件](./plugins.md) — 将 Agent 与其他能力一起打包分发。
* [设置](./settings.md) — 配置模型角色与任务隔离。
