# 主题

主题控制 TUI 的文本、背景、边框、Markdown、语法高亮、diff、输入模式、状态行与符号。选择主题最快的方式是 `/settings`：展开 **Appearance（外观）**，然后选择 **Dark Theme（深色主题）** 或 **Light Theme（浅色主题）**。在列表中上下移动时会即时预览每个内置或已安装的主题。按 Enter 保留当前高亮的主题，或按 Escape 恢复之前的主题。

## 跟随终端外观

omp 没有一个固定的“系统”调色板。它保留一个深色主题槽位和一个浅色主题槽位，然后使用与终端背景匹配的那个槽位。默认值分别是：深色背景用 `titanium`，浅色背景用 `light`。

可在 `/settings` 中设置这两个槽位，也可在当前生效的 agent 配置中设置：

```
# ~/.omp/agent/config.yml
theme:
  dark: titanium
  light: light
```

omp 根据终端上报的 OSC 11 背景色来决定使用哪个槽位，其次看 `COLORFGBG`。在 macOS 的 Zellij 环境下 OSC 11 不可靠，此时可使用 macOS 外观。若以上都不可用，则选择深色槽位。外观变化会在交互式 TUI 运行期间被重新评估。

内置列表包含 `dark`、`light`、`titanium`、以终端为导向的调色板（如 `dark-terminal`），以及许多具名的深色与浅色调色板。请把 `/settings` 列表当作你所安装版本的权威目录，而不是从其它版本复制名称。

## 创建并安装自定义主题

自定义主题是放在当前生效 agent 目录中的一个 JSON 文件：

*   默认档案(profile)：`~/.omp/agent/themes/<name>.json`
*   命名档案(profile)：`~/.omp/profiles/<profile>/agent/themes/<name>.json`
*   自定义 agent 目录：`$PI_CODING_AGENT_DIR/themes/<name>.json`

项目本地的主题文件不会被扫描。去掉 `.json` 的文件名就是选择名称；请让 JSON 里的 `name` 使用相同的值。若内置主题与自定义文件同名，内置主题优先。

先创建目录，再把下面这份完整的最小主题保存为 `~/.omp/agent/themes/ink.json`：

```
mkdir -p ~/.omp/agent/themes
```

```
{
  "name": "ink",
  "vars": {
    "fg": "#e6edf3",
    "muted": "#8b949e",
    "dim": "#6e7681",
    "accent": "#79c0ff",
    "green": "#56d364",
    "red": "#ff7b72",
    "yellow": "#e3b341",
    "purple": "#d2a8ff",
    "panel": "#161b22",
    "selected": "#26364a",
    "border": "#30363d"
  },
  "colors": {
    "accent": "accent",
    "border": "border",
    "borderAccent": "accent",
    "borderMuted": "border",
    "success": "green",
    "error": "red",
    "warning": "yellow",
    "muted": "muted",
    "dim": "dim",
    "text": "fg",
    "thinkingText": "muted",

    "selectedBg": "selected",
    "userMessageBg": "panel",
    "customMessageBg": "panel",
    "toolPendingBg": "panel",
    "toolSuccessBg": "#14251a",
    "toolErrorBg": "#2d1719",
    "statusLineBg": "panel",

    "userMessageText": "fg",
    "customMessageText": "fg",
    "customMessageLabel": "accent",
    "toolTitle": "fg",
    "toolOutput": "muted",

    "mdHeading": "accent",
    "mdLink": "accent",
    "mdLinkUrl": "muted",
    "mdCode": "yellow",
    "mdCodeBlock": "fg",
    "mdCodeBlockBorder": "border",
    "mdQuote": "muted",
    "mdQuoteBorder": "border",
    "mdHr": "border",
    "mdListBullet": "accent",

    "toolDiffAdded": "green",
    "toolDiffRemoved": "red",
    "toolDiffContext": "muted",

    "syntaxComment": "muted",
    "syntaxKeyword": "purple",
    "syntaxFunction": "accent",
    "syntaxVariable": "fg",
    "syntaxString": "green",
    "syntaxNumber": "yellow",
    "syntaxType": "accent",
    "syntaxOperator": "red",
    "syntaxPunctuation": "muted",

    "thinkingOff": "dim",
    "thinkingMinimal": "muted",
    "thinkingLow": "accent",
    "thinkingMedium": "green",
    "thinkingHigh": "yellow",
    "thinkingXhigh": "purple",
    "bashMode": "green",
    "pythonMode": "yellow",

    "statusLineSep": "dim",
    "statusLineModel": "purple",
    "statusLinePath": "accent",
    "statusLineGitClean": "green",
    "statusLineGitDirty": "yellow",
    "statusLineContext": "accent",
    "statusLineSpend": "muted",
    "statusLineStaged": "green",
    "statusLineDirty": "yellow",
    "statusLineUntracked": "red",
    "statusLineOutput": "fg",
    "statusLineCost": "yellow",
    "statusLineSubagents": "purple"
  },
  "symbols": {
    "preset": "unicode"
  }
}
```

