# 插件

插件以单一受管单元的形式为 omp 添加能力。一个插件可以包含扩展代码、技能、Slash 命令、Hook、自定义工具、Agent、规则、提示词或 MCP/LSP/DAP 配置。当你想要把一组相关行为放在一起安装和管理时，请使用插件。

先从查看已经安装了哪些内容开始。在添加任何东西之前，检查它的发布者与来源：

```
omp plugin list
omp plugin install --dry-run '@scope/plugin@1.2.3'
omp plugin install '@scope/plugin@1.2.3'
omp plugin list
```

`--dry-run` 会预览 npm、Git 和本地路径安装，而不会真正安装目标。它**不**适用于市场安装；请改为在项目作用域下评估这些安装。一次成功的安装会打印解析出的名称和版本。启动一个新的 omp 会话以加载插件的全部行为，或参考[重新加载活动会话](./plugins.md)。

> **插件是可信任的代码，不是沙箱。** 项目作用域限制的是市场插件的发现范围；它并不限制该插件可以读取、写入、执行或通过网络发送什么。

## 选择安装来源

`omp plugin install` 接受以下来源形式：

| 来源 | 示例 | 安装位置 |
| --- | --- | --- |
| npm 包或版本 | `omp plugin install '@scope/plugin@1.2.3'` | 用户插件目录 |
| Git 简写，可选固定版本 | `omp plugin install 'github:org/repo#v1.4.0'` | 用户插件目录 |
| 完整的 Git URL | `omp plugin install 'https://github.com/org/repo.git#v1.4.0'` | 用户插件目录 |
| 本地目录 | `omp plugin install ./path/to/plugin` | 符号链接进用户插件目录 |
| 市场条目 | `omp plugin install --scope project plugin-name@marketplace-name` | 默认为用户作用域，或项目作用域 |

Git 简写还支持 `gitlab:`、`bitbucket:`、`codeberg:`、`sourcehut:` 和 `srht:`。完整的 HTTPS、SSH、`git://` 和 `git+…` URL 也被接受。请给包含 `#`、`[` 或 `]` 的来源加引号，以免你的 shell 去解释它们。

较短的 `omp install <source>` 命令是 `omp plugin install` 与 `omp plugin link` 的便捷封装。本页通篇使用 `omp plugin …` 形式，因为它暴露了完整的管理界面。

对于正在开发的本地插件，以下两条命令是等效的：

```
omp plugin install ./my-plugin
omp plugin link ./my-plugin
```

对源码的修改会通过符号链接保持可见，但一个已经在运行的 omp 会话在每一项改动生效前，仍然需要重新加载或重启。

## 从市场安装

市场是插件的目录，而不是插件本身。添加一个目录，检查它的条目，然后按其完整的 `name@marketplace` ID 安装一个条目：

```
omp plugin marketplace add anthropics/claude-plugins-official
omp plugin marketplace list
omp plugin discover claude-plugins-official
omp plugin install --scope project plugin-name@claude-plugins-official
omp plugin list
```

受支持的目录来源包括：

*   GitHub 简写，例如 `owner/repo`
*   HTTP(S)、SSH 或 Git 仓库 URL
*   以 `.json` 结尾的直接 HTTP(S) URL
*   本地目录，例如 `./catalog`、`~/catalog` 或 `/absolute/catalog`

Git 和本地目录使用 `.omp-plugin/marketplace.json`，并回退到与 Claude Code 兼容的 `.claude-plugin/marketplace.json`。目录浏览、来源格式与发布参见[市场](./marketplace.md)。

### 用户与项目作用域

作用域仅适用于市场安装：

*   `--scope user` 是默认值，会让插件在所有项目中可用。
*   `--scope project` 会把它记录到最近的项目 `.omp/plugins/installed_plugins.json` 中，并让它在那个项目中可用。
*   npm、Git 和链接的本地插件使用用户插件目录；为它们传入 `--scope` 会被忽略并给出警告。

启用的项目安装会遮蔽同一 `name@marketplace` ID 的已启用用户安装。被禁用的项目安装不会隐藏已启用的用户安装。如果同一个插件同时安装在两个作用域中，请在升级、禁用、启用或卸载该副本时传入 `--scope user` 或 `--scope project`。

项目作用域有助于让项目的依赖集保持独立。它**不是**安全边界：插件仍然会以与 omp 相同的操作系统权限运行。

## 查看、禁用与启用

在改变状态之前先列出列表，这样你能使用已安装的包名或完整的市场 ID：

```
omp plugin list
omp plugin list --json
```

