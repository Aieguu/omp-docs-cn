# Prompt 模板

## 创建你的第一个模板

提示词模板保存你反复使用的指令，并将其暴露为斜杠命令。可以用它来做统一的审查清单、发布摘要、测试计划，或任何其他不需要自定义程序逻辑的任务。

在你想要使用该命令的项目中创建 `.omp/prompts/review-change.md`：

```
---
description: Review one area of this project for correctness
---

Review the code related to $1.

Focus on: $@[2:].

Report concrete findings first, with file and line references. Then list any
remaining risks or missing tests. Do not change files.
```

在该项目中启动一个新的 omp 会话，然后输入：

```
/review-change authentication "error handling and tests"
```

文件名创建了 `/review-change` 命令。omp 会把 `$1` 展开为 `authentication`，把 `$@[2:]` 展开为 `error handling and tests`，并把生成的 Markdown 作为你的消息发送。`description` 会显示在 `/` 自动补全中该命令的旁边。

与项目共享的提示词放在 `.omp/prompts/`。若希望命令在每个项目中都可用，则把同样的 Markdown 文件保存到 `~/.omp/agent/prompts/` 下。

## 传递参数

参数跟在命令名之后。空格和制表符用于分隔参数；匹配的单引号或双引号会把文本连在一起，且引号字符会被移除。

```
/review-change payments "retry behavior" tests
```

| 语法 | 本例中的值 |
| --- | --- |
| `$1`、`$2`、… | `payments`、`retry behavior`、… |
| `$@` 或 `$ARGUMENTS` | `payments retry behavior tests` |
| `$@[2]` 或 `$@[2:]` | 从第二个起的所有参数：`retry behavior tests` |
| `$@[2:1]` | 从第二个起取一个参数：`retry behavior` |

索引从 1 开始。缺失的位置参数、超出范围的切片或非正数的切片索引都会展开为空字符串。

参数解析器没有反斜杠转义语法。如果参数包含空格，请改用另一种引号样式把它包起来，而不要试图转义外层引号。空的带引号参数会被丢弃。

如果模板没有任何参数占位符，omp 也不会丢弃你提供的文本。它会在提示词之后加一个空行，然后把拼接后的参数追加到末尾：

```
Summarize the requested part of this project.
```

调用 `/summarize src/auth` 时，会先发送模板，再发送 `src/auth`。

## 使用 Handlebars 插值

在替换完 `$…` 占位符后，omp 会把结果作为 Handlebars 模板渲染。最常用的取值有：

| 语法 | 含义 |
| --- | --- |
| <code v-pre>{{arg 1}}</code> | 解析出的第一个参数；`arg` 从 1 开始 |
| <code v-pre>{{arguments}}</code> 或 <code v-pre>{{ARGUMENTS}}</code> | 所有解析出的参数，以空格连接 |
| <code v-pre>{{args}}</code> | 解析出的参数数组，在块和辅助函数中很有用 |
| <code v-pre>{{default (arg 1) "current branch"}}</code> | 第一个参数缺失时的回退值 |
| <code v-pre>{{#if args}}…{{else}}…{{/if}}</code> | 根据是否提供了参数来决定的条件内容 |

例如：

```
---
description: Draft a test plan for a feature
---

Draft a test plan for {{default (arg 1) "the current change"}}.
{{#if args}}
Additional context: {{arguments}}
{{/if}}
```

Shell 风格的替换先进行，Handlebars 渲染后进行。包含 `$1`、`$@` 或 `$ARGUMENTS` 的参数值不会被递归替换。使用任一种行内参数占位符样式的模板，也不会再接收自动追加的参数后缀。

对于普通的可复用提示词，优先使用 `$1` 和 `$@` 形式：它们更简短，也让调用更容易理解。只有当你需要默认值或条件区块时，才使用 Handlebars。

## 添加描述

在 omp 提示词模板的 YAML frontmatter 中，只有 `description` 具有特殊含义：

```
---
description: Explain a failing test and propose the smallest fix
---
```

把 frontmatter 放在文件开头。如果没有 `description`，omp 在自动补全中会使用正文的第一条非空行（截断到 60 个字符）。命令名始终来自 Markdown 文件名；frontmatter 中的 `name` 字段不会重命名它。

## 发现与命名

在会话启动时，omp 会递归发现以下位置的 Markdown 文件：

| 范围 | 目录 | 自动补全来源标签 |
| --- | --- | --- |
| 用户 | `~/.omp/agent/prompts/**/*.md` | `(user)` 或 `(user:subdirectory)` |
| 项目 | `<working-directory>/.omp/prompts/**/*.md` | `(project)` 或 `(project:subdirectory)` |

只有最终的文件名会成为命令名。`.omp/prompts/frontend/review.md` 和 `.omp/prompts/backend/review.md` 都会定义 `/review`，而不是带命名空间的命令。即使你按子目录组织文件，也要给每个模板一个独一无二的文件名。

提示词模板是 Markdown 提示词，不是可执行的命令模块。如果某个命令需要运行自定义的程序逻辑或显示自己的 UI，请改用[扩展](./extension-authoring.md)来实现。

## 优先级

omp 先加载用户模板，再加载项目模板，并采用第一个匹配的名字。因此，`~/.omp/agent/prompts/review.md` 会胜过 `.omp/prompts/review.md`。这与许多「项目覆盖用户」的配置系统不同，所以使用独一无二的名字是最稳妥的选择。

其他类型的斜杠命令会在提示词模板之前解析。同名的内置命令、扩展命令、自定义命令、技能命令或基于文件的斜杠命令会胜出；冲突的提示词模板会从自动补全中被省略。

## 编辑后重新加载

提示词模板在会话开始时才会被读取。omp 不会监听这些文件，`/reload-plugins` 也不会重新加载它们。创建、重命名或编辑模板之后，请退出，并在目标工作目录中启动一个新的 `omp` 会话。

## 故障排查

### 命令没有出现在自动补全中

*   确认文件以 `.md` 结尾，并且位于当前工作目录的 `.omp/prompts/` 中，或你的用户级 `~/.omp/agent/prompts/` 中。
*   修改文件后启动一个新的会话。
*   检查是否存在另一个同名的模板。用户模板胜过项目模板。
*   尝试一个更有辨识度的文件名，以防某个内置、技能、扩展、自定义或基于文件的命令已经占用了该名字。
*   检查会话日志中是否有提示词模板相关的警告。无效的 YAML frontmatter 或无法读取的文件都可能阻止该模板加载。

### 参数意外展开

*   对包含空格的参数加引号：`/review-change auth "error handling"`。
*   不要依赖带引号参数内的反斜杠转义；它们会被按字面处理，而不是作为转义机制。
*   请记住，`$@` 包含所有参数，包括 `$1`。只想取剩余参数时，请使用 `$@[2:]`。
*   如果需要控制参数出现的位置，请添加显式占位符。没有占位符时，omp 会把它们追加在模板正文之后。

### 项目模板没有覆盖我的用户模板

这是当前的优先级规则：用户模板先加载。重命名其中一个文件，或删除用户级的重复模板，然后启动一个新的会话。
