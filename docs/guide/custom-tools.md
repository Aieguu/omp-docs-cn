# 自定义工具

## 添加一个 omp 没有的操作

自定义工具是一个小型的 TypeScript 或 JavaScript 模块，它让 omp 能够调用由你掌控的代码。它适用于特定于项目的工作，例如查询内部服务、检查某个领域不变量，或执行一个范围受到严格限制的操作。

先从一个项目工具开始，这样它的源码就能随仓库一起被审查。创建 `.omp/tools/hello/index.ts`，从项目目录重启 omp，然后请它使用该工具。当该能力已经存在于一个独立服务中、或需要被多个客户端共享时，请改用 [MCP 服务器](./mcp.md)。

> **自定义工具是被信任的代码。** omp 会导入发现到的工具模块，并以你用户账户的权限运行它们。在不熟悉的仓库中打开 omp 之前，请先审查项目本地的 `.omp/tools` 代码。

## 创建最小的工具

从项目根目录：

```
mkdir -p .omp/tools/hello
```

创建 `.omp/tools/hello/index.ts`：

```
import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent";

const factory: CustomToolFactory = pi => ({
  name: "hello",
  label: "Hello",
  description: "Greet a person by name",
  parameters: pi.zod.object({
    name: pi.zod.string().describe("The person to greet"),
  }),

  async execute(_toolCallId, params) {
    return {
      content: [{ type: "text", text: `Hello, ${params.name}!` }],
      details: { greeted: params.name },
    };
  },
});

export default factory;
```

这个示例不需要安装任何 schema 包。omp 会把 schema 构造器以 `pi` 的形式注入到工厂中。

### 加载并测试它

工具发现在会话启动时进行。退出任何正在运行的会话，然后从项目根目录再次启动 omp：

```
omp
```

输入 `/tools` 并确认 `hello` 在列表中。然后这样提示：

```
Use the hello tool to greet Ada.
```

你应该会看到一张 **Hello** 工具卡片，以及一个包含 `Hello, Ada!` 的最终结果。若要一次性快速检查，请启动一个全新的进程：

```
omp -p 'Use the hello tool to greet Ada.'
```

工厂及其 `execute` 函数由你来写；你**不**需要调用 `execute`，也不需要输入 JSON 工具请求。模型会从你的自然语言请求中选出该工具，构造与 `parameters` 匹配的参数，而 omp 会在运行你的代码之前校验这些参数。精确的 `description`、字段描述以及收窄的 schema 会让这一选择更可靠。

## 选择它的加载位置

| 作用域 | 推荐路径 | 何时使用 |
| --- | --- | --- |
| 项目 | `.omp/tools/<name>/index.ts` | 该工具属于某一个仓库，并应随该仓库一起被审查。 |
| 用户 | `<active-config-dir>/tools/<name>/index.ts` | 你希望该工具出现在当前激活的 omp 档案(profile)下的每一个项目中。运行 `omp config path` 可打印当前激活的配置目录；默认是 `~/.omp/agent`。 |

omp 的原生目录也接受扁平的 `.ts` 和 `.js` 文件，例如 `.omp/tools/hello.ts`。当工具带有配套文件时，使用带 `index.ts` 的命名子目录更可取。为了兼容性，omp 也会在用户与项目的 `.claude/tools` 和 `.codex/tools` 目录中发现扁平的 `.ts` 和 `.js` 工具。

被发现的 `.md` 或 `.json` 文件是元数据，而不是可执行的工具模块。可执行模块必须导出一个工厂函数；默认导出就是上文所示的那种受支持且无歧义的形式。

## 工厂与定义 API

从 `@oh-my-pi/pi-coding-agent` 导入 `CustomToolFactory`。一个工厂可以返回一个工具、一组工具，或其中任一的 promise。返回的每个工具名在内置工具以及所有其他已加载的自定义工具中都必须唯一。

### 必填字段

