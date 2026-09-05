# Hook

## 先从一个 force-push 保护开始

Hook 让你可以在 omp 每次工作时应用一条本地策略：在危险命令运行前阻止它、在输出到达模型前对其脱敏、为某个轮次添加上下文，或记录会话活动。Hook 是一个订阅公开事件的受信任 TypeScript 或 JavaScript 模块。

下面这个项目 Hook 会阻止 `git push --force`，同时仍然允许 `--force-with-lease`：

```
// .omp/hooks/pre/force-push.ts
import {
  isToolCallEventType,
  type ExtensionAPI,
} from "@oh-my-pi/pi-coding-agent";

const FORCE_PUSH = /\bgit\s+push\b[^\n]*(?:--force(?:\s|$)|(?:^|\s)-f(?:\s|$))/;

export default function forcePushGuard(pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.notify("Force-push guard active", "info");
  });

  pi.on("tool_call", (event) => {
    if (!isToolCallEventType("bash", event)) return;
    if (!FORCE_PUSH.test(event.input.command)) return;

    return {
      block: true,
      reason: "Blocked git push --force; use --force-with-lease after reviewing the remote branch.",
    };
  });
}
```

创建该目录、保存文件，然后从该项目启动一个新的 `omp` 会话。启动通知会确认处理器已运行。打开 `/extensions` 可以查看解析到的文件及其源码。

要测试一个松散的文件而不安装它，请显式传入：

```
omp --hook /absolute/path/to/force-push.ts
```

然后询问：

> 在这个一次性仓库中运行 `git push --force`。

该命令必须不会运行。omp 会把 Hook 的 reason 显示为工具错误，Agent 则可以选取一个更安全的下一步。请使用一次性仓库来做策略测试，以防 Hook 本身含有错误。

> Hook 会以你的用户身份执行，并且可以检查提示词、工具输入、结果、凭据元数据与会话状态。只加载你信任的代码。

## 安装松散的 Hook

omp 会自动发现下列目录中的直接 `.ts` 和 `.js` 文件：

| 范围 | 目录 |
| --- | --- |
| 当前项目 | 会话工作目录下的 `.omp/hooks/pre/` 与 `.omp/hooks/post/` |
| 当前用户档案(profile) | 具名档案(profile)下的 `~/.omp/profiles/<name>/agent/hooks/pre/` 与 `post/`；默认档案(profile)下的 `~/.omp/agent/hooks/pre/` 与 `post/` |

发现过程不是递归的。类似 `.omp/hooks/pre/team/guard.ts` 的文件会被忽略。添加或修改 Hook 后，请启动一个新的会话。

`pre` 与 `post` 是用于组织与发现的命名空间；它们不会自动选择事件或工具。`pre/` 中的文件可以订阅任何事件，而类似 `bash.ts` 这样的文件名也不会自动过滤调用。请在代码中注册事件，并执行任何 `toolName` 检查。按惯例，把闸门（gate）与输入变换放在 `pre/` 中，把观察器或结果变换放在 `post/` 中。

若要为单次会话加载，可以使用 `--hook <path>` 或 `--extension <path>`；这两个标志走的是同一个模块加载接口。相对路径从会话工作目录解析。要让某个显式的 Hook 保持启用，请把它在 `~/.omp/agent/config.yml` 中的绝对路径加入 `extensions`：

```
extensions:
  - /absolute/path/to/force-push.ts
```

可以通过交互式的 `/extensions` 或从 shell 运行 `omp -p '/extensions'` 来检查生效的集合。

## 模块契约

当前的 Hook 模块默认导出一个接收 `ExtensionAPI` 的同步或异步工厂。在工厂加载期间注册处理器：

```
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function myHook(pi: ExtensionAPI) {
  pi.on("turn_end", async (event, ctx) => {
    pi.logger.debug("turn completed", {
      cwd: ctx.cwd,
      turn: event.turnIndex,
    });
  });
}
```

处理器会收到 `(event, ctx)`。`event` 是下面各表格中的类型化负载。常用且有用的上下文成员包括：

