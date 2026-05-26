# 调试

## 何时使用

当阅读代码不够、需要运行中的进程状态时——这个变量在三次迭代后是什么样子、哪个线程卡在哪个互斥锁上、为什么这个分支在一种输入下触发而另一种不会——请使用 `debug`。如需关于代码本身的静态问题，请使用[代码智能](./code-intelligence.md)。

## debug.enabled 开关

`debug` 工具**默认关闭**。在运行前在 `~/.omp/agent/config.yml` 中启用：

```
# ~/.omp/agent/config.yml
debug:
  enabled: true
```

这个开关存在是因为无头 agent 不应在未被明确要求时启动调试器。完整配置结构详见[设置](./settings.md)。

## 适配器

omp 自动发现 PATH 上的 DAP 适配器，并根据目标文件扩展名和工作区标记（`Cargo.toml`、`go.mod`、`pyproject.toml`、`package.json` 等）选择一个。当通用后端和专用后端同时安装时，使用 `adapter` 覆盖选择。

| 语言 | 适配器 | 备注 |
| --- | --- | --- |
| C, C++, Rust, Swift, Zig, Objective-C | `lldb-dap` | 随 macOS Xcode CLT 附带；在 Apple 芯片上无需额外安装即可使用。 |
| Go | `dlv` | Delve 通过 socket 传输。`go install github.com/go-delve/delve/cmd/dlv@latest`。 |
| Python | `debugpy` | 在你调试的解释器中使用 `pip install debugpy` 安装。 |
| JavaScript / TypeScript (Node) | `vscode-js-debug` (`js-debug-adapter`) | 随 VS Code 附带；可通过 `npm i -g js-debug-adapter` 独立安装。 |

默认配置表中的其他适配器涵盖 .NET (`netcoredbg`)、Kotlin、Ruby (`rdbg`)、PHP (Xdebug)、Bash、Dart/Flutter 和 Elixir。安装你所用语言的适配器；当适配器不在 PATH 上时，工具会报告明确的错误。

## 操作

| 操作 | 用途 |
| --- | --- |
| **生命周期** |
| `launch` | 在适配器下启动新进程（`program`、`args`、`cwd`）。 |
| `attach` | 附加到运行中的 `pid`，或远程 `host`+`port`。 |
| `terminate` | 结束活跃会话并清理资源。 |
| `sessions` | 列出已跟踪的会话，包括适配器、状态和停止位置。 |
| **断点** |
| `set_breakpoint` | 在 `file`+`line` 或 `function` 处设置断点；可选 `condition` / `hit_condition`。 |
| `remove_breakpoint` | 移除源码断点。 |
| `set_data_breakpoint` | 对已解析变量设置监视点（`read`/`write`/`readWrite`）。 |
| `set_instruction_breakpoint` | 在 `instruction_reference` 处设置地址级断点。 |
| **执行** |
| `continue` | 恢复已停止的线程。 |
| `step_over` | 单步执行一行源码，跳过函数调用。 |
| `step_in` | 步入下一个调用。 |
| `step_out` | 运行到调用者返回处。 |
| `pause` | 中断运行中的目标。 |
| **检查** |
| `threads` | 适配器已知的所有线程。 |
| `stack_trace` | 已停止线程的帧，受 `levels` 限制。 |
| `scopes` | `frame_id` 的局部变量、参数和寄存器。 |
| `variables` | 展开 `scope_id` 或 `variable_ref`。 |
| `evaluate` | 在帧中运行 `expression`；`context` 可选 `watch` / `repl` / `hover`。 |
| `output` | 排空目标的缓冲 stdout/stderr。 |

当适配器支持时，还提供内存和反汇编操作（`read_memory`、`write_memory`、`disassemble`）以及 `custom_request` 逃生舱。

## 实战示例：在三次迭代后捕获值

`etl/transform.py` 中的 Python 循环仅在第三次遍历时产生错误的总计。设置条件断点，让它触发，然后在继续之前检查局部变量。

```
# 1. 在 debugpy 下启动脚本。
debug action=launch adapter=debugpy program=etl/transform.py

# 2. 在循环第三次执行时中断。
debug action=set_breakpoint file=etl/transform.py line=58 condition="i == 3"
debug action=continue

# 3. 停下时读取帧信息。
debug action=stack_trace levels=5
debug action=scopes frame_id=0
debug action=variables scope_id=<locals_ref_from_scopes>

# 4. 向运行中的解释器提问。
debug action=evaluate frame_id=0 expression="sum(running_totals)" context=repl

# 5. 完成。
debug action=continue
debug action=terminate
```

`repl` 上下文的 `evaluate` 是 DAP 接口未直接暴露的原始调试器命令的逃生舱。每个 agent 只能有一个活跃的调试会话——再次启动或附加前请先调用 `terminate`。
