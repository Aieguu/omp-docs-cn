# ACP

## 启动

```
omp acp           # equivalent to: omp --mode acp
```

该模式标志与所有其他选项一起记录在 [CLI 参考](../reference/cli.md) 中。ACP 通过 stdio 使用 JSON-RPC 帧协议运行——将 omp 作为子进程启动，并将其 stdin/stdout 连接到你的客户端。

规范：[zed-industries/agent-client-protocol](https://github.com/zed-industries/agent-client-protocol)。Zed 内置了一等 ACP 支持；其他实现了该协议的编辑器可以同样方式驱动 omp。

## 初始化

ACP 在启动时不需要已配置的模型。客户端驱动 `initialize`，然后是 `authenticate`（包括 `/login`），最后才选择模型。当客户端在 `clientCapabilities.auth.terminal` 中声明支持时，omp 会公布 `terminal` 认证方式；否则回退到嵌入式交互式登录。

## 客户端可见行为

当客户端在 `initialize` 时声明文件系统和终端能力时，代理会将内置工具 I/O 路由通过客户端。读取可以看到未保存的缓冲区；写入通过编辑器落地。

| omp 工具 | ACP 方法 |
| --- | --- |
| `read` | `fs/read_text_file` |
| `write` | `fs/write_text_file` |
| `bash` | `terminal/create` + `terminal/output`（按调用创建的客户端终端） |

`bash`、`edit`、`write` 和 `ast_edit` 在客户端支持的情况下受 `session/request_permission` 门控。代理在会话生命周期内缓存每个工具的 `allow_always` 和 `reject_always`，因此一次批准可覆盖长时间的编辑循环。计划模式会被公布，以便客户端从 UI 将代理切换为仅提案执行；工具调用更新携带 `tool_call_update.locations`，使编辑器可以实时跟踪多文件编辑。

## 斜杠命令

大多数[斜杠命令](./slash-commands.md)通过 ACP 的命令列表暴露，因此用户在编辑器内部可以使用相同的 `/plan`、`/model`、`/compact` 等命令。没有文本处理器的命令——仅用于驱动 TUI 界面的命令——会被过滤掉，`/login` 和 `/quit` 也会被隐藏（登录由 ACP 的 `authenticate` 步骤负责；退出是客户端的工作）。

文件引用（`@path`）和工具调用卡片的工作方式与 TUI 中相同——编辑器使用 ACP 的内容块类型进行渲染。

## 模式与配置更新

`session/set_mode` 和 `session/set_session_config_option("mode", …)` 都会发出 `current_mode_update`，以便编辑器保持同步。`/model` 在切换后发出 `config_option_update`。

## Extension 方法

在标准 ACP 之外，omp 暴露了一个小型 `_omp/*` 命名空间（前导下划线是非标准方法的规范约定）：

| 方法 | 返回 |
| --- | --- |
| `_omp/sessions/listAll` | 分页的跨 cwd 会话索引。 |
| `_omp/projects/list` | 已发现的项目 cwd 及会话计数。 |
| `_omp/chats/byCwd` | 按工作目录过滤的会话。 |
| `_omp/usage` | 活跃会话的 Token 和费用汇总。 |
| `_omp/extensions` | 列出已发现的 Extension。 |
| `_omp/extensions/toggle` | 启用或禁用某个 Extension。 |

这些方法让 ACP 客户端可以浏览和重新打开先前的会话，无需重新实现会话发现；有关底层树结构的布局，请参阅 [会话](./sessions.md)。

## 调试线路

ACP 帧是 stdio 上每行一个 JSON 对象，与 RPC 格式相同，因此相同的 `tee` 技巧可以使用：

```
mkfifo in out
tee acp.in.log < in | omp acp | tee acp.out.log > out &
# point your ACP client at the named pipes
#   stdin  -> in
#   stdout -> out
```

如需一次性检查，可运行编辑器并指向 `omp acp 2>acp.stderr.log`。omp 会将启动和传输错误写入 stderr，不会混入 ACP 流中。
