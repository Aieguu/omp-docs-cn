# 使用 omp

## 交互式会话的结构

直接运行 `omp` 会打开一个交互式会话。屏幕从上到下分为四个区域：

Header

首次启动时显示 OMP logo，对话开始后变为紧凑的会话头：标题、当前在会话树中的分支，以及任何活动模式横幅（plan、loop、background）。

Messages

用户 prompt、助手轮次和工具调用卡片。每个工具调用渲染为一行摘要；Ctrl+O 展开卡片查看完整输出、完整 diff 或完整 bash 转录。

Editor

多行输入，支持文件引用、路径补全、图片粘贴、Shell 转义和外部编辑器交接。

Footer

两行淡色信息（当 Extension 发布状态时为三行）。第一行：工作目录和当前 git 分支。第二行：token 计数器、费用、上下文使用量和当前模型。

## 编辑器功能

| 功能 | 操作 | 说明 |
| --- | --- | --- |
| 文件引用 | `@` | 模糊搜索项目文件（遵循 `.gitignore`）。发送时每个引用被替换为文件内容并内联到 prompt 中。 |
| 路径补全 | Tab | 补全相对路径、`../`、`~/` 等前缀。 |
| 多行输入 | Shift+Enter / Alt+Enter | 插入换行。Windows Terminal 上请使用 Ctrl+Enter 代替。 |
| 图片附件 | Ctrl+V、拖放或 `@image.png` | 从剪贴板粘贴、从操作系统文件管理器拖入或内联路径。当前模型必须支持图片输入，否则附件会在发送时被丢弃并显示警告。 |
| Shell 转义（可见） | `!` | 以 `!` 开头将 prompt 作为 shell 命令执行，并将输出包含在上下文中。实时流式输出。Escape 取消。 |
| Shell 转义（隐藏） | `!!` | 与 `!` 相同，但输出不会包含在 LLM 上下文中。输出仍然流式显示在终端中。 |
| Python 转义 | `$` / `$$` | 在共享 Python kernel 中运行。`$$` 隐藏输出，方式与 `!!` 隐藏 bash 输出相同。 |
| 外部编辑器 | Ctrl+G | 在 `$VISUAL` / `$EDITOR` 中打开当前草稿；退出时保存回编辑器。 |
| Prompt 操作 | # | 在当前草稿上方打开 prompt 操作菜单。 |

完整的按键列表（历史搜索、行移动、复制按键、模型切换）请参阅 [键绑定](./keybindings.md)。

## 消息队列

在 agent 工作时输入内容，不会丢失任何消息。在轮次中途提交的消息会排队，并通过两个通道依次传递。

| 按键 | 通道 | 送达时机 |
| --- | --- | --- |
| Enter | 引导消息 | 当前助手轮次完成工具调用后。用于在执行过程中纠偏。 |
| Alt+Enter | 后续消息 | agent 完成所有排队工作并 yield 后。用于"然后做这个"。 |
| Escape | — | 中止当前轮次。已排队的引导消息和后续消息会恢复到编辑器栈中，而不是被丢弃。 |
| Alt+Up | — | 将最近一条排队消息移回编辑器。 |

三个设置项控制相关行为，可在 `/settings` → _Interaction_ 中配置，或作为顶层键写入 `~/.omp/agent/config.yml`：

- `steeringMode` — `all` 或 `one-at-a-time`（默认）。
- `followUpMode` — `all` 或 `one-at-a-time`（默认）。
- `interruptMode` — `immediate`（默认）或 `wait`。

## 模式

Interactive 是默认模式。其他模式是非交互式界面，通过 `--print` 或 `--mode <mode>` 选择。

| 模式 | 调用方式 | 输出 | 适用场景 |
| --- | --- | --- | --- |
| Interactive（默认） | `omp` | TUI | 日常工作。 |
| Print | `omp -p "prompt"` | stdout 上的纯文本，无 TUI。 | 脚本、CI、Shell 管道。 |
| JSON | `omp --mode json -p "prompt"` | stdout 上的换行分隔 JSON 事件。 | 稳定格式，便于管道到其他工具。 |
| RPC | `omp --mode rpc` | JSON-RPC over stdio。 | SDK 和编程客户端。参见 [RPC 模式](./rpc.md)。 |
| ACP | `omp --mode acp`（或 `omp acp`） | Agent Client Protocol over stdio。 | 编辑器和其他 ACP 感知宿主。参见 [ACP](./acp.md)。 |

`--mode rpc-ui` 是 `rpc` 的变体，将 TUI 内的工具调用界面暴露给客户端。完整标志列表请参阅 [CLI 页面](../reference/cli.md)。

## Plan 模式

在涉及多个文件或执行顺序不明显的变更之前，建议使用 Plan 模式。`/plan` 在独立的 planner 模型上以只读工具访问启动一个计划轮次；批准后你可以选择执行并清除、保留记录或压缩上下文。完整演练请参阅 [Plan 模式](./plan.md) 页面。
