# Marketplace

Marketplace 是一个 Git 仓库（或本地目录），在其根目录的 `.claude-plugin/marketplace.json` 发布单个目录文件。该目录列出 [Plugins](./plugins.md) 及其获取来源。添加一次目录后，即可通过 `name@marketplace` 安装其插件，无需记住底层 Git URL。

## 添加来源

```
/marketplace add anthropics/claude-plugins-official
/marketplace add ./my-local-marketplace
/marketplace add https://github.com/org/catalog.git
```

`omp plugin marketplace add <source>` 可在 shell 中使用。来源按形式分类：

| 来源格式 | 解析为 |
| --- | --- |
| `owner/repo` | GitHub 简写 |
| `https://….git` 或 `git@…` | Git 仓库 |
| `https://….json` | 直接目录 URL |
| `./path`、`~/path`、`/path` | 本地目录 |

omp 克隆（或读取）来源，验证 `.claude-plugin/marketplace.json`，并将目录缓存到 `~/.omp/plugins/cache/marketplaces/` 下。运行 `/marketplace update [name]` 重新拉取；`/marketplace remove <name>` 删除它。

## 浏览与安装

不带参数输入 `/marketplace` 可打开交互式浏览器。直接安装：

```
/marketplace install code-review@claude-plugins-official
/marketplace install --scope project my-plugin@my-marketplace
/marketplace install --force name@marketplace        # 重新安装
```

CLI 等效命令位于 `omp plugin install` 下。作用域默认为 **用户**（全局可用，记录在 `~/.omp/plugins/installed_plugins.json` 中）；传入 `--scope project` 仅安装到当前仓库的 `.omp/plugins/installed_plugins.json`——项目安装会遮蔽同插件的用户安装。

`omp -p '/extensions'` 列出本次会话加载的每个扩展面，包括来源插件和 Marketplace。

## 目录结构

目录必须位于仓库根目录的 `.claude-plugin/marketplace.json`。

```
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "acme-plugins",
  "owner": { "name": "Acme Corp", "email": "plugins@acme.example" },
  "description": "Official Acme plugins for omp",
  "plugins": [
    {
      "name": "acme-linter",
      "description": "Enforce Acme coding standards",
      "category": "development",
      "source": "./plugins/linter"
    }
  ]
}
```

顶层字段：`name`（小写字母数字加 `-` 和 `.`，最多 64 字符）、`owner.name` 和 `plugins` 是必填的。`description`、`owner.email` 和 `metadata.pluginRoot`（添加到相对插件来源的前缀）是可选的。

每个插件条目需要 `name` 和 `source`。可选字段：`description`、`version`、`author`、`homepage`、`category`、`tags`。

## 插件来源

每个条目的 `source` 决定 omp 从哪里获取插件：

| 形式 | 结构 |
| --- | --- |
| 相对路径 | `"./plugins/foo"` — Marketplace 仓库的子目录 |
| Git URL | `{ "source": "url", "url": "…​.git", "ref": "main", "sha": "…​" }` |
| GitHub 简写 | `{ "source": "github", "repo": "org/repo", "ref": "v1.0" }` |
| Git 子目录 | `{ "source": "git-subdir", "url": "…", "path": "packages/foo" }` |
| npm | `{ "source": "npm", "package": "@scope/foo", "version": "1.2.0" }` |

锁定 `sha` 可将插件固定到确切提交。逃逸 Marketplace 根目录的相对路径和逃逸克隆仓库的子目录路径会被拒绝。

## 编写 Marketplace

创建一个具有以下布局的 Git 仓库：

```
my-marketplace/
  .claude-plugin/
    marketplace.json
  plugins/
    my-plugin/        ← 插件目录树，参见 /docs/plugins
```

一个可用的 `marketplace.json` 最简如下：

```
{
  "name": "my-marketplace",
  "owner": { "name": "Your Name" },
  "plugins": [
    { "name": "my-plugin", "source": "./plugins/my-plugin" }
  ]
}
```

推送到 GitHub 并分享 `owner/repo` 字符串。用户运行 `/marketplace add owner/repo`，然后 `/marketplace install my-plugin@my-marketplace`。先用 `/marketplace add ./my-marketplace` 在本地测试——本地目录是一等来源。

## 信任

Marketplace 是一个指针列表；在你机器上运行的代码是各插件条目解析到的内容。没有签名、没有沙箱、没有中央审查。目录可以发布一个注册了在每次提示时触发的 [Hooks](./hooks.md) 的插件，或模型可以无需确认调用的[自定义工具](./custom-tools.md)。

在 `/marketplace add` 之前审查目录仓库。在 `install` 之前审查每个插件的源码。锁定到 `sha` 或带标签的 `ref`，而非跟踪 `main`。对于你未亲自阅读过的代码，优先使用 `--scope project`。

## 相关

- [Plugins](./plugins.md) — Marketplace 分发的单元。
- [Skills](./skills.md) — 插件通常打包的按需操作手册。
- [Hooks](./hooks.md) — 插件可以注册的生命周期代码；添加 Marketplace 前需要审查的主要原因。
