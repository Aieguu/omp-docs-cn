# Hooks

## Hook 的存放位置

```
~/.omp/agent/hooks/pre/*.ts      # 全局 pre-hook
~/.omp/agent/hooks/post/*.ts     # 全局 post-hook
.omp/hooks/pre/*.ts              # 项目 pre-hook
.omp/hooks/post/*.ts             # 项目 post-hook
```

发现是非递归的：更深层目录中的文件会被忽略。在 CLI 中，`--hook <path>` 可加载指定文件（它是 `--extension` 的别名）。

## 可挂接的事件

| 接口 | 事件 | 返回契约 |
| --- | --- | --- |
| 工具调用拦截 | `tool_call` | 返回 `{ block: true, reason }` 以拒绝调用。`reason` 会成为模型看到的错误。第一次拦截生效。 |
| 工具结果改写 | `tool_result` | 返回 `{ content?, details?, isError? }` 以修改模型接收到的内容。处理器链式执行。 |
| 单次调用消息脱敏 | `context` | 返回 `{ messages }` 以替换本次调用发送给模型的消息数组。处理器链式执行。 |
| 压缩拦截 | `session_before_compact` | 返回 `{ cancel: true }` 以否决压缩。`session_before_branch`、`session_before_switch`、`session_before_tree` 使用相同结构。 |
| 会话生命周期 | `session_start`、`session_shutdown`、`turn_start`、`turn_end`、`message_*`、`tool_execution_*` | 仅观察。返回值被忽略。 |

完整的事件列表请参见 `HookAPI` 类型。`HookAPI` 是窄化的事件处理器接口；`ExtensionAPI` 是超集，还可以注册命令、工具和渲染器——当你需要的不只是 `on` 时，请使用它。

## 在 bash 中阻止 rm -rf

一个 pre-tool hook，在 `bash` 执行之前拒绝几种灾难性命令。处理器返回 `{ block: true, reason }`，Agent 将 `reason` 作为工具错误呈现。

```
// ~/.omp/agent/hooks/pre/guard-rm.ts
import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";

const DANGER =
  /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s+(\/|~|\$HOME)(\s|$)/;

export default function (pi: HookAPI) {
  pi.on("tool_call", (event) => {
    if (event.toolName !== "bash") return;
    const cmd = String(event.input.command ?? "");
    if (DANGER.test(cmd)) {
      return { block: true, reason: `Refused: ${cmd.slice(0, 80)}` };
    }
  });
}
```

> 第一个 `block` 生效——多个 pre-hook 之间的排序由文件系统决定，但请将正则视为最后一道防线，而非唯一防线。

## 在工具输出中脱敏密钥

一个 post-tool hook，在模型看到之前改写 `read` 的结果以清除 API 密钥。

```
// ~/.omp/agent/hooks/post/redact-keys.ts
import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";

export default function (pi: HookAPI) {
  pi.on("tool_result", (event) => {
    if (event.toolName !== "read" || event.isError) return;
    const content = event.content.map((c) =>
      c.type === "text"
        ? { ...c, text: c.text.replaceAll(/API_KEY=\S+/g, "API_KEY=[REDACTED]") }
        : c,
    );
    return { content };
  });
}
```

## 调试 Hook

运行 `omp -p '/extensions'` 可确认 Hook 是否已加载以及加载路径。如果未出现，说明文件不在已发现的目录中——将其移到 `~/.omp/agent/hooks/pre/` 或 `.omp/hooks/pre/` 下，或通过 `--hook /path/to/file.ts` 显式加载。相邻的自定义入口请参见 [Prompt 模板](./prompt-templates.md) 和 [Skills](./skills.md)；需要每轮注入静态规则而非主动拦截时，请参见 [上下文文件](./context-files.md)。
