# 运行模式

omp 有两种模式类别：

1.  **启动模式**决定你是在终端 UI 中工作、接收一次回答、流式接收机器可读事件，还是把 omp 连接到另一个应用。
2.  **交互式轮次控制**会改变工作在终端会话内的运行方式：`/loop`、`/force` 或 `/fast`。

对于日常编码工作，从终端 UI 开始：

```
omp
```

描述你期望的结果，例如："把 `issueToken` 重命名为 `mintToken`，并更新项目中的每一个调用方。" 只有当脚本、编辑器或应用——而不是坐在终端前的人——需要消费输出时，才使用其他启动模式。

## 选择启动模式

| 你想要…… | 用以下方式启动 omp…… | 你会看到什么 | 如何结束 |
| --- | --- | --- | --- |
| 交互式工作 | `omp` 或 `omp "your first prompt"` | 完整的终端 UI、对话记录、编辑器、审批和状态行 | `/exit`、`/quit`、`/q` 或 `Ctrl+D` |
| 获取一个纯文本回答 | `omp -p "your prompt"` | 在 stderr 上显示 `Working...`，然后在 stdout 上输出最终的助手文本 | 在该轮次后退出 |
| 通过管道输入提示词 | `git diff \| omp -p "Review this diff"` | 相同的一次性文本输出 | 在该轮次后退出 |
| 流式接收结构化事件 | `omp --mode json "your prompt"` | 每行一个 JSON 对象输出到 stdout | 在该轮次后退出 |
| 把 omp 嵌入其原生 RPC API 之后 | `omp --mode rpc` | 一个 `ready` 帧，随后通过 stdio 返回 RPC 响应和事件 | 客户端关闭、stdin EOF 或进程被中断 |
| 嵌入 omp 并处理交互式 UI 请求 | `omp --mode rpc-ui` | RPC 加上供宿主渲染的扩展/工具 UI 请求 | 客户端关闭、stdin EOF 或进程被中断 |
| 在支持 ACP 的编辑器中运行 omp | 配置编辑器以启动 `omp acp` | 编辑器负责会话、变更、终端和审批 | ACP 客户端断开连接或停止进程 |

`--mode` 只接受 `text`、`json`、`rpc`、`rpc-ui` 或 `acp` 这几个值。任何显式的 `--mode` 都会选择无头模式——即使是 `--mode text`。裸 `omp` 只有在未提供 `--print`、未选择模式且 stdin 没有提供提示词时才是交互式的。

### 交互式终端 UI

除非你有特定的自动化或集成需求，否则请使用此模式。

*   `Esc` 中断当前轮次。它不会退出 omp。
*   `Ctrl+C` 清空编辑器；在半秒内再次按下则退出。
*   `Ctrl+D` 退出并保存一份未发送的草稿，以便在会话恢复时将其还原。
*   `/exit`、`/quit` 和 `/q` 执行同样的有序关闭。

状态行仅在此模式下可用。当 Fast、Plan、Goal、Vibe 和 Loop 等控件处于活动状态时，状态行的模型和模式区段会显示这些控件。

### 一次性文本

以下形式是请求纯文本并退出的等价方式：

```
omp -p "Summarize the last commit"
omp --mode text "Summarize the last commit"
printf '%s\n' "Summarize the last commit" | omp
```

只有在 `--print` 和 `--mode` 都未选择其他方式时，管道输入的 stdin 才会自动选择一次性文本。omp 在开始前会等待 EOF；如果产生方一直保持 stdin 打开，omp 会在 stderr 上报出它仍在读取提示词。请关闭产生方或按 `Ctrl+C`。

默认情况下，stdout 只包含最终的助手文本。当脚本确实需要模型的思考块时，可加上 `--print-thoughts`：

```
omp -p --print-thoughts "Explain this stack trace"
```

全新的一次性运行会忽略 `plan.defaultOnStartup`，因为没有审查界面。对于受支持的无头"先规划后执行"流程，请使用 `--plan-yolo`；参见[计划模式](./plan.md)。

### JSON 事件流

当脚本需要进度和生命周期事件，而不是渲染好的答案时，使用 JSON：

```
omp --mode json "Find every TODO under src" > run.jsonl
```

当会话有头部时，它就是第一行 JSON；随后是会话事件。流式更新会省略重复的完整消息快照和 Provider 私有的重放数据，因此请消费事件流，而不要指望每一行都是完整的对话记录。

### RPC、RPC UI 与 ACP

这些是集成传输方式，而不是备选的终端界面：

