# 快捷键

官方建议在会话内运行：

```text
/hotkeys
```

它会显示当前构建实际启用的快捷键，包括用户重映射和扩展新增的键位。

## 常用默认键位

| Action ID | 默认键位 | 作用 |
| --- | --- | --- |
| `app.model.cycleForward` | `Ctrl+P` | 按循环顺序向前切换当前主模型。 |
| `app.model.cycleBackward` | `Shift+Ctrl+P` | 反向切换当前主模型。 |
| `app.model.selectTemporary` | `Alt+P` | 临时选择模型，不写回 `modelRoles`。 |
| `app.model.select` | `Ctrl+L` | 打开模型选择器并设置角色。 |
| `app.plan.toggle` | `Alt+Shift+P` | 切换 plan mode。 |
| `app.history.search` | `Ctrl+R` | 搜索 prompt 历史。 |
| `app.tools.expand` | `Ctrl+O` | 展开 / 折叠工具输出。 |
| `app.thinking.toggle` | `Ctrl+T` | 显示 / 隐藏 thinking block。 |
| `app.thinking.cycle` | `Shift+Tab` | 循环 thinking level。 |
| `app.editor.external` | `Ctrl+G` | 用 `$VISUAL` / `$EDITOR` 编辑当前草稿。 |
| `app.message.followUp` | `Ctrl+Enter` | 将消息排入 follow-up 队列。 |
| `app.message.dequeue` | `Alt+Up` | 把已排队消息取回编辑器。 |
| `app.clipboard.copyLine` | `Alt+Shift+L` | 复制当前行。 |
| `app.clipboard.copyPrompt` | `Alt+Shift+C` | 复制完整 prompt。 |
| `app.stt.toggle` | `Alt+H` | 切换语音转文本录音。 |

## 模型相关键位怎么理解

- `/model`：打开模型选择器；可选择当前模型并调整角色分配。
- `Ctrl+P`：在当前会话里按配置的循环列表切换主模型。
- `Shift+Ctrl+P`：反向循环。
- `Alt+P`：临时选一个模型用于本会话，不写回角色配置。
- `Ctrl+L`：打开选择器并设置角色。

官方 roles 文档中默认循环列表是角色顺序，例如 `slow -> main/default -> smol`。也可以通过 CLI `--models` 或设置项改变循环范围。

## 自定义快捷键

用户级重映射文件：

```text
~/.omp/agent/keybindings.json
```

示例：

```json
{
  "app.model.cycleForward": "Ctrl+P",
  "app.model.selectTemporary": "Alt+P",
  "app.plan.toggle": "Alt+Shift+P"
}
```

一个 action 可以绑定多个键：

```json
{
  "app.history.search": ["Ctrl+R", "Alt+R"]
}
```

禁用某个 action：

```json
{
  "app.stt.toggle": []
}
```

## Tree 选择器内的键位

`/tree` 打开后：

| 键位 | 作用 |
| --- | --- |
| `Up` / `Down` | 上下移动。 |
| `Left` / `Right` | 翻页。 |
| `Enter` | 选择节点。 |
| `Esc` | 清空搜索或关闭。 |
| `Shift+L` | 编辑 / 清除节点标签。 |
| `Ctrl+O` | 循环过滤器。 |
| `Shift+Ctrl+O` | 反向循环过滤器。 |
| `Alt+D/T/U/L/A` | 跳到 default / no-tools / user-only / labeled-only / all。 |

## 保留键位

扩展注册快捷键时，以下键位属于保留或高风险组合，通常会被忽略：

```text
ctrl+c, ctrl+d, ctrl+z, ctrl+k, ctrl+p, ctrl+l,
ctrl+o, ctrl+t, ctrl+g,
shift+tab, shift+ctrl+p,
alt+enter, escape, enter
```