| 字段 | 作者约定 |
| --- | --- |
| `name` | 用于标识工具的注册名。不要复用内置工具或其他自定义工具的名称。 |
| `label` | 在 TUI 中显示的人类可读名称。 |
| `description` | 简短、具体的引导，帮助模型判断该工具何时适用。 |
| `parameters` | 所接受参数的 schema。omp 据此推导 `params` 的 TypeScript 类型，并在 `execute` 之前校验调用。 |
| `execute` | 返回 `AgentToolResult` 的异步实现。 |

### 可选行为

| 字段 | 效果 |
| --- | --- |
| `strict` | 为该工具请求严格的 schema 处理。 |
| `hidden` | 保持该工具禁用，除非它被显式选择。 |
| `loadMode` | `"discoverable"` 让 schema 不进入始终在场的工具集；`"essential"` 让它保持在顶层。自定义工具默认是 `"discoverable"`。 |
| `approval` | 声明能力层级：`"read"`、`"write"` 或 `"exec"`；它也可以是决策对象，或一个接收已解析参数的函数。省略的审批会被视为 `"exec"`。 |
| `onSession` | 接收设置、状态变更与清理相关的生命周期事件。 |
| `renderCall` | 替换该调用在 TUI 中的默认渲染。 |
| `renderResult` | 替换部分结果与最终结果在 TUI 中的默认渲染。 |

`renderCall(args, options, theme)` 和 `renderResult(result, options, theme)` 返回来自 `@oh-my-pi/pi-tui` 的 `Component`。它们的 `options` 包含 `expanded` 与 `isPartial`；部分渲染还可以接收 `spinnerFrame`。渲染器影响的是人看到的内容，而不是模型接收的内容。

## 参数 schema

工厂宿主提供三个公开的 schema 构造器：

| 构造器 | 说明 |
| --- | --- |
| `pi.zod` | 与 Zod 兼容的构造器，用于入门示例。 |
| `pi.arktype` | 原生的 omptype/ArkType 构造器。 |
| `pi.typebox` | 为面向旧版 TypeBox 风格 API 编写的工具提供的兼容垫片(shim)。新工具请优先使用当前的构造器。 |

在操作允许的范围内让 schema 尽量小。对有限的动作使用枚举，为含义不明显的字段添加描述，并在省略具有安全含义时把默认值写进 schema。

```
parameters: pi.zod.object({
  action: pi.zod.enum(["check", "summarize"]),
  path: pi.zod.string().describe("Repository-relative file path"),
  limit: pi.zod.number().int().positive().optional().default(20),
}),
```

## 执行、进度与取消

完整的执行签名是：

```
async execute(toolCallId, params, onUpdate, ctx, signal) {
  // ...
}
```

| 参数 | 用途 |
| --- | --- |
| `toolCallId` | 用于关联本次调用的日志或 UI 状态。 |
| `params` | 已校验的、schema 类型的参数。 |
| `onUpdate` | 可选回调，用于向用户展示部分进度。模型接收的是最终返回的 `content`，而不是这些进度更新。 |
| `ctx` | 面向高级的、感知会话的工具的 `CustomToolContext`。普通工具应优先使用稳定的工厂宿主 API，避免依赖会话内部实现。 |
| `signal` | 可选的 `AbortSignal`。在长时间运行的工作中检查它，并把它转发给可取消的操作。 |

工厂宿主将会话工作目录暴露为 `pi.cwd`，并提供支持取消的进程助手 `pi.exec(command, args, options?)`：

```
async execute(_id, params, onUpdate, _ctx, signal) {
  onUpdate?.({
    content: [{ type: "text", text: `Checking ${params.path}…` }],
  });

  const result = await pi.exec("git", ["status", "--short", "--", params.path], {
    cwd: pi.cwd,
    signal,
  });

  if (result.code !== 0) {
    throw new Error(result.stderr || "git status failed");
  }

  return { content: [{ type: "text", text: result.stdout || "No changes" }] };
}
```

仅当 `pi.hasUI` 为 true 时，交互式 UI 方法才通过 `pi.ui` 可用。Print、RPC 以及其他无头模式不提供交互式 UI，因此每个面向这些模式的工具都必须有一条非交互路径。

