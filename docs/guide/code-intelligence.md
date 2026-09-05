# 代码智能

## 借助语义上下文修改代码

代码智能让 omp 可以向语言服务器询问某个符号的含义、在哪里定义、哪些代码引用了它，以及哪些修复是有效的。这比把源代码当作纯文本来处理更安全：语义重命名能够区分两个同名的变量，并跨文件更新导入和再导出。

通常，你只需要为自己的语言安装语言服务器，从项目根目录启动 `omp`，然后提出你想要的结果即可：

```
Rename `issueToken` to `mintToken` across the project. Preview the language-server changes before applying them.
```

omp 还可以查找定义和实现、检查推断出的类型、列出引用、报告诊断、应用服务器提供的修复，以及在重命名文件的同时更新导入。对于不以某个符号为中心的、基于语法的改动，请改用[结构化编辑](./editing.md)。

## 自动生效的部分

默认启用 LSP 支持。omp 会检查其内置的服务器定义，并且只有在以下两点同时成立时才会选择某个服务器：

1.   在你启动 omp 的目录中直接存在匹配的项目标记，例如 `package.json`、`Cargo.toml` 或 `go.mod`。
2.   服务器可执行文件位于受支持的项目本地 bin 目录中，或位于 `PATH` 上。

项目本地的可执行文件优先。这包括 `node_modules/.bin`、Python 虚拟环境的 bin 目录、Ruby binstub，以及 Go 项目的 `bin` 目录等位置。

发现过程不会向上遍历父目录，通配符标记也只检查启动目录。请在包含所需标记的仓库或包根目录处启动 omp。

默认情况下，检测到的服务器是**惰性（lazy）**的：欢迎面板会把它们列为可用，但 omp 会等到代码智能操作或对匹配文件的编辑需要某个服务器时才启动它。当 daemon broker 可用时，同一项目的不同 omp 会话之间会共享服务器；如果无法共享，omp 会回退到私有服务器。

在交互式模式下，运行 `/session` 可以查看检测到的服务器名称、文件类型和启动状态：

| 状态 | 含义 |
| --- | --- |
| `available` | 已检测到，可在首次使用时启动。 |
| `connecting` | 正在预热启动。 |
| `ready` | 预热启动已完成。 |
| `error` | 启动失败；有失败原因时该行会附带显示。 |

## 用自然语言提问

描述你想要的结果，并在需要消除歧义时把 omp 指向某个符号或文件。你永远不需要提供协议位置或 LSP 请求细节。

| 目标 | 示例请求 |
| --- | --- |
| 理解符号 | `Explain the inferred type of result in src/parser.ts and show me its definition.` |
| 找出影响范围 | `Find every reference to PaymentGateway.authorize, including implementations, before changing it.` |
| 安全重命名 | `Rename issueToken to mintToken across the project using code intelligence. Preview first.` |
| 移动模块 | `Move src/auth/token.ts to src/security/token.ts and update imports through the language server.` |
| 诊断文件 | `Ask the language server why src/server.ts is failing and explain the diagnostics.` |
| 应用修复 | `Use the server's quick fix for the missing import in src/routes.ts, then check diagnostics again.` |
| 检查契约 | `Find every implementation of StorageAdapter and summarize how they differ.` |

当一个名字在一行中出现多次时，请用文字描述具体是哪一处，例如：“第 88 行第二次调用的 `parse`。” omp 会解析出确切的源代码位置。

## 你会看到什么

导航请求会返回源位置、签名、类型或文档，omp 可以在响应中加以说明。引用搜索会为它提供一份项目范围内的影响清单。诊断会包含服务器的严重级别、消息和位置。

对于重命名，如果你想在任何改动发生之前查看将要修改的文件，请先要求预览。应用之后，omp 会显示常规的已更改文件和 diff 输出。一次语义重命名可能作为一个由服务器计算的 workspace 变更来更新多个文件；如果服务器没有返回有效的重命名，omp 不会凭空编造语义编辑。

语言服务器无法可靠地找到动态字符串查找、叙述性注释、工作区之外生成的代码，或位于该服务器工作区之外的其他包中的使用方。在做出大范围改动之后，除了检查诊断之外，还应让 omp 运行项目的编译器和针对性的测试。

