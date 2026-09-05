# 快捷键

快捷键让你无需离开键盘即可发送提示词或将其排队、中断任务、在编辑器中导航，并打开常用的会话控制。先从下方的小集合开始；当你忘记某个按键组合时，使用 `/hotkeys`。

## 首次会话快捷键

| 按键 | 作用 |
| --- | --- |
| Enter | 发送提示词。当 omp 正在工作时，这会把一条引导消息发送给当前轮次。 |
| Shift+Enter、Ctrl+J 或 Alt+Enter | 插入换行而不是发送。 |
| Ctrl+Q 或 Ctrl+Enter | 排队一条后续消息，在当前轮次结束后发送。 |
| Escape | 关闭自动补全或中断当前操作。 |
| Ctrl+O | 展开或折叠工具输出。 |
| Ctrl+R | 搜索提示词历史。 |
| Ctrl+C | 清空编辑器。在半秒内再次按下可退出。 |
| Ctrl+D | 立即退出；非空的提示词会保存为可恢复的草稿。 |
| Alt+A | 打开 Agent Hub。 |

## 查看当前生效的快捷键

在任意交互式会话中输入：

```
/hotkeys
```

生成的表格使用你所在平台上的按键名称，并解析当前生效的 `keybindings.yml` 中的应用级重映射。例如，在配置语法使用 `alt` 和 `super` 的地方，macOS 上会显示为 Option 和 Cmd。

`/hotkeys` 是一份日常使用的快速列表，并非完整的配置登记表。它的编辑器导航行描述的是标准默认值，扩展新增的快捷键不会追加到其中。重映射编辑器或选择控制时，请使用下文中的动作表。

## 快捷键的适用范围

当前聚焦的界面决定某个按键的含义。在不同的上下文中复用同一个按键是正常的：例如，Ctrl+O 在对话记录中展开工具输出，但在 `/tree` 中循环切换筛选条件。

| 上下文 | 控制 |
| --- | --- |
| 主提示词编辑器 | 应用动作（`app.*`）以及编辑器动作（`tui.editor.*` 和 `tui.input.*`）。 |
| 自动补全、历史记录和大多数选择器 | 选择动作（`tui.select.*`）：方向键移动，PageUp/PageDown 翻页，Enter 确认，Escape 取消。 |
| `@` 文件选择器 | 输入以模糊筛选项目文件，用 Up/Down 移动，用 Tab 接受，用 Escape 关闭。 |
| Plan 审批 | Escape 取消审批并返回 [Plan 模式迭代](./plan.md)。 |

### 全屏界面

这些页面会添加各自界面专属的控制。它们的固定控制不是 `keybindings.yml` 中独立的动作 ID；可重映射的选择动作和中断动作在所示位置仍然适用。

| 界面 | 控制 |
| --- | --- |
| `/tree` | Up/Down 移动；Alt+Up/Down 在用户或助手轮次之间跳转；Left/Right 或 PageUp/PageDown 翻页；Home/End 跳到第一个/最后一个可见条目；Enter 选中；Shift+Enter 总结并直接切换；Ctrl+O/Shift+Ctrl+O 循环切换筛选条件；Escape 清除搜索，然后关闭。 |
| `/extensions` | Tab/Shift+Tab 或 Left/Right 切换 Provider 标签页；方向键或 j/k 移动；Space 或 Enter 切换所选行；输入进行筛选；Escape 先清除筛选条件，再关闭；Ctrl+C 立即关闭。 |
| `/agents` | Tab/Shift+Tab 或 Left/Right 在范围与列表之间切换；方向键移动；Enter 打开或激活；搜索为空时 Space 切换所选 Agent；输入进行筛选；Ctrl+R 重新加载；Escape 先清除筛选条件，再关闭。 |
| Agent Hub | 方向键或 j/k 选择；Enter 打开某个 Agent；t 切换扁平/树状视图；窄终端上 Tab 显示检查器；r 复活已停放的 Agent；x 终止并释放某个 Agent；Escape 先关闭检查器，再关闭 Hub。 |

