# SDK

## 在你的应用中嵌入 omp

当你的宿主应用使用 TypeScript 或 JavaScript 编写、运行在 Bun 上、并且需要与 omp 共享同一个进程时，请使用 SDK。你会获得与 CLI 相同的 agent 核心，但由你的应用程序掌控提示词的生命周期、接收流式事件，并把普通函数作为 agent 工具暴露给 agent。

如果需要不同的语言、进程隔离，或一个稳定的 JSON 边界，请改用 [RPC 模式](./rpc.md)。

### 1. 安装软件包

```
bun add @oh-my-pi/pi-coding-agent
```

SDK 需要 **Bun 1.3.14 或更新版本**。它不是 Node.js SDK。

在发送由模型驱动的提示词之前，先对某个 Provider 完成认证。最快的路径是运行 `omp`，进入 `/login`，完成该 Provider 的登录流程。Provider 的 API 密钥环境变量也同样有效；参见 [Provider](./providers.md)。

### 2. 运行一个会话

创建 `embed.ts`：

```
import { createAgentSession } from "@oh-my-pi/pi-coding-agent";

const { session, modelFallbackMessage } = await createAgentSession({
  cwd: process.cwd(),
});

if (modelFallbackMessage) {
  process.stderr.write(`${modelFallbackMessage}\n`);
}

const unsubscribe = session.subscribe((event) => {
  if (
    event.type === "message_update" &&
    event.assistantMessageEvent.type === "text_delta"
  ) {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

try {
  await session.prompt("Summarize this repository in three bullets.");
  process.stdout.write("\n");
} finally {
  unsubscribe();
  await session.dispose();
}
```

在你希望 omp 处理的项目目录下运行它：

```
bun run embed.ts
```

文本通过 `message_update` 事件增量地到达。工具执行、历史更新、重试与压缩仍然是会话生命周期的一部分；`prompt()` 会在所提交的轮次落定后完成。默认情况下，会话使用当前项目，并像 CLI 一样持久化历史。

## 默认值与配置

`createAgentSession()` 遵循「省略即自动发现、提供即覆盖」的模式。不传选项时，它会自动发现你的 omp 凭据、设置、模型、扩展、技能、规则、项目上下文、提示词模板、slash 命令、MCP 服务器与工具。MCP 与 LSP 集成默认开启。

这让最小的示例在已有的 omp 环境中也能直接派上用场。嵌入方通常只覆盖那些需要由自己掌控的部分：

| Option | 使用时机 |
| --- | --- |
| `cwd` | 当 omp 需要在宿主进程的项目目录以外的其他目录上工作时。 |
| `sessionManager` | 当宿主需要临时历史、自定义会话位置、恢复或分叉行为时。 |
| `model` 或 `modelPattern` | 当模型选择必须是确定性的，而不是从设置中自动发现时。 |
| `thinkingLevel` | 当宿主想要一个特定的推理选择器，例如 `"medium"` 或 `"high"` 时。 |
| `settings` | 当宿主需要隔离的覆盖配置，而不是自动发现到的配置时。 |
| `systemPrompt` / `appendSystemPrompt` | 当宿主需要替换或扩展渲染出的 system prompt 时。 |
| `toolNames` / `restrictToolNames` | 当宿主需要请求工具或强制启用允许列表时。 |
| `customTools` | 当宿主把应用程序函数暴露给 agent 时。 |
| `extensions` / `additionalExtensionPaths` | 当宿主提供内联或基于文件的扩展时。 |
| `enableMCP` / `enableLsp` | 当宿主禁用其中任意一个自动发现的集成时。 |
| `autoApprove` | 当宿主有意退出交互式工具审批时。 |

### 临时会话与持久会话

默认的会话管理器会把历史写入 omp 的会话存储。对于请求作用域内的作业，请使用内存管理器：

```
import {
  createAgentSession,
  SessionManager,
} from "@oh-my-pi/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
});
```

