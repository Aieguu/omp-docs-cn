# 交接

当对话积累了过多历史时，交接（Handoff）会给 omp 一个干净、面向任务的上下文。它会总结到目前为止已完成的工作、重要的决策以及接下来应该发生的事，然后把这个总结压缩进**当前会话**中。

当你希望下一轮次从一个深思熟虑的检查点继续时，运行它：

```
/handoff
```

在 omp 准备交接期间，状态行会显示 `Generating handoff… (esc to cancel)`。成功后，对话会围绕一个 `handed-off` 分隔线重建，omp 报告 `Context handed off and compacted in place`。

> 尽管名字如此，`/handoff` 并不会创建、分叉或切换到另一个会话。你的会话 ID、名称、分支以及已保存的会话都保持不变。

## 交接还是压缩？

两条命令都会就地缩减模型的活跃上下文，并保留对话最近的一截尾部。根据你希望替换后的上下文强调什么来选择。

| 选择 | 你希望的时候 | 结果 |
| --- | --- | --- |
| `/handoff` | 一份以工作为重心的后续简报：目标、进展、决策、约束和下一步 | omp 会生成该简报，把它用作较早上下文的总结，并将该位置标记为 `handed-off` |
| [`/compact`](./compaction.md) | 一般的上下文缩减，或对压缩方法（如 `soft`、`remote` 或 `snapcompact`）的控制 | omp 使用所选的压缩方法，并标记对应的压缩点 |
| 两者都不用 | 当前上下文仍然有用，而且舒服地处于模型限制范围内 | 继续工作即可；自动上下文维护默认已启用 |

在切换工作阶段之前、长时间停顿后回来时，或想要保留一个精确的实现/调试检查点时，使用 `/handoff`。当优先级只是释放上下文时，使用 `/compact`。如果你其实想要一个单独的会话，请使用 [会话](./sessions.md) 中描述的会话控制。

## 聚焦后续工作

在命令后面添加用平实语言表达的焦点指令：

```
/handoff Focus on the migration plan, decisions already made, and callers that still need updating.
```

该焦点会改变简报强调的内容；它不会变成新的用户任务，也不会创建新的会话。没有焦点时，omp 会从对话中挑选重要的后续细节。

好的焦点指令会点明必须在缩减中存活下来的工作：

```
/handoff Preserve the test failure, hypotheses ruled out, and the next two debugging steps.
```

```
/handoff Emphasize the approved API shape and unresolved compatibility risk.
```

运行该命令前，先等待当前回复结束。如果你需要停止该回复，请先中止它，然后再输入 `/handoff`。

## 屏幕上会有什么变化

一次成功的交接会改变未来模型轮次所使用的上下文：

*   较早的上下文会被生成的交接简报替换。
*   最近的消息保持原样。保留的量由 `compaction.keepRecentTokens` 控制，默认为 `20000`。
*   Todos 和其他实时会话界面会刷新。
*   同一个会话继续下去；没有恢复或加载步骤。

默认情况下，交接前的历史会被折叠出实时转录，最近的尾部出现在一个类似下面的分隔线之后：

```
──────── handed-off · 180K→24K · ctrl+o ────────
```

按 Ctrl+O 展开分隔线并阅读生成的简报。如果你希望在压缩分隔线周围内联保留完整的已保存转录，请把 `display.collapseCompacted: false`。折叠只影响显示，不影响已持久化的会话历史。

你的下一条提示词可以立即继续这项工作：

```
Continue with the first remaining migration caller.
```

## 取消或从失败中恢复

当 `Generating handoff…` 可见时按 Esc 即可取消。omp 显示 `Handoff cancelled`，保持当前上下文不变，并让你留在同一会话中。

其他前置条件和错误同样是非破坏性的：

| 消息 | 含义与后续操作 |
| --- | --- |
| `Wait for the current response to finish or abort it before handing off.` | 让回复结束，或中止它，然后重试。 |
| `Nothing to hand off (no messages yet)` | 可总结的消息少于两条。先继续对话。 |
| `Nothing to hand off (already compacted)` | 已没有需要替换的较早上下文。先继续工作，再重试。 |
| `Compaction already in progress` | 等待正在进行的自动或手动压缩完成。 |
| `Handoff failed: No model selected for handoff` | 先选择模型，然后重试。 |
| `Handoff failed: No API key for …` | 先认证当前激活的 Provider，然后重试。 |
| `Handoff failed: …` | Provider 或生成过程失败。原始上下文仍保持激活；解决报告的错误后重试。 |

生成的简报为空会被视为失败，而不是取消。omp 会自动重试暂时性的 Provider 失败，但如果最后一次尝试失败，它会显示真实的错误，并且不会提交不完整的交接。

## 自动交接

手动 `/handoff` 始终会请求交接工作流；它不依赖于是否启用自动压缩，也不依赖于 `compaction.methodOrder`。

要自动使用，请启用压缩并把 `handoff` 放到有序回退列表靠前的位置。默认顺序为：

```
remote → snapcompact → handoff → shake → soft
```

也就是说，另一个可用的方法可能会在交接之前运行。如果自动交接无法运行或失败，omp 会尝试下一个已配置的方法。当输入已经溢出模型的上下文时，omp 通常会跳过发起新的交接请求，因为同样超大的输入无法被总结；一个已准备好的预生成（speculative）交接仍可能被应用。

打开 `/settings` 并使用 **Context → Compaction**，或向 `config.yml` 添加全局或项目级覆盖：

```
compaction:
  enabled: true
  methodOrder: [handoff, remote, snapcompact, shake, soft]
  handoffSaveToDisk: true
```

`handoffSaveToDisk` 会向已持久化会话的工件目录添加一个带时间戳的 `handoff-*.md` 文件，**仅针对自动交接**。手动 `/handoff` 会把结果作为该会话的压缩总结存储，但不会写入额外的 Markdown 文件。

## 相关设置

| 设置 | 默认值 | 作用 |
| --- | --- | --- |
| `compaction.enabled` | `true` | 启用自动上下文维护。它不会禁用手动 `/handoff`。 |
| `compaction.methodOrder` | `[remote, snapcompact, handoff, shake, soft]` | 选择并排列自动维护方法。把 `handoff` 放首位可优先使用它。 |
| `compaction.keepRecentTokens` | `20000` | 交接或压缩后近似原样保留的最近上下文量。 |
| `compaction.thresholdPercent` | `-1` | 自动维护阈值（百分比）；`-1` 使用基于预留量的默认值。 |
| `compaction.thresholdTokens` | `-1` | 固定的自动维护 token 上限；非默认值会覆盖百分比设置。 |
| `compaction.asyncEnabled` | `true` | 可能会在临近阈值时提前准备一份由 LLM 支撑的总结（包括交接），以便快速应用。 |
| `compaction.handoffSaveToDisk` | `false` | 仅对持久化会话中的自动交接写入额外的 Markdown 工件。 |
| `display.collapseCompacted` | `true` | 在实时 TUI 中折叠被替换的历史；关闭它以在行内保留完整转录。 |

配置位置、作用域和优先级请参阅 [设置](./settings.md)。

## 相关文档

*   [压缩](./compaction.md) —— 压缩方法、阈值与恢复行为
*   [会话](./sessions.md) —— 创建、分叉、恢复和切换会话
*   [计划模式](./plan.md) —— 在保留该检查点之前创建实现计划
