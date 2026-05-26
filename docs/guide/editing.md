# 结构化编辑

行锚定的 [edit](./files.md) 补丁精确但对重新格式化脆弱。结构化编辑在 AST 层面操作：同一模式匹配 `foo( x )`、`foo(x)` 和 `foo(/* comment */ x)`。如需接触每个导入者的符号感知重命名（TypeScript 风格，语言服务器支持），请使用 [lsp rename](./code-intelligence.md)——它以 ast-grep 不具备的方式理解作用域和重导出。

## ast_edit

`ast_edit` 使用 [ast-grep](https://ast-grep.github.io/) 进行结构化代码重写。每个操作为 `{ pat, out }`：`pat` 匹配 AST 形状，`out` 是替换模板。模式匹配结构而非文本——空白和注释被忽略。

| 元变量 | 匹配内容 |
| --- | --- |
| `$A` | 一个 AST 节点，捕获为 `$A` 供模板使用。 |
| `$_` | 一个 AST 节点，不捕获。 |
| `$$$ARGS` | 零个或多个节点，捕获为 `$ARGS`。 |
| `$$$` | 零个或多个节点，不捕获。 |

重用同一元变量强制一致性：`$A == $A` 匹配 `x == x` 但不匹配 `x == y`。语言从 `paths` 中的文件扩展名推断；将每次调用限定为一种语言以获得确定性重写。

```
# 将 legacyFn 的每个调用点重命名为 newFn，保留参数
ast_edit ops=[{ pat: "legacyFn($$$ARGS)", out: "newFn($$$ARGS)" }] \
         paths=["src/**/*.ts"]

# 删除所有 console.log，无论参数形状如何
ast_edit ops=[{ pat: "console.log($$$)", out: "" }] paths=["src/"]

# 将 CommonJS require 重写为 const 绑定
ast_edit ops=[{ pat: "$F = require($M)", out: "const $F = require($M)" }] \
         paths=["src/"]

# 现代化为可选链；$A 强制一致性
ast_edit ops=[{ pat: "$A && $A()", out: "$A?.()" }] paths=["src/"]
```

每次 `ast_edit` 运行都暂存为预览。TUI 显示 diff 和替换计数；在模型调用 `resolve` 传入 `{ action: "apply" }` 之前不会写入磁盘（见下文）。通过 `astEdit.enabled` 控制该工具的开关；启用后，它会随 [edit](./files.md) 自动启用。

对于一次性本地文本编辑，请使用 `edit`。如需只读结构化搜索，请使用 `ast_grep`：相同的模式语法，无重写，返回带锚点前缀的匹配行，内联元变量捕获。

## conflict://

当文件包含 git 合并标记时，`read` 会将每个 `<<<<<<<` / `=======` / `>>>>>>>` 块注册为虚拟 `conflict://N` URL。agent 选择一方并写回；拼接在原处完成。

| URL | 效果 |
| --- | --- |
| `conflict://N` | 文件中第 N 个冲突块。写入内容即可拼接。 |
| `conflict://*` | 批量形式；用相同内容或简写解析所有块。 |
| `read path:conflicts` | `path` 中每个未解决冲突的单行索引。 |

简写 `@ours`、`@theirs` 和 `@base` 代表合并的三方。当一方整体正确时，一行 `@theirs` 即为完整编辑。

```
# 1. 查看未解决的内容
read src/session.ts:conflicts

# 2. 为一个块选择一方
write path="conflict://1" content="@theirs"

# 3. 或用相同方式解析文件中的所有块
write path="conflict://*" content="@ours"

# 4. 混合：读取块，写入手工合并的拼接
read conflict://2
write path="conflict://2" content="const merged = { ...base, ...theirs, ...ours };
:"
```

无需合并 UI，无需专用工具。相同的 [`read` 和 `write`](./files.md) 配对处理整个流程。

## resolve

`resolve` 定型一个待处理操作。暂存变更的工具（`ast_edit`、Extension 提供的预览、计划审批）会排队一个回调，必须在写入前应用或丢弃。契约为 `{ action: "apply" | "discard", reason }`；生产者的回调运行后其结果即为工具响应。

```
# 1. 暂存 AST 重写（返回(提议)预览卡片）
ast_edit ops=[{ pat: "console.log($X)", out: "" }] paths=["src/auth.ts"]
# → 3 replacements in 1 file (proposed)

# 2. 接受预览
resolve action="apply" reason="redundant logging in auth path"
# → Applied 3 replacements in src/auth.ts

# 3. 或拒绝
resolve action="discard" reason="keep logs until after the release"
```

在没有待处理操作时调用 `resolve` 会报错，因此 agent 不会意外接受前一轮中的过时预览。丢弃是单次调用且原子的；不存在部分应用。

## 何时使用哪种

**`ast_edit`**

跨多个文件重写语法形状：重命名调用、交换 API、删除匹配语句。忽略格式。

**[lsp rename](./code-intelligence.md)**

跨所有导入者的符号感知重命名，尊重作用域和重导出。当 ast-grep 的文本形状匹配可能捕获来自另一模块的同名符号时，这是正确的选择。

**`conflict://`**

合并解析。读取以枚举，写入以拼接，重复直到文件中没有标记。

**`resolve`**

接受或拒绝任何暂存的预览。`ast_edit`、计划审批和自定义工具预览共用同一契约。

**[edit](./files.md)**

针对你刚读取的特定片段的行锚定补丁。当变更局部且周围文本稳定时使用。