人类可读的列表会把 npm/链接插件与市场插件分开。它对 npm/链接插件显示版本、启用状态和可选特性；市场行则包括作用域，以及项目副本是否遮蔽了用户副本。在会话内部，`/plugins` 或 `/plugins list` 会提供更简短的视图。

当你想要停止加载某个插件，但又不想删除它的文件或设置时，请禁用它：

```
# npm、Git 或链接插件；状态为全用户级
omp plugin disable @scope/plugin
omp plugin enable @scope/plugin

# 市场插件
omp plugin disable --scope project plugin-name@marketplace-name
omp plugin enable --scope project plugin-name@marketplace-name
```

在交互式会话内部，`/plugins disable` 和 `/plugins enable` 用于管理市场插件：

```
/plugins disable --scope project plugin-name@marketplace-name
/plugins enable --scope project plugin-name@marketplace-name
```

之后运行 `/reload-plugins`，或重启 omp。禁用会减少未来的加载；它无法撤销代码在当前进程中已经执行过的操作。

某些 npm/链接插件会声明可选特性。请独立于整个插件的启用状态来查看和更改这些特性：

```
omp plugin features @scope/plugin
omp plugin features @scope/plugin --enable search,web
omp plugin features @scope/plugin --disable web
omp plugin features @scope/plugin --set search
```

安装时，请给特性选择器加引号：

```
omp plugin install '@scope/plugin[search,web]'
omp plugin install '@scope/plugin[*]'
omp plugin install '@scope/plugin[]'
```

不带方括号会使用插件的默认值；`[*]` 启用每一个声明的特性，`[]` 则一个可选特性都不启用。

## 更新插件

更新行为取决于来源。

### 市场插件

刷新市场只会更新它的目录。升级是单独的一步，用来替换已安装的插件代码：

```
omp plugin marketplace update marketplace-name
omp plugin upgrade --scope project plugin-name@marketplace-name
```

省略市场名称会刷新所有目录。省略 `omp plugin upgrade` 中的插件 ID 会升级所有已安装的市场插件：

```
omp plugin marketplace update
omp plugin upgrade
```

当某个市场插件同时存在于两个作用域时，省略 `--scope` 会升级两个副本。如果某个条目失败，批量升级可能会部分成功，所以请阅读每一条结果，并随后运行 `omp plugin list`。

### npm 与 Git 插件

npm 或 Git 安装没有通用的 `omp plugin update` 命令。请重新安装你想要运行的版本或 ref：

```
omp plugin install '@scope/plugin@1.3.0'
omp plugin install 'github:org/repo#v1.5.0'
```

对于链接的本地插件，请自行更新它的源目录；符号链接不需要重新安装。当可复现性很重要时，请固定 npm 版本以及 Git 标签或提交。

## 移除插件

先预览移除结果，再按 `omp plugin list` 中显示的名称卸载：

```
omp plugin uninstall --dry-run @scope/plugin
omp plugin uninstall @scope/plugin
```

对于市场插件，请使用它的完整 ID，并在必要时指明要卸载的副本：

```
omp plugin uninstall --dry-run --scope project plugin-name@marketplace-name
omp plugin uninstall --scope project plugin-name@marketplace-name
```

卸载会移除所选作用域下该插件的注册信息和已安装文件。移除市场目录则不同：它只移除该目录及其缓存，而不会卸载已经从中安装的插件。

```
omp plugin marketplace remove marketplace-name
```

在移除了具有可执行行为的插件之后请重启 omp，或按下面的说明重新加载活动会话。

## 重新加载活动会话

Shell 命令只会改变磁盘上的插件状态；它们不会重建已经运行的 omp 进程。交互式市场更改也需要显式刷新。

运行：

```
/reload-plugins
```

这会刷新活动会话中的插件发现、技能、Slash 命令、Agent 定义、能力缓存和 MCP 连接。对于新安装或更改的扩展模块、Hook 或可执行的自定义工具，请重启 omp，因为这些已初始化的运行时组件无法在原地完整重建。如果不确定，就重启。

## 检查健康状况与设置

如果某个插件已安装却不出现在 `omp plugin list` 中、无法加载，或指向一个已被删除的本地路径，请先运行这个不改动状态的健康检查：

```
omp plugin doctor
```

阅读它的诊断结果之后，`omp plugin doctor --fix` 可以尝试修复。当另一个程序需要消费该结果时，请使用 `--json`。

插件可以声明带类型的设置。在设置某个键之前，先查看已声明的键：

```
omp plugin config list @scope/plugin
omp plugin config get @scope/plugin apiKey
omp plugin config set @scope/plugin apiKey value
omp plugin config delete @scope/plugin apiKey
omp plugin config validate
```

