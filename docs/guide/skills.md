# 技能

技能会改变 **omp 处理任务的方式**：它为特定领域提供指令、约定与可选的辅助文件。它本身并不会增加权限或可执行的工具。

要使用已安装的技能，请从你真正想完成的任务开始：

```
Review this Postgres migration for locking and rollback risks.
```

在会话开始时，omp 会公布每个可用技能的名称与描述。当你的请求与某个描述匹配时，Agent 会在工作前加载该技能的完整操作手册。常规使用并不需要特殊语法。

## 查找并使用已安装的技能

在交互式 TUI 中，运行：

```
/extensions
```

打开 **Skills**，即可看到每个被发现技能的描述、状态、作用范围、Provider 与来源路径。选中一个技能并按空格或回车键，即可启用或禁用它。更改会被持久化；之后运行 `/reload-plugins`，让当前会话刷新其技能与 `/skill:` 命令。

当你希望强制使用某个特定技能而不是依赖匹配时，请显式调用它：

```
/skill:postgres Review migrations/042_add_status.sql for lock risk.
```

输入 `/skill:` 之后，技能名称会出现在 Slash 命令补全中。技能记号也可以出现在普通文本中：

```
Review migrations/042_add_status.sql with /skill:postgres and propose a safer rollout.
```

显式调用在默认情况下可用。它可以通过 `skills.enableSkillCommands: false` 禁用；此时自然的任务匹配仍然有效。隐藏的技能同样不会出现在自动匹配中，但只要启用了技能命令，它仍可通过 `/skill:<name>` 使用。

## 安装技能

独立技能只是一个包含 `SKILL.md` 的目录。把它复制到 omp 的原生位置之一：

```
~/.omp/agent/skills/<name>/SKILL.md   # 用户：每个项目
.omp/skills/<name>/SKILL.md           # 项目：该仓库/目录树
```

例如，为你自己安装一个检出的技能，可能只需要这么小的一段操作：

```
mkdir -p ~/.omp/agent/skills/postgres
cp ./postgres-skill/SKILL.md ~/.omp/agent/skills/postgres/SKILL.md
```

把操作手册引用的所有文件都放在同一个 `postgres/` 目录中。发现只深入一层：`skills/postgres/SKILL.md` 会被找到，而 `skills/databases/postgres/SKILL.md` 不会。

技能也可以随插件一起提供。浏览已配置的市场，然后按用户或项目作用范围安装该插件：

```
omp plugin discover [marketplace]
omp plugin install --scope user name@marketplace
# 或者：omp plugin install --scope project name@marketplace
```

关于添加目录、检查包、固定版本、升级与卸载插件，参见 [市场](./marketplace.md)。在复制、安装、升级或编辑技能之后，请开启一个新会话或运行 `/reload-plugins`。技能旁边捆绑的插件模块、Hook 或工具仍可能需要完全重启。

## 作用范围与信任

用户技能在每个项目中都可用。项目技能只有在 omp 于该项目目录树内启动时才会被发现；omp 还会向上遍历父目录，直到仓库边界。这让项目技能对特定仓库的工作流很有用，但也意味着你打开的仓库可以贡献指令。

把技能当作代码对待：

*   在启用之前检查 `SKILL.md` 及其引用的脚本、模板与文件；
*   检查 `/extensions` 中显示的来源，尤其是在新克隆的仓库里；
*   当第三方技能只被一个项目需要时，按项目作用范围安装它们；
*   记住，操作手册可能会指示 Agent 使用该会话已有的权限运行命令。

同名的技能不会合并。显式配置的自定义目录会覆盖默认的发现位置。否则 omp 会保留优先级最高的 Provider：原生的 `.omp`、OMP/插件包、Claude、Agent/Codex 兼容目录、OpenCode、GitHub，然后是受管的自学习技能。在被遍历的项目源码中，最近的目录胜出。请避免重名；`/extensions` 会显示哪一份副本处于活动状态、哪一份被遮蔽。

## 启用与过滤发现

当你需要临时边界时，使用单次运行的标志：

```
omp --no-skills
omp --skills 'git-*,postgres'
```

`--skills` 接受逗号分隔的 glob 模式，只保留匹配的名称。要持久控制，请编辑 `~/.omp/agent/config.yml`：

