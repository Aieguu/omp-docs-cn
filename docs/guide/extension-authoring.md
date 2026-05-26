# 扩展编写

## 什么是扩展包

扩展是一个包含 `package.json` 清单、一个或多个 TypeScript 工厂模块以及你想一起发布的各种能力文件夹的目录。运行时部分——`pi.registerTool`、`pi.registerCommand` 和 `pi.on` 实际运行的内容——就是清单指向的工厂模块。目录中的其他内容（Skills、Hooks、自定义工具、Prompt 模板、`mcp.json`、主题）在包进入加载路径后会由 omp 现有的发现面自动拾取。清单是唯一必须存在的文件；其余都是约定。

本页介绍打包方式。各个扩展面的详情请参见 [Skills](./skills.md)、[Hooks](./hooks.md)、[自定义工具](./custom-tools.md) 和 [MCP](./mcp.md)。

## 清单

omp 从 `package.json` 中读取一个字段：`omp.extensions`。它是一个入口路径数组，每个路径相对于包根目录解析。每个路径是一个 `.ts` 或 `.js` 模块，默认导出一个接收 `ExtensionAPI` 的工厂函数。

```
{
  "name": "my-extension",
  "version": "0.1.0",
  "omp": {
    "extensions": ["./src/main.ts"]
  }
}
```

一个包可以声明多个入口——当一个捆绑包想要将安全 Hook 与生产力工具分开时很有用：

```
{
  "omp": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"]
  }
}
```

遗留键 `pi.extensions` 仍以相同形式被接受；新包应使用 `omp.extensions`。

## 目录布局

omp 通过目录名而非清单字段发现能力。如果你在工厂旁放置了约定文件夹，它们会被加载，就像用户自己将它们放在 `~/.omp/agent/` 下一样。

```
my-extension/
  package.json          ← omp.extensions 清单
  src/
    main.ts             ← 扩展工厂（注册工具、命令、事件）
  skills/
    my-skill/
      SKILL.md          ← 按需操作手册
  hooks/
    pre/
      block-rm.ts       ← 遗留 HookAPI 模块
  tools/
    my-tool/
      index.ts          ← 自定义工具工厂
  prompts/
    review.md           ← Prompt 模板
  mcp.json              ← 额外的 MCP 服务器
  themes/
    midnight.json       ← 主题
  README.md
```

子发现规则与独立扩展面一致：Skill 在 `skills/` 下一层目录，Hook 在 `hooks/pre/` 和 `hooks/post/`，自定义工具在 `tools/<name>/index.ts`。`src/main.ts` 中的工厂在这些之上额外运行，而非替代它们。

## 完整示例

一个注册一个工具、一个斜杠命令并发布一个 Skill 的最小包：

```
{
  "name": "@acme/notes",
  "version": "1.0.0",
  "description": "Notes search tool plus a writing-style skill",
  "omp": {
    "extensions": ["./src/main.ts"]
  }
}
```

```
// src/main.ts
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function notes(pi: ExtensionAPI) {
  const { z } = pi.zod;

  pi.registerCommand("notes", {
    description: "Open today's note",
    handler: async (_args, ctx) => ctx.ui.notify("Opened notes", "info"),
  });

  pi.registerTool({
    name: "search_notes",
    label: "Search Notes",
    description: "Full-text search through project notes",
    parameters: z.object({ query: z.string() }),
    async execute(_id, params) {
      return {
        content: [{ type: "text", text: `Searched: ${params.query}` }],
        details: { query: params.query },
      };
    },
  });
}
```

`skills/notes-style/SKILL.md` 和其他约定文件夹无需额外配置——放入后 omp 在包进入加载路径时会自动发现它们。

## 本地测试

开发时加载包的三种方式。从运行时角度看，这三种方式等价；选择适合你迭代方式的即可。

- **在设置中指向目录。** 将绝对路径添加到 `~/.omp/agent/config.yml` 的 `extensions` 中：

  ```
  extensions:
    - /path/to/my-extension
  ```

- **通过 CLI 一次性加载。** `omp --extension ./my-extension` 为单个会话加载包。`--hook` 是不同名称下的同一标志。

- **作为插件安装。** `omp install ./my-extension`（或 `-l ./my-extension` 用于项目作用域）将目录符号链接到插件集并监视其变更——当你想在真实工具集中试用时，这是正确的选择。参见 [Plugins](./plugins.md)。

用 `omp -p '/extensions'` 确认加载了什么。用 `--log-level debug` 运行可查看按扩展面的加载日志。

## 通过 Marketplace 发布

Marketplace 是一个 Git 仓库，带有 `.claude-plugin/marketplace.json` 目录，列出一个或多个包。版本和元数据存在于目录中——`name`、`version`、`author`、`category`、`tags`、`homepage`——而非包本身。指向同一仓库中同级目录的最小条目：

```
{
  "name": "acme-plugins",
  "owner": { "name": "Acme Corp" },
  "plugins": [
    {
      "name": "notes",
      "version": "1.0.0",
      "category": "productivity",
      "source": "./plugins/notes"
    }
  ]
}
```

推送仓库；用户通过 `omp marketplace add owner/repo` 添加，通过 `omp install notes@acme-plugins` 安装。通过对 Marketplace 仓库打 tag 并更新目录的 `version` 字段来锁定版本——安装会尊重锁定。完整的目录 schema 和来源类型（Git URL、GitHub 简写、git-subdir、npm）请参见 [Marketplace](./marketplace.md)。

## 相关

- [Marketplace](./marketplace.md) — 目录 schema 和发布工作流。
- [Plugins](./plugins.md) — 安装、作用域和更新机制。
- [Skills](./skills.md) — `skills/` 下打包的操作手册。
- [Hooks](./hooks.md) — `hooks/` 下打包的事件拦截器。
