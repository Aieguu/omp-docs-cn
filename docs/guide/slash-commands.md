# Slash 命令

Slash 命令是在 TUI 输入框中以 `/` 开头的控制命令。输入 `/` 会出现补全；自定义命令也可以从配置目录加载。

本页按官方英文文档和当前上游注册表整理。不同版本可能增减命令，运行中可用 `/hotkeys` 和 `/tools` 辅助确认当前构建状态。

## 使用模型与 Provider

| 命令 | 作用 |
| --- | --- |
| `/login [provider|redirect-url]` | 登录或添加 Provider 凭据。无参数时打开按字母排序的 Provider 选择器；OAuth 流程中也可粘贴 redirect URL。 |
| `/logout <provider>` | 清除 Provider 的已保存 OAuth / API key 凭据。 |
| `/model` / `/models` | 打开模型选择器；在 TUI 中用于选择当前模型并调整角色分配。 |
| `/model <id>` | 在非 TUI / ACP 路径中可直接设置指定模型；`id` 可为 `provider/model`。 |
| `/fast [on|off|status]` | 切换优先服务层，例如 OpenAI `service_tier=priority` 或 Anthropic fast。 |
| `/usage` | 查看 Provider 用量和限制。 |

::: tip `/model` 与 `Ctrl+P` 的区别
官方文档中 `/model` 是模型选择器入口；它可以选择模型并调整角色。  
`Ctrl+P` 才是会话内按角色/模型循环顺序切换当前主模型的快捷键。`Shift+Ctrl+P` 反向循环，`Alt+P` 临时选择模型且不写回角色配置。
:::

## 运行模式与当前 turn 控制

| 命令 | 作用 |
| --- | --- |
| `/plan [prompt]` | 开启计划模式：使用 `plan` 角色模型进行只读规划，审批后再执行。 |
| `/goal <objective>` | 设置或切换 goal mode。 |
| `/goal set <objective>` | 设置或替换持久目标。 |
| `/goal show` | 显示当前目标详情。 |
| `/goal pause` / `/goal resume` | 暂停 / 恢复目标。 |
| `/goal drop` | 移除目标。 |
| `/goal budget <N|off>` | 调整目标 token 预算。 |
| `/loop [count|duration]` | 开启 loop mode：下一条 prompt 在每次 yield 后自动重提。 |
| `/force <tool> [prompt]` | 强制下一轮使用指定工具。当前实现也支持 `/force:<tool-name> [prompt]` 形式。 |
| `/background` / `/bg` | 将运行中的任务脱离 UI，在后台继续。 |
| `/retry` | 重试最后一次失败的 agent turn。 |
| `/btw <question>` | 基于当前会话上下文问一个临时旁路问题。 |

## 会话与上下文

| 命令 | 作用 |
| --- | --- |
| `/new` | 开始新会话。 |
| `/drop` | 删除当前会话并开始新会话。 |
| `/resume` | 从历史会话中恢复。 |
| `/branch` | 从历史消息创建分支。 |
| `/fork` | 从历史消息创建新会话文件。 |
| `/tree` | 打开 session tree，在当前会话文件中移动 leaf。 |
| `/session info` | 显示当前会话信息。 |
| `/session delete` | 删除当前会话并返回选择器。 |
| `/rename <name>` | 重命名当前会话。 |
| `/move <cwd>` | 将会话移动到另一个工作目录作用域。 |
| `/compact` | 手动压缩会话上下文。 |
| `/handoff [focus]` | 生成交接摘要并带到新会话。 |
| `/context` | 显示估算的上下文使用情况。 |
| `/export [path]` | 导出会话为 HTML。 |
| `/dump` | 复制完整会话 transcript。 |
| `/share` | 通过 GitHub gist 分享会话。 |

## 工具、任务与调试

| 命令 | 作用 |
| --- | --- |
| `/tools` | 显示当前对 agent 可见的工具。 |
| `/jobs` | 显示异步后台 job。 |
| `/debug` | 打开调试工具选择器。 |
| `/browser [headless|visible]` | 切换 browser 工具的 headless / visible 模式。 |
| `/copy last` | 复制最后一条 agent 消息。 |
| `/copy code` | 复制最后一个代码块。 |
| `/copy all` | 复制最后一条消息中的全部代码块。 |
| `/copy cmd` | 复制最后一次 bash / python 命令。 |
| `/todo edit` | 在 `$EDITOR` 中编辑 todo 列表。 |
| `/todo copy` | 复制 todo Markdown。 |
| `/todo export [path]` | 导出 todo，默认 `TODO.md`。 |
| `/todo import [path]` | 从 Markdown 替换 todo。 |
| `/todo append [phase] <task>` | 添加任务。 |
| `/todo start <task>` | 将任务标记为进行中。 |
| `/todo done [task|phase]` | 完成任务 / 阶段 / 全部。 |
| `/todo drop [task|phase]` | 放弃任务 / 阶段 / 全部。 |
| `/todo rm [task|phase]` | 删除任务 / 阶段 / 全部。 |

## 配置、扩展与外部服务

| 命令 | 作用 |
| --- | --- |
| `/settings` | 打开设置菜单。 |
| `/extensions` / `/status` | 打开 Extension Control Center。 |
| `/agents` | 打开 Agent Control Center。 |
| `/reload-plugins` | 重新加载 skills、commands、hooks、tools、agents、MCP。 |
| `/mcp <subcommand>` | 管理 MCP servers。 |
| `/ssh <subcommand>` | 管理 ssh 工具使用的 host 定义。 |
| `/memory <subcommand>` | 查看、清理或重建 memory。 |
| `/marketplace <subcommand>` | 管理 marketplace 来源和插件。 |
| `/plugins [list|enable|disable]` | 查看或启停已安装插件。 |

### `/mcp` 子命令

```text
add, list, remove, test, reauth, unauth,
enable, disable,
smithery-search, smithery-login, smithery-logout,
reconnect, reload, resources, prompts, notifications, help
```

### `/ssh` 子命令

```text
add, list, remove, help
```

### `/memory` 子命令

```text
view, clear/reset, enqueue/rebuild,
mm list, mm show, mm refresh, mm history,
mm seed, mm delete, mm reload
```

### `/marketplace` 子命令

```text
add, remove, update, list, discover,
install, uninstall, installed, upgrade, help
```

## UI 与退出

| 命令 | 作用 |
| --- | --- |
| `/hotkeys` | 显示当前键位。 |
| `/changelog` / `/changelog full` | 显示更新日志。 |
| `/exit` / `/quit` | 退出交互模式。 |

## 自定义 slash 命令

项目或用户可以放置 Markdown prompt template，加载后作为 slash 命令使用。常见目录：

```text
~/.omp/agent/commands/*.md
<project>/.omp/commands/*.md
```

模板可以带 frontmatter 描述，并通过参数占位把用户输入拼入 prompt。自定义命令适合封装团队固定流程，例如 `/review`、`/release-note`、`/migration-plan`。