| 成员 | 含义 |
| --- | --- |
| `ctx.cwd` | 当前会话的工作目录。 |
| `ctx.mode` | `"tui"`、`"rpc"`、`"json"` 或 `"print"`。 |
| `ctx.hasUI`、`ctx.ui` | 交互式 UI 是否可用，以及通知、提示、状态、widgets 等 UI 方法。调用交互式方法前，请用 `hasUI` 或 `mode === "tui"` 做守卫。 |
| `ctx.model`、`ctx.models` | 当前模型以及只读的模型查询接口。 |
| `ctx.sessionManager` | 只读的会话访问。受支持的写入请使用 `pi.sendMessage()` 或 `pi.appendEntry()`。 |
| `ctx.isIdle()`、`ctx.hasPendingMessages()`、`ctx.abort()` | 当前的运行状态与取消控制。 |
| `ctx.getContextUsage()`、`ctx.getSystemPrompt()` | 当前的上下文用量与生效的系统提示词行。 |
| `ctx.setTimeout()`、`ctx.setInterval()`、`ctx.clearTimer()` | 会话自有的定时器；它们的错误会被包含处理，并在关闭时被清除。 |

请使用导出的 TypeScript 类型，而不要在 Hook 中复制嵌套的负载类型。特别是，工具输入与 details 都是可辨识联合；`isToolCallEventType("bash", event)` 可以安全地收窄内置工具。

## 可改变行为的事件

负载列列出的是除 `type` 之外的公开顶层字段。不带返回值返回会让行为保持不变。

| 事件 | 负载 | 处理器返回与组合行为 |
| --- | --- | --- |
| `resources_discover` | `cwd`、`reason: "startup" \| "reload"` | `{ skillPaths?, promptPaths?, themePaths? }`。来自每个处理器的路径会被累积。 |
| `input` | `text`、`images?`、`source: "interactive" \| "rpc" \| "extension"` | `{ text?, images?, handled? }`。变换会链式执行；`handled: true` 会停止正常的输入处理以及后续处理器。 |
| `user_bash` | `command`、`excludeFromContext`、`cwd` | `{ result }` 以替换执行。第一个返回结果的处理器生效。它观察的是用户输入的 `!`/`!!` 命令，而不是模型的工具调用。 |
| `user_python` | `code`、`excludeFromContext`、`cwd` | `{ result }` 以替换执行。第一个返回结果的处理器生效。它观察的是用户输入的 `$`/`$$` 代码。 |
| `tool_call` | `toolName`、`toolCallId`、类型化的 `input` | `{ block?, reason?, input? }`。第一个 block 会停止分发。否则以最后返回的结果为准；所有处理器看到的都是原始的事件输入。替换模型发起调用的 `input` 会被重新校验，并成为 omp 显示、审批、持久化并执行的内容。它会被被阻止的调用忽略，也不会应用于 `computer` 调用。 |
| `tool_result` | `toolName`、`toolCallId`、`input`、`content`、`details`、`isError` | `{ content?, details?, isError? }`。修改会逐字段链式执行，后续处理器可以看到先前的修改。Hook 可以改写成功或失败的输出，也可以更改最终的错误状态。 |
| `context` | 即将发送给模型的 `messages` | `{ messages }`。替换会链式执行。它只改变这一次模型调用，不会改变已存储的会话消息。 |
| `before_provider_request` | 不透明的 `payload` | 直接返回替换后的 provider 负载。替换会链式执行。这是一个高级的 provider 专属接缝；格式错误的负载可能破坏请求。 |
| `before_agent_start` | `prompt`、`images?`、当前的 `systemPrompt` 行 | `{ message?, systemPrompt? }`。每个返回的 message 都会被添加；system-prompt 的替换会链式执行。自定义消息会被持久化，并按它的 `display` 字段显示。 |
| `session_before_switch` | `reason: "new" \| "resume" \| "fork"`、`targetSessionFile?` | `{ cancel: true }` 会停止切换。第一个取消生效。 |
| `session_before_branch` | `entryId` | `{ cancel?, skipConversationRestore? }`。第一个取消生效；否则以最新返回的结果为准。 |
| `session_before_compact` | `preparation`、`branchEntries`、`customInstructions?`、`signal` | `{ cancel?, compaction? }`。取消，或提供一个完整的自定义压缩结果；第一个取消生效，否则以最新结果为准。 |
| `session.compacting` | `sessionId`、`messages` | `{ context?, prompt?, preserveData? }`。最新返回的结果会替换先前的结果。用它来自定义常规压缩，而无需构造完整的压缩结果。 |
| `session_before_tree` | `preparation`、`signal` | `{ cancel?, summary? }`。第一个取消生效；否则以最新结果为准。自定义摘要只在 `preparation.userWantsSummary` 为 true 时使用。 |
| `session_stop` | `messages`、`turn_id`、`last_assistant_message?`、`session_id`、`session_file?`、`stop_hook_active`、`signal` | `{ continue: true, additionalContext }` 或 `{ decision: "block", reason }` 会请求一次对模型可见的继续。第一个具有非空 context/reason 的可执行继续会生效。 |

