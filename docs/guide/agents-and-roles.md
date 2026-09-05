# Agent 与模型角色

**模型**、**角色**和**agent**配置的是不同的层：

| 层 | 它是什么 | 何时修改它… |
| --- | --- | --- |
| **模型** | 一个具体的 Provider/模型，例如 `anthropic/claude-sonnet-4-5` 或 `openai/gpt-5.4`。 | 当你想要不同的能力、延迟、价格、上下文大小或 Provider 凭据时。 |
| **角色** | 一个命名的路由槽位，例如 `default`、`smol` 或 `slow`，它会解析为一个模型。 | 当多个功能应跟随同一个模型选择，或你想在不逐个修改使用方的情况下更换它们的模型时。 |
| **agent** | 一个可复用的行为档案(profile)：名称、指令、允许使用的工具，以及可选的模型、prewalk 与 advisor 偏好。 | 当你需要的是一个可复用的专项子代理（例如审查者、研究员或设计师），而不只是换一个模型时。 |

一个 agent 可以指向一个角色，而该角色指向一个模型。例如，`reviewer` agent 通常使用 `@slow`；更改 `slow` 角色会改变未来 reviewer 运行所用的模型，同时不改变 reviewer 本身的职责。

## 一个简单的工作流程

1.   输入 `/model`，打开**角色**，为你关心的常用槽位赋值。先从 `default`、`smol` 和 `slow` 开始；在需要可预期的路由之前，其余保持自动即可。

2.   输入 `/agents` 查看内置与自定义 agent。选中一个即可看到它的来源、启用状态、生效模型、prewalk 选择与 advisor 选择。

3.   用日常语言让 omp 按名称调用该专项子代理：

> 让 librarian 核实上游 API 的行为，然后总结源码证据。

> 让 reviewer 检查当前改动是否正确。不要编辑文件。

> 并行推进 UI 打磨与安全检查：界面交给 designer，只读审计交给 security-reviewer。

4.   在 **Agent Hub** 中监督这个子代理。阅读它的活动与用量，打开它的转录，发送一条普通的后续消息，或在任务出错时停止它。

你永远无需描述 omp 的内部委派协议。说明期望的结果与所需的专项子代理，加上范围或安全限制，然后让主会话协调这些工作即可。

## 打开并浏览 Agent Hub

按 Alt+A 打开 Agent Hub。Ctrl+S 会通过旧的 session-observe 按键绑定打开同一视图。

还有一个容易被忽略的导航手势：

*   在**空的主会话编辑器**中按两次 ←。当当前会话有可展示的子代理时，Agent Hub 就会打开。
*   当焦点**位于某个子代理中**时，让它自己的编辑器保持为空并按两次 ←，即可返回主会话。

选中某个子代理并按 Enter，可打开它的实时或持久化转录。在其中发送的消息会引导运行中的子代理，或跟进空闲的子代理。Agent Hub 还会显示状态、解析后的模型、当前活动、谱系、token、请求、工具调用、活动时间，以及数据可得时的实测成本。用 r 复活已停放的子代理，用 x 终止不应继续工作的子代理。

关于状态、隔离、引导、限制以及完整的控制参考，请参见[子代理与 Agent Hub](./subagents.md)。

## 选择内置 agent

随 omp 一起发布的 agent 如下：

| agent | 选择它用于 | 常规模型路由 |
| --- | --- | --- |
| `scout` | 快速、只读的仓库探查，返回压缩后的发现。 | `@smol` |
| `designer` | UI/UX 实现、无障碍与视觉打磨。 | `@designer` |
| `reviewer` | 有证据支撑的正确性、质量与安全审查。 | `@slow` |
| `security-reviewer` | 只读的漏洞发现与安全分析。 | 当前会话模型的回退 |
| `librarian` | 对外部库和 API 做源码验证式研究。 | `@smol` |
| `task` | 具备完整可用能力集的通用多步骤工作。 | `@task` |
| `sonic` | 几乎不需要推理的严格机械性编辑或数据收集。 | `@smol` |

请选用最窄、最合适的专项子代理。只读 agent 更适合调研，更安全；没有合适的专项子代理时用 `task`；`sonic` 用于机械性工作，不用于模糊的设计或审查。请打开 `/agents` 查看你当前安装中的实际生效定义，因为项目级与用户级 agent 可能新增名称或替换内置 agent。

## 选择角色

内置角色除了路由 agent，也会路由产品功能：

| 角色 | 被路由到它这里的工作 |
| --- | --- |
| `default` | 常规的交互式工作，也是主会话的默认值。 |
| `smol` | 快速、低成本的实用型工作，也是通常的 prewalk 交接目标。 |
| `slow` | 深度推理与审查，适用于可接受额外延迟的场景。 |
| `vision` | 由支持视觉的模型进行图像检查。 |
| `plan` | 计划模式下的架构设计与审查。 |
| `designer` | 内置的 designer agent。 |
| `commit` | 提交消息的生成。 |
| `tiny` | 非常小的后台任务，例如标题、记忆支持与语音清理。 |
| `task` | 通用的子代理工作。 |
| `advisor` | 审查已选择加入的会话或子代理的独立模型。 |

未分配的内置角色会根据可用的已认证模型自动解析。当你需要稳定的行为、成本或 Provider 选择时，在 `/model` 中为某个角色赋值。更改当前对话的活动模型并不会改写已保存的角色赋值。

关于自动选择、项目存储、思考级别、快速切换、启动覆盖以及重试回退链，请参见[模型角色](./roles.md)页面。

## agent 如何获取它的模型

