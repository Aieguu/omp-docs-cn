# 调试

## 使用 omp 调试程序

当答案取决于运行时状态时使用调试器：某个值出乎意料地变化、某个分支只为某一种输入而触发、进程挂起，或多个线程交互异常。omp 使用调试适配器协议（Debug Adapter Protocol，DAP）通信，因此它可以启动或附加到程序、使其停止、检查帧（frames）与变量、单步执行，并通过语言专属的调试适配器（debug adapter）求值表达式。

最小可用的工作流程是：

1.  为语言安装适配器，并让它的可执行文件对 omp 可用。
2.  在项目目录中启动 `omp`。
3.  用自然语言描述程序、停止点和问题。

例如，用 `uv add --dev debugpy` 安装 debugpy 之后：

```
Debug etl/transform.py with sample.csv. Break on line 58 when i == 3,
inspect the locals and running total, and explain where the bad value enters.
```

omp 会根据 `.py` 目标与 Python 项目标记来选择 debugpy，启动该脚本并驱动已停止的进程。你不需要把请求翻译成 DAP 操作，也不必自行管理帧标识符。

对于只需读取定义、引用或类型的问题，请改用[代码智能](./code-intelligence.md)。调试会执行真实代码或附加到真实代码，并可能改变目标的状态。

## 自动完成的工作

调试器支持默认启用。在 shell 中确认该设置：

```
omp config get debug.enabled
```

对启动（launch）而言，omp 只考虑已安装的适配器，然后根据目标的文件扩展名和附近的项目标记（如 `pyproject.toml`、`go.mod`、`Cargo.toml`、`package.json`、`CMakeLists.txt`）为它们排序。对无扩展名的原生可执行文件，它优先使用 GDB，其次 LLDB。在请求中点名的适配器会覆盖自动选择。

大多数内置的启动配置会在程序入口处停止。这给了 omp 在恢复执行前安装你所请求的断点的机会。Go 还可以把包目录作为目标；其他适配器通常需要一个文件或可执行文件路径。

附加（attach）比启动更缺少自描述性。在可能存在歧义时，请带上适配器，同时提供进程 ID，或提供目标暴露出的主机与端口。

## 安装适配器

为目标至少安装一个合适的适配器。omp 内置了以下常见选择的配置；适配器本身是单独的程序。

| 目标 | 内置适配器名称 | omp 的预期 |
| --- | --- | --- |
| C、C++、Rust | `gdb` | 支持 DAP 的 GDB 构建，可用作 `gdb` |
| C、C++、Objective-C、Swift、Rust、Zig | `lldb-dap` | `lldb-dap` 在 `PATH` 上 |
| C、C++、Rust、Zig | `codelldb` | `codelldb` 在 `PATH` 上 |
| Python | `debugpy` | `python` 在 `PATH` 上，且在该解释器中执行过 `uv add --dev debugpy` |
| Go | `dlv` | 执行 `go install github.com/go-delve/delve/cmd/dlv@latest`，`$GOBIN`（或 `~/go/bin`）在 `PATH` 上 |
| Ruby | `rdbg` | 执行 `gem install debug`，`rdbg` 在 `PATH` 上 |
| 运行于 Node 的 JavaScript 与 TypeScript | `js-debug-adapter` | vscode-js-debug 的 `dapDebugServer.js`；见下文 |
| .NET | `netcoredbg` | `netcoredbg` 在 `PATH` 上 |
| Kotlin | `kotlin-debug-adapter` | `kotlin-debug-adapter` 在 `PATH` 上 |
| PHP | `php-debug-adapter` | `php-debug-adapter` 在 `PATH` 上 |
| Bash | `bash-debug-adapter` | `bash-debug-adapter`、`bash`、`bashdb` 在 `PATH` 上 |
| Dart / Flutter | `dart-debug-adapter` / `flutter-debug-adapter` | Dart SDK 的 `dart debug_adapter` 命令 |
| Elixir | `elixir-ls-debugger` | `elixir-ls-debugger` 在 `PATH` 上 |

对表中没有命令的适配器，安装是平台相关的。安装一个之后，请验证启动 omp 的进程能够解析到它，例如：

```
command -v dlv
command -v lldb-dap
```

### JavaScript 与 TypeScript