安装文件后打开 `/settings`，为 **Dark Theme** 选择 `ink`。如果你创建文件时设置列表已经打开，请关闭后重新打开；若新名称仍未出现，请重启 omp。若要使用自定义浅色调色板，请针对浅色终端背景来设计，然后为 **Light Theme** 选择它。

## 文件格式与颜色值

`name` 与 `colors` 是必需的。`vars`、`export` 与 `symbols` 可选。

每个颜色都可以是：

*   `"#RRGGBB"`，用于 RGB 颜色；
*   `0` 到 `255` 之间的整数，用于 ANSI 256 色调色板索引；
*   `vars` 中某个条目的名称（引用可嵌套）；或
*   `""`，使用终端的默认前景色或背景色。

缺失的变量引用与循环变量引用都是错误。十六进制颜色在支持的终端上以真彩色输出，否则转换为 256 色。数值总是寻址终端的 256 色调色板，因此它们的具体外观取决于终端。内置的 `dark-terminal` 是一个有用的兼容性起点，而 `""` 让终端自己掌握基础前景色或背景色。

下面这些 `colors` 键全部是必需的，只有 `thinkingMax` 可选——缺失时回退到 `thinkingXhigh`：

| 区域 | Tokens |
| --- | --- |
| 核心 | `accent`, `border`, `borderAccent`, `borderMuted`, `success`, `error`, `warning`, `muted`, `dim`, `text`, `thinkingText` |
| 背景 | `selectedBg`, `userMessageBg`, `customMessageBg`, `toolPendingBg`, `toolSuccessBg`, `toolErrorBg`, `statusLineBg` |
| 消息与工具文本 | `userMessageText`, `customMessageText`, `customMessageLabel`, `toolTitle`, `toolOutput` |
| Markdown | `mdHeading`, `mdLink`, `mdLinkUrl`, `mdCode`, `mdCodeBlock`, `mdCodeBlockBorder`, `mdQuote`, `mdQuoteBorder`, `mdHr`, `mdListBullet` |
| Diff | `toolDiffAdded`, `toolDiffRemoved`, `toolDiffContext` |
| 语法 | `syntaxComment`, `syntaxKeyword`, `syntaxFunction`, `syntaxVariable`, `syntaxString`, `syntaxNumber`, `syntaxType`, `syntaxOperator`, `syntaxPunctuation` |
| 思考与输入模式 | `thinkingOff`, `thinkingMinimal`, `thinkingLow`, `thinkingMedium`, `thinkingHigh`, `thinkingXhigh`, 可选 `thinkingMax`, `bashMode`, `pythonMode` |
| 状态行 | `statusLineSep`, `statusLineModel`, `statusLinePath`, `statusLineGitClean`, `statusLineGitDirty`, `statusLineContext`, `statusLineSpend`, `statusLineStaged`, `statusLineDirty`, `statusLineUntracked`, `statusLineOutput`, `statusLineCost`, `statusLineSubagents` |