### 工具拦截细节

`tool_call` 是执行前的策略接缝。它的 `event.input` 是供检查的规范化视图；处理器返回的 `input` 则必须是工具实际执行的完整原始参数对象。不要把规范化的、仅用于闸门的字段复制进替换内容。如果你只需要拒绝某个动作，请返回 `block`，并避免改写 input。

修订后的调用仍会经过正常的工具 schema 与审批策略。因此，用户批准的是将要真正运行的参数。Hook 是对 omp 审批设置的补充；它们不会绕过这些设置。

`tool_result` 在成功与失败的执行之后都会运行。文本与图像块位于 `content` 中；工具专属的元数据位于 `details` 中。最好返回新的 content 对象，而不是就地修改事件。

## 通知事件

这些事件的返回值会被忽略。负载仍然是有类型的，因此 Hook 可以记录日志、更新 UI、持久化自己的状态，或把一条受支持的消息排入队列。

### 会话与 Agent 生命周期

| 事件 | 负载与时机 |
| --- | --- |
| `session_start` | 无额外字段；初始会话加载。 |
| `session_switch` | `reason`、`previousSessionFile`；在新的、恢复的或分叉的会话变为活动之后。 |
| `session_branch` | `previousSessionFile`；分叉之后。 |
| `session_compact` | `compactionEntry`、`fromExtension`；压缩之后。 |
| `session_tree` | `newLeafId`、`oldLeafId`、`summaryEntry?`、`fromExtension?`；会话树导航之后。 |
| `session_shutdown` | 无额外字段；进程关闭。只用于简短的清理。 |
| `agent_start` | 无额外字段；每提交一个提示词、某个 Agent 循环开始时。 |
| `agent_end` | `messages`、`willContinue?`；循环结束。`willContinue` 表示一次自动继续已被排定。 |
| `turn_start` | `turnIndex`、`timestamp`；一个模型/工具轮次的开始。 |
| `turn_end` | `turnIndex`、最终的 `message`、`toolResults`；一个轮次的结束。 |
| `message_start` | `message`；一条用户、助手或工具结果消息已开始。 |
| `message_update` | 当前的 `message`、`assistantMessageEvent`；流式助手的更新。这可能流量很高。 |
| `message_end` | 分离出的 `message` 快照；仅通知。修改它不会重写模型或会话上下文。 |

### 工具执行与审批

| 事件 | 负载与时机 |
| --- | --- |
| `tool_execution_start` | `toolCallId`、`toolName`、`args`、`intent?`；前置调用处理完成后开始执行。 |
| `tool_execution_update` | `toolCallId`、`toolName`、`args`、`partialResult`；流式进度。这可能流量很高。 |
| `tool_execution_end` | `toolCallId`、`toolName`、`result`、`isError`；执行完成。要改写模型收到的内容，请使用 `tool_result`，而不是此事件。 |
| `tool_approval_requested` | `sessionId`、`toolCallId`、`toolName`、`reason?`、`approvalMode`；omp 即将请求审批。 |
| `tool_approval_resolved` | `sessionId`、`toolCallId`、`toolName`、`approved`、`reason?`；审批已被接受或拒绝。 |

### 维护、重试与集成

| 事件 | 负载与时机 |
| --- | --- |
| `auto_compaction_start` | `reason`、`action`；自动压缩已开始。 |
| `auto_compaction_end` | `action`、`result`、`aborted`、`willRetry`、`errorMessage?`、`skipped?`；自动压缩已收尾。 |
| `auto_retry_start` | `attempt`、`maxAttempts`、`delayMs`、`errorMessage`、`errorId?`；一次重试等待已开始。 |
| `auto_retry_end` | `success`、`attempt`、`finalError?`、`retryErrors?`；重试序列已收尾。 |
| `retry_fallback_applied` | `from`、`to`、`role`；重试已切换模型/provider。 |
| `retry_fallback_succeeded` | `model`、`role`；某个请求已在备用方案上成功。 |
| `ttsr_triggered` | 匹配到的 `rules`；生成过程被一条 TTSR 规则打断。 |
| `todo_reminder` | `todos`、`attempt`、`maxAttempts`；未完成 todo 的提醒逻辑已运行。 |
| `goal_updated` | `goal` 或 `null`、`state?`；目标模式的状态已改变。 |
| `credential_disabled` | `provider`、`disabledCause`；omp 自动对一个失败的凭据做了软禁用。用户移除或凭据去重时不会发出此事件。 |
| `mcp_notification` | 原始配置的 `server` 名称、JSON-RPC `method`、不透明的 `params`；在 omp 处理完已知的 MCP 通知之后，以及针对 server 专属的方法也会发出。 |
| `after_provider_response` | `status`、`headers`、`requestId?`、`metadata?`；在流式响应体被消费之前即可获得响应元数据。此事件中没有响应体。 |