对于普通的具名子代理，omp 会按顺序尝试以下来源：

1.   **设置覆盖** —— `task.agentModelOverrides.<agent-name>`。
2.   **agent 默认值** —— 该 agent 的 `model` frontmatter，可以只包含一个选择器，也可以是有序列表。
3.   **常规回退** —— 父会话的活动模型，然后是它已配置的/默认的模型回退。

前两层中的选择器可以是具体的 `provider/model`，也可以是 `@slow` 这样的角色别名。角色别名会在启动时通过 `modelRoles` 展开。

当你想在不复制或编辑既有 agent 定义的情况下为其重新路由时，使用 `task.agentModelOverrides`。当多个 agent 或功能应一起切换时，那里更推荐使用角色别名：

```
modelRoles:
  default: anthropic/claude-sonnet-4-5
  smol: openai/gpt-4.1-mini
  slow: openai/gpt-5.4:high
  review: openai/gpt-5.4:high

task:
  agentModelOverrides:
    reviewer: "@review"
```

有了这套配置，`/model` 控制 `review` 由哪个具体模型填充，而 `/agents` 控制 `reviewer` 是否使用该角色。`agentModelOverrides` 中的具体模型会绕过该 agent 在 frontmatter 中的选择，并且在角色被重新分配时不会随之变动。

## 用户级与项目级 agent

自定义 agent 定义是带有 YAML frontmatter 的 Markdown 文件：

*   **用户范围：**`~/.omp/agent/agents/*.md` 可在各项目之间使用。
*   **项目范围：**`.omp/agents/*.md` 属于当前项目。

`/agents` 会把定义标注为 **Project**、**User** 或 **Bundled**。名称区分大小写。名称冲突时，项目定义优先于用户定义，自定义定义优先于内置定义。这样既能针对某个仓库定制像 `reviewer` 这样的标准名称，也能解释它为什么在那个仓库里行为不同。

定义中与模型相关的部分可以保持简短：

```
---
name: release-auditor
description: Check release readiness and report concrete blockers.
tools: read, grep, glob, bash
model: "@slow"
prewalk: false
advisor: "@advisor"
---

Inspect the assigned release scope. Report evidence and blockers; do not edit files.
```

这里的 `model` 参与上面的优先级顺序。`prewalk` 和 `advisor` 为该 agent 提供默认值；`/agents` 可以不修改文件就覆盖其中任一项。在 `/agents` 中使用 **New agent** 开始一份定义，或参考[编写子代理](./subagent-authoring.md)了解所有受支持的 frontmatter、工具限制、输出形态、技能加载与校验。

在 omp 运行期间编辑 agent 文件后，回到 `/agents` 并按 Ctrl+R 重新加载列表。

## 每个 agent 的 prewalk 与 advisor 控制

在 `/agents` 中选中一个 agent，可配置四个属性：启用、模型、prewalk 与 advisor。

*   **Prewalk** 让该子代理先在其解析后的模型上做规划与早期实现，然后一次性交接给更快或更便宜的目标。`on` 使用 `@smol`；`off` 关闭它；模型或角色模式则选择其他目标。
*   **Advisor** 为该子代理配对一个独立的审查模型。`on` 使用 `@advisor`；`off` 关闭它；模型或角色模式则选择其他 advisor。

对应的设置项会覆盖 agent 的 frontmatter，并且可以在 `~/.omp/agent/config.yml` 中编辑：

```
task:
  agentPrewalk:
    task: "@smol"
    reviewer: "off"
  agentAdvisor:
    reviewer: "on"
    security-reviewer: "@slow"
```

更宽泛的默认值与限制，请使用 `/settings`。**Generic Task Prewalk** 设置（`task.prewalk`）会影响内置的 `task` agent；`/agents` 中按 agent 的选择仍然优先。关于这些系统的完整行为，请参见[Prewalk](./prewalk.md)、[Advisor](./advisor.md)与[设置](./settings.md)。

## 成本与故障排查

每个子代理都是一个独立的模型会话。并行子代理会成倍增加 Provider 请求与 token 用量；advisor 会带来自己的审查调用，而 prewalk 在单个子代理的整个生命周期内可能使用两个模型。当 Provider 暴露的数据足够时，Agent Hub 会报告实测用量与成本。从最小且够用的扇出规模开始，谨慎地为轻量工作选择路由，并停止已经过时的子代理。

如果结果不是你预期的：

*   **行为不对：**在 `/agents` 中确认确切的 agent 名称与来源。项目级定义可能遮蔽了用户级或内置定义。
*   **模型不对：**在 `/agents` 中查看生效模型，然后依次检查 `task.agentModelOverrides`、该 agent 的 `model` frontmatter，以及 `/model` 中被引用的角色。同时确认所选 Provider 已通过认证。
*   **未知或已禁用的 agent：**检查区分大小写的名称与启用状态，并在改动文件后按 Ctrl+R。
*   **Prewalk 或 advisor 没有启动：**先检查按 agent 的覆盖设置，然后是 frontmatter、角色赋值、模型可用性与凭据。不可用的 prewalk 目标会被跳过，而不会导致该子代理失败。
*   **连按两次 ← 无效：**清空编辑器，并确认当前会话有可展示的子代理。即使名册为空，Alt+A 也会打开 Agent Hub。
*   **Agent Hub 不显示任何子代理：**Agent Hub 的范围是当前会话。请返回或恢复启动了该子代理的那个会话。

如需详尽的行为说明，请继续阅读[模型角色](./roles.md)、[子代理与 Agent Hub](./subagents.md)与[编写子代理](./subagent-authoring.md)。
