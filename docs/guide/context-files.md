# 上下文文件

## 一次性把项目规则交给 omp

在仓库根目录放一个 `AGENTS.md`。omp 会自动加载它，并在整个会话中持续应用，这样你就不必在每条提示词里重复构建命令、约定或安全边界。

```
# Project instructions

## Build and test
- Install dependencies with `bun install`.
- Run unit tests with `bun test`.
- Run the app with `bun run dev`.

## Conventions
- Keep public API changes backward compatible.
- Never edit generated files under `src/generated/`.
- Before finishing, run the narrowest test that covers the change.
```

在仓库内任意位置启动 omp，然后像平常一样提问：

```
Fix the failing invoice test and follow the repository instructions.
```

用 `AGENTS.md` 承载应指导该目录树下大多数工作的事实与约束。保持简短而具体：每一条被加载的指令都会消耗上下文。

## 支持的文件

所有指令文件都是纯 Markdown。它们不需要 frontmatter，也不需要配置条目。

### omp 原生文件

| 文件 | 推荐的项目位置 | 用户全局位置 | 行为 |
| --- | --- | --- | --- |
| `AGENTS.md` | `<repo>/AGENTS.md` | `~/.omp/agent/AGENTS.md` | 常规常驻指令。独立的项目文件会在不同目录层级之间组合生效。 |
| `AGENTS.md` | `<repo>/.omp/AGENTS.md` | `~/.omp/agent/AGENTS.md` | omp 专属的备选位置。在某个目录层级上，它优先于兼容的上下文文件 Provider。 |
| `RULES.md` | `<repo>/.omp/RULES.md` | `~/.omp/agent/RULES.md` | 粘性、始终应用的规则。用户与项目文件可以同时应用。 |
| `APPEND_SYSTEM.md` | `<launch-directory>/.omp/APPEND_SYSTEM.md` | `~/.omp/agent/APPEND_SYSTEM.md` | 向 omp 内置的系统指令追加文本。优先使用它，而不是替换内置指令。 |
| `SYSTEM.md` | `<launch-directory>/.omp/SYSTEM.md` | `~/.omp/agent/SYSTEM.md` | 替换 omp 内置的指令正文。项目作用范围优先于用户作用范围。仅在刻意采用不同的 Agent 人格时使用。 |

`~/.omp/agent/` 是默认的用户全局目录。使用命名档案（named profile）时，对应目录为 `~/.omp/profiles/<profile>/agent/`。自定义的 omp 配置根目录也会以同样的方式改变前缀。

对于 `SYSTEM.md` 和 `APPEND_SYSTEM.md`，最可预测的做法是从包含 `.omp/` 的目录启动 omp。它们的直接 CLI 搜索会先按以下顺序检查项目文件：

1. `<launch-directory>/.omp/`
2. `<launch-directory>/.claude/`
3. `<launch-directory>/.codex/`
4. `<launch-directory>/.gemini/`

如果这些都不存在，omp 会按相同顺序检查对应的用户目录：当前激活档案的 `agent/` 目录、当前激活的 Claude 配置目录、`~/.codex/`，然后是 `~/.gemini/`。它使用第一个匹配到的文件名。启用的发现 Provider 只有在直接搜索一无所获时，才会补充额外的 `SYSTEM.md` 位置；`APPEND_SYSTEM.md` 只使用直接搜索。

`--system-prompt` 与 `--append-system-prompt` 的优先级高于发现到的文件；每个参数既可接受字面文本，也可接受可读的文件路径。

`SYSTEM.md` 会移除内置的行为与工具使用指南，但 omp 仍会在其周围提供项目上下文、规则与环境信息。`APPEND_SYSTEM.md` 保留内置指南，因此是更安全的默认选择。

### 兼容的上下文文件

omp 可以复用来自其他 agent 生态系统的指令文件。这些是上下文文件来源，而不是额外的格式：它们的内容仍然是 Markdown。

| Provider ID | 项目来源 | 用户全局来源 | 项目发现方式 |
| --- | --- | --- | --- |
| `native` | 最近的 `.omp/AGENTS.md` | 当前激活档案的 `AGENTS.md` | 向上遍历到仓库根目录，并使用最近的 `.omp` 配置目录。 |
| `claude` | `.claude/CLAUDE.md` | 当前激活的 Claude 配置目录中的 `CLAUDE.md` | 仅启动目录。 |
| `agents` | `.agent/AGENTS.md` 或 `.agents/AGENTS.md` | `~/.agent/AGENTS.md` 或 `~/.agents/AGENTS.md` | 从启动目录向上遍历到仓库根目录。在同一层级，`.agent` 优先于 `.agents`。 |
| `codex` | — | `~/.codex/AGENTS.md` | 仅用户全局。 |
| `gemini` | `.gemini/GEMINI.md` | `~/.gemini/GEMINI.md` | 仅启动目录。 |
| `opencode` | — | `~/.config/opencode/AGENTS.md` | 仅用户全局。 |
| `github` | `.github/copilot-instructions.md` | `~/.copilot/copilot-instructions.md` | 仅启动目录。`COPILOT_HOME` 可重新定位用户来源。 |
| `agents-md` | `AGENTS.md` | — | 从启动目录向上遍历。 |

`COPILOT_CUSTOM_INSTRUCTIONS_DIRS` 还可以指定以逗号分隔的目录，这些目录中的 `AGENTS.md` 文件会被视为用户全局的 GitHub Copilot 上下文。

Cursor rules、Cline rules、`*.instructions.md` 以及类似的按路径生效的规则文件，会被作为**规则（rules）**发现，而不是一般的上下文文件。它们会单独出现在 `/extensions` 中，并按各自的条件应用。

