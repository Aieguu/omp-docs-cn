# 模式

大部分 omp 行为由一次性[斜杠命令](./slash-commands.md)塑造。其中有四个命令会切换一个持久或单轮的*模式*，而不是仅执行一次旁路操作：`/loop`、`/background`（别名 `/bg`）、`/force` 和 `/fast`。它们可以组合使用——`/loop` 加 `/background` 是标准的"让它通宵跑"配方。

## 循环模式 — `/loop [count|duration]`

`/loop` 切换一种状态：你发送的下一条提示会在每次 yield 后自动重新提交，直到达到限制或你手动停止。当工作是迭代式的且模型已经知道验收检查时很有用："修复下一个失败的测试"、"处理队列中的下一个文件"、"审查列表中的下一个 PR"。

```
:/loop          # unlimited; runs until you cancel
:/loop 10       # cap at 10 iterations
:/loop 30m      # wall-clock cap
:/loop 2h
```

接受的单位：`s`、`m`/`min`、`h`/`hr` 及其复数形式。混合形式（如 `/loop 10 5m`）会被拒绝。切换后发送的第一条提示成为循环提示；后续 yield 会重新触发相同的文本。`Esc` 取消当前迭代但不退出循环模式；再次运行 `/loop` 退出循环模式；带时限的形式在截止时间到达后自动结束。

循环状态显示在状态行的模式区段中，与任何活动的 Plan 模式指示器并列。

## 后台模式 — `/background` / `/bg`

`/background`（别名 `/bg`）将 TUI 从正在运行的会话中分离，让 Agent 在后台继续执行。会话进程保持存活；终端被释放。从任意终端重新连接：

```
omp -c        # reattach to the most recent session
```

`/background` 仅在轮次正在流式输出时有效——会话空闲时会被拒绝。调用时，交互式工具切换到非 UI 模式（需要提示的操作会快速失败），加载器和状态行停止，TUI 通过 `SIGTSTP` 挂起。运行结束时，omp 发送桌面通知并关闭后台进程。

要查看后台会话的状态而不重新连接，可从另一个活跃会话使用 `/jobs`。配合 `/loop` 适合你不想守着的长时间自主运行。

## 强制模式 — `/force <tool> [prompt]`

`/force` 将下一轮钉选到特定工具。作用范围恰好是一轮——该轮返回后，工具选择自动取消钉选。当模型反复选错工具时使用：对一个还不存在的文件调用 `edit`、拒绝对新脚手架调用 `write`、开口说话而不是派出子 Agent。

```
:/force write src/server/auth.ts: stub a JWT verifier
:/force task                       # pins next message you send
```

如果在工具名称后提供提示词，它会在同一轮中提交。仅传 `/force <tool>` 时，钉选会附加到你接下来输入的内容上。也接受 `/force:<tool>` 形式。

## 快速模式 — `/fast`

`/fast` 切换 OpenAI 的 `service_tier: "priority"` 对出站请求的启用状态。在支持的 OpenAI 模型上，优先流量会以更高的每 Token 成本排在默认层请求之前路由；这与你在 API 调用中自行设置的选项相同。omp 将每个优先请求计入 `premiumRequests` 预算——与 GitHub Copilot 高级请求使用同一配额——因此会在 `/usage` 和 `omp stats` 的高级卡片中显示。

```
:/fast          # toggle
:/fast on
:/fast off
:/fast status
```

该模式在会话中持久化（通过会话日志中的 `service_tier_change` 条目在重新加载后存活），并以状态行中的小徽标显示。在非 OpenAI Provider 上，该标志在请求发出前会被丢弃，因此切换它不会产生任何效果。

## 场景选择指南

- **对队列重复执行相同提示或直到检查通过** → 使用带次数或时限上限的 `/loop`。
- **想离开长时间运行的任务** → 先 `/loop`，再 `/background`；用 `omp -c` 重新连接。
- **模型反复选错工具** → `/force <tool>` 一轮，然后放手。
- **某一轮对延迟敏感且你在用 OpenAI** → `/fast on`，接受更高成本。

循环和后台可以组合。强制是逐轮的，会自动取消钉选。快速是逐会话的，直到你手动关闭。没有哪个命令能替代清晰的提示——它们只是移除了手动重新提交、前台绑定、错误工具选择或排队延迟。

## 相关文档

- [斜杠命令](./slash-commands.md) — 上述命令的完整参考。
- [Goal 模式](./goal.md) — 与 `/loop` 配合的持久化自主目标。
- [Plan 模式](./plan.md) — 适用于更复杂变更的先起草后执行模式。
