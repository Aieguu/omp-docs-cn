# 自定义工具

## 何时编写自定义工具

当模型需要执行特定于你项目的操作时——查询内部 API、运行领域检查、修改远程系统——请使用自定义工具。如果你只是想暴露一个现成的集成，请改用 [MCP 服务器](./mcp.md)。

## 存放位置

将 TypeScript 模块放在以下位置之一：

- `~/.omp/agent/tools/<name>/index.ts` — 用户作用域
- `.omp/tools/<name>/index.ts` — 项目作用域

`.claude/tools/` 和 `.codex/tools/` 同样会被发现。目录名即为注册的工具名。同目录下的纯 `.md` 和 `.json` 文件被视为元数据，而非模块。

## 骨架

默认导出一个工厂函数。`params` 的类型由 TypeBox schema 静态推导。

```
import { Type } from "@sinclair/typebox";
import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent";

const factory: CustomToolFactory = (pi) => ({
  name: "repo_stats",
  label: "Repo Stats",
  description: "Count tracked files matching a glob",
  parameters: Type.Object({
    glob: Type.Optional(Type.String({ default: "**/*.ts" })),
  }),
  async execute(_toolCallId, params, onUpdate, _ctx, signal) {
    onUpdate({ status: `Listing ${params.glob ?? "**/*.ts"}` });
    const result = await pi.exec(
      "git",
      ["ls-files", params.glob ?? "**/*.ts"],
      { signal, cwd: pi.cwd },
    );
    if (result.code !== 0) {
      throw new Error(result.stderr || "git ls-files failed");
    }
    const files = result.stdout.split("\n").filter(Boolean);
    return {
      content: [{ type: "text", text: `Found ${files.length} files` }],
      details: { count: files.length, sample: files.slice(0, 10) },
    };
  },
});

export default factory;
```

## 工厂字段

| 字段 | 用途 |
| --- | --- |
| `name` | 模型调用的工具名。不能与内置工具或其他自定义工具冲突。 |
| `label` | TUI 中显示的人类可读标签。 |
| `description` | 模型在决定是否调用时看到的内容。触发条件要具体。 |
| `parameters` | TypeBox schema。驱动 JSON Schema 验证和 `params` 的类型推导。 |
| `execute` | `(toolCallId, params, onUpdate, ctx, signal) => Promise<ToolResult>`。将 `signal` 传递给子进程以实现取消传播。 |
| `renderCall` / `renderResult` | 可选。调用卡片和结果的自定义 React 渲染器。 |

## 流式输出

在 `execute` 内部调用 `onUpdate(partial)` 以在最终返回前向 TUI 推送进度。模型只能看到最终的 `content`；`onUpdate` 面向用户。

## 返回结构

返回 `ToolResult`。`content` 是模型读取的内容；`details` 不会进入提示。

```
return {
  content: [
    { type: "text", text: "Done." },
    { type: "image", mimeType: "image/png", data: pngBase64 },
    { type: "file", path: "/abs/path/to/report.pdf", mimeType: "application/pdf" },
  ],
  details: { /* arbitrary JSON, surfaced to the user, not the model */ },
  isError: false,
};
```

`text` 块成为内联上下文。`image` 块会传递给具备视觉能力的模型。`file` 块引用用户可从 TUI 打开的本地路径。

## 加载与冲突

名称冲突在加载时会被拒绝——无论是与内置工具还是与其他已加载的自定义工具冲突。没有覆盖标志。内置工具始终优先。运行 `omp -p '/extensions'` 可查看哪些已加载、哪些被拒绝。

## 相关

- [MCP](./mcp.md) — 暴露由外部进程提供的工具。
- [Hooks](./hooks.md) — 拦截工具调用和结果，而非添加新工具。
- [Plugins](./plugins.md) — 将自定义工具与 Skills、命令和 MCP 配置打包。
