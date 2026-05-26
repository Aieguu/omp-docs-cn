# 记忆

记忆是持久化的：来自过去会话的事实和惯例会前馈到新会话中。它与 [compaction](./compaction.md) 并列但相互独立，后者将单个会话保持在上下文窗口内。

## 各机制触发时机

| 机制 | 范围 | 触发条件 | 模型看到的内容 |
| --- | --- | --- | --- |
| **Compaction** | 单个会话 | 轮次溢出、轮次后的阈值维护或手动 `/compact` | 用摘要条目替换较旧的轮次，加上近期尾部的原文 |
| **本地记忆** | 单个项目（cwd） | 启动时或 `/memory enqueue` | 系统提示词中的静态 _Memory Guidance_ 块，从本机过去的会话中提取 |
| **Hindsight** | 全局、按项目或按标签（参见 `hindsight.scoping`） | 首轮自动召回加上按需的 `retain` / `recall` / `reflect` 工具调用 | 一个不断增长的远程事实库，代理可以写入和查询 |

## Compaction

Compaction 是正交的会话内机制：当窗口满时，它会摘要活动分支上的较旧消息，磁盘上的文件不受影响。触发条件、`/compact` 命令、非压缩重试路径以及 `compaction.*` 设置请参阅 [Compaction](./compaction.md)。

## 记忆后端

后端通过 `memory.backend` 选择：

| 值 | 效果 |
| --- | --- |
| `off`（默认） | 不提取任何内容，不注入任何内容。 |
| `local` | 本地管道；在启动时注入静态指导块。 |
| `hindsight` | 远程 Hindsight 仓库；代理通过 `retain` / `recall` / `reflect` 进行读写。 |

### 本地后端

当前项目的过去会话会被摘要成一个紧凑的记忆文档，并在会话启动时作为 _Memory Guidance_ 块注入系统提示词。该块是启发式上下文，代理被要求在执行操作前根据当前仓库状态进行验证。记忆按项目（工作目录）隔离，存储在 `~/.omp/agent/memories/` 下。

从 TUI 管理本地记忆：

| 命令 | 功能 |
| --- | --- |
| `/memory view` | 显示当前注入的有效载荷。 |
| `/memory clear`（别名 `/memory reset`） | 删除此项目的所有记忆数据和生成的制品。 |
| `/memory enqueue`（别名 `/memory rebuild`） | 强制在下次启动时运行整合。 |

代理还可以通过 `read` 工具按需读取 `memory://` URL 获取更深层的上下文：

```
# Show the static guidance block injected into the system prompt
omp -p 'read memory://root'

# Show the full long-term memory document for this project
omp -p 'read memory://root/MEMORY.md'

# Show a generated skill playbook
omp -p 'read memory://root/skills/<name>/SKILL.md'
```

### Hindsight 后端