## 结果与错误

返回一个 `AgentToolResult`：

```
return {
  content: [
    { type: "text", text: "Check complete." },
    { type: "image", mimeType: "image/png", data: pngBase64 },
  ],
  details: { checked: 12 },
  isError: false,
};
```

*   `content` 是必需的。它包含文本和/或 base64 图片块，是模型可以在下一步中使用的结果。
*   `details` 是可选的、用于 UI 渲染、日志与历史的结构化状态。它不会替代面向用户可读的 `content`。
*   `isError: true` 在保留结构化结果的同时，标记一个预期中的、不会抛错的失败。

对于会阻止操作产生有用结果的失败，请抛出 `Error`。omp 会把抛出或被拒绝的错误转换为面向模型的失败工具结果，并向用户展示该失败。当你的工具主动捕获了某个领域失败、并且本身能返回清晰、结构化的解释时，使用 `isError: true`。永远不要用看起来像成功的内容来掩盖失败。

将 `signal` 转发给 `pi.exec` 及其他可取消的 API。这样用户的停止操作就能取消子进程的工作，而不是任其继续运行。

## 会话生命周期

只有当工具拥有必须随会话变化而调整的资源或状态时，才添加 `onSession(event, ctx)`。它可以是同步的，也可以是异步的。

```
onSession(event) {
  if (event.reason === "shutdown") {
    // Close resources created by this factory.
  }
},
```

`event` 是一个可辨识联合。当前的原因有：

| 原因 | 触发时机 |
| --- | --- |
| `start`、`switch`、`branch`、`tree`、`shutdown` | 会话的创建、导航与拆除。这些事件携带 `previousSessionFile`；在 switch/branch 时会被填充，其他情况下可能为 undefined。 |
| `auto_compaction_start`、`auto_compaction_end` | 自动上下文压缩之前与之后。 |
| `auto_retry_start`、`auto_retry_end` | 自动重试处理之前与之后。 |
| `ttsr_triggered` | 运行时规则触发时。 |
| `todo_reminder` | 发出待办提醒时。 |

生命周期错误会以警告的形式记入日志，不会导致会话崩溃。让清理保持幂等；如果持久化状态必须在进程重启后依然存活，就把它放在内存闭包之外。

## 故障排查

### `/tools` 未列出该工具

1.  重启 omp；自定义工具目录会在会话启动时被扫描。
2.  确认项目会话是从包含 `.omp/tools` 的目录启动的。
3.  确认该模块是一个 `.ts` 或 `.js` 文件，并默认导出一个函数。
4.  检查工厂是否返回了包含 `name`、`description`、`parameters` 和 `execute` 的对象。
5.  在 `~/.omp/logs/` 下今天的日志中查找 `Custom tool load failed`。

### 模块加载了，但该工具缺失

它的 `name` 很可能与某个内置工具或更早加载的工具冲突。冲突会被拒绝；没有覆盖标志。请重命名该工具并重启 omp。

### 模型没有选择它

让工具的 `description` 准确说明它应在何时被使用，描述含义模糊的参数，并把宽泛的字符串收窄为枚举或受约束的 schema。测试期间，请在自然语言提示中显式说出工具名。只有当该工具必须在每次请求中都保持在顶层时，才使用 `loadMode: "essential"`；否则保留 discoverable 这一默认值。

### 交互时可用，但在 print 或 RPC 模式下失败

该实现很可能假定存在一个 TUI。请用 `pi.hasUI` 守护对 `pi.ui` 的调用并提供无头行为，或者返回一个清晰说明该操作需要交互式会话的错误。

## 相关

*   [MCP](./mcp.md) — 暴露由外部进程提供的工具。
*   [编写扩展](./extension-authoring.md) — 将工具与命令和事件行为打包成扩展。
*   [Hooks](./hooks.md) — 观察或修改现有的工具调用，而不是添加新能力。
*   [Plugins](./plugins.md) — 将工具与 omp 的其他自定义配置一起分发。