## 配置或覆盖服务器

当一个内置服务器的标记和可执行文件可以被发现时，它不需要任何配置文件。先在项目中或 `PATH` 上安装该服务器，然后从项目根目录重新启动 omp。

使用 `<project>/.omp/lsp.json` 进行项目级覆盖。例如，内置定义是按服务器名称合并的，因此下面的配置只会修改 `gopls` 的设置：

```
{
  "servers": {
    "gopls": {
      "settings": {
        "gopls": {
          "gofumpt": false,
          "staticcheck": false
        }
      }
    }
  }
}
```

`settings`、`initOptions`、`capabilities` 和 `workspaceReadyTimings` 等对象类型字段会替换整个字段，而不是深度合并。请把你希望保留的所有值都包含在覆盖后的对象中。

若要添加 omp 未定义的服务器，请提供它的命令、处理的扩展名和项目标记：

```
# <project>/.omp/lsp.yaml
servers:
  my-language-server:
    command: my-language-server
    args: ["--stdio"]
    fileTypes: [".xyz"]
    languageId: xyz
    rootMarkers: [".xyz-project"]
```

命令可以是可执行文件名称（从项目本地 bin 或 `PATH` 解析），也可以是绝对路径。缺少 `command`、`fileTypes` 或 `rootMarkers` 的新服务器会被忽略并给出警告。

要为一个项目禁用某个内置服务器，同时让其他服务器保持可用：

```
{
  "servers": {
    "eslint": {
      "disabled": true
    }
  }
}
```

编辑完 LSP 配置之后，启动一个新的 omp 会话以获得最清晰的验证效果。先查看欢迎面板或 `/session`，然后提问：

```
Confirm which language server handles src/main.ts and check that file for diagnostics.
```

如果你在某个进行中的会话期间安装了缺失的可执行文件，请让 omp 重新加载所有语言服务器并重新读取它们的配置。

## 选择配置存放的位置

omp 会读取名为 `lsp` 或 `.lsp` 的 JSON、YAML 和 YML 文件。各来源按从低到高的优先级合并：

| 优先级 | 位置 |
| --- | --- |
| 最低 | `~/lsp.*` 和 `~/.lsp.*` |
|  | 已安装插件提供的 LSP 配置 |
|  | 用户配置目录，包括当前 omp agent 目录以及受支持的 Claude、Codex 和 Gemini 目录 |
|  | 启动目录下的配置目录，例如 `<cwd>/.omp`、`<cwd>/.claude`、`<cwd>/.codex` 和 `<cwd>/.gemini` |
| 最高 | `<cwd>/lsp.*` 和 `<cwd>/.lsp.*` |

对于 omp 自有的配置，建议：

*   项目：`<project>/.omp/lsp.json`
*   用户：默认档案使用 `~/.omp/agent/lsp.json`，或使用当前档案的 agent 目录

在同一位置，优先级顺序是 `lsp.json`、`.lsp.json`、`lsp.yaml`、`.lsp.yaml`、`lsp.yml`，然后是 `.lsp.yml`。服务器条目按名称进行浅层合并。覆盖配置中没有提到的服务器会保留其内置定义，而且 omp 仍会根据 `disabled`、根标记和可执行文件的可用性对合并后的集合进行过滤。

顶层的 `servers` 包装是可选的，但请不要混用包装形式与扁平形式的服务器条目。下面两种写法是等价的：

```
{
  "servers": {
    "eslint": { "disabled": true }
  },
  "idleTimeoutMs": 300000
}
```

```
eslint:
  disabled: true
idleTimeoutMs: 300000
```

省略、为零或为负的 `idleTimeoutMs` 会保持空闲关闭功能处于禁用状态。

## LSP 设置

打开 `/settings`，然后使用 **Files → LSP** 分组在交互式界面中修改这些设置。持久化设置也可以放在用户 `~/.omp/agent/config.yml` 或项目 `.omp/config.yml` 中；关于档案和优先级，请参阅[设置](./settings.md)。