### 可选导出与符号覆盖

HTML 导出的颜色可以独立提供：

```
"export": {
  "pageBg": "#0d1117",
  "cardBg": "#161b22",
  "infoBg": "#26364a"
}
```

未提供时，omp 会从主题推导导出背景色。`symbols.preset` 接受 `unicode`、`nerd` 或 `ascii`；Nerd 符号需要 Nerd Font。全局 **Symbol Preset** 设置会覆盖主题的预设。高级主题还可以替换单个符号与加载动画帧：

```
"symbols": {
  "preset": "ascii",
  "overrides": {
    "status.success": "OK",
    "nav.cursor": ">",
    "boxRound.topLeft": "+"
  },
  "spinnerFrames": {
    "status": [".", "o", "O", "o"],
    "activity": [".", "..", "..."]
  }
}
```

覆盖键使用 UI 符号词汇，包括 `status.*`、`nav.*`、`tree.*`、`boxRound.*`、`boxSharp.*`、`sep.*`、`icon.*`、`thinking.*`、`md.*`、`lang.*`、`tab.*` 与 `tool.*`。未知键会被忽略。`spinnerFrames` 也可以是一个非空字符串数组，同时应用于两个 spinner；在对象形式中，`status` 与 `activity` 各自可选，但至少须有一个存在且非空。

## 重新加载并检查可读性

一旦某个已安装的自定义主题在交互式会话中生效，omp 就会监视该文件。保存合法的 JSON 会在短暂防抖后重绘 TUI；没有重载命令。文件暂时缺失、格式错误或不完整时，屏幕会保留最后一次成功加载的版本。请修复后再次保存。内置主题是嵌入式的，不会被监视。

在保留某个主题之前，请检查普通对话文本、选中行、Markdown 链接与代码、pending/success/error 工具块、diff、语法、每种思考级别、bash 与 Python 模式，以及全部状态行片段。尤其是：

*   让前景色与背景色保持高对比度，包括弱化文本与选中行；
*   让错误、警告与新增内容不仅能靠色相区分，也能靠亮度区分；
*   若主题将被共享，请在真彩色终端与 256 色终端上各测试一次；
*   若边框或图标字形以错误的宽度渲染，请选择 `ascii`；
*   需要时在 `/settings` 中开启 **Color Blind Mode**。它会将 `toolDiffAdded` 的十六进制绿色向蓝色偏移；不会改写其余调色板。

## 故障排查

**主题没有出现在列表中。** 请确认文件直接位于当前生效 agent 的 `themes` 目录中、以 `.json` 结尾，并且在打开设置列表时已经存在。项目的 `.omp/themes` 目录不是主题来源。

**加载的是另一个主题。** 不要复用内置名称：内置主题优先。同时请检查你是否在 omp 当前检测到浅色背景时改了深色槽位，或反之。

**选择时报缺少颜色。** 自定义主题需要上面列出的完整 token 集。只有 `thinkingMax` 单独可选。

**选择时报颜色或变量无效。** 请使用 `#RRGGBB`、`0`–`255`、`""`，或一个可解析的 `vars` 名称。检查 JSON 语法、缺失的变量与引用循环。

**启动时回退到 `dark`。** 配置的主题无法找到或未通过校验。请修复所选文件，或在 `/settings` 中选择一个内置主题；初始加载失败时会使用内置 `dark` 回退。

**保存后没有重绘。** 实时重载只监视当前生效的自定义文件。请先选中它，再保存合法的 JSON。如果编辑器临时替换或删除了该文件，请在最终文件存在后再次保存一次。

## 相关

*   [设置](./settings.md) —— 配置文件位置与外观设置。
*   [插件](./plugins.md) —— 扩展安装与其它自定义入口。