*   **RPC** 是 omp 原生的换行分隔协议。它独占 stdin 和 stdout，并在接受命令前发出 `ready`。`@file` 启动参数会被拒绝，因为客户端必须通过协议提供提示词和上下文。参见 [RPC 模式](./rpc.md)。
*   **RPC UI** 是供同时渲染 omp 的交互式扩展和工具 UI 请求的宿主使用的 RPC。它不是 `rpc` 的美化版本；除非宿主实现了这种 UI 交换，否则不要选择它。它还会禁用基于 PTY 的 shell 执行。
*   **ACP** 是标准的编辑器集成。优先使用 `omp acp`；`omp --mode acp` 与之等价。编辑器启动该进程并通过 stdio 创建会话。手动运行它会在 stderr 上打印一段说明并等待协议帧。参见 [ACP](./acp.md)。

关闭 RPC 的 stdin 会告诉 omp 客户端已离开：它会拒绝待处理的 UI 请求、排空已接受的命令、销毁会话并退出。ACP 会在其对端断开时退出。请把协议 stdout 保留给协议专用；将你应用自身的日志发送到别处。

## 在终端 UI 中控制轮次

这些斜杠控件不会取代启动模式。它们在交互式会话内部运行。

### 使用 `/loop` 重复工作

Loop 模式会捕获一条提示词，并在每个轮次之后再次提交它。请将其用于具有可观察停止条件的、真正可重复的工作，例如处理队列中的下一个文件或修复下一个失败的测试。

```
/loop
Fix the next failing test. If the suite is clean, explain that and stop.

/loop 5 Review the next unreviewed migration
/loop 30m Process the next item in the queue
/loop 1h30m Check the next repository and record the result
/loop 10 minutes Re-run the acceptance check
```

这些形式的含义如下：

*   `/loop` 启用无限循环；下一条普通提示词即成为被重复的提示词。
*   `/loop <prompt>` 立即以该提示词启动无限循环。
*   `/loop <positive-integer> [prompt]` 允许在第一次轮次之后自动重新提交那么多次。
*   `/loop <duration> [prompt]` 在墙上时钟(wall-clock)截止时间到期时停止重新提交。接受的单位有秒、分钟和小时，包括 `s`、`sec`、`m`、`min`、`h`、`hr`、复数形式、紧凑组合（如 `1h30m`）以及带空格的形式（如 `10 minutes`）。

状态行会显示 `Loop waiting`、`Loop running` 或 `Loop paused`，以及剩余次数或时间。斜杠命令的自动补全也会描述当前的 Loop 状态。

Loop 控件有意保持相互独立：

*   在某次迭代期间按 `Esc` 以中止该轮次。Loop 仍保持启用。
*   在两次迭代之间按 `Esc` 以暂停、丢弃捕获到的提示词，并阻止待处理的重放。下一条普通提示词会变成新的循环提示词并恢复循环。
*   再次运行 `/loop` 以完全禁用 Loop。
*   次数限制或时长截止时间会禁用 Loop 并显示原因。

默认情况下，`loop.mode` 为 `prompt`，因此每次重放都在同一会话中继续。`compact` 设置会在每次重放前压缩上下文；`reset` 会在每次重放前启动一个全新会话。只有在重复的上下文成为问题时才配置这些设置——参见[设置](./settings.md)。

### 使用 `/force` 强制一次工具调用

当 omp 反复选错活动工具时，可将 Force 用作一种有针对性的纠正。先用 `/tools` 查看可用的名称，然后强制恰好一次调用：

```
/force read Inspect package.json and summarize its scripts
/force:read Inspect package.json and summarize its scripts
```

两种拼写均可接受。若不附带行内提示词，该强制会作用于你下一条提交的提示词：

```
/force read
```

Force 不是持久模式。下一个模型调用必须调用一次该活动工具，随后该 Agent 轮次在不进行另一次工具调用的情况下结束。下一轮恢复正常。没有 Force 徽标，因为没有持久状态；当下一轮被钉选时 omp 会显示确认。

当指定的工具处于非活动状态或当前模型无法强制指定工具时，Force 会失败，而不是去猜测。这在[计划模式](./plan.md)中很重要，因为在那里具备写入能力的工具有意不可用。

### 使用 `/fast` 请求优先服务

Fast 模式要求当前的模型系列使用其优先服务路径：

```
/fast on
/fast off
/fast status
/fast
```

裸 `/fast` 用于切换。当需要确定性的状态时，请优先使用 `/fast on`，因为它是幂等的，并且会在当前模型没有兼容的服务层控制时给出提示。

