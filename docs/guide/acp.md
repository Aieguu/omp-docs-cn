# ACP

## 从你的编辑器使用 omp

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 让编辑器可以在不内嵌 omp、也不添加编辑器专用插件的情况下承载一次 omp 对话。当你希望一边审查代码，一边查看更改、终端、审批和会话历史，同时让 omp 保留自己的模型、凭据、设置、扩展和技能时，请使用它。

编辑器会把 omp 作为子进程启动。你不需要在单独的终端中运行 ACP 服务端，也不需要把它连接到某个端口。

首先，确认 `omp` 在你编辑器将要使用的环境中可用：

```
command -v omp
omp --version
```

然后用以下启动值配置 ACP 客户端：

| 字段 | 值 |
| --- | --- |
| Command（命令） | `omp` |
| Arguments（参数） | `acp` |
| Transport（传输方式） | stdio |
| Session directory（会话目录） | 已打开项目或工作区的绝对路径 |

`omp --mode acp` 与 `omp acp` 等价，但 `omp acp` 是推荐的客户端配置写法。

## 连接 Zed

在 Zed 中，运行 **agent: open settings**，打开 **External Agents**，选择 **Add Agent → Add Custom Agent**，然后添加：

```
{
  "agent_servers": {
    "Oh My Pi": {
      "type": "custom",
      "command": "omp",
      "args": ["acp"]
    }
  }
}
```

从 Agent Panel 启动一个新线程并选择 **Oh My Pi**。Zed 拥有线程界面；omp 拥有代理、Provider 连接和模型设置。

如果通过 GUI 启动的 Zed 找不到 `omp`，请把 `"omp"` 替换为 `command -v omp` 输出的绝对路径。这条规则同样适用于其环境没有继承你 shell `PATH` 的其他客户端。

对于其他 ACP 客户端，请创建等效的自定义代理条目：以单个参数 `acp` 启动 `omp`，让 stdin 和 stdout 保持连接 ACP 传输通道，并在创建会话时提供工作区的绝对路径。不要解析终端界面输出，也不要在不带 `acp` 的情况下直接启动 `omp`。

## 认证并启动线程

omp 会向每个 ACP 客户端公布 **Use existing local credentials**（使用已有本地凭据）。这些是 omp 已经可用的 Provider 密钥和 OAuth 会话；仅为你编辑器内置代理配置的凭据不会被自动共享。

如果客户端提供 **Set up Oh My Pi in terminal**（在终端中设置 Oh My Pi），请选择它以打开 omp 的交互式 Provider 设置。否则：

1. 在终端中运行 `omp`。
2. 输入 `/login` 或 `/login <provider>` 并完成认证。
3. 在编辑器中启动一个新的 ACP 线程。

凭据来源和优先级请参阅 [Provider](./providers.md)。连接之后，使用编辑器的会话控件选择一个可用的 **Model**（模型）和 **Thinking**（思考）级别。模型列表反映的是 omp 在当前凭据和配置下可用的模型。

现在像平常一样给出提示，例如：

```
Rename issueToken to mintToken across this project, update every caller, and run the focused tests.
```

响应会流式进入编辑器。在功能完整的客户端中，omp 通过编辑器的文件系统桥进行读取、通过编辑器进行写入，并在客户端侧的终端中运行 shell 命令。这能让读取与已打开的缓冲区保持一致，并让编辑器显示被改动的代码位置和命令输出。如果某个客户端没有提供上述某一项 ACP 能力，omp 会针对该项能力回退到工作区文件系统或它自己的本地命令运行器。

## 会话控制

一个 ACP 线程就是一个普通的持久化 omp 会话。根据客户端界面不同，你可以重新打开、恢复、分叉或关闭会话，并看到它们保存的标题和工作目录。

标准的会话控件包括：

* **Mode**（模式）——Default 或 Plan。当 `plan.enabled` 为 true（默认如此）时，才可使用 Plan。
* **Model**（模型）——omp 当前可用的任意模型。
* **Thinking**（思考）——Off、Auto 或所选模型支持的一个级别。

当你想在编辑前做只读调研时，请从客户端的模式控件中选择 **Plan**。omp 会把完成的计划呈报给你审批；关闭或拒绝那个提示永远不会授予写权限。`/plan` 是 TUI 专用命令，不是通过 ACP 进入计划模式的方式。工作流程请参阅[计划模式](./plan.md)。