## 完整的应用默认值

这些动作 ID 控制主要的 omp 会话。标为 **Unbound**（未绑定）的动作在为其分配按键组合后才会生效。

| 动作 ID | 默认值 | 用户可见的动作 |
| --- | --- | --- |
| `app.interrupt` | `escape` | 取消自动补全或中断进行中的工作。 |
| `app.clear` | `ctrl+c` | 清空编辑器；在 500 毫秒内再次按下则退出。 |
| `app.exit` | `ctrl+d` | 退出并将当前提示词保存为草稿。 |
| `app.suspend` | `ctrl+z` | 在 POSIX 系统上挂起 omp；用 `fg` 恢复。 |
| `app.display.reset` | `alt+l` | 重置并重新绘制终端显示。 |
| `app.thinking.cycle` | `shift+tab` | 循环切换思考级别。 |
| `app.thinking.toggle` | `ctrl+t` | 显示或隐藏思考块。 |
| `app.model.cycleForward` | `ctrl+p` | 向前循环角色模型：slow、default、smol。 |
| `app.model.cycleBackward` | `shift+ctrl+p` | 向后循环角色模型。 |
| `app.model.selectTemporary` | `alt+p` | 为本次会话选择一个临时模型。 |
| `app.model.select` | `alt+m` | 打开模型选择器并设置模型角色。 |
| `app.tools.expand` | `ctrl+o` | 展开或折叠工具输出。 |
| `app.tools.toggleVisibility` | `ctrl+shift+o` | 显示或隐藏工具活动。 |
| `app.editor.external` | `ctrl+g` | 用 `$VISUAL` 编辑草稿，回退到 `$EDITOR`。 |
| `app.message.followUp` | `ctrl+q`、`ctrl+enter` | 排队一条后续消息。 |
| `app.retry` | `alt+r` | 重试上一次失败的助手轮次。 |
| `app.message.dequeue` | `alt+up`、`shift+up` | 将最近排队的一条消息移回编辑器。 |
| `app.clipboard.pasteImage` | Linux：`ctrl+v`；macOS：`ctrl+v`、`super+v`；Windows：`ctrl+v`、`alt+v` | 从剪贴板粘贴图片；若没有图片则粘贴文本。 |
| `app.clipboard.pasteTextRaw` | `ctrl+shift+v`、`alt+shift+v` | 粘贴文本而不折叠大型粘贴内容。 |
| `app.clipboard.copyLine` | `alt+shift+l` | 复制当前提示词行。 |
| `app.clipboard.copyPrompt` | `alt+shift+c` | 复制整个提示词。 |
| `app.agents.hub` | `alt+a` | 打开或关闭 Agent Hub。 |
| `app.session.observe` | `ctrl+s` | 使用旧的 session-observe 按键组合打开或关闭 Agent Hub。 |
| `app.session.new` | Unbound | 开始一个新会话，类似 `/new`。 |
| `app.session.tree` | Unbound | 打开会话树。 |
| `app.session.fork` | Unbound | 打开用于分叉会话的消息选择器。 |
| `app.session.resume` | Unbound | 打开会话恢复选择器。 |
| `app.plan.toggle` | `alt+shift+p` | 切换 Plan 模式。 |
| `app.history.search` | `ctrl+r` | 搜索提示词历史。 |
| `app.stt.toggle` | Unbound | 切换语音转文字录制。默认情况下，启用语音转文字后，按住 Space 录制，松开即转写。 |
| `app.live.toggle` | `ctrl+l` | 开始或停止实时语音模式，类似 `/live`。 |

在空编辑器中双击 Left，当存在可展示的 Agent 时也会打开 Agent Hub。该手势是固定的，而非可重映射的动作。

## 完整的编辑器与选择器默认值

### 编辑器导航与编辑

