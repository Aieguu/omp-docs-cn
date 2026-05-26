# Prompt 模板

## 两种形式

Prompt 模板就是一个斜杠命令。去掉扩展名的文件名即为命令名。最简单的版本是带有提示正文的 Markdown 文件；对于需要参数解析、自定义 UI 或后台工作的场景，请改用 TypeScript 模块。

## 存放位置

```
~/.omp/agent/commands/<name>.md           # 全局，markdown
~/.omp/agent/commands/<name>/index.ts     # 全局，typescript
.omp/commands/<name>.md                   # 项目，markdown
.omp/commands/<name>/index.ts             # 项目，typescript

# 同样被发现：
~/.claude/commands/  .claude/commands/
~/.codex/commands/   .codex/commands/
```

项目级命令会遮蔽同名的全局命令。运行 `omp -p '/extensions'` 可查看加载了什么。

## Markdown 模板

一个 Markdown 命令由 YAML frontmatter 加上提示正文组成。当命令被调用时，正文成为用户消息。位置参数为 `$1`、`$2`……；连接后的剩余部分为 `$@` 或 `$ARGUMENTS`。

```
---
description: Review a PR with a structured checklist
---

Review pull request #$1.

Focus areas (from `$@`):

1. Correctness — logic errors, off-by-ones, wrong return paths.
2. Security — injection, authn/authz, secret handling.
3. Performance — N+1, allocations on hot paths, blocking I/O.
4. Tests — new code paths covered, no flakiness or hidden mocks.

Use `gh pr view $1 --json title,body,files` to start, then
`gh pr diff $1` for the patch. Surface findings inline with file:line.
```

通过 `/review-pr 482 --focus security` 调用。`$1` 解析为 `482`，`$@` 解析为 `--focus security`。

### Frontmatter

| 字段 | 作用 |
| --- | --- |
| `description` | 在 `/` 自动补全中显示的一行摘要。 |
| `argument-hint` | 在选择器中命令名后显示的占位文本。 |
| `model` | 覆盖该命令启动的那一轮所使用的模型角色。 |
| `allowed-tools` | 限制该命令轮次可用的工具集。 |

## TypeScript 模块

当你需要解析参数、提示用户、运行 shell 命令或渲染自定义 UI 时，请改用 TS 模块。默认导出一个工厂函数，接收扩展 API 并注册命令。

```
// ~/.omp/agent/commands/changelog/index.ts
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("changelog", {
    description: "Summarise recent commits into CHANGELOG bullets",
    argumentHint: "<rev-range>",
    handler: async (args, ctx) => {
      const range = args.trim() || "HEAD~10..HEAD";
      const log = await pi.exec("git", ["log", "--oneline", range], {
        cwd: pi.cwd,
      });
      if (log.code !== 0) {
        ctx.ui.notify("git log failed: " + log.stderr, "error");
        return;
      }
      await pi.sendUserMessage(
        `Summarise these commits as CHANGELOG bullets, grouped by Added / Changed / Fixed:\n\n${log.stdout}`,
        { deliverAs: "nextTurn" },
      );
      ctx.ui.notify(`Queued changelog for ${range}`, "info");
    },
  });
}
```

工厂函数可以注册多个命令，以及自定义 UI、消息渲染器和键盘快捷键。相关的生命周期 API 请参见 [Hooks](./hooks.md)；需要按需加载的操作手册而非固定提示时，请参见 [Skills](./skills.md)。

## 调用

所有模板都会出现在交互模式的 `/` 自动补全选择器中。在 CLI 中，将斜杠命令作为提示传入：`omp -p '/review-pr 482'`。选择器、历史记录和内置命令参考请参见 [斜杠命令](./slash-commands.md)。