可选的远程后端，由 [Hindsight](https://hindsight.vectorize.io)（云托管或自托管）支持。Hindsight 不是注入静态摘要，而是向代理提供三个工具：`retain` 存储持久事实，`recall` 搜索先前的记忆，`reflect` 跨多条记忆综合出答案。在每个会话的第一轮，会针对配置的仓库触发自动召回，以便先前的上下文在模型发言之前就位。

每个会话关联一个仓库；子代理复用父代理的仓库，使 retain 和 recall 汇聚到同一位置。`hindsight.scoping` 选择仓库的分区方式：

| 值 | 布局 |
| --- | --- |
| `global` | 所有项目共享一个仓库。 |
| `per-project` | 每个工作目录一个独立仓库。 |
| `per-project-tagged`（默认） | 一个共享仓库，使用 `project:<cwd>` 标签，使全局和按项目的记忆在召回时合并。 |

### 设置 Hindsight

在 `~/.omp/agent/config.yml` 中配置四个 `hindsight.*` 键即可连接：

```
# Public Hindsight Cloud
memory:
  backend: hindsight
hindsight:
  apiUrl: https://api.hindsight.vectorize.io
  apiToken: hs_live_REPLACE_ME
  bankId: my-team-bank          # optional; auto-allocated when omitted
  scoping: per-project-tagged   # global | per-project | per-project-tagged
```

```
# Self-hosted (default apiUrl is http://localhost:8888)
memory:
  backend: hindsight
hindsight:
  apiUrl: http://hindsight.internal:8888
  apiToken: REPLACE_ME
  bankId: null                  # per-project bucket allocated on first use
  scoping: per-project
```

> 当你希望全局事实和项目范围的事实存储在同一个仓库中并在召回时合并时，使用 `per-project-tagged`。当项目之间不能看到彼此的记忆时（例如受 NDA 保护的客户工作），切换到 `per-project`，但需接受召回将不再拉取跨项目的偏好设置。`global` 保留给只有一个心智项目的单开发者场景。

### 心智模型

经过长期维护的策划摘要（用户偏好、项目惯例、架构决策），每个仓库初始化一次，在整合后刷新。活动集作为 `<mental_models>` 块拼接到系统提示词中。通过 TUI 的 `/memory mm` 进行管理：

| 子命令 | 功能 |
| --- | --- |
| `list` | 列出活动仓库中的心智模型。 |
| `show <id>` | 打印某个模型的文本。 |
| `refresh [id]` | 从当前记忆重新综合。不带 `id` 时仅刷新启用了自动刷新的模型；带 `id` 时按需刷新任何模型。 |
| `history <id>` | 以行差异格式查看修订历史。 |
| `seed` | 创建此仓库中缺失的内置心智模型。 |
| `delete <id>` | 从仓库中删除心智模型。 |
| `reload` | 重新将缓存的 `<mental_models>` 块拉入系统提示词。 |

> 本地的 `/memory view|clear|enqueue` 命令在 Hindsight 后端下仍然适用——它们管理项目的本地制品，而非远程仓库。`/memory mm` 仅限 TUI；在 ACP / headless 模式下请直接使用 Hindsight HTTP API 维护模型。

## 隐私与存储

**会话记录存放在哪里？** 在 `~/.omp/agent/sessions/<cwd-hash>/` 下，每个会话一个 JSONL 文件。默认仅存储在本地；除非你运行 `/share`、导出到网络路径，或使用 `--mode rpc` 将会话事件管道输出到 ACP 客户端，否则不会离开本机。

**记忆存放在哪里？** 使用 `local` 后端时，在 `~/.omp/agent/memories/<cwd-hash>/MEMORY.md` 加 SQLite 索引中。使用 `hindsight` 后端时，持久存储在你指向 `hindsight.apiUrl` 的外部仓库中——自托管或 Hindsight Cloud——你的机器上只有本地配置和一个别名仓库 ID。

**什么会被上传到 Hindsight？** 仅 `retain` 有效载荷和 `recall` / `reflect` 查询。磁盘上存储的会话记录已剥离了 `retain` 调用、召回响应和 `<mental_models>` 系统提示词块，因此策划的记忆不会作为对话噪音重新馈入仓库，仓库也不会看到原始的逐轮对话。

> 可随时通过 `omp -p 'read memory://root'` 审核注入的有效载荷，通过 `omp -p 'read memory://root/MEMORY.md'` 审核长期文档。

## 用法示例

### 重大重构后重建本地记忆

你重命名了一半的模块，"Memory Guidance" 块现在满是过时的文件路径。清除项目的记忆并入队一次新的整合：

```
/memory clear
/memory enqueue
```

### 在新的 Hindsight 仓库中初始化心智模型

```
/memory mm seed
/memory mm list
```

模型初始为空，随着 `retain` 调用流入逐渐填充。当你在仓库中有几条真正的 retain 后，可以通过 `/memory mm refresh project-conventions` 强制提前刷新。

### 从本地切换到 Hindsight 且不丢失上下文

1. `/memory clear` —— 否则本地的 _Memory Guidance_ 会作为静态系统提示词块与新的 Hindsight 工具并存。
2. 在 [`~/.omp/agent/config.yml`](./settings.md) 中设置 `memory.backend: hindsight` 加上四个 `hindsight.*` 键。
3. 重启代理。自动召回在新（空）仓库上的第一轮触发；后续的 `retain` 调用会从实际工作中填充它。
4. 可选：`/memory mm seed` 将内置的心智模型脚手架放入仓库。

有关恢复和分支机制，请参阅 [Sessions](./sessions.md)；完整的命令清单请参阅 [Slash commands](./slash-commands.md)；headless 模式的参数请参阅 [CLI reference](../reference/cli.md)。