| 动作 ID | 默认值 | 动作 |
| --- | --- | --- |
| `tui.editor.cursorUp` | `up` | 上移光标；主编辑器为空时浏览较早的提示词历史。 |
| `tui.editor.cursorDown` | `down` | 下移光标或浏览较新的提示词历史。 |
| `tui.editor.cursorLeft` | `left`、`ctrl+b` | 向左移动一个字符。 |
| `tui.editor.cursorRight` | `right`、`ctrl+f` | 向右移动一个字符。 |
| `tui.editor.cursorWordLeft` | `alt+left`、`ctrl+left`、`alt+b` | 向左移动一个词。 |
| `tui.editor.cursorWordRight` | `alt+right`、`ctrl+right`、`alt+f` | 向右移动一个词。 |
| `tui.editor.cursorLineStart` | `home`、`ctrl+a` | 移到行首。 |
| `tui.editor.cursorLineEnd` | `end`、`ctrl+e` | 移到行尾。 |
| `tui.editor.jumpForward` | `ctrl+]` | 读取一个字符，然后向前跳到该字符处。 |
| `tui.editor.jumpBackward` | `ctrl+alt+]` | 读取一个字符，然后向后跳到该字符处。 |
| `tui.editor.pageUp` | `pageUp` | 在编辑器中上移一页。 |
| `tui.editor.pageDown` | `pageDown` | 在编辑器中下移一页。 |
| `tui.editor.deleteCharBackward` | `backspace` | 删除光标前的字符。 |
| `tui.editor.deleteCharForward` | `delete`、`ctrl+d` | 删除光标后的字符。在主 omp 编辑器中，`app.exit` 占用了 `ctrl+d`，因此请使用 Delete。 |
| `tui.editor.deleteWordBackward` | `ctrl+w`、`alt+backspace`、`ctrl+backspace`、`super+alt+backspace` | 删除前一个词。 |
| `tui.editor.deleteWordForward` | `alt+delete`、`alt+d`、`super+alt+delete`、`super+alt+d` | 删除后一个词。 |
| `tui.editor.deleteToLineStart` | `ctrl+u` | 删除到行首。 |
| `tui.editor.deleteToLineEnd` | `ctrl+k` | 删除到行尾。 |
| `tui.editor.yank` | `ctrl+y` | 插入最近删除的文本。 |
| `tui.editor.yankPop` | `alt+y` | 将上一次 yank 替换为前一条被删文本条目。 |
| `tui.editor.undo` | `ctrl+-`、`ctrl+_` | 撤销上一次编辑。 |
| `tui.editor.spellingSuggestions` | `ctrl+.` | 显示拼写替换建议。 |

### 通用输入与选择

| 动作 ID | 默认值 | 动作 |
| --- | --- | --- |
| `tui.input.newLine` | `shift+enter`、`ctrl+j` | 插入换行。Alt+Enter 也是内置的换行回退方式。 |
| `tui.input.submit` | `enter` | 提交输入。 |
| `tui.input.tab` | `tab` | Tab 或接受自动补全。 |
| `tui.input.copy` | `ctrl+c` | 在支持选择的输入中复制所选内容。 |
| `tui.select.up` | `up` | 将选择器中的选项上移。 |
| `tui.select.down` | `down` | 将选择器中的选项下移。 |
| `tui.select.pageUp` | `pageUp` | 将选择器中的选项上移一页。 |
| `tui.select.pageDown` | `pageDown` | 将选择器中的选项下移一页。 |
| `tui.select.confirm` | `enter` | 确认选择器中的选项。 |
| `tui.select.cancel` | `escape`、`ctrl+c` | 取消选择器。 |

## 重映射快捷键

按键绑定与主设置文件相互独立：

*   默认 profile：`~/.omp/agent/keybindings.yml`
*   命名 profile：`~/.omp/profiles/<name>/agent/keybindings.yml`
*   自定义的默认 profile agent 目录：`$PI_CODING_AGENT_DIR/keybindings.yml`

命名 profile 会继承默认 profile 的绑定，然后逐动作地覆盖它们。有关 profile 与目录配置，请参阅[设置](./settings.md)。

