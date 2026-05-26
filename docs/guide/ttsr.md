# TTSR（实时流修正）

## 工作原理

TTSR 规则是一个带有 frontmatter 的 Markdown 文件。omp 在字节到达时监视实时模型流，针对每个规则的 `condition` 正则进行匹配。第一次命中会中止生成，将规则正文作为系统提醒前置，并重试同一请求——在匹配点之后的中止续写不会消耗任何 token。

每个规则在每个会话中最多触发一次。注入的提醒在压缩后仍然保留。当某类错误 _仅在_ 模型流式输出过程中出现时——例如尝试使用被禁止的 API、生成你希望压缩的样板代码、错误命名项目特定的约定——请使用 TTSR。

对于作用域为工具调用的规则，你可以设置 `interruptMode: never` 将提醒折叠到匹配工具的 `toolResult` 中作为 `<system-reminder>` 载荷，而不是中止流。模型在下一轮看到修正——适用于你不想承担中止/重试开销的软提示场景。

## 规则的存放位置

- `.omp/rules/<rule>.md` — 项目作用域，随仓库检入
- `~/.omp/agent/rules/<rule>.md` — 用户作用域，全局生效

项目规则会遮蔽同文件名的用户规则。

## Frontmatter

| 字段 | 必填 | 用途 |
| --- | --- | --- |
| `description` | 是 | 在 `/extensions` 和触发卡片中显示的一行摘要。 |
| `condition` | 是 | 在流式传输时与模型原始输出匹配的正则。PCRE 风格。在 YAML 中需要转义反斜杠。 |
| `scope` | 否 | 逗号分隔的流接口列表，用于监视范围。默认为全部。 |

Scope 值：

- `text` — 助手散文
- `thinking` — 推理通道（可见时）
- `tool:<name>(<glob>)` — 特定工具的参数，可选按路径 glob 过滤——例如 `tool:edit(*.ts)`、`tool:write(*.rs)`、`tool:bash`

## 实际示例

一个来自 Rust 项目的真实规则：阻止模型使用 `Box::leak`，引导其使用 `Arc<str>`。

```
---
description: Refuse Box::leak in production code paths
condition: "Box::leak\\("
scope: "tool:edit(*.rs), tool:write(*.rs)"
---

You were about to write `Box::leak` to obtain a `&'static` reference. Stop.

`Box::leak` permanently allocates for the lifetime of the process &mdash; harmless
in a one-shot binary, a real leak inside a server that runs for days. In this
codebase use one of:

- `Arc<str>` for cheaply-cloneable owned strings
- `Cow<'static, str>` when the value is sometimes a literal, sometimes owned
- `OnceLock<String>` for actual program-lifetime singletons

Re-plan the edit with one of those, then proceed.
```

当模型在针对 `.rs` 文件的 `edit` 或 `write` 中输出 `Box::leak(` 时，流会在调用中途中止，规则正文被前置为系统提醒，模型带着新上下文从同一点重新运行。

## 编写条件

正则匹配原始字节，而非解析后的 token。锚定在能唯一标识失败模式并为模型留出足够回退空间的最小片段上。捕获 `Box::leak\(` 即可；仅捕获 `leak` 会在日志消息和无害提及上过度触发。

对于工具作用域的规则，正则针对 JSON 序列化的工具输入运行，因此你可以同时匹配文件路径和补丁正文：`"path"\s*:\s*"[^"]*\.rs".*Box::leak\(` 仅匹配 _路径_ 以 `.rs` 结尾且 _正文_ 包含该调用的编辑。

## 列出与禁用

`omp -p '/extensions'` 列出每个规则的作用域和来源路径。通过在 `config.yml` 的 `disabledExtensions` 中添加标识符来禁用单个规则：

```
disabledExtensions:
  - "ttsr:box-leak"
```

`ttsr_triggered` hook 事件在每次规则注入时触发，因此你可以从 [Hook](./hooks.md) 中记录或统计它们。

## 相关

- [Hooks](./hooks.md) — 在工具调用运行前拦截，而非等到模型开始输入。
- [上下文文件](./context-files.md) — 进入每个提示的永久引导，而非匹配触发的修正。
- [Skills](./skills.md) — 当轮次匹配描述时加载的按需操作手册。
