# TTSR 规则

**Time-Traveling Stream Rule（TTSR，时间旅行流规则）** 是用于拦截 agent 实时输出中可识别错误的一种护栏：例如编辑中出现的禁用 API、不安全的 shell 片段，或正文里反复出现的主张。当规则命中时，omp 可以打断该响应，显示是哪条规则触发的，提供该规则的 Markdown 说明，并在修正内容可见的情况下重新开始生成。

请对满足以下条件的指导使用 TTSR：

*   只有当某个特定模式出现时才重要；
*   足够具体，能够被可靠地检测到；并且
*   在提议的工具调用执行**之前**最有帮助。

当指令很窄或很少相关时，这比[常驻上下文](./context-files.md)更好。常驻上下文更适合 agent 在每项任务中都必须考虑的约定，因为 TTSR 是反应式的：只有在其条件出现之后才能起作用。

## 创建最小的可用规则

从项目根目录创建 `.omp/rules/no-box-leak.md`：

```
---
description: Prevent permanent Box::leak allocations in Rust edits
condition: 'Box::leak\('
scope:
  - 'tool:edit(*.rs)'
  - 'tool:write(*.rs)'
---

Do not introduce `Box::leak` in production Rust code. Keep ownership explicit;
prefer `Arc<str>`, `Cow<'static, str>`, or a true process-lifetime singleton,
then continue with the option that fits this code.
```

文件名即规则名：`no-box-leak`。frontmatter 说明 _何时、何地_ 作出反应；Markdown 正文说明 _为什么以及该怎么办_。正文应保持简短且可操作——模型只有在规则触发时才会收到它。

把规则保存在以下原生位置之一：

| 位置 | 用途 |
| --- | --- |
| `<project>/.omp/rules/<name>.md` 或 `.mdc` | 项目规则；通常随仓库一起提交。 |
| `~/.omp/agent/rules/<name>.md` 或 `.mdc` | 适用于每个项目的个人规则。该目录跟随当前生效的档案(profile)与 `PI_CODING_AGENT_DIR`。 |

项目规则与用户规则会在会话启动时被发现。新增或修改文件之后，请启动一个新的会话。

## 测试、检查并启用它

在依赖自动发现之前，先单独测试规则文件：

```
omp ttsr test \
  --rule .omp/rules/no-box-leak.md \
  --source tool --tool edit --path src/lib.rs \
  'let value = Box::leak(Box::new(input));'
```

报告应把 `no-box-leak` 列入已触发的规则。source、tool 与候选路径都很重要：它们再现了 `scope` 与 `globs` 所使用的上下文。其他有用的检查有：

```
# Show every active TTSR rule, its conditions, scope, and source file.
omp ttsr list

# Explain both matching and non-matching rules for a sample.
omp ttsr test --verbose --source tool --tool edit --path src/lib.rs \
  'let value = Box::leak(Box::new(input));'

