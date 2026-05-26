# 斜杠命令

## 工作原理

输入 `/` 即可打开补全菜单。已安装的 Skill 会显示为 `/skill:<name>`，[自定义命令模板](./prompt-templates.md) 会以各自的 `/<template>` 名称展开。驱动编辑器的按键绑定请参阅 [快捷键](./keybindings.md) 页面。

## 你最常用的 10 个命令

- `/plan` — 切换 Plan 模式；Agent 会先起草计划再执行。参见 [Plan 模式](./plan.md)。
- `/model` — 打开模型选择器；选择角色和 Provider。
- `/compact` — 手动压缩旧上下文；可传入聚焦提示。
- `/tree` — 原地打开会话导航器；跳转到任意历史消息。
- `/branch` — 从同一文件中的某条历史消息开始新线程。
- `/extensions` — Extension 控制中心，管理 Skill、Hook、自定义工具、MCP、插件。
- `/agents` — Agent 控制中心；启动、观察和引导子 Agent。
- `/login` — OAuth 登录 Provider；`/logout` 撤销授权。
- `/share` — 渲染会话并上传（自定义处理器，回退到 Gist）。
- `/handoff` — 写一段结构化的总结并结束当前轮次。

## 会话管理

| 命令 | 说明 |
| --- | --- |
| `/session [info\|delete]` | 显示会话信息或删除当前会话 |
| `/resume` | 打开会话选择器 |
| `/new` | 开始新会话 |
| `/drop` | 删除当前会话并开始新会话 |
| `/rename <title>` | 重命名当前会话 |
| `/move <path>` | 将会话移动到其他工作目录 |
| `/tree` | 导航会话树（切换分支） |
| `/branch` | 从某条历史消息创建分支（同文件，新叶节点） |
| `/fork` | 从某条历史消息分叉到新文件 |
| `/compact [focus]` | 手动压缩会话上下文 |
| `/handoff [focus]` | 写一段结构化的总结条目并结束当前轮次 |
| `/btw <question>` | 使用当前上下文的临时旁路问题 |
| `/retry` | 重试上一次失败的 Agent 轮次 |
| `/background` (`/bg`) | 分离 UI 并继续在后台运行 |
| `/export [path]` | 将会话导出为 HTML |
| `/dump` | 将会话记录复制到剪贴板 |
| `/share` | 将会话上传为私密 GitHub Gist（或自定义处理器） |
| `/copy [last\|code\|all\|cmd]` | 复制最后一条 Agent 消息 / 代码块 / 最后的 bash 或 python 命令 |
| `/goal <subcommand>` | 持久化自主目标（`set`、`show`、`pause`、`resume`、`drop`、`budget`） |
| `/todo <subcommand>` | 查看/编辑待办列表（`edit`、`copy`、`export`、`import`、`append`、`start`、`done`、`drop`、`rm`） |

## 模型

| 命令 | 说明 |
| --- | --- |
| `/model` (`/models`) | 打开模型选择器 |
| `/fast [on\|off\|status]` | 切换 OpenAI 服务层快速模式 |
| `/loop [count\|duration]` | 切换循环模式（每次 yield 后自动重新提交下一条提示） |
| `/force <tool> [prompt]` | 强制下一轮使用指定工具 |
| `/browser [headless\|visible]` | 切换浏览器 headless/visible 模式 |

## Plan 模式

| 命令 | 说明 |
| --- | --- |
| `/plan [prompt]` | 切换 Plan 模式；将下一条提示路由到规划器 |

Plan 模式是一个使用专用 `plan` 角色模型的旁路轮次。工作流、退出时的审批选项以及适用场景详见 [Plan 模式](./plan.md) 页面。

## Extension

| 命令 | 说明 |
| --- | --- |
| `/mcp <subcommand>` | 管理 MCP 服务器（`add`、`list`、`remove`、`test`、`reauth`、`unauth`、`enable`、`disable`、`smithery-search`、`smithery-login`、`smithery-logout`、`reconnect`、`reload`、`resources`、`prompts`、`notifications`） |
| `/ssh <subcommand>` | 管理 SSH 主机（`add`、`list`、`remove`） |
| `/memory <subcommand>` | 查看、清除或重建记忆（`view`、`clear`/`reset`、`enqueue`/`rebuild`、`mm list|show|refresh|history|seed|delete|reload`） |
| `/marketplace <subcommand>` | 管理 Marketplace 源和插件（`add`、`remove`、`update`、`list`、`discover`、`install`、`uninstall`、`installed`、`upgrade`） |
| `/plugins [list\|enable\|disable]` | 查看和管理已安装的插件（npm + Marketplace） |
| `/reload-plugins` | 重新加载 Skill、命令、Hook、工具、Agent 和 MCP |

