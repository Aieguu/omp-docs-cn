# 市场

市场让你能通过短名称安装插件，而无需自行管理每个插件的仓库。市场只是一个目录：它告诉 omp 存在哪些插件，以及它们的代码来自哪里。

先从添加一个由你信任的发布者控制的目录开始，浏览它的条目，并在评估期间以 **project**（项目）作用域安装一个插件：

```
/marketplace add anthropics/claude-plugins-official
/marketplace
/marketplace install --scope project <plugin>@claude-plugins-official
```

在交互式 TUI 中，`/marketplace` 会打开一个浏览器，显示插件名称、版本、描述及其所属市场。选择一个条目即可按默认的 user 作用域安装它；当你需要项目作用域时，请使用上面的显式安装命令。

## 选择并核验来源

omp 不会搜索中心存储库，也不会认证市场发布者。`/marketplace discover` 只搜索你已经添加的目录。请从插件发布者自己的站点或仓库获取来源，并在添加之前检查它：

1.   确认该仓库或域名属于预期的发布者。
2.   检查 `.omp-plugin/marketplace.json` 或 `.claude-plugin/marketplace.json`。
3.   顺着每个插件的 `source` 检查；受信任的目录仍可能指向另一个仓库。
4.   优先选择用 `sha` 固定到已审查提交的条目，而不是跟随移动的分支。

添加来源会拉取并校验其目录；它不会安装插件。随时列出已配置的来源，以便发现意外的或被改名的来源：

```
/marketplace list
```

在 shell 中：

```
omp plugin marketplace list
```

可接受的来源形式为：

| 来源 | 示例 | omp 的处理方式 |
| --- | --- | --- |
| GitHub 简写 | `owner/repo` | 克隆该 GitHub 仓库 |
| Git URL | `https://github.com/org/repo`、`git@github.com:org/repo.git` 或 `ssh://…` | 克隆该仓库 |
| 直接目录 URL | `https://plugins.example/marketplace.json` | 下载该 JSON 目录 |
| 本地目录 | `./marketplace`、`~/marketplace` 或绝对路径 | 直接读取该目录而不克隆 |

Git 和本地来源必须包含 `.omp-plugin/marketplace.json`（优先），或与 Claude Code 兼容的 `.claude-plugin/marketplace.json` 作为后备。直接目录 URL 无法使用 `"./plugins/linter"` 这类相对插件来源，因为没有配套的仓库树。

## 浏览与安装

添加来源后，要么打开 TUI 浏览器，要么打印可用条目：

```
/marketplace
/marketplace discover
/marketplace discover claude-plugins-official
```

shell 等效命令为：

```
omp plugin discover
omp plugin discover claude-plugins-official
```

按目录 ID `name@marketplace` 安装：

```
/marketplace install --scope project name@marketplace
/marketplace install --scope user name@marketplace
```

```
omp plugin install name@marketplace --scope project
```

默认作用域是 `user`。`--force` 会重新安装已有的插件：

```
/marketplace install --force name@marketplace
```

对于 shell 命令，市场必须已经配置好。否则，`omp plugin install name@marketplace` 可能会把该参数解释为 npm 包加版本标签。请运行 `omp plugin marketplace list`，并使用目录声明的 `name`——它可能与仓库名不同。

## 更新、升级与移除

刷新**市场**与升级**插件**是两种不同的操作：

```
/marketplace update marketplace-name   # 刷新一个目录
/marketplace update                    # 刷新每个目录
/marketplace upgrade name@marketplace  # 从其当前条目重新安装一个插件
/marketplace upgrade                   # 升级所有符合条件的市场插件
```

目录更新不会改变已安装的插件代码；升级则会。升级所有插件时，omp 会比较声明了 `version` 的条目；某个插件失败不会阻止其他插件，所以请检查报告的结果。

用以下命令列出或移除已安装的插件：

```
/marketplace installed
/marketplace uninstall --scope project name@marketplace
/plugins list
```

在 TUI 中，不带 ID 的 `/marketplace uninstall` 会打开一个选择器。shell 等效命令为：

```
omp plugin list
omp plugin uninstall name@marketplace --scope project
omp plugin upgrade name@marketplace --scope project
```

只有在决定好如何处理其已安装的插件之后，才移除目录：

```
/marketplace remove marketplace-name
```

```
omp plugin marketplace remove marketplace-name
```

移除市场会删除其注册表条目和目录缓存，但**不会**卸载已由它记录的插件。如果你不再信任或不再需要它们，请显式卸载。

## 作用域与启用状态

| 作用域 | 可见性 | 默认存储位置 |
| --- | --- | --- |
| `user` | 每个项目 | `~/.omp/plugins/installed_plugins.json` |
| `project` | 仅当前活动项目 | 最近项目中的 `.omp/plugins/installed_plugins.json` |

启用的项目安装会遮蔽同一 `name@marketplace` 的用户安装；禁用的项目安装则不会遮蔽用户的副本。当一个插件同时安装在这两个作用域中时，请传入 `--scope user` 或 `--scope project`，以卸载、升级、启用或禁用你想要的那个副本。

```
/plugins disable --scope project name@marketplace
/plugins enable --scope project name@marketplace
```

```
omp plugin disable name@marketplace --scope project
omp plugin enable name@marketplace --scope project
```

项目作用域限制 omp 从哪里加载插件；它**不是**安全沙箱。插件代码仍会以与 omp 相同的操作系统权限运行。