如果需要显式的文件后端会话，请使用 `SessionManager.create(cwd)`。同一个公共类还提供 `continueRecent(cwd)`、`list(cwd)`、`open(path)` 以及分叉辅助方法；参见[会话](./sessions.md)。

### 自行掌控模型与设置的选择

当宿主必须掌控凭据、模型选择与设置，而不是依赖自动发现时，请使用包根导出的内容：

```
import {
  createAgentSession,
  discoverAuthStorage,
  ModelRegistry,
  SessionManager,
  Settings,
} from "@oh-my-pi/pi-coding-agent";

const authStorage = await discoverAuthStorage();
const modelRegistry = new ModelRegistry(authStorage);
await modelRegistry.refresh();

const model = modelRegistry.getAvailable()[0];
if (!model) {
  throw new Error("No authenticated model is available");
}

const settings = Settings.isolated({
  "compaction.enabled": true,
  "retry.enabled": true,
});

const { session } = await createAgentSession({
  authStorage,
  modelRegistry,
  model,
  settings,
  sessionManager: SessionManager.inMemory(),
  enableMCP: false,
});
```

当同时传入 `authStorage` 与 `modelRegistry` 时，registry 必须是用同一个 auth-storage 实例创建的。常规持久化配置及其优先级规则参见[设置](./settings.md)。

默认的进程级 `AgentRegistry` 每一代只接纳一个顶层 `Main` 身份。如果你的应用程序并发运行多个相互独立的顶层会话，请为每个会话配置各自的 `agentRegistry: new AgentRegistry()`。

## 把事件流式传输到你的宿主

`session.subscribe(listener)` 返回一个退订函数。最有用的公共事件有：

| Event | 宿主用途 |
| --- | --- |
| `message_update` | 流式传输 assistant 内容。`assistantMessageEvent.type` 包括 `text_delta`、`thinking_delta`、`toolcall_start`、`toolcall_delta`、`toolcall_end`、`done` 与 `error`。 |
| `message_start` / `message_end` | 观察完整的用户、assistant 与工具结果消息。 |
| `tool_execution_start` / `_update` / `_end` | 渲染工具进度。结束事件包含结果以及可选的 `isError`。 |
| `turn_start` / `turn_end` | 界定一次 assistant 响应及其工具结果。 |
| `agent_start` / `agent_end` | 界定一次 agent 运行。如果 `agent_end.isTerminal === false`，排队的异步投递会恢复该会话。 |
| `auto_compaction_start` / `_end` | 展示自动上下文维护。 |
| `auto_retry_start` / `_end` | 展示 Provider 重试状态。 |
| `notice` | 呈现来自会话的信息、警告或错误通知。 |

事件监听器是通知，而不是背压机制：会话不会 await 异步监听器。如果顺序重要，请自行把开销较大的宿主工作排入队列。

## 添加宿主自有工具

`CustomTool` 是一个公共回调约定。用该包导出的 `z` 模式构建器定义其输入，并为模型返回文本或图像内容。最后的 `AbortSignal` 让会话取消能够触达你的 I/O。

```
import {
  createAgentSession,
  type CustomTool,
  z,
} from "@oh-my-pi/pi-coding-agent";

const lookupTicket: CustomTool = {
  name: "lookup_ticket",
  label: "Lookup ticket",
  description: "Fetch a support ticket by its public ticket ID.",
  parameters: z.object({ ticketId: z.string() }),

  async execute(_toolCallId, { ticketId }, _onUpdate, _context, signal) {
    try {
      const response = await fetch(
        `https://support.example.test/tickets/${encodeURIComponent(ticketId)}`,
        { signal },
      );

      if (!response.ok) {
        return {
          content: [{ type: "text", text: `Ticket lookup failed (${response.status}).` }],
          isError: true,
        };
      }

      const ticket = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(ticket) }],
      };
    } catch (error) {
      if (signal?.aborted) throw error;
      return {
        content: [{ type: "text", text: `Ticket lookup failed: ${String(error)}` }],
        isError: true,
      };
    }
  },
};