```
skills:
  enabled: true
  enableSkillCommands: true
  includeSkills:
    - "git-*"
    - postgres
  ignoredSkills:
    - "*-experimental"
  customDirectories:
    - ~/work/shared-skills
```

空的 `includeSkills` 列表会包含所有名称。`ignoredSkills` 会排除匹配的名称，即使它们同时匹配了允许列表。每个自定义目录必须按技能各含一个子目录，例如 `~/work/shared-skills/postgres/SKILL.md`。

`/extensions` 中的开关会把某个被禁用的技能以 `skill:<name>` 形式持久化到顶层的 `disabledExtensions` 设置中。单个技能的变更请优先使用该面板；等效的 YAML 是：

```
disabledExtensions:
  - skill:untrusted-skill
```

`skills` 下还提供 Provider 专属的开关：`enablePiUser`、`enablePiProject`、`enableAgentsUser`、`enableAgentsProject`、`enableClaudeUser`、`enableClaudeProject` 与 `enableCodexUser`。它们都默认为 `true`。

## 兼容位置

除 `.omp` 之外，omp 默认还会发现这些每目录一个技能的布局：

| 作用范围 | 位置 |
| --- | --- |
| 用户 | `~/.agent/skills/`, `~/.agents/skills/`, `~/.claude/skills/`, `~/.codex/skills/`, `~/.config/opencode/skills/` |
| 项目 | `.agent/skills/`, `.agents/skills/`, `.claude/skills/`, `.codex/skills/`, `.opencode/skills/`, `.github/skills/` |
| 受管 | `~/.omp/agent/managed-skills/` |

项目级的 `.agent`、`.agents` 与 `.claude` 位置会在从工作目录向仓库根目录遍历的过程中被发现。当多个兼容工具安装了同一个名称时，请使用 `/extensions`，而不是猜测。

## 创建最小的技能

在项目中创建 `.omp/skills/release-check/SKILL.md`：

```
---
description: Use when preparing or reviewing a release; verify versioning, changelog, build artifacts, and publication status.
---

# Release check

1. Identify the version and release tag.
2. Verify the changelog describes the shipped behavior.
3. Check the build artifacts before publishing.
4. Report blockers before changing a tag or publishing.
```

这就是一个完整可用的技能。目录名 `release-check` 会成为它的调用名，因此在 `/reload-plugins` 之后或在新会话中，可以用 `/skill:release-check` 来调用它。

## 编写参考

### Frontmatter

| 字段 | 必填 | 当前行为 |
| --- | --- | --- |
| `description` | `.omp`、自定义目录、插件与 GitHub 技能为必填 | 在正文加载前显示，用于决定技能是否适用。写下具体的任务动词、名词与作用范围。 |
| `name` | 否 | 覆盖用于匹配与 `/skill:<name>` 的目录名。除非兼容性要求覆盖，否则优先使用目录名。 |
| `hide` | 否 | 从自动技能列表中省略该技能，同时保留显式调用。 |
| `disable-model-invocation` | 否 | 与 Agent Skills 兼容的写法，效果与 `hide` 相同。 |

尽管某些兼容格式接受 `globs` 或 `alwaysApply` 等字段，omp 目前并不会用它们来选择或自动注入技能。把触发条件放进 `description`。对于必须始终存在的指导，请改用 [上下文文件](./context-files.md)。

有用的描述会指明：

*   动作：编写、审查、调试、迁移；
*   对象：Postgres 迁移、快照测试、发布工件；
*   需要时的边界：目录、文件类型或子系统。

```
description: Use when adding or reviewing Vitest tests in src/importer; covers fixtures, snapshots, and integration setup.
```

### 正文与辅助文件

写出直接、可操作的指令。说明该工作流在何时适用、要求的顺序、重要的安全边界，以及成功的结果包含什么。把详细的参考资料、模板或脚本放在 `SKILL.md` 旁边，并用相对于技能目录的路径引用它们：

```
release-check/
├── SKILL.md
├── references/
│   └── registry-checks.md
└── scripts/
    └── verify-artifacts.sh
```

正文只在需要时加载，因此把长篇参考材料移出始终可见的描述，可以保持普通会话精简。辅助文件不会自动执行；操作手册必须说明它们应在何时以及如何使用。