支持文本的 Slash 命令会公布在客户端的命令菜单中。`/login`、`/quit` 这类 TUI 专用命令被有意排除在外：认证和进程生命周期属于 ACP 宿主。

## 权限

ACP 会在以下操作之前增加一道编辑器侧的安全闸门：

* shell 命令；
* 文件删除；
* 文件移动或重命名，包括包含在更大编辑中的破坏性操作。

客户端可以提供 **Allow once**（允许一次）、**Always allow**（始终允许）、**Reject**（拒绝）和 **Always reject**（始终拒绝）。“始终”类选择只会针对当前会话和该操作类别进行缓存，并不是永久性的全局设置。普通的读取和非破坏性文件写入不会触发这种 ACP 专属闸门，但你常规的 omp 审批设置仍然适用。

被拒绝、被取消或不受支持的权限请求都会以失败收尾（fails closed）。omp 不会静默执行该操作。

对于可信的无人工值守工作区，请在客户端启动参数中明确做出选择：

```
{
  "command": "omp",
  "args": ["acp", "--approval-mode", "yolo"]
}
```

这会跳过 omp 和客户端的权限提示，除非某个工具的 per-tool 策略被显式设置为 `prompt` 或 `deny`。交互式编辑器使用请优先采用默认的提示式设置。持久化的 `tools.approvalMode` 和按工具策略请参阅[设置](./settings.md)。

## MCP 与编辑器能力

在 ACP 模式下，客户端拥有 MCP 服务端配置。会话启动时，omp 接受客户端传入的 stdio、HTTP 和 SSE MCP 服务端；它有意不针对该会话自动发现 omp 磁盘上的 MCP 配置。请在编辑器或 ACP 宿主中配置缺失的 MCP 服务端，然后启动或重新加载线程。

omp 还支持客户端提供的文本、图像和内嵌上下文。你的编辑器是否提供附件、会话导入、分叉、Plan 模式、终端或未保存缓冲区读取，取决于它所实现的 ACP 能力和界面。

## 故障排查

### `omp acp` 看起来卡住了

这是你手动运行它时预期会看到的现象：进程正在 stdin 上等待 ACP 消息，而 stdout 保留给协议使用。请改为配置编辑器来启动它。启动和传输诊断信息会输出到 stderr，omp 日志位于 `~/.omp/logs/` 下。

在 Zed 中，运行 **dev: open acp logs** 来检查连接的客户端侧。

### 编辑器报告 `command not found`

在终端中运行 `command -v omp`，并将输出的绝对路径用作自定义代理的命令。GUI 应用程序通常获得的 `PATH` 比交互式 shell 更小。如果项目在远程，请在 ACP 进程实际运行的环境中安装 omp 并完成认证。

### 线程已连接，但没有任何模型可用

打开客户端提供的终端设置，或者在编辑器之外运行 `omp` 和 `/login <provider>`，然后创建一个新线程。同时检查 Provider 凭据或环境变量是否对编辑器进程可见；编辑器自带的模型凭据不会自动配置 omp。

### 未保存的更改丢失，或终端在编辑器外部打开

客户端可能没有公布 ACP 的文件系统或终端支持。请更新或重新配置客户端。没有文件系统桥接时，在让 omp 检查缓冲区之前先保存它们；没有终端桥接时，命令会使用 omp 的本地运行器。

### 权限提示始终无法完成

ACP 客户端必须渲染并答复权限请求。取消对话框或使用一个无法答复的客户端，都会拒绝该操作。请使用较新的客户端，或者刻意配置一个审批策略，而不要假定会获得批准。

### MCP 工具缺失

请在 ACP 客户端中配置 MCP 服务端，而不仅是在 omp 的本地 MCP 文件中配置。启动一个新线程，以便客户端能在创建会话时传入服务端配置。

## 面向 ACP 客户端实现者

`omp acp` 在按行分隔的 stdio 上使用 ACP JSON-RPC 通信。请让 stdout 只连接协议，并从 stderr 读取诊断信息。客户端可以渐进式集成：基本提示功能先能工作，而当客户端实现了相应的公开 ACP 能力后，文件系统访问、终端、权限对话框、图像、内嵌上下文、MCP 服务端、会话历史、模式选择、模型选择和思考控件便会逐步出现。

该进程会公布会话创建，以及列表、加载、恢复、分叉和关闭的支持。消息模式请使用官方 [ACP 规范](https://agentclientprotocol.com/)；omp 不要求客户端理解它的内部工具或私有桥接负载。