const { session } = await createAgentSession({
  customTools: [lookupTicket],
});
```

工具模式校验的是形状，而不是授权。请在宿主回调内部落实租户边界、权限、速率限制与密钥处理。对于模型可以反应的预期失败，返回 `isError: true`；把抛出的错误保留给取消或意外失败。

`toolNames` 会请求工具，并且可以启用默认被禁用的工具，但它本身**并不是**允许列表。若要限制会话，请设置 `restrictToolNames: true`。在受限会话中，宿主工具只有在以下三个条件全部满足时才可用：

```
const { session } = await createAgentSession({
  customTools: [lookupTicket],
  toolNames: ["lookup_ticket"],
  restrictToolNames: true,
  allowRestrictedCustomTools: true,
});
```

对于从编写好的包中加载的可复用工具、命令、Hook 与 UI 集成，请使用[编写扩展](./extension-authoring.md)。

## 控制并清理会话

| API | 行为 |
| --- | --- |
| `session.prompt(text, options?)` | 提交一条提示词。只有当某个本地命令完整消费了输入时才返回 `false`；否则返回 `true`。 |
| `session.steer(text)` | 排入一条引导消息，在下一个安全边界打断正在进行的运行。 |
| `session.followUp(text)` | 在当前运行本会停止之后，再排入一个用户轮次。 |
| `session.abort()` | 取消正在进行的操作，并等待 agent 变为空闲。 |
| `session.compact(instructions?)` | 显式运行上下文压缩。 |
| `session.dispose()` | 幂等地停止所拥有的操作并释放会话资源。始终要 await 它。 |

当会话已经在流式传输时调用 `prompt()`，需要 `streamingBehavior: "steer"` 或 `"followUp"`；对大多数宿主来说，直接调用 `steer()` 或 `followUp()` 会更清晰。

在每个会话的整个生命周期外层使用 `try`/`finally`。如果你的宿主有自己的异步关闭工作，请在第一个关闭 `await` 之前调用 `session.beginDispose()`，完成宿主的清理之后，再 `await session.dispose()`。`beginDispose()` 会关闭对新工作的准入，但它并不能替代 `dispose()`。

## 处理失败

在 API 与事件两个边界上都要处理失败：

*   用 `try`/`catch` 包裹 `createAgentSession()` 与 `session.prompt()`。无效的配置、auth/model 接线不一致、所选模型缺失、API 密钥缺失或会话忙碌，都可能导致调用被拒绝。
*   监听 `message_update` 中 `assistantMessageEvent.type === "error"` 的情况，以捕获 Provider 侧的流式失败。其 assistant 消息会携带 Provider 的错误详情。
*   监听 `tool_execution_end.isError`，以捕获 agent 作为结果收到的工具失败。
*   当恢复会话时无法使用其保存的模型、omp 因而改选另一个模型时，请显示 `modelFallbackMessage`。
*   如果没有可用模型，请运行 `omp` 并使用 `/login`，设置该 Provider 的 API 密钥环境变量，或传入显式配置好的 `authStorage` 与 `modelRegistry`。
*   失败后始终要 dispose 会话；dispose 可以安全地多次调用。

## SDK 还是 RPC？

| 选择 | 最适合 | 权衡 |
| --- | --- | --- |
| **SDK** | Bun/TypeScript 宿主、工具的直接回调、直接的会话状态、最低的集成开销 | omp 共享你的进程、运行时、内存与失败边界 |
| **RPC** | 任何语言、子进程或服务隔离、以换行分隔的 JSON 协议 | 宿主必须自行管理进程与协议的生命周期 |

RPC 通过 `omp --mode rpc` 启动，并通过 stdio 暴露会话事件。不要仅仅为了「两次调用同一个进程」而在 SDK 后面再套一个 RPC 子进程：进程内 Bun 宿主请选择 SDK；真正的语言/进程边界则选择 RPC。