# Look for existing files that would match the rule.
omp ttsr scan --rule .omp/rules/no-box-leak.md src/
```

`omp ttsr test src/lib.rs` 也同样有效：可识别的源文件扩展名会隐含 tool/edit 上下文。在排查路径或 scope 不匹配时，请使用显式标志。`--json` 可供脚本使用，而 `--file -` 会从标准输入读取样本。

TTSR 默认启用。若要显式启用并检查生效值：

```
omp config set ttsr.enabled true
omp config get ttsr.enabled
```

`omp config set` 会写入当前生效档案(profile)的全局 `~/.omp/agent/config.yml`。如需仅限项目的覆盖，请改为编辑 `<project>/.omp/config.yml`。在 omp 内部，`/extensions` 是查看已发现规则及其源路径的另一种方式。

## 触发时的表现

在默认的 `interruptMode: always` 下，命中的响应会立即停止。TUI 会显示 **Injecting rule: no-box-leak** 通知；默认情况下，部分生成的尝试会被丢弃，agent 会使用规则正文生成一个替代响应。匹配的 edit 或 write 会在那段不完整的调用执行之前被阻止。

这是中断与重试，而不是文本替换：规则应当解释安全的替代方案，而不是试图自己改写代码。把触发点放得窄一些，能让重试尽早发生且代价更低。

如需针对某个工具的轻柔提示，可把规则的 `interruptMode` 设为 `never`。omp 会让匹配的工具执行完毕，并把提醒放在该工具的结果旁边，供 agent 下一步使用。对于正文，`never` 会让响应生成完毕，并在其后附上更正。只有当允许匹配到的动作完整执行是安全的时，才使用该设置。

## 匹配与作用范围

`condition` 是一个 JavaScript 正则表达式。它会对每个被监视输出层面上累积的内容求值，因此可以跨越流式传输的片段进行匹配。对于 `edit` 和 `write`，omp 匹配的是正在引入的源码内容，而不是序列化后的命令语法。其他工具则针对其流式参数进行匹配。

优先使用最小而有区分度的模式：

```
condition: 'Box::leak\('
```

避免像 `leak` 这样宽泛的模式，它会连带命中讨论、日志以及无关的标识符。YAML 的单引号让正则表达式的反斜杠最容易阅读。支持开头的 `(?i)`、`(?m)` 与 `(?s)` 标志；其余情况请使用 JavaScript 正则表达式语法。

规则可以为 `condition` 提供一个字符串或一个列表。多个正则条件互为备选：任一命中即可触发。`astCondition` 以 ast-grep 模式提供同样的“或”行为。如果两种条件同时存在，那么在通过 scope 与路径门槛之后，任何一种都可以触发。

未提供 `scope` 时，规则监视 assistant 的正文与每个工具的参数，但不监视 thinking。显式给出 `scope` 会取代这一默认行为。支持的标记有：

| Scope 标记 | 监视对象 |
| --- | --- |
| `text` | assistant 正文。 |
| `thinking` | 当 provider 暴露思考流时，模型的思考流。 |
| `tool` 或 `toolcall` | 每个工具。 |
| `tool:<name>` | 单个工具，例如 `tool:bash`。像 `bash` 这样的裸工具名同样会被接受。 |
| `tool:<name>(<glob>)` | 仅当候选路径匹配时的单个工具，例如 `tool:edit(src/**/*.ts)`。 |

逗号分隔的字符串与 YAML 列表均被接受。组合多个 scope 时建议使用 YAML 列表。路径 glob 匹配的是规范化路径与文件名（basename）。顶层 `globs` 字段是作用于所有 scope 之上的附加路径门槛；至少得有一个候选路径与它匹配。

当格式化或标识符命名使正则变得过于脆弱时，AST 匹配很有用：

```
---
description: Reject TypeScript any assertions
astCondition:
  - '$VALUE as any'
scope:
  - 'tool:edit(*.ts)'
  - 'tool:write(*.ts)'
---

Preserve the real type. Narrow or model it instead of asserting `any`.
```

`astCondition` 只作用于带有可识别文件扩展名的源码型 edit/write 内容。它检查的是该次调用所引入的内容，而不是文件中其他未改变的代码。请用 `--source tool` 与 `--path` 测试它。

## 重复触发、冷却与优先级

默认情况下，每条规则在每个会话中只触发一次。该已触发状态会随会话保存，因此恢复会话不会意外地重新武装它。如需在冷却期之后允许再次注入，可配置全局重复策略：

```
omp config set ttsr.repeatMode after-gap
omp config set ttsr.repeatGap 10
```

这个间隔统计的是已完成的轮次，而不是秒数或流式片段。所有 TTSR 规则都使用这一全局重复策略。

优先级是可预期的：

1.  在 `ttsr.disabledRules` 中点名的规则会被移除。
2.  项目的原生规则优先于同名的（由文件名衍生）用户原生规则；更一般地说，某个名称下最先被发现的那条规则胜出。
3.  带有 `condition` 或 `astCondition` 的有效规则就是 TTSR 规则，即使它同时写了 `alwaysApply: true`；它也不会再被当作常驻上下文注入。
4.  规则的 `interruptMode` 会覆盖全局的 `ttsr.interruptMode`。
5.  如果多条符合条件的规则命中同一输出，omp 可以注入所有不同的命中。只要有任何一条命中的规则要求中断，该响应就会被中断。

使用唯一而有描述性的文件名，以避免意外遮蔽。用 `omp ttsr list` 确认生效的来源。

## 完整的规则 frontmatter

除 TTSR 规则至少需要一个可用的 `condition` 或 `astCondition` 之外，所有字段都是可选的。标记为“list”的字符串字段同样接受单个字符串。

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `description` | string | 规则检查时展示给用户的可读摘要。建议提供。 |
| `condition` | string 或 string list | JavaScript 正则表达式的备选。旧的 `ttsr_trigger` 拼写也会被接受，但新规则请使用 `condition`。 |
| `astCondition` | string 或 string list | 针对 edit/write 源码内容的 ast-grep 模式备选。 |
| `scope` | string 或 string list | 输出层面以及可选的工具/路径过滤。省略时等于 `text` 加上全部工具，不含 thinking。 |
| `globs` | string 或 string list | 附加的候选路径门槛。它不会取代 `scope`。 |
| `interruptMode` | `always`、`prose-only`、`tool-only` 或 `never` | 针对单个规则的覆盖项，决定哪些命中的层面会立即中止。 |
| `alwaysApply` | boolean | 通用规则元数据。有效的 TTSR 条件优先，因此把两者结合并不会让正文变成常驻。 |
| 为兼容起见，形如文件 glob 的 `condition` 值（例如 `*.rs`）会被视为简写：表示在该 glob 上监视 `edit` 和 `write`，并配以一个一网打尽的条件。建议改用显式的正则外加 `scope`；它能让触发意图与测试上下文更清晰。 |  |  |

frontmatter 之后的 Markdown 就是要注入的指令。规则名与源路径来自发现过程；不要把它们写进 frontmatter。

完整的全局 TTSR 配置如下：

```
ttsr:
  enabled: true
  contextMode: discard       # discard | keep
  interruptMode: always      # always | prose-only | tool-only | never
  repeatMode: once           # once | after-gap
  repeatGap: 10              # completed turns
  builtinRules: true
  disabledRules: []          # filename-derived rule names
