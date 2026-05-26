# 子 agent 与 IRC

## task 工具

`task` 并行启动一个或多个子 agent。`tasks` 中的每个条目获得一个自包含的 `assignment` 字符串，并在自己的子会话中运行。并发数量受信号量限制；父级只看到每个任务的内联摘要。完整记录可通过 `agent://<id>` URL 访问，父级可以随时 [`read`](./files.md)。

传入 `isolated: true` 可在各自的 git worktree（或支持的 FUSE/ProjFS 叠加层）中运行每个任务，使并发编辑不冲突；任务成功后补丁会合并回来。通过 `task.isolation.mode` 调整策略。

### 内置 Agent

omp 附带七个可调度的 agent。在 `agent` 字段中传入名称，或在 `~/.omp/agent/agents/` 和 `.omp/agents/` 下放置你自己的 agent。

| Agent | 最佳场景 | 生成 |
| --- | --- | --- |
| `explore` | 快速只读调查；返回压缩的发现。 | — |
| `plan` | 多文件架构决策。 | `explore` |
| `designer` | UI/UX 实现、可访问性、视觉审查。 | — |
| `reviewer` | 质量和安全审查，带结构化发现。 | `explore` |
| `librarian` | 外部库/API 研究，提供经源码验证的答案。 | — |
| `task` | 通用多步骤委派。 | 任意 |
| `quick_task` | 严格机械性更新或数据收集。 | — |

> 当工作是机械性的时，使用 `quick_task`——它在廉价模型上以最小推理运行。当工作是开放性的且需要完整工具访问时，使用 `task`。

## 并行机制

单次 `task` 调用中的每个任务同时启动并独立运行。每个子任务在 IRC 对等块中能看到其他任务，因此它们可以在工作期间互相通信。任务在其返回值具象化后立即结束；其 id 此后对 IRC 无效。

## IRC 通信

`irc` 工具在同一进程内的活跃 agent 之间传递简短的散文消息。主 agent 是 `0-Main`；子 agent 复用其任务 id 并加上进程槽前缀，例如 `2-AuthMap`。

- `op: "list"` 枚举当前可见的对等方。
- `op: "send"` 将 `message` 发送给 `to`（对等方 id 或 `"all"`）。直接消息的默认行为是等待接收方在其侧通道轮次中生成的同步回复——即使对等方正在执行工具调用也是安全的。

受 `irc.enabled` 控制。

## 非对称握手

子 agent 在结果具象化的瞬间退出。如果两个对等方在工作末尾互相尝试 DM，第二个会对第一个的退出竞争失败并收到 `peer is not available via IRC`。可靠的模式是非对称的：_一个_对等方 DM 并等待；另一个在其侧通道轮次中回复，同时仍然存活。

1. 对等方 A 继续工作并保持存活。
2. 对等方 B 调用 `irc op=send to=A` 并阻塞等待回复。
3. A 的临时回复轮次在 A 的主循环仍在运行时触发。B 收到 A 的回答并继续。

切勿将其构造为"A 完成后，B 再询问 A"——A 已经退出了。如果 A 在 5 秒完成而 B 在 12 秒 DM，调用会失败。

## 实战示例：两个子 agent，一个 DM 另一个

父级展开一个 auth-map 任务和一个 route-audit 任务。route-audit 需要 AuthMap 正在生成的发行者列表，因此它 DM 并等待。AuthMap 保持存活足够长时间以回复。

```
# 父级
task agent=explore tasks=[
  { id: "AuthMap",
    assignment: "Map every token issuance path under src/auth/. \
                 Stay responsive on IRC until RouteAudit pings you." },
  { id: "RouteAudit",
    assignment: "List protected routes under src/routes/. \
                 DM 0-AuthMap for the live issuer list before finalizing." },
:]

# 在 RouteAudit 内部
irc op=send to=0-AuthMap message="Which issuer does /api/v2 use?"
# -> 同步返回回复，RouteAudit 继续执行

# 父级，在批次返回后
read agent://AuthMap
read agent://RouteAudit
```

有关其余工具清单及每个工具的能力页面，请参阅[工具索引](./tools.md)。
