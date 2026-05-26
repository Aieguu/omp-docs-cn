# 代码智能

## 通过语言服务器重命名

正则重命名会遗漏重导出、局部变量遮蔽和字符串键访问。`lsp action=rename` 向服务器请求 `WorkspaceEdit`，并在所有涉及文件中原子性地应用。如果服务器拒绝（符号不可重命名，或某个编辑会产生冲突），则不会写入任何内容。`rename_file` 也是如此，它会在移动文件的同时重写导入语句。

对于不涉及符号的其他结构化重写——基于语法模式的代码迁移、大规模机械重构——请参阅[结构化编辑](./editing.md)。

## 操作

| 操作 | 返回内容 | 适用场景 |
| --- | --- | --- |
| **导航** |
| `definition` | 定义光标处符号的位置。 | 在阅读调用者之前确认"这来自哪里？"。 |
| `type_definition` | 符号类型声明的位置。 | 值是一个实例；你想查看类/接口。 |
| `implementation` | 接口或抽象方法的具体实现。 | 追踪 trait/接口到其实现。 |
| `references` | 项目中该符号的所有调用点。 | 在变更前评估影响范围。 |
| `hover` | 符号的类型签名和文档注释。 | 推断类型、泛型实例化、文档字符串。 |
| `symbols` | 文档大纲（使用 `file`）或工作区搜索（使用 `file="*"` + `query`）。 | 在不知道文件名的情况下按名称查找符号。 |
| **诊断与修复** |
| `diagnostics` | 文件的错误、警告和提示（或使用 `file="*"` 查看工作区）。 | 编辑后检查文件；对工作区进行完整性检查。 |
| `code_actions` | 服务器为某范围提供的修复/重构建议；可用 `only` 过滤（如 `quickfix`）。 | "添加缺失导入"、"实现 trait"、整理导入。 |
| **重构** |
| `rename` | 原子性 `WorkspaceEdit`，在所有引用处重命名符号。 | 任何跨文件符号重命名。 |
| `rename_file` | 移动/重命名文件并重写导入以匹配。 | 调整模块布局而不破坏调用者。 |
| **服务器管理** |
| `status` | 哪些服务器正在运行、空闲或未在 PATH 中找到。 | 诊断结果为空——服务器是否已启动？ |
| `capabilities` | 活跃服务器实际支持的功能。 | 在请求可能未实现的功能（如调用层次结构）之前。 |
| `reload` | 重启某个文件的服务器，或使用 `file="*"` 重启所有服务器。 | 安装缺失的工具链后，或清除过时状态。 |
| `request` | 使用 `method` + `params` 发送原始 LSP 请求。 | 包装器未直接暴露的 LSP 功能。 |

## 指向符号

大多数操作接受 `file` + `line`，并需要列号来解析符号。传入 `symbol` 代替手动计数字符：工具会在该行上查找符号并使用其偏移量。当同一行上同名出现多次时，附加 `#N` 表示第 N 次出现（从 1 开始计数）。

```
lsp action=references file=src/server/auth.ts line=42 symbol="issueToken"
lsp action=definition  file=src/parse.ts      line=88 symbol="parse#2"
```

## 服务器

omp 从默认配置表自动检测服务器（tsserver、rust-analyzer、pyright、gopls、clangd 等），并按需启动。可在 `~/.omp/agent/config.yml` 的 `lsp` 下按项目覆盖。整个工具由 `lsp.enabled` 控制；使用 `--no-lsp` 可在单个会话中禁用。配置选项详见[设置](./settings.md)。

## 实战示例：跨代码库重命名

函数 `issueToken` 位于 `src/auth/jwt.ts`，被若干处理器和测试调用。要将其重命名为 `mintToken` 而不遗漏任何调用点或破坏重导出：

```
# 1. 确认变更范围（服务器计算，尚未编辑）。
lsp action=references file=src/auth/jwt.ts line=14 symbol="issueToken"

# 2. 原子性地应用重命名。
lsp action=rename file=src/auth/jwt.ts line=14 symbol="issueToken" new_name="mintToken"

# 3. 重新检查工作区是否有遗留问题。
lsp action=diagnostics file="*"
```

步骤 2 要么一次性写入所有涉及文件，要么什么都不写。步骤 3 会暴露重命名无法修复的内容——字符串动态查找、引用旧名称的文档注释、通过其他路径导入该符号的下游包。

## 常见陷阱

**诊断为空但构建失败**

运行 `lsp action=status`。该语言的服务器可能未在 PATH 中。安装它（`rust-analyzer`、`gopls` 等），然后运行 `lsp action=reload file="*"`。

**重命名被拒绝**

服务器标记该符号为不可重命名（通常是内置类型、外部类型或纯字符串键）。请使用结构化编辑来修复受影响的位置。

**选中了错误的出现**

当同一行上名称重复时，使用 `symbol="name#2"` 来消除歧义。
