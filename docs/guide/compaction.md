# 压缩

会话会不断增长直到不再适合模型的上下文窗口。Compaction 是 omp 的解决方案：用单个摘要条目替换记录的较旧部分，同时保留近期尾部的原文。下一轮看到的是 `system`，然后是摘要，再然后是保留的尾部——足够的近期细节以继续工作，加上之前所有内容的摘要。原始条目保留在磁盘上；只有实时消息流被重写。

## 保留什么，摘要什么

`compaction.keepRecentTokens`（默认 `20000`）设置保留尾部的目标大小。切割点选在该窗口内的用户轮次边界处；工具结果不会跨越边界被切割。切割点之前的元数据条目（模型更改、思考级别更改、标签）会被前移到保留区域，以便近期轮次仍可正确解析。

在切割点之前，omp 可能会先修剪大型工具输出。默认策略保护最新的 `40 000` 个工具输出 token，要求至少节省 `20 000` 个 token 的总估计量，并且从不触及 `skill` 或 `read` 结果。被修剪的输出会被替换为 `[Output truncated - N tokens]` 占位符。切割点之前的所有其他内容被折叠成一个摘要，记录对话要点加上会话触及的 `<read-files>` / `<modified-files>` 路径列表。

摘要条目作为 `CompactionEntry` 追加到会话中，包含 `type: "compaction"`、原文 `summary`、`firstKeptEntryId` 和 `tokensBefore`。压缩前的条目保留在磁盘上；[`/tree`](./sessions.md) 仍然可以回溯到它们。

## 手动：`/compact [focus]`

在任何时候运行 `/compact` 以强制对当前分支进行压缩。可选参数是自由文本，作为额外指令传递给摘要器——当默认摘要会对错误的线程过度加权时使用：

```
/compact Focus on the API redesign decisions; the migration scripts are scratch work.
```

手动压缩会先中止当前轮次，然后进行摘要，最后写入条目。无论 `compaction.enabled` 是否开启都可以工作——该设置仅控制自动路径。计划模式在接受计划时通过 _Approve and compact context_ 提供相同的原语。

## 自动触发器

三条自动路径共享压缩机制，但触发时机和后续行为不同。

| 触发器 | 触发时机 | 压缩后 |
| --- | --- | --- |
| **溢出恢复** | 模型在当前轮次返回上下文溢出错误。 | 重试同一轮次。首先尝试配置的升级链中更大的模型；仅在升级不可用时才运行压缩。 |
| **阈值维护** | 一轮成功的对话完成后，调整后的上下文 token 超过解析的阈值。 | 调度自动继续提示，除非 `compaction.autoContinue` 为 `false`。 |
| **空闲维护** | 会话空闲、未在流式传输、未在压缩。 | 停止。不会自动继续。 |

阈值默认为 `contextWindow - max(15% of contextWindow, reserveTokens)`。使用 `compaction.thresholdPercent` 或 `compaction.thresholdTokens` 覆盖；取正值的那个生效。

## 非压缩重试

并非所有失败都是溢出。Provider 过载、速率限制、5xx 响应、套接字重置和使用限额错误是临时性的——重新发送相同的提示词通常有效。omp 通过单独的重试策略路由这些错误，该策略**不会**进行压缩：

1. 代理根据临时性模式（`overloaded`、`rate limit`、`429`、`5xx`、`connection reset`、`fetch failed`、usage-limit、retry hints）对错误消息进行分类。
2. 上下文溢出错误被明确排除，转而进入压缩流程。
3. 失败的助手条目从实时代理状态中移除（仍保留在会话文件中），轮次在退避延迟后重新调度。

退避策略是指数级的：`retry.baseDelayMs * 2^(attempt - 1)`。默认配置下，三次尝试分别为 2 秒、4 秒、8 秒。Provider 提供的提示（`retry-after`、`retry-after-ms`、`x-ratelimit-reset`）可以覆盖本地延迟。如果配置的回退链（`retry.fallbackChains`）提供了不同的模型或凭据，omp 会立即切换并无延迟重试；当原始资源的冷却期到期后会恢复，除非 `retry.fallbackRevertPolicy` 为 `"never"`。

```
retry:
  enabled: true
  maxRetries: 3
  baseDelayMs: 2000
  fallbackRevertPolicy: cooldown-expiry
```

TUI 在重试待处理时显示 `Retrying (n/max) in Ns… (esc to cancel)`。`Esc` 取消退避并终止重试链；全局中止也会取消进行中的重试。达到最大尝试次数后，会话发出 `auto_retry_end { success: false, finalError }`，轮次显示为失败——不会自动压缩，不会再次尝试。

## 检查上下文和压缩

`/context` 打印实时窗口的分桶明细：系统提示词、系统工具、系统上下文、Skills、消息、自动压缩缓冲区和剩余空间。每个桶都有一个 ASCII 条形图和 token 计数，方便看出哪个会先溢出。

`/usage` 报告活动凭据的 Provider 速率限制余量。当轮次停滞时，先检查 `/usage` 以排除配额瓶颈——重试路径会自动处理这种情况。

压缩条目在[会话文件](./sessions.md)中以 JSON 对象形式可见，格式为 `{ "type": "compaction", "summary": "…", "firstKeptEntryId": "…", "tokensBefore": N }`。编排器的 `session_compact` Hook 在每次压缩后触发，因此 Extension 可以记录或对其做出反应。

## 配置

在 `~/.omp/agent/config.yml` 中：

```
compaction:
  enabled: true              # master switch for automatic paths
  strategy: context-full     # "context-full" | "handoff" | "off"
  reserveTokens: 16384       # headroom kept under the context window
  keepRecentTokens: 20000    # target size of the verbatim tail
  autoContinue: true         # schedule continuation after threshold compaction
  idleEnabled: true          # run maintenance while idle
  thresholdPercent: -1       # explicit % override; -1 = auto
  thresholdTokens: -1        # explicit token override; -1 = auto
```

对于 headless 或脚本化运行，设置 `autoContinue: false` 使压缩静默发生并停止。设置 `strategy: handoff` 在达到阈值时启动新会话并附带交接文档，而非在当前分支上写入压缩条目。设置 `enabled: false` 完全禁用自动路径；手动 `/compact` 仍然可用。

## 相关页面

- [Memory](./memory.md) —— 跨会话的持久化笔记；与本页描述的会话内压缩正交。
- [Sessions](./sessions.md) —— 恢复、分支和 `/tree`，用于浏览压缩写入的磁盘会话文件。
- [Settings](./settings.md) —— `compaction.*` 和 `retry.*` 配置组的完整参考。
