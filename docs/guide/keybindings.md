# 快捷键

## 查看实时列表

在任意会话中运行 `/hotkeys` 即可导出当前构建所识别的按键组合。该列表反映了生效的重映射以及[插件](./plugins.md)添加的任何组合键；下方的表格是开箱即用的默认值。

## 编辑器 — 导航

| 按键 | 操作 |
| --- | --- |
| 方向键 | 移动光标；在空编辑器中按 ↑ 可浏览历史记录 |
| Option+←/→ | 按词移动 |
| Ctrl+A / Home / Cmd+← | 行首 |
| Ctrl+E / End / Cmd+→ | 行尾 |

## 编辑器 — 编辑

| 按键 | 操作 |
| --- | --- |
| Enter | 发送（或在 Agent 工作时作为引导消息入队） |
| Shift+Enter / Alt+Enter | 换行 |
| Ctrl+Enter | 作为后续消息入队（当前轮次 yield 后排空） |
| Ctrl+W / Option+Backspace | 向前删除一个词 |
| Ctrl+U | 删除到行首 |
| Ctrl+K | 删除到行尾 |
| Alt+Shift+L | 复制当前行 |
| Alt+Shift+C | 复制整个提示词 |
| Ctrl+G | 在 `$VISUAL` / `$EDITOR` 中编辑草稿 |
| Alt+Up | 将已入队的消息取回编辑器 |

> 在 Windows Terminal 中，Ctrl+Enter 是唯一有效的后续消息组合键；Shift+Enter 与 Enter 不可区分，会被当作引导消息。

## 编辑器 — 控制

| 按键 | 操作 |
| --- | --- |
| Tab | 路径补全 / 接受自动补全 |
| Escape | 取消自动补全 / 中断当前轮次 |
| Ctrl+C | 清空编辑器（第一次按）/ 退出（第二次按） |
| Ctrl+D | 退出（编辑器为空时） |
| Ctrl+Z | 挂起到后台；在 Shell 中用 `fg` 恢复 |
| Ctrl+R | 搜索提示词历史 |
| Ctrl+O | 切换工具输出展开（以及 `/tree` 内的筛选循环） |
| Ctrl+T | 切换思考块可见性 |
| Alt+H | 切换语音转文字录制 |
| Shift+Tab | 循环切换思考级别 |

## 模型

| 按键 | 操作 |
| --- | --- |
| Ctrl+P | 向前循环角色模型（slow / default / smol） |
| Shift+Ctrl+P | 向后循环角色模型 |
| Alt+P | 为当前会话临时选择模型 |
| Ctrl+L | 打开模型选择器（设置角色） |
| Alt+Shift+P | 切换 [Plan 模式](./plan.md) |

## 仪表盘（导航面板）

`/tree`、`/extensions` 和 `/agents` 共享通用导航器。Escape 关闭；第一次 Escape 清除活动筛选器，第二次退出。

| 按键 | 操作 |
| --- | --- |
| Tab / Shift+Tab | 切换标签页（如 `/extensions` 中的 Provider 标签页） |
| Up/Down 或 j/k | 移动高亮 |
| Space | 切换选中项（或在标题行上切换整个标签页） |
| Enter | 打开检查器 / 保存编辑 |
| N | 在 `/agents` 中启动新建 Agent 流程 |
| R | 在新建 Agent 流程中重新生成 |
| Ctrl+R | 从磁盘重新加载（`/agents`） |

## 选择器

文件和历史选择器（`@` 文件引用、提示词搜索、`#` 上的提示词操作菜单）与编辑器共享移动键：Up/Down 遍历列表，Tab 接受高亮项，Escape 关闭。`@` 选择器会模糊匹配项目根目录下所有未被 `.gitignore` 忽略的文件。

## Plan 模式组合键

| 按键 | 操作 |
| --- | --- |
| Alt+Shift+P | 切换 Plan 模式（`/plan` 的别名） |
| 在审批界面上按 Escape | 取消；返回 Plan 模式迭代而不执行 |

## 自定义按键绑定

重映射配置保存在 `~/.omp/agent/keybindings.json` 中——这是一个独立于 `config.yml` 的文件。每个条目将一个带命名空间的操作 ID（如 `/hotkeys` 输出中的 `app.model.cycleForward`、`tui.editor.undo`）映射到一个组合键，或映射到一个组合键数组（如果你希望多个按键都触发同一操作）。组合键记法与 `/hotkeys` 输出的规范形式一致：小写、`+` 连接，如 `ctrl+p`、`alt+shift+p`、`alt+up`。参见 [设置](./settings.md) 了解 Agent 目录的位置，[斜杠命令](./slash-commands.md) 了解按键触发的命令。

```
// ~/.omp/agent/keybindings.json
{
  "app.model.cycleForward": "ctrl+p",
  "app.plan.toggle": "alt+shift+p",
  "app.clipboard.copyPrompt": ["alt+shift+c", "ctrl+shift+c"]
}
```

> 旧配置中的短名称（`cycleModelForward`、`togglePlanMode` 等）在加载时会自动迁移为带命名空间的形式并回写到同一文件。

> 操作名称在各版本之间保持稳定；如果升级后某个组合键失效，请运行 `/hotkeys` 并与你的配置对比。