## 顺序、超时与错误

在单个模块内，处理器按注册顺序运行。除 `session_shutdown` 外，事件处理器会被逐个等待。跨模块时，处理器遵循解析后的加载顺序，但目录枚举与能力去重并不是公开的优先级机制。请不要用诸如 `00-` 和 `99-` 之类的文件名前缀，在不同的 Hook 文件之间建立正确性依赖；请把有依赖关系的处理器合并进同一个模块。

重复的已发现 Hook 键可能会遮蔽较低优先级 provider 的 Hook。请让包中的文件名具有区分度。显式列出的路径会按其解析后的绝对路径去重，因此同一个模块不会被有意加载两次。

大多数处理器有 30 秒的活动工作预算。`tool_call` 使用可配置的 `extensionHandlers.toolCallTimeoutMs` 设置，默认同样为 30 秒：

```
extensionHandlers:
  toolCallTimeoutMs: 10000
```

`tool_call` 的异常或超时采用"失败即关闭"（fail closed）：omp 会阻止该调用，并报告是哪个扩展失败或超时。其他事件的异常与超时会被报告为扩展错误，该处理器不贡献任何结果，后续处理器会继续运行。`session_shutdown` 处理器会并发运行，预算为两秒，这样清理就不会一直占用进程。

在加载时，语法/导入错误、工厂抛出的异常或缺少默认工厂，都会阻止该模块加载；omp 会继续加载其他模块。用 `/extensions` 找出缺失的路径，然后用 `--log-level debug` 重启以查看加载错误。

## 打包并分享 Hook

对于可复用的仅含 Hook 的包，请保留约定的目录结构，并把该 Hook 声明为包入口。这样既支持直接的目录加载，又可以让已安装插件的发现机制找到 `hooks/` 界面：

```
force-push-guard/
  package.json
  hooks/
    pre/
      force-push.ts
```

```
{
  "name": "@acme/force-push-guard",
  "version": "1.0.0",
  "omp": {
    "extensions": ["./hooks/pre/force-push.ts"]
  }
}
```

发布前先测试这个目录：

```
omp --hook ./force-push-guard
```

常规本地使用则把它作为插件安装：

```
omp install ./force-push-guard
# Project scope instead of user scope:
omp install -l ./force-push-guard
```

`omp install` 接受本地路径、npm 包、Git 仓库与市场条目。包导入必须能从所安装的包中解析，并且每个运行时文件都必须包含在发布产物中。请把密钥与机器专属的策略放在用户或项目配置中，而不要把它们提交进公开的包。

多入口包请参见 [编写扩展](./extension-authoring.md)，安装、作用域、更新与发布请参见 [插件](./plugins.md)。

## 故障排查

| 症状 | 检查 |
| --- | --- |
| Hook 没有出现在 `/extensions` 中 | 文件必须是 `hooks/pre` 或 `hooks/post` 的直接 `.ts` 或 `.js` 子文件，或被显式传入。项目发现使用会话的工作目录；用户发现使用当前激活的档案(profile)。 |
| Hook 出现了，但某个处理器从未运行 | 目录与文件名不会选择事件。请确认确切的 `pi.on("event_name", ...)` 注册，以及任何 `toolName` 过滤。 |
| 启动时报告无效扩展 | 导出一个默认的工厂函数，并修复它的导入/语法错误。用 `--log-level debug` 运行以查看失败的路径。 |
| UI 调用在 print 或 RPC 模式下消失 | 在提示或渲染前检查 `ctx.hasUI` 或 `ctx.mode`。在无头模式中使用日志或持久化状态。 |
| 某个工具以扩展错误为由被阻止 | 某个 `tool_call` 处理器抛出了异常或超过了超时。请先修复 Hook，而不是先调高超时；闸门按设计"失败即关闭"。 |
| 两个 Hook 意见不一 | 把依赖顺序的逻辑放进同一个模块。对于相互独立的模块，请记住：第一个 block 生效，结果/上下文变换按上述说明链式执行，而许多会话结果事件采用最新返回的结果。 |
