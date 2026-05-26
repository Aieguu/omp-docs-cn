# 交接

`/handoff [focus]` 通过生成一份捕捉状态、待处理事项和后续步骤的简短文档来关闭当前轮次，然后打开一个全新的会话并将该文档作为其第一块上下文注入。旧会话的记录保持不变；新会话除了收尾内容外从零开始。

## 何时使用

当会话_完成了当前工作块_但工作本身尚未完成时使用 `/handoff`：

- 调试或实现阶段结束时，在你离开之前。
- 切换上下文——同一项目，不同功能——你希望下一个会话不用从 200 轮不相关的历史开始。
- 长时间暂停前（隔夜、周末结束），你回来时希望快速回顾。
- 将 JSONL 交给队友。他们恢复到新会话时首先看到收尾内容，而非原始记录。

如果你只需要缩小活动上下文以适应下一轮，请改用 [`/compact`](./compaction.md)。压缩留在同一会话中并就地摘要；交接结束当前会话并创建后继会话。

可选的 `[focus]` 参数引导文档偏向你关心的方向，例如 `/handoff Focus on the migration plan and which callers still need updating`。不提供时，生成器自行选择结构。

如果当前分支的消息少于两条，`/handoff` 拒绝执行并提示 `Nothing to hand off (no messages yet)`——内容太少，无法有效摘要。

## 生成内容

生成器作为侧通道模型调用运行，使用高推理强度且禁用工具，因此状态栏会显示加载指示器约 10–20 秒：`Generating handoff… (esc to cancel)`。输出是自由格式的 markdown——通常是正在处理的工作、代码当前状态、剩余事项以及值得延续的决策或约束。

文本被包装后追加到_新_会话中，作为类型为 `handoff` 的 `custom_message` 条目：

```
<handoff-context>
...handoff text...
</handoff-context>

The above is a handoff document from a previous session. Use this context to continue the work seamlessly.
```

由于它是 `custom_message`，当你重建聊天时该条目会出现在 TUI 中，并在新会话的后续每一轮中参与 LLM 上下文。

## 新会话

生成完成后，`/handoff` 将旧会话刷写到磁盘，创建新的会话文件，并将其 `parentSession` 字段设置为旧会话的 ID。该血统标记与 `/fork` 写入的相同，因此两个会话在浏览树时会显示为关联的。

切换后，你会在聊天中看到 `New session started with handoff context`，`/context` 会显示收尾条目作为消息桶的一部分。之前的会话_不会_被修改——收尾内容永远不会追加到旧记录中，只追加到新记录中。

## 取消和失败

在加载指示器可见时按 Esc 可中止请求。界面报告 `Handoff cancelled`，你留在原始会话中，磁盘上无任何更改。如果模型未返回文本也会显示相同消息。任何其他错误——Provider 故障、网络中断——都会显示为 `Handoff failed: <message>`，同样保持原始会话不变。

## 读取交接内容

下一个会话的恢复方式与任何会话相同：从同一目录执行 `omp -c`，或从任何地方执行 `omp --resume <id-prefix>`。由于交接是第一个真正的条目，代理在第一轮就读取它，人类在重建的聊天顶部看到它。没有单独的"加载交接"步骤。

从新会话执行 `/fork` 会向前克隆血统，携带交接条目。`/tree` 回溯到新会话自身的历史；要进入_父_会话，从 `~/.omp/agent/sessions/<cwd-hash>/` 按 ID 恢复。

自动触发的交接（压缩子系统为你触发的）在设置了 `compaction.handoffSaveToDisk` 时，也可以在会话的制品目录下生成带时间戳的 `handoff-*.md` 文件。手动 `/handoff` 跳过该文件——JSONL 条目是规范副本。

## 相关页面

- [Sessions](./sessions.md) —— 恢复、分支、分叉及会话工具包的其余功能。
- [Memory & compaction](./memory.md) —— 何时就地压缩而非交接。
- [Plan mode](./plan.md) —— 将计划与交接搭配，将规范传递到下一个会话。