如果文件不存在请创建它。它是一个 YAML 映射，将精确的动作 ID 映射到一个按键组合、一个按键组合数组或一个空数组：

```
# ~/.omp/agent/keybindings.yml
app.model.cycleForward: f6
app.plan.toggle: f7
tui.editor.undo: [ctrl+-, ctrl+_]
app.history.search: []
```

重映射会**替换**该动作完整的默认列表，而不是在它基础上追加。想保留的任何默认值请重复列出。空数组会禁用该动作。

保存文件后重新启动 `omp`。运行 `/hotkeys` 验证诸如 `app.model.cycleForward` 之类的应用动作；要验证编辑器与选择器动作，请直接按键测试——它们的 `/hotkeys` 行仍只是一份精简的默认值指南。

### 按键组合语法

*   按键组合是用 `+` 连接的同时按下的按键，例如 `ctrl+p`、`alt+shift+p` 或 `ctrl+backspace`。不支持多步序列。
*   名称不区分大小写。编写配置文件时建议使用小写。
*   修饰键包括 `ctrl`、`shift`、`alt` 和 `super`。在 macOS 上，`alt` 表示 Option，`super` 表示 Command。
*   基础按键包括字母、数字、标点、方向键、`home`、`end`、`pageUp`、`pageDown`、`backspace`、`delete`、`insert`、`enter`、`escape`、`tab`、`space`，以及 `f1` 到 `f12`。
*   `esc` 可用作 `escape` 的别名；`return` 可用作 `enter` 的别名。
*   避免在同一上下文中为多个动作分配同一个按键组合。最终哪一个生效可能取决于当前聚焦的界面。

旧版不带命名空间的动作名称会在加载时被迁移。旧版 `keybindings.json` 会迁移为 `keybindings.yml`；`keybindings.yaml` 也接受。新配置应使用 `keybindings.yml` 以及本页中带命名空间的 ID。

## 平台与终端注意事项

*   **macOS：**虽然 omp 显示为 Option 和 Cmd，YAML 中仍应写 `alt` 和 `super`。某些终端 profile 使用 Option 进行字符组合，不会传递 Option+Up；请使用 Shift+Up 作为退队回退。
*   **Windows：**Ctrl+Z 无法挂起 omp。Windows Terminal 不会发送独立的 Ctrl+Enter，因此后续消息请使用 Ctrl+Q。如果它拦截了 Ctrl+V，请对剪贴板图片使用 Alt+V。
*   **换行：**如果终端无法区分 Shift+Enter 与 Enter，请使用 Ctrl+J 或 Alt+Enter。
*   **终端占用的按键：**你的终端、多路复用器、桌面或 shell 可能会在 omp 收到按键组合之前将其截获。请修改对应终端的绑定，或另选一个 omp 按键组合。

## 故障排查

### 重映射未生效

1.   确认你编辑的是当前生效 profile 的 agent 目录下的 `keybindings.yml`，而不是 `config.yml`。
2.   确认动作 ID 与表中的条目完全一致；动作 ID 区分大小写。
3.   重新启动 `omp`。按键绑定在交互式会话启动时加载。
4.   检查 YAML 值是否为字符串、字符串数组或 `[]`。
5.   应用动作运行 `/hotkeys`，编辑器/选择器动作则直接按键测试。

### 按键组合仍然无效

试试文档中列出的某个回退按键组合。如果回退按键有效，说明终端很可能正在消耗或规范化原始按键组合。这在 Ctrl+Enter、Shift+Enter、Option 组合键以及剪贴板按键上很常见。

还要检查 `keybindings.yml` 其余部分是否出现了同一个按键组合。在同一上下文中把它分配给两个动作会造成有歧义的重映射。

### 按键执行了不同的操作

检查当前聚焦的界面。编辑器、选择器、`/tree`、`/extensions`、`/agents` 和 Agent Hub 的控制都是区分上下文的。按 Escape 关闭当前浮层，然后回到主提示词编辑器中重试该快捷键。常用快捷键的命令替代方式请参阅[斜杠命令](./slash-commands.md)。