`js-debug-adapter` 是 omp 的适配器名称，**不是 npm 包**。请勿运行 `npm install -g js-debug-adapter`。

从 [vscode-js-debug 发布页](https://github.com/microsoft/vscode-js-debug/releases) 下载 `js-debug-dap-*.tar.gz` 归档并解压，使服务器位于此处：

```
~/.local/opt/js-debug/src/dapDebugServer.js
```

该路径会被自动发现。Neovim Mason 的安装也会在 `$XDG_DATA_HOME/nvim/mason/packages/js-debug-adapter/js-debug/src/dapDebugServer.js`（通常在 `~/.local/share` 下）被发现。对其他任何位置，请在启动 omp 前导出路径：

```
export JS_DEBUG_DAP_SERVER=/absolute/path/to/js-debug/src/dapDebugServer.js
omp
```

当 `node` 可用时，omp 用 `node` 运行该服务器，否则使用其 Bun host。

## 配置适配器

通常你并不需要 DAP 配置文件。当适配器安装在 `PATH` 之外、它的内置默认值与项目不符，或你在添加 omp 尚不认识的适配器时，再添加一个。

用 `.omp/dap.json` 做项目专属配置，或用 `~/.omp/agent/dap.json` 作为个人默认配置。omp 启动所在目录中的 `dap.json` 优先级高于 `.omp/dap.json`。等价的 `.dap.json`、`dap.yaml`、`.dap.yaml`、`dap.yml` 和 `.dap.yml` 名称同样会被接受。所有适用文件中的适配器映射会被合并；工作区文件会覆盖用户与插件默认值。

### 覆盖内置适配器

覆盖项会与内置条目合并，因此只需指定要改变的内容。这个项目级文件让 omp 使用项目的 Python 环境，同时保留 debugpy 的文件扩展名与根标记：

```
{
  "adapters": {
    "debugpy": {
      "command": ".venv/bin/python",
      "launchDefaults": {
        "justMyCode": true,
        "stopOnEntry": true
      }
    }
  }
}
```

诸如 `.venv/bin/python` 的相对命令会从调试工作目录解析。在 Windows 上，请使用与环境相符的解释器路径。

### 添加自定义适配器

自定义适配器需要一个命令，以及足以用于自动选择的匹配信息：

```
{
  "adapters": {
    "acme-jvm": {
      "command": "./tools/acme-debug-adapter",
      "args": ["--stdio"],
      "languages": ["java", "kotlin"],
      "fileTypes": [".java", ".kt", ".kts"],
      "rootMarkers": ["pom.xml", "build.gradle", "build.gradle.kts"],
      "launchDefaults": {
        "request": "launch",
        "stopOnEntry": true,
        "projectRoot": "."
      },
      "attachDefaults": {
        "request": "attach",
        "host": "127.0.0.1"
      }
    }
  }
}
```

`launchDefaults` 与 `attachDefaults` 是适配器专属的 DAP 参数。无法从提示词推断出的设置应放在这里，例如 JVM 主类、源映射、`justMyCode`，或适配器专属的附加模式。在运行时，来自你请求的程序路径、工作目录、程序参数、PID、主机和端口优先于这些默认值。

## 让 omp 启动或附加

给 omp 具体的路径，并描述你想要的证据。启动目标是路径，而不是 shell 命令；如有必要，先让 omp 构建目标。

```
Launch build/server with --config test/fixtures/dev.toml. Stop in parseConfig,
then show me the arguments and the first caller that supplied an empty path.
```

```
Debug the Go package in ./cmd/worker. Break when retryCount reaches 5 and
compare the current job with the previous stack frame.
```

```
Use lldb-dap to launch ./build/repro with arguments --seed 417. Stop at main,
then continue until decode_packet and inspect the packet header.
```

要附加到本地进程，请提供它的 PID：

```
Attach lldb-dap to PID 48120. Pause it, show all threads, and identify which
thread is holding the process in shutdown.
```

对调试服务器，请同时提供端点和适配器：

```
Use debugpy to attach to 127.0.0.1:5678. When the request handler is reached,
inspect request.user and explain why authorization fails.
```

一个 omp 会话中只能有一个根调试会话处于活跃状态。在启动或附加到不同目标之前，请让 omp 结束当前的调试会话。

## 停止时你会看到什么

调试活动会以 `Debug` 块的形式出现在对话记录中。启动或附加成功后，该块会标明所选适配器、状态、工作目录和程序。当执行停止时，它还会显示停止原因、当前帧与源码位置，例如：

```
Adapter: debugpy
Status: stopped
Stop reason: breakpoint
Frame: transform_row
Location: /workspace/etl/transform.py:58:9
```

随后，在单步执行或继续之前，omp 可以检查调用栈、线程、作用域、局部变量、嵌套值、目标输出与受支持的表达式。如果目标在请求超时前仍未停止，对话记录会说明它仍在运行；这不会被报告为崩溃。请让 omp 暂停它，或设置一个可达的断点然后继续。

已停止的进程是真正被暂停的。在继续或终止之前，它可能不再响应请求，或一直持有锁。在某些适配器中，表达式求值也可能调用代码或改动状态，因此当这种区别很重要时，请说“只检查，不求值表达式”。

## 故障排查

### 调试不可用

检查功能开关，必要时启用它：

```
omp config get debug.enabled
omp config set debug.enabled true
```

在更改启用了哪些工具之后，启动一个新的 omp 会话。

### omp 提示适配器不可用

从启动 omp 的同一个 shell 中验证可执行文件。如果它安装在别处，请在启动 omp 前更新 `PATH`，或在 `dap.json` 中设置绝对的 `command`。对 debugpy，`python` 可能存在而模块不存在；用以下命令验证：

```
python -m debugpy --version
```

对 JavaScript，请验证 `JS_DEBUG_DAP_SERVER` 或某个自动的 `dapDebugServer.js` 位置，而不是寻找 `js-debug-adapter` 可执行文件。

### 选错了适配器

在请求中点名适配器。要做持久修复，请在项目 DAP 配置中修正它的 `fileTypes` 与 `rootMarkers`。文件扩展名应包含前导点，并按小写匹配。

### 目标路径被拒绝

请传入源码文件或可执行文件路径，而不是把命令加参数混在一条字符串里。把程序参数单独写进请求。目录目标要求适配器具有 `acceptsDirectoryProgram: true`；内置的 Delve 配置为 Go 包启用了这一点。

### 断点处于待定状态或从未命中

检查源码路径和行号是否确实属于目标所加载的代码。用调试符号重新构建编译型代码，若单步执行会产生误导则禁用优化，并验证生成 JavaScript 的源映射设置。条件表达式必须使用目标语言，且被该适配器支持。

### 附加失败

确认 PID 仍然存活，或主机与端口可达。然后明确点名预期的适配器。某些适配器需要额外字段，例如进程选择器或模式；请把这些适配器专属的值放进 `attachDefaults`。

### omp 提示已有另一个活跃会话

请让它终止现有的调试会话，然后重试。启动或附加失败会被自动清理，但运行中或已停止的会话在调试工作结束前仍保持活跃。

## DAP 适配器配置参考

| 字段 | 必需 | 含义 |
| --- | --- | --- |
| `command` | 是 | 可执行文件的名称或路径。相对路径从调试工作目录解析。 |
| `args` | 否 | 传给适配器进程的参数，而非传给被调试程序的参数。 |
| `languages` | 否 | 与该适配器关联的语言元数据。 |
| `fileTypes` | 否 | 小写扩展名（含前导点），用于启动时的选择。 |
| `rootMarkers` | 否 | 用于识别并排序匹配项目的文件或目录。 |
| `launchDefaults` | 否 | 适配器专属参数，在每次启动时、于所请求的程序、工作目录和程序参数之前合并。 |
| `attachDefaults` | 否 | 适配器专属参数，在每次附加时、于所请求的 PID、主机和端口之前合并。对进程启动时即已处于附加状态的适配器，可使用 `skipAttachRequest: true`。 |
| `connectMode` | 否 | 默认 `stdio`；对 Delve 风格适配器用 `socket`；对本地 DAP 服务器用 `tcp`。在 `tcp` 模式下，`args` 中的 `${port}` 会被替换为已分配的端口。 |
| `acceptsDirectoryProgram` | 否 | 当适配器可以启动包或项目目录而非文件时，设为 `true`。 |

外层的 `adapters` 对象是可选的：配置文件也可以直接包含适配器映射。没有可用 `command` 的无效新条目会被忽略；无效的部分覆盖不会抹掉它本想修改的内置适配器。
