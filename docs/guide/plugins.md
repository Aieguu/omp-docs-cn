# Plugins

## 四个命令

| 命令 | 效果 |
| --- | --- |
| `omp install <source>` | 将插件安装到 `~/.omp/plugins/`。 |
| `omp remove <name>` | 卸载插件并注销其各扩展面。 |
| `omp update [name]` | 重新拉取单个插件或所有已安装插件。 |
| `omp list` | 显示所有已安装插件及其来源、版本和作用域。 |

向 `install`/`remove`/`update` 传入 `-l`（或 `--scope project`）可在当前仓库的 `.omp/plugins/` 上操作。项目安装会遮蔽同插件的用户安装。将 `.omp/plugins/installed_plugins.json` 提交以与团队共享插件集，而不强制影响其全局配置。

## 来源

每个 `omp install` 来源解析为以下之一：

**npm 包**

`omp install @scope/plugin-foo`。裸名和作用域名均可；语义化版本范围以 `name@^1.2` 形式接受。

**Git 仓库**

`omp install github:user/repo`、`omp install https://github.com/user/repo.git`，或带引用的 Git URL：`user/repo#tag`。

**本地路径**

`omp install ./path/to/plugin` — 开发时很有用。omp 创建目录符号链接并监视其变更。

**Marketplace 插件**

`omp install code-review@claude-plugins-official` — `name@marketplace` 形式，前提是先通过 `omp marketplace add <source>` 添加目录。

## Marketplace 目录

Marketplace 是一个 Git 仓库（或本地目录），其根部有 `.claude-plugin/marketplace.json` 目录文件。添加后即可通过短名称安装其插件集。

```
omp marketplace add anthropics/claude-plugins-official
omp marketplace discover           # 浏览目录中的插件
omp install code-review@claude-plugins-official
omp list                           # 所有已安装内容，npm + marketplace
```

Marketplace 接口兼容 Claude Code——现有目录可以直接使用。交互式等效入口在 omp 内部位于 `/marketplace` 和 `/plugins` 下；参见[斜杠命令](./slash-commands.md)。

## 插件可以打包的内容

插件的根布局与扩展目录结构一致。每个子文件夹都是可选的。

```
my-plugin/
  plugin.json              # name, version, description, entry points
  skills/<name>/SKILL.md   # → /docs/skills
  commands/<name>.md       # → /docs/prompt-templates
  hooks/pre/*.ts           # → /docs/hooks
  hooks/post/*.ts
  tools/<name>/index.ts    # → /docs/custom-tools
  mcp.json                 # → /docs/mcp
  themes/<name>.json       # → /docs/themes
  README.md
```

安装时，omp 将每个子目录合并到其对应的发现面。插件的 `mcp.json` 贡献额外的 `mcpServers` 条目；其 `themes/` 目录贡献额外的主题文件；以此类推。卸载时会撤销所有这些。

## 打包的扩展面——快捷链接

- [Skills](./skills.md) — `skills/<name>/SKILL.md` 下的按需操作手册。
- [Prompt 模板](./prompt-templates.md) — `commands/` 下的 Markdown 斜杠命令。
- [Hooks](./hooks.md) — `hooks/pre/` 和 `hooks/post/` 下的生命周期处理器。
- [自定义工具](./custom-tools.md) — `tools/<name>/index.ts` 下带 TypeBox schema 的工具。
- [MCP 服务器](./mcp.md) — 通过插件的 `mcp.json` 添加的 `mcpServers` 条目。
- [主题](./themes.md) — `themes/<name>.json` 下的调色板。

## 列出已加载内容

`omp list` 显示已安装的插件；`omp -p '/extensions'` 显示按扩展面分类的视图——当前会话解析的每个 Skill、命令、Hook、工具、MCP 服务器和主题，以及提供它们的插件或目录。

## 安全

> 插件可以注册在每次提示时运行的 Hook、模型可以无需确认调用的自定义工具，以及使用你的 token 与远程服务通信的 MCP 服务器。仅从你信任的来源安装——你每一轮都在运行任意 TypeScript。

安装前审计插件：克隆源码，阅读其 `hooks/` 和 `tools/`，浏览其 `mcp.json`。对于你未审查过的代码，优先使用项目作用域安装（`-l`），并锁定到特定的 Git tag 或 npm 版本，而非跟踪 `main`。同样的注意事项也适用于 Marketplace 目录——添加前先审查目录仓库。

## 相关

- [斜杠命令](./slash-commands.md) — `/marketplace` 和 `/plugins` 交互式入口。
- [设置](./settings.md) — 通过 `disabledExtensions` 按插件启用/禁用。