该设置按会话持久化，并独立作用于 OpenAI、Anthropic 和 Google 模型系列。如果你在某个 OpenAI 系列的模型上启用 Fast，切换到 Anthropic 模型，之后再切回来，OpenAI 系列的选择仍保持开启；Anthropic 系列保留它自己的选择。

当优先服务确实处于活动状态时，如果主题提供了 Fast 图标，模型区段会显示该图标。`/fast status` 是直接检查当前模型系列所配置状态的方式；`/fast on` 会在该模型没有兼容的优先控制时给出提示。如果 Provider 拒绝了优先服务，omp 会在不使用它的情况下重试，为该系列关闭 Fast，并显示一条警告。

优先服务可能花费更高，并计入高级请求的用量统计。请用 `/usage` 或 `omp stats` 核对，而不要假设更低的延迟是免费的。

## 这些控件如何组合

| 组合 | 结果 |
| --- | --- |
| Loop + Fast | 当活动模型支持所选系列的优先档位时，每一次重复轮次都使用 Fast。 |
| Loop + Force | 只有接下来第一次模型调用被强制。之后的循环重新提交不受强制。 |
| Loop + 活动中的 Goal | 在 Loop 被禁用之前，Loop 优先于自动的 Goal 延续。如果需要目标驱动的自主性，请使用[目标模式](./goal.md)，而不是毫无理由地把两者叠加。 |
| Loop + Plan、Prewalk、Goal 或 Vibe | 这些控件可能仍处于活动状态，但单一模式区段显示优先级更高的工作状态，而不是 Loop。这是显示优先级，并不证明 Loop 已关闭。 |
| `loop.mode: reset` + Vibe | 该组合会被拒绝：omp 会禁用 Loop，并告诉你在使用 reset 循环前先退出 Vibe。 |
| Force + Plan | Force 只能选择在 Plan 的只读环境中处于活动状态的工具。 |
| 任一启动 `--mode` + 另一启动模式 | 启动模式互斥；只能传入一个 `--mode` 值。RPC 和 ACP 独占 stdin，因此管道输入的字节是协议帧，而不是提示词。 |

Fast 有自己的模型区段图标，因此它与单一工作模式区段无关地保持可见。要确认被另一个工作状态徽标隐藏的 Loop，可打开 `/loop` 的斜杠自动补全；要停止它，可运行 `/loop`。

## 选择工作模式，而不是传输模式

有若干更深入的功能会改变 omp 处理工作的方式。它们在适当的启动模式内可用，并有各自的控件：

*   [计划模式](./plan.md) — 在实现前先评审方案。
*   [目标模式](./goal.md) — 在多个轮次间追求一个持久目标。
*   [Vibe 模式](./vibe.md) — 协调并行工作者。
*   [Prewalk](./prewalk.md) — 把已规划的实现交给更快的模型。
*   [Advisor](./advisor.md) — 被动评审工作并抛出关注点。

请查看这些页面以了解它们的生命周期和安全控件。请使用本页来决定如何启动 omp，以及当前终端轮次是应该重复、强制一次工具调用，还是请求优先服务。

## 故障排查

**终端 UI 打开了，但我想要的是供脚本使用的输出。**

 对最终文本使用 `-p`，对事件使用 `--mode json`。裸的位置参数提示词不会让 omp 变成无头模式。

**一条通过管道运行的命令在开始任何工作之前似乎卡住了。**

 omp 必须通过 stdin 一直读到 EOF。检查产生方是否关闭了管道；一秒后 omp 会在 stderr 上报出它在等待什么。

**`omp acp` 看起来空闲。**

 那是一个等待 ACP 客户端的服务器，不是独立的 UI。请配置你的编辑器来启动它；参见 [ACP](./acp.md)。

**Loop 在重复，但它的徽标消失了。**

 Plan、Prewalk、Goal 和 Vibe 在单一模式区段中具有显示优先级。请在斜杠自动补全中检查 `/loop`。运行 `/loop` 即可禁用它。

**`/force` 提示工具不处于活动状态。**

 运行 `/tools`。如果当前工作模式有意移除了该工具，请切换工作模式，或选择其中一个活动名称。

**`/fast on` 不可用，或自动关闭了。**

 当前模型要么没有受支持的优先路径，要么其 Provider 拒绝了请求。请继续使用普通档位，或切换到受支持的模型；在收到拒绝之后不要反复切换。

## 相关

*   [CLI 参考](../reference/cli.md) — 每一个启动标志和子命令。
*   [斜杠命令](./slash-commands.md) — 完整的交互式命令参考。
*   [快捷键](./keybindings.md) — 默认值与重新映射。
*   [RPC 模式](./rpc.md) — 原生嵌入协议。
*   [ACP](./acp.md) — 编辑器集成。