| 设置 | 默认值 | 效果 |
| --- | --- | --- |
| `lsp.enabled` | `true` | 启用符号智能、LSP 格式化和 LSP 诊断。 |
| `lsp.lazy` | `true` | 仅在匹配的文件操作需要时才启动服务器。设为 `false` 可在交互式启动时在后台预热检测到的服务器。 |
| `lsp.shared` | `true` | 通过 daemon broker 在每个项目中共享一个服务器，并回退到私有服务器。 |
| `lsp.formatOnWrite` | `false` | 在 omp 写入匹配的代码后对其进行格式化。 |
| `lsp.diagnosticsOnWrite` | `true` | 在文件写入后返回诊断。 |
| `lsp.diagnosticsOnEdit` | `false` | 在增量编辑后也返回诊断。 |
| `lsp.diagnosticsDeduplicate` | `true` | 抑制已对某个文件显示过的诊断，除非它们发生了变化。 |

对于需要禁用所有基于 LSP 的行为的一次性会话，可以这样启动：

```
omp --no-lsp
```

## 服务器配置参考

对内置服务器的部分覆盖可以省略继承的字段。新建服务器需要下面列出的三个必填字段。

| 字段 | 类型 | 新建服务器是否需要 | 用途 |
| --- | --- | --- | --- |
| `command` | string | 是 | 可执行文件名称或绝对路径。 |
| `fileTypes` | string[] | 是 | 服务器处理的扩展名，包含前导点号。 |
| `rootMarkers` | string[] | 是 | 用于识别启动目录是否为匹配项目的文件或目录；支持单级通配符。 |
| `args` | string[] | 否 | 传给服务器进程的命令行参数。 |
| `languageId` | string | 否 | 为打开的文件发送的语言标识符；省略时根据路径推断。 |
| `initOptions` | object | 否 | 服务器特有的初始化选项。 |
| `settings` | object | 否 | 服务器特有的工作区设置。 |
| `disabled` | boolean | 否 | 为 `true` 时排除该服务器。 |
| `warmupTimeoutMs` | number | 否 | 每个服务器的预热启动超时时间（毫秒）。 |
| `isLinter` | boolean | 否 | 将服务器标记为仅用于诊断/格式化，因此不会用于类型智能。 |
| `capabilities` | object | 否 | 启用受支持的可选集成：`flycheck`、`ssr`、`expandMacro`、`runnables` 和 `relatedTests`。这些目前用于 rust-analyzer。 |
| `workspaceReadyTimings` | object | 否 | 高级 rust-analyzer 时序覆盖：`timeoutMs`、`pollMs`、`settleMs` 和 `statusRequestTimeoutMs`。 |

## 故障排查

### 欢迎面板或 `/session` 中没有出现服务器

*   从包含预期根标记的目录启动 omp；发现过程不会向上搜索父目录。
*   确认二进制文件已安装到 omp 可以解析到的位置。例如，运行 `command -v rust-analyzer` 或检查项目的本地 bin 目录。
*   检查自定义服务器是否具有非空的 `command`、`fileTypes` 和 `rootMarkers` 字段。
*   检查配置文件名和语法。无法读取或无效的 JSON/YAML 会被忽略，以便其他配置源可以继续加载。
*   如果安装了多个 Python 或 JavaScript 服务器，请禁用不需要的那些，使服务器选择没有歧义。

### 服务器显示为 `available`，但什么都没有启动

在 `lsp.lazy: true` 的情况下这是正常的。请对匹配的文件请求定义、引用、重命名或诊断。如果你希望在交互式会话打开时就在后台启动服务器，请将 `lsp.lazy` 设为 `false`。

### 启动失败或诊断始终为空

让 omp 报告它选择了哪个服务器、重新加载它并显示启动错误。在 omp 之外验证配置的命令和参数。同时确认文件扩展名在 `fileTypes` 中，并且该文件属于该服务器根标记所描述的项目。

标记为 `isLinter` 的服务器可以提供格式化、诊断和修复，但不能提供定义、引用或语义重命名。编译器和测试输出也可能会捕获 LSP 不会报告的工作区或构建系统错误。

### 重命名被拒绝或遗漏了文本

内置符号、外部声明、生成的文件以及仅以字符串形式出现的属性名可能无法重命名。先让 omp 显示引用，然后对非语义位置使用针对性的编辑或结构化编辑。跨项目重命名之后，务必审查 diff，并运行相关的编译器或测试。
