# 目标模式

目标模式用于处理单轮次无法完成、但有明确终点的工作：仓库级迁移、持续的测试—修复循环，或包含多个相互依赖步骤的发布清单。你只需陈述一次目标；omp 会不断采取下一个有用的步骤，直到它验证工作已完成、你暂停或放弃目标，或预算阻止进一步的工作为止。

从一个有边界、可测试的目标开始：

```
/goal Migrate the importer to streaming. Update every caller and user-facing documentation, preserve current error behavior, and finish only after the importer tests and typecheck pass.
/goal budget 200000
```

状态行会显示目标模式已激活，omp 会在每个有产出的轮次后继续推进，而不是等待你再次给出提示词。请随时处理高风险决策，并在工作推进过程中进行审查，同时用 `/goal show` 查看状态与使用量。

> **Token 预算是安全边界，而不是成功的定义。** 当预算耗尽时，目标会进入 `budget-limited` 状态，omp 会收束它已了解的情况。除非目标模式明确报告完成，否则目标仍未完成。

## 选择合适的任务类型

目标模式在以下情况效果最好：

*   期望的最终状态和验证命令已知；
*   推进过程可能需要多次编辑、运行工具或重试；
*   omp 可以不每一步都提问就做出常规决策；并且
*   你可以预先表达安全边界。

对于应在单轮次内完成的聚焦改动，请使用普通提示词。当你希望在实施前先审阅方案时，使用[计划模式](./plan.md)。不要对生产环境更改、破坏性操作、凭据相关的工作或模糊的产品决策放任目标无人看管；请在目标中要求对这些操作进行确认。

高质量的目标应写明交付物、完成证据以及被禁止的捷径。例如：

```
/goal Remove the legacy session API and migrate all callers. Keep the public behavior compatible, do not change the database schema, run the focused session tests and typecheck, and report any callers that cannot be migrated safely.
```

如果终点还不明确，先让 omp 采访你：

```
/guided-goal I need to make authentication safer before launch
```

`/guided-goal [粗略目标]` 会在普通聊天中提出澄清性问题，把你的回答转化为具体目标，然后启动目标模式。使用普通的 `/goal` 时，省略目标即可打开多行编辑器。

## 监督进行中的目标

在交互式 TUI 中，活动目标会在短暂的空闲暂停后自动继续。输入提示词、附加图片或进行中断，都会让你在下一轮次开始前获得控制权。你可以随时用一条普通消息来引导工作：

```
Before continuing, keep the existing wire format and add a regression test for malformed frames.
```

用以下命令检查和操控当前会话的目标：

| 命令 | 作用 |
| --- | --- |
| `/goal` | 为活动或已暂停的目标打开管理菜单。如果尚不存在目标，则打开目标编辑器。 |
| `/goal show` | 显示目标、状态、已用和剩余 token 以及活动时间。 |
| `/goal pause` | 停止自动继续，但将目标及其计量保留在会话中。 |
| `/goal resume` | 恢复已暂停的目标并调度它的下一次继续。 |
| `/goal budget <N>` | 设置正整数形式的 token 总预算。已有的用量会保留。 |
| `/goal budget off` | 移除 token 上限。已有的用量会保留。 |
| `/goal set <objective>` | 启动一个目标，或用新目标和新计数器替换活动目标。替换同时会清除旧预算。 |
| `/goal drop` | 确认后永久停止当前目标。没有单独的 `/goal stop` 命令。 |

按 `Esc` 可中断当前轮次。被中断的活动目标会以已暂停状态保存，因此请检查已完成的部分，并只在可以安全继续时运行 `/goal resume`。

已暂停的目标必须先恢复，之后才能更改其预算。它也不能被静默覆盖：请恢复它并使用 `/goal set …`，或在开始其他目标之前将其放弃。

## 设置与解读预算

目标模式**默认没有 token 上限**。对于受监督的工作，请在开始后尽快设置一个：

```
/goal budget 100000
```

`N` 是当前目标的总额度，而不是在其剩余额度上追加的数额。更改预算会保留已累计的用量。计数包括输入 token、输出 token 和缓存写入 token；缓存读取 token 不计入。某一轮次可能在计量追上之前越过精确的边界，因此请把这个数值视为护栏，而不是精确的硬性截止点或消费上限。