在 `config list`、`get`、`set` 或 `delete` 上添加 `-l` 或 `--local`，以使用当前项目的设置覆盖。清单把某个设置标记为 secret（机密）会遮蔽它的显示；它并不会把一个不受信任的插件变成受信任的代码。

## 信任清单

插件可以在 omp 的进程中运行扩展模块、围绕提示词与工具活动注册 Hook、暴露可执行工具、启动 MCP/LSP/DAP 进程，并接收已配置的凭证。请把安装当成运行来自该来源的代码来对待。

在安装或升级之前：

1.   核验发布者、仓库，以及精确的 npm 版本、Git ref 或市场条目。
2.   阅读扩展入口点、Hook、可执行工具/脚本，以及 MCP/LSP/DAP 配置。
3.   审查已安装版本与拟用版本之间的依赖与源码变更。
4.   优先使用固定的 npm 版本、Git 标签、提交或市场版本。
5.   在评估市场插件时使用项目作用域来限制发现范围，但不要把它误认为沙箱。
6.   禁用或卸载任何你不再信任的内容，然后重启 omp。

添加市场并不会执行它的插件，但目录控制着后续安装与升级从哪里获取代码。请同时信任目录维护者和每一个插件的来源。

## 插件、扩展与市场

| 术语 | 它是什么 | 用户如何管理它 |
| --- | --- | --- |
| **插件** | 一个可安装单元，可以打包 omp 的多种能力 | `omp plugin install`、`list`、`disable`、`upgrade` 和 `uninstall` |
| **扩展** | 向 omp 注册行为的运行时 TypeScript/JavaScript 代码 | 为单个会话直接加载或从配置加载，或放进插件里随插件分发 |
| **市场** | 一个为插件命名并指向其来源的目录 | `omp plugin marketplace …` 或 `/marketplace …` |

插件不一定包含扩展模块；它可以只包含声明式的内容，例如技能或 MCP 配置。反过来，你也可以直接加载扩展，而无需把它安装成受管插件。相关的运行时 API 参见[编写扩展](./extension-authoring.md)。

## 命令参考

| 命令 | 用途 |
| --- | --- |
| `omp plugin list [--json]` | 列出 npm/链接与市场插件 |
| `omp plugin install [--dry-run] [--force] <source>[features] …` | 安装 npm、Git、本地或市场来源；市场条目不支持 `--dry-run` |
| `omp install <source> …` | plugin install/link 的便捷形式 |
| `omp plugin link <path>` | 为开发目的符号链接一个本地插件 |
| `omp plugin disable <name> …` / `enable <name> …` | 持久化整个插件的启用状态 |
| `omp plugin features <name> [--enable list] [--disable list] [--set list]` | 查看或选择可选的 npm/链接插件特性 |
| `omp plugin uninstall [--dry-run] <name> …` | 移除已安装的插件 |
| `omp plugin upgrade [name@marketplace] [--scope user\|project]` | 升级一个或全部市场插件 |
| `omp plugin marketplace add <source>` | 添加市场目录 |
| `omp plugin marketplace list` | 列出已配置的目录 |
| `omp plugin marketplace update [name]` | 刷新一个或全部目录而不升级插件 |
| `omp plugin marketplace remove <name>` | 移除一个目录，而不是它的已安装插件 |
| `omp plugin discover [marketplace]` | 列出市场条目 |
| `omp plugin doctor [--fix] [--json]` | 检查插件安装的健康状况 |
| `omp plugin config <list\|get\|set\|delete> <name> … [-l]` | 管理已声明的插件设置 |
| `omp plugin config validate` | 校验每个已安装插件的设置 |

只在市场安装、启用、禁用、升级和卸载操作中使用 `--scope user|project`。`/marketplace help` 会显示对应的会话内市场命令。

## 面向插件作者

用户不应该需要理解清单就能管理插件。npm 或链接的 omp 包的作者在 `package.json` 的 `omp` 键下声明运行时入口点（旧的 `pi` 键也被接受）：

```
{
  "name": "@acme/omp-review",
  "version": "1.0.0",
  "omp": {
    "extensions": ["./src/index.ts"]
  }
}
```

包还可以使用约定俗成的 `skills/`、`commands/`、`hooks/`、`tools/`、`rules/`、`prompts/` 和 `agents/` 目录，以及 `.mcp.json` 或 `mcp.json`。可选的 `features` 和带类型的 `settings` 属于 `omp` 清单，因为上面的管理命令会读取它们。公开的扩展 API 参见[编写扩展](./extension-authoring.md)，目录清单参见[市场](./marketplace.md)。
