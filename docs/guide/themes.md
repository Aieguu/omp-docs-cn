# 主题

## 内置主题

omp 附带 65+ 调色板以及两个基线主题 `dark` 和 `light`。目录包括 Catppuccin（Mocha、Macchiato、Frappé、Latte）、Dracula、Nord、Gruvbox（dark 和 light）、Tokyo Night（Storm、Night、Day）、Poimandres、Material 变体、Solarized、Rose Pine、One Dark、Ayu、Kanagawa、Everforest、Monokai 以及 omp 原创的 `titanium`。

在 omp 内部通过 `/settings` 列出当前活跃集，然后选择一个应用。

## 切换主题

在 `/settings` 中导航到 **Theme** 并选择一个值。要在 `~/.omp/agent/config.yml` 中固定：

```
theme:
  dark: titanium
  light: light
```

插槽会自动选择：首先检测 OSC 11 背景亮度，然后 `COLORFGBG`，然后在 Zellij 路径上（OSC 11 不可靠的场景）使用原生 macOS 外观探测，最后回退到深色。

## 自定义主题

将 JSON 文件放在 `~/.omp/agent/themes/<name>.json`。去掉扩展名的文件名即为主题名。内置名称优先于同名的自定义文件——请选择唯一的名称。

```
{
  "name": "ink",
  "vars": {
    "fg": "#e6e6e6",
    "bg": "#0b0d12",
    "accent": "#7aa2f7"
  },
  "colors": {
    "text": "fg",
    "background": "bg",
    "accent": "accent",
    "error": "#f7768e",
    "success": "#9ece6a",
    "warning": "#e0af68",
    "info": "#7dcfff",
    "border": "#3a3f4b",
    "muted": "#565f89"
    /* ...remaining required tokens... */
  },
  "symbols": "unicode"
}
```

`vars` 是一个可选的调色板，你可以在 `colors` 中按名称引用。`colors` 声明完整的 UI 键集（约 67 个 token，涵盖文本、边框、状态栏、语法、diff、思考模式）。缺失的键会回退到基线主题。

## ANSI 调色板

设置 `ansi` 可覆盖 omp 在工具结果和助手渲染的 markdown 中用于终端输出的 16 色调色板：

```
{
  "ansi": {
    "black":         "#09070F",
    "red":           "#FF6B6B",
    "green":         "#5FD37F",
    "yellow":        "#ECBE24",
    "blue":          "#9362F4",
    "magenta":       "#F84FCC",
    "cyan":          "#00DBE4",
    "white":         "#C3C3CD",
    "brightBlack":   "#272432",
    "brightRed":     "#FF8C8C",
    "brightGreen":   "#7FE6A0",
    "brightYellow":  "#F4D255",
    "brightBlue":    "#B59CFF",
    "brightMagenta": "#FA8CD7",
    "brightCyan":    "#7FE9EF",
    "brightWhite":   "#F7F5EF"
  }
}
```

## UI 颜色键

必填的 `colors` token 分为以下几组：

| 分组 | 键 |
| --- | --- |
| 表面 | `background`、`backgroundElev`、`text`、`muted`、`border` |
| 状态 | `accent`、`success`、`warning`、`error`、`info` |
| 状态栏 | `statusBackground`、`statusText`、`statusAccent` |
| Diff | `diffAdd`、`diffDel`、`diffContext`、`diffHunk` |
| 语法 | `syntaxKeyword`、`syntaxString`、`syntaxNumber`、`syntaxComment`、`syntaxFunction`、`syntaxType`、`syntaxOperator` |
| 思考 | `thinking`、`thinkingMuted` |

## 符号集

`symbols` 可在 `unicode`（默认）、`nerd`（需要 Nerd Font）和 `ascii` 之间切换，用于不能正确渲染字形的终端。

## 实时重载

活跃的自定义主题文件会被监视。保存后 TUI 立即重绘。无需重启，无需重载命令。

## 相关

- [设置](./settings.md) — 在 `config.yml` 中固定主题。
- [Plugins](./plugins.md) — 将主题与其他扩展面打包。
