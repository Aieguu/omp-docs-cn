# 配置体系

omp 的配置来源很多，但可以用三层理解：

1. **全局用户配置**：`~/.omp/agent/`。
2. **项目配置**：当前项目或祖先目录下的 `.omp/`。
3. **兼容导入**：从 `.claude`、`.codex`、`.gemini` 等工具目录读取已有规则、技能、MCP 等。

## 配置根目录

核心 source priority：

1. `.omp`
2. `.claude`
3. `.codex`
4. `.gemini`

用户级：

```text
~/.omp/agent
~/.claude
~/.codex
~/.gemini
```

项目级：

```text
<cwd>/.omp
<cwd>/.claude
<cwd>/.codex
<cwd>/.gemini
```

`.pi` 不在当前通用 discovery 顺序中。

## Settings

主配置文件：

```text
~/.omp/agent/config.yml
```

有效设置的合并顺序：

```text
schema defaults <- global config.yml <- project settings capability <- runtime overrides
```

注意：

- `settings.set(...)` 写入全局 `config.yml`。
- 项目 settings 通过 capability discovery 读取，通常是只读层。
- 老版本 `settings.json` 和 `agent.db` 中的设置会迁移到 `config.yml`。

## Native `.omp` 布局

常见项目布局：

```text
.omp/
  AGENTS.md
  SYSTEM.md
  settings.json
  mcp.json
  skills/
    postgres/
      SKILL.md
  commands/
    review.md
  rules/
    no-global-state.md
  hooks/
    pre/
    post/
  tools/
  extensions/
```

上游实现对不同类型的 admission 规则不同：

- Skills 会从当前目录到 repo root / home 边界的祖先 `.omp/skills` 扫描。
- `SYSTEM.md` / `AGENTS.md` 使用最近祖先项目 `.omp` 查找，但项目 `.omp` 目录需要非空。
- slash command、rules、hooks、tools、extensions 等通常要求对应 root 存在且非空。

## Capability provider 优先级

不同来源会注册 capability provider。大致优先级：

| Provider | 优先级 |
| --- | ---: |
| native `.omp` | 100 |
| Claude | 80 |
| Codex / agents / Claude marketplace | 70 |
| Gemini | 60 |

多数 capability 会按 key 去重，先出现者胜出。

常见 key：

| 类型 | key |
| --- | --- |
| skills | `name` |
| tools | `name` |
| hooks | `${type}:${tool}:${name}` |
| extensions | `name` |
| settings | 不去重，按顺序 deep merge |

## 环境变量加载顺序

环境变量由 `$env` 读取，顺序：

1. 当前进程环境。
2. 项目 `.env`。
3. `~/.omp/agent/.env`。
4. `~/.omp/.env`。
5. `~/.env`。

后面的文件不会覆盖已经存在的 key。每个 `.env` 内部，`OMP_*` 会镜像到对应 `PI_*`。

## 常用配置任务

### 设置项目模型角色

可以在全局 `config.yml` 或项目 settings 中配置 `modelRoles`：

```yaml
modelRoles:
  default: claude-sonnet-4-5
  smol: gpt-5.3-codex-spark:minimal
  slow: claude-opus-4-6:high
  commit: openai/gpt-5.3-codex
```

### 限定可用模型

```yaml
enabledModels:
  - claude-sonnet-4-5
  - path: ~/work
    models:
      - anthropic/claude-opus-4-5

disabledProviders:
  - ollama
  - path: ~/private
    providers:
      - anthropic
```

### 配置 MCP

项目级：

```text
.omp/mcp.json
```

用户级：

```text
~/.omp/agent/mcp.json
```

详见 [MCP 配置速查](../reference/mcp.md)。

## 兼容迁移

仍存在的兼容路径：

- `ConfigFile` 对 YAML 目标支持 JSON → YAML 迁移。
- `settings.json` / `agent.db` 迁移到 `config.yml`。
- `queueMode` → `steeringMode`。
- `ask.timeout` 毫秒值转换为秒。
- 旧的扁平 `theme` 转为 `theme.dark` / `theme.light`。
- `skills.enablePiUser` / `skills.enablePiProject` 仍用于 native source gating。