## 发现与作用范围

omp 会从会话的工作目录解析上下文。

对于推荐的独立 `AGENTS.md` 布局，它会向上遍历并加载每一个适用的文件。在嵌套于主目录之下的仓库中，扫描可能会越过 Git 根目录继续向上，以拾取工作区指令，但会在把 `~/AGENTS.md` 当作项目上下文之前停下来。在此之外的情况下，仓库根目录就是边界。

例如，在 `repo/packages/api` 中启动 omp 可以加载：

```
~/.omp/agent/AGENTS.md       user-wide
~/work/AGENTS.md             enclosing workspace
~/work/repo/AGENTS.md        repository
~/work/repo/packages/api/AGENTS.md
```

这些文件按从最通用到最本地的顺序呈现，因此最近的项目指令位于最后、也是最具针对性的位置。这让 monorepo 布局很有用：

- 把共享命令与策略放在仓库根目录；
- 把包专属的命令放在嵌套的 `AGENTS.md` 中；
- 避免把根文件复制进每个包。

改动会在 omp 重建新会话时被拾取。编辑完指令文件后，先使用 `/new` 或重启 omp，再依赖新的文本。

### 同一作用范围内谁优先

对于每个用户全局作用范围和每个项目目录深度，只会有一个上下文文件 Provider 存活。Provider 的优先级是：

1. `native`
2. `claude`
3. `agents`，然后是 `codex`
4. `gemini`
5. `opencode`
6. `github`
7. `agents-md`

这意味着在同一个仓库层级上，`<repo>/.omp/AGENTS.md` 会遮蔽 `<repo>/AGENTS.md`；它们不会被拼接。除非你刻意想要这种遮蔽，否则不要同时创建两者。位于不同祖先层级的独立 `AGENTS.md` 文件具有不同的作用范围，因此会正常地组合生效。

用户全局上下文遵循同样的 Provider 优先级，最多贡献一个通用上下文文件。`RULES.md` 是独立的：当存在时，用户全局规则与最近项目中的 `.omp/RULES.md` 都会被加载。对于 `SYSTEM.md` 和 `APPEND_SYSTEM.md`，只会选择一个被发现的文件，其中项目作用范围优先于用户作用范围，omp 的 `.omp` 位置优先于兼容的配置目录。

## 导入共享指令

使用 `@path` 记号来包含另一个文件，而不复制它：

```
# Project instructions

@docs/agent/testing.md
@docs/agent/style.md
```

导入行为是可预期的：

- 相对路径从包含该导入的文件解析，而不是从 omp 的工作目录解析；
- `~/...` 从你的主目录解析，绝对路径也可接受；
- `@` 必须位于行首或跟在空白之后，因此电子邮件地址和 `git@github.com` 会被原样保留；
- 行内代码或围栏代码块中的导入会作为示例保留，而不会被展开；
- 嵌套导入最多被跟随五次跳转；
- 循环会被阻止，无法读取的导入会以其原始的 `@path` 记号保持可见。

导入的文本会被插入到记号所在的位置。导入适合承载小型共享策略，而不是大型的自动生成文档。

## 验证实际加载的内容

1. 从你打算工作的目录启动 omp。
2. 在交互式会话中输入 `/extensions`。
3. 选择相关的 Provider 标签页，并检查 **Context Files**。该面板会显示来源路径、是否已启用，以及是否有更高优先级的文件遮蔽了它。
4. 更改文件后，使用 `/new` 或重启 omp，重新打开 `/extensions`，并确认预期的路径处于生效状态。

你也可以这样询问：

```
Summarize the repository instructions that apply to this task and name their source files.
```

`/extensions` 面板是权威的检查方式；上面的总结则有助于确认指令本身是否清晰。

## 故障排查

### 文件没有出现

- 检查确切的大小写：在区分大小写的文件系统上，受支持的文件名区分大小写。
- 确认 omp 是从预期目录启动的。标记为“仅启动目录”的 Provider 不会向上遍历到父仓库。
- 确保该文件是可读的 Markdown，然后开启一个新会话。
- 对于 `.omp/AGENTS.md` 和 `.omp/RULES.md`，先检查最近的 `.omp` 目录。更近的项目配置目录会定义 native 项目作用范围。
- 如果某个命名档案处于激活状态，请检查该档案专属的 `agent/` 目录，而不是默认的 `~/.omp/agent/`。

### 文件显示为被遮蔽

某个更高优先级的 Provider 在同一作用范围内提供了上下文文件。检查器会同时标明这两个来源。删除重复的文件、把真正更狭窄的指令移入嵌套目录，或从 `/extensions` 中禁用那个不需要的 Provider。

Provider 的开关会通过 `disabledProviders` 设置持久化。常见 ID 已列在上面的表格中；例如，禁用 `agents-md` 会停止独立 `AGENTS.md` 的发现，同时让 `.omp/AGENTS.md` 继续可用。

### 粘性规则缺失

`RULES.md` 必须位于激活用户的 `agent/` 目录中，或位于最近项目的 `.omp/` 目录中。`--no-rules` 标志会在该次运行中禁用 `RULES.md` 以及所有其他被发现到的规则。

### 某个导入仍保留为 `@path`

相对于发起导入的文件解析路径、检查文件权限，并确保该记号位于行内代码或围栏代码之外。循环，或超过五跳的递归链，也会让导入保持未展开状态。

参考 [CLI 参考](../reference/cli.md) 了解 prompt 与规则标志，参考 [设置](./settings.md) 了解 `disabledProviders`，并在 `/extensions` 中查看被发现到的按条件生效的规则文件。