当已用 token 达到上限时：

1.   状态从 `active` 变为 `budget-limited`。
2.   omp 会发起一个收尾轮次，询问进度、剩余工作和阻碍因素，而不是开始更多实质性工作。
3.   自动继续停止，但目标仍附着在会话上。

先检查状态，再决定怎么做：

```
/goal show
```

如果目标仍值得继续，就设置一个高于所显示用量的新总额，或移除上限：

```
/goal budget 250000
# or
/goal budget off
```

这会把受预算限制的目标恢复到活动工作状态。如果你不再想要更多工作，用 `/goal pause` 把它保留到以后，或用 `/goal drop` 结束它。切勿把 `budget-limited`、收尾回复、沉默或 Provider 错误解读为完成。

## 完成意味着什么

目标模式会要求 omp 对照当前仓库状态逐项检查每个交付物之后才宣布完成。成功时，你会看到 **Goal mode completed**（目标模式已完成），自动继续结束，完成记录会把目标和已跟踪的用量写入会话历史。

这比仅仅到达轮次末尾更强，但它不能替代你的审查。请阅读最终的证据、检查重要的更改，并运行任何需要人工授权的发布或生产检查。如果最终回复列出了剩余工作或阻碍因素，那么即便回复听起来已经盖棺定论，任务也仍未完成。

## 持久化与恢复

目标、状态、预算、token 用量和活动时间会随工作推进与会话一起存储。压缩不会丢弃目标。在运行中的 TUI 里切换到其他会话再切回同一会话，会保留活动目标；从冷启动重新打开持久化会话时，活动目标会以 **paused**（已暂停）状态恢复，这样它就不会在无人看管的情况下继续。请使用 `/goal show`，检查工作树，然后运行 `/goal resume`。

显式暂停的目标会一直保留在会话中，直到恢复或放弃。放弃会移除活动目标记录，而累计用量仍保留在会话日志中。完成会清除活动模式并写入一条完成记录。

当工作意外停止时，请使用这份恢复清单：

| 你看到的情况 | 该怎么做 |
| --- | --- |
| 按 `Esc`、轮次被中断或重新打开会话后处于 `paused` | 检查部分更改和日志，然后运行 `/goal resume`。 |
| `budget-limited` | 运行 `/goal show`；把总额提高到已用 token 之上，或使用 `/goal budget off`。 |
| `active`，但没有自动的下一轮次 | 提交或清除等待在输入区（Composer）中的任何草稿/图片。如果上一次继续没有取得可执行的进展，发送一条普通消息，例如“从最后一个已验证的步骤继续该目标。” |
| 反复出现 Provider 或命令失败 | 暂停目标，修复凭据/环境或优化目标，然后恢复。只有当你确实想重置计数器时，才放弃并重新开始。 |
| “Exit plan mode first”或“Exit vibe mode first” | 结束或退出该模式；计划模式、Vibe 模式和目标模式互斥。 |
| “Goal mode is disabled” | 启用 `goal.enabled`，然后重试 `/goal`。 |

自动继续目前是交互式模式下的行为。Loop 模式也会接管自动提交，因此当你期望由目标驱动的继续时，不要把 `/loop` 与目标组合使用。

## 配置

无需任何配置：目标模式、它的底部状态以及交互式继续默认都是启用的。你可以在 **Settings → Tasks → Modes**（设置 → 任务 → 模式）中，或在 `~/.omp/agent/config.yml` 中更改它们：

```
goal:
  enabled: true
  statusInFooter: true
  continuationModes:
    - interactive
```

| 设置项 | 默认值 | 作用 |
| --- | --- | --- |
| `goal.enabled` | `true` | 允许 `/goal` 和 `/guided-goal` 创建会话级目标。 |
| `goal.statusInFooter` | `true` | 在状态行中，于目标指示器旁显示目标的 token 用量。 |
| `goal.continuationModes` | `["interactive"]` | 在交互式 TUI 中启用轮次间的自动继续。移除 `interactive` 以要求手动提示词。 |

从 shell 验证生效值：

```
omp config get goal.enabled
omp config get goal.statusInFooter
omp config get goal.continuationModes
```

关于文件的优先级顺序和配置命令，参见[设置](./settings.md)；完整的命令索引参见 [Slash 命令](./slash-commands.md)。