在使用 omp 的 XDG 布局的系统上，用户注册表和缓存文件存放在有效的 XDG data/cache 根目录下，而非 `~/.omp`。`omp config init-xdg` 会创建这些目录，但不会移动现有数据，也不会设置 XDG 环境变量。

## 重新加载当前会话

交互式 TUI 中的市场命令会更新磁盘状态并使发现缓存失效，但它们不会重建正在运行的会话的每个部分。

在安装、升级、卸载、启用或禁用插件后，运行：

```
/reload-plugins
```

这会刷新技能、斜杠命令、任务 agent、能力发现和 MCP 服务器。当变更涉及自定义工具、hooks 或扩展模块时，请重启 omp 会话；这些已初始化的运行时表面无法由 `/reload-plugins` 完全重建。

shell 命令会影响未来的会话。已经运行的会话仍然需要上面提到的重新加载或重启。

## 控制自动更新

默认情况下，`marketplace.autoUpdate` 为 `notify`。启动时 omp 会刷新过期的目录并检查版本，但目前的 `notify` 模式只在调试日志中报告可用更新；它不会显示 TUI 通知。如果这不是你想要的行为，请显式选择：

```
omp config get marketplace.autoUpdate
omp config set marketplace.autoUpdate off
omp config set marketplace.autoUpdate auto
```

| 值 | 启动时的行为 |
| --- | --- |
| `off` | 不检查市场插件 |
| `notify` | 检查并把可用更新写入调试日志；这是默认值 |
| `auto` | 检查并自动升级可用的插件 |

当你需要在每个代码变更运行之前进行审查时，请使用 `off`，或手动执行 `/marketplace update` 加 `/marketplace upgrade`。`auto` 允许发布者在没有手动审批步骤的情况下交付更新的插件代码。

## 安全模型

市场与插件不受 omp 的签名、沙箱隔离或中央审查。安装插件可以添加技能和命令，但也可能添加 hooks、自定义工具、agents、MCP 或 LSP 服务器以及扩展模块。这些表面可能会运行进程、访问文件、发起网络请求，或在会话期间自动行动。

安装之前：

*   同时审查目录条目和解析后的插件来源；
*   检查 hooks、服务器命令、扩展模块和包安装脚本；
*   将声明的 `sha` 与你审查过的提交核对；
*   使用项目作用域来限制在其他地方的意外加载，但不要把它当作权限边界；
*   对于你无法信任其未来变更的来源，请避免自动升级。

`--force` 只会重新安装插件。它不会执行额外的校验。

## 故障排查

### 来源添加成功但没有插件出现

运行 `/marketplace update <name>`，再运行 `/marketplace discover <name>`。目录的顶层 `name` 就是命令名。即使目录的其余部分可用，无效的插件条目也会被跳过，因此请检查日志以及条目必填的 `name` 和 `source` 字段。

### 找不到目录

对于仓库或本地目录，请把目录放在仓库根目录的 `.omp-plugin/marketplace.json` 或 `.claude-plugin/marketplace.json`。相对本地路径要以 `./` 开头；裸目录名不会被识别为本地来源。

### 安装后看不到

运行 `/marketplace installed` 确认 ID 和作用域，然后运行 `/reload-plugins`。如果是工具、hooks 或扩展模块，请重启会话。如果两个作用域包含相同的 ID，`/plugins list` 会显示哪个副本处于活动状态或被遮蔽。

### 更新没有改变插件

`/marketplace update` 只刷新目录。请运行 `/marketplace upgrade name@marketplace` 来更新已安装的代码，然后重新加载或重启会话。

## 发布一个市场

市场作者会发布一个带目录以及一个或多个可安装[插件树](./plugins.md)的 Git 仓库：

```
my-marketplace/
  .omp-plugin/
    marketplace.json
  plugins/
    my-plugin/
```

为 omp 使用 `.omp-plugin/marketplace.json`。当你还需要与 Claude Code 兼容时，改用 `.claude-plugin/marketplace.json`；当不存在 `.omp-plugin` 目录时，omp 会读取它。

最小的有效目录是：

```
{
  "name": "my-marketplace",
  "owner": { "name": "Your Name" },
  "plugins": [
    {
      "name": "my-plugin",
      "description": "What this plugin adds",
      "version": "1.0.0",
      "source": "./plugins/my-plugin"
    }
  ]
}
```

顶层必须包含 `name`、`owner.name` 和 `plugins`。每个插件都必须有 `name` 和 `source`。市场名和插件名必须以小写字母或数字开头和结尾，只能包含小写字母、数字、`-` 和 `.`，且最多 64 个字符。

相对来源必须以 `./` 开头并保持在市场仓库内部。外部插件可使用 `github`、`url` 或 `git-subdir` 来源对象，并带可选的 `ref` 和 `sha`；要获得可重现的安装，请固定 `sha`。npm 来源对象会被目录解析器接受，但目前无法安装。

发布前先在本地测试完整的消费者工作流：

```
/marketplace add ./my-marketplace
/marketplace discover my-marketplace
/marketplace install --scope project my-plugin@my-marketplace
/reload-plugins
```

然后推送仓库并分享它的 `owner/repo` 简写。消费者可以审查该仓库、添加它，并按目录名安装。

## 相关

*   [Plugins](./plugins.md) — 插件布局、加载与生命周期。
*   [Skills](./skills.md) — 插件可以随附的按需操作手册。
*   [Hooks](./hooks.md) — 安装前需要检查的自动生命周期代码。
*   [自定义工具](./custom-tools.md) — 插件可以添加的可执行能力。