插件开发相关文档请参阅 [插件](./plugins.md) 页面。

## 信息查询

| 命令 | 说明 |
| --- | --- |
| `/usage` | Provider 用量和速率限制余量 |
| `/context` | 当前轮次的 Token 预算分解 |
| `/jobs` | 异步后台任务状态 |
| `/tools` | 当前对 Agent 可见的工具 |
| `/extensions` (`/status`) | 打开 Extension 控制中心仪表盘 |
| `/agents` | 打开 Agent 控制中心仪表盘 |
| `/debug` | 打开调试工具选择器 |
| `/changelog [full]` | 显示变更日志条目 |
| `/hotkeys` | 显示实时快捷键列表 |

经验法则：`/usage` 回答"我能继续工作吗？"；`/context` 回答"下一轮能放下吗？"。

## 其他

| 命令 | 说明 |
| --- | --- |
| `/settings` | 打开设置菜单 |
| `/login` / `/logout` | OAuth 登录 / 撤销授权 |
| `/exit` (`/quit`) | 退出交互模式 |

## 用法示例

### `/force <tool> [prompt]`

将下一轮钉选到特定工具。当模型反复对一个还不存在的文件使用 `edit`，或拒绝对新脚手架调用 `write` 时很有用：

```
:/force write Create src/config.ts with the default settings
```

作用范围恰好是一轮。该轮返回后，工具选择自动取消钉选。仅传 `/force write` 不带提示，则钉选你发送的下一条消息。

### `/btw <question>`

提出临时旁路问题，不会污染记录。模型能看到当前上下文，但对话不会被持久化，因此不出现在 `/tree` 中，也不参与记忆整合。

```
:/btw what does the regex on line 47 actually match?
```

### `/loop` — 迭代直到完成或预算耗尽

切换循环模式后，你发送的下一条提示会在每次 yield 后自动重新提交。传入纯数字限制迭代次数；传入 `10m` / `2h` / `30s` 形式则设置挂钟时限。`Esc` 取消当前迭代；再次运行 `/loop` 则禁用。

```
:/loop 10
run the auth tests and fix the first failure you see

:/loop 20m
clear the typecheck backlog in packages/coding-agent
```

接受的单位：`s`、`m`、`min`、`h`、`hr` 及其复数形式。混合形式（如 `/loop 10 5m`）会被拒绝。

### `/background` 然后 `omp -c`

分离 UI 让 Agent 继续运行。会话在后台进程中继续；你可以关闭终端。从任意终端重新连接：

```
:/background          # detach the current session
omp -c               # reattach the most recent session
```

从另一个活跃会话使用 `/jobs` 可以在不重新连接的情况下查看后台任务状态，它会列出后台工作和最后一行状态。配合 `/loop` 适合长时间自主运行。

### `/retry` 应对上下文溢出

当上一轮报错（Provider 429、上下文长度溢出、临时 Socket 重置）时，`/retry` 会重新提交相同的用户输入。如果此后已经进行了压缩（手动 `/compact` 或自动压缩），重试会使用压缩后的上下文，这通常能解决溢出问题。`/retry` 仅适用于失败的轮次；已完成但答案不好的轮次应使用引导消息或 `/branch`。

## 自定义斜杠命令

`~/.omp/agent/commands/<name>.md`（用户级）或 `<cwd>/.omp/commands/<name>.md`（项目级）下的任何 Markdown 文件都会成为 `/<name>` 并作为提示词模板展开。Skill 以 `/skill:<name>` 形式暴露。编写详情、发现顺序和 TypeScript 处理器 API 请参阅 [提示词模板](./prompt-templates.md) 页面。

```
---
description: Code-review a file or diff
argument-hint: <path-or-diff>
Review the following for correctness, edge cases, and style:

$@
```

调用 `/review src/auth.ts` 时，正文中的 `$@` 会被替换为参数。还支持位置参数形式（`$1`、`$2`、`$@[1:2]`）和 `$ARGUMENTS`。