```

`contextMode: keep` 会在重试前保留部分响应；`discard` 会移除它，对大多数护栏而言更安全。`builtinRules: false` 只会禁用 omp 自带的 TTSR 规则，不会禁用你的文件。不删除文件即可禁用某一条规则：

```
omp config set ttsr.disabledRules '["no-box-leak"]'
```

修改 TTSR 配置后请启动新会话，以确保发现结果与会话状态清晰无误。

## 安全与性能

*   把针对危险动作的规则限定到相关的工具与文件类型。监视全部正文与所有工具会增加误报与匹配开销。
*   在不安全片段完成之前中断。TTSR 命中无法撤销已经完成的工具调用。
*   保持正则线性且具体。避免像 `(.*)+` 这样嵌套、含混的重复，随着输出增长它会变得昂贵。
*   结构性代码规则优先使用 `astCondition`，但要按工具与扩展名加以约束；结构化匹配比简单正则成本更高。
*   不要把机密写进规则正文。规则触发时正文会被发送给所选模型，并可能保留在会话中。
*   启用大范围的仓库规则之前先运行 `omp ttsr scan`。要审查匹配项，而不是把所有文本出现处都当作违规。
*   只有允许匹配到的工具动作实际执行时，才使用 `interruptMode: never`。

## 故障排查

### `omp ttsr list` 没有显示该规则

*   确认文件是 `.omp/rules/` 或当前档案(profile)的 `rules/` 目录中的 `.md` 或 `.mdc` 文件。
*   确保 frontmatter 从第一行开始、有收尾的 `---`，并包含非空的 `condition` 或 `astCondition`。
*   检查 `omp config get ttsr.enabled`、`omp config get ttsr.disabledRules` 与 `omp config get ttsr.builtinRules`。
*   查找是否存在另一个同名的（由文件名衍生）已发现规则。
*   编辑文件后启动一个新的会话。

### 隔离测试没有触发

带上 `--verbose` 运行，并精确再现实时上下文：

```
omp ttsr test --verbose --rule .omp/rules/no-box-leak.md \
  --source tool --tool edit --path src/lib.rs 'Box::leak('
```

检查正则转义、工具名、`scope`、顶层 `globs` 与路径扩展名。没有 `--source tool` 和文件扩展名的 AST 规则无法推断语言。无效的正则与 AST 模式会被忽略，而不是中止会话启动。

### 测试触发了，但实时会话没有

会话可能加载了之前的文件；规则可能已经在 `repeatMode: once` 下触发过；或者实时动作使用不同的工具/路径层面。启动一个全新的会话，用 `omp ttsr list` 检查，并使用相同的 `--source`、`--tool` 与 `--path` 测试。

### 规则触发过于频繁

收窄 `condition`、添加工具/路径 `scope`，或添加 `globs`。修改期间可把 `ttsr.disabledRules` 当作即时开关使用。不要通过让正文变得含糊来解决误报——触发条件应当用于识别违规。

### 部分响应仍然可见

检查 `omp config get ttsr.contextMode`。把它重新设为 `discard`，以获得干净的重试。同时检查该层面上的规则或全局 `interruptMode` 是否为 `never`；不中断的命中会有意让当前响应或工具执行完成。

## 相关文档

*   [上下文文件](./context-files.md) — 应放进每条提示词的指导。
*   [Hook](./hooks.md) — 在工具执行前后进行确定性拦截。
*   [技能](./skills.md) — 针对任务按需选择的操作手册。
