# 模型角色

## 按用途分配工作

模型角色让 omp 能为不同类型的工作使用不同的模型。你可以在主会话中使用一个均衡的模型，用更快的模型处理轻量工作，再用更强的推理模型应对困难的规划或审查。每个角色只需配置一次；使用该角色的功能会自动选用它。

使用 omp 之前，你不必先配置角色。登录某个 provider 后，omp 会自动为未分配的内置角色挑选可用的模型。先从默认设置开始，只有当你想要可预测的质量、延迟、成本或 provider 用量时，再去固定（pin）某个角色。

角色决定**由哪个模型**处理某一类工作；而 agent 还决定**这个执行者如何行事、可以使用什么**。当你在斟酌该改动哪一层时，请参见 [Agent 与模型角色](./agents-and-roles.md)。

最快的分配方式是：

1.  输入 `/model`（或按 Alt+M）。
2.  打开**角色**。
3.  选择一个角色，挑选模型，并可选择它的思考级别。
4.  返回**角色**查看生效的分配。

大多数人只需要考虑这些角色：

| 角色 | 什么时候配置它… |
| --- | --- |
| `default` | 你想为普通的交互式工作选择模型时。 |
| `smol` | 你希望轻量工作优先考虑速度和成本时。它也是 [prewalk](./prewalk.md) 常见的交接目标。 |
| `slow` | 你希望困难的推理和审查使用更强的模型时。 |
| `plan` | 你希望[计划模式](./plan.md)使用专门的架构模型时。 |
| `vision` | 你的主模型无法检查图像，或者你希望将图像分析路由到别处时。 |

## 自动解析角色

当 `modelRoles` 映射为空时，omp 会从可用且已认证的模型中解析角色。因此，即使没有完整的角色映射，专用功能也能正常工作。

有几个默认行为值得了解：

*   `default` 是主会话的模型。
*   未分配的 `smol`、`slow` 和 `designer` 角色，在 omp 寻找其他合适模型之前，可以先使用已配置的 `default` 模型。
*   未分配的 `tiny` 工作遵循 `smol` 所使用的快速模型偏好。
*   未分配的 `advisor` 会寻找独立的强推理模型，而不是继承 `default`。advisor 工作流请参见 [Advisor](./advisor.md)。
*   如果没有可用模型能满足某个角色，omp 会跳过该路径，或显示可操作的模型/认证错误，而不是悄悄使用未认证的 provider。

自动选择会随 provider、凭据或模型目录的变化而改变。请固定（pin）那些行为必须保持稳定的角色。

## 在模型中心分配角色

`/model` 与 Alt+M 会打开完整的模型中心。其中的**角色**视图是推荐的配置界面，因为它同时展示显式分配与自动选择。

*   选择角色会打开可用的模型目录。
*   选择模型后，你可以选择它支持的思考级别。
*   清除显式分配会让角色回到自动选择。
*   该视图还管理 Ctrl+P 快速轮换的顺序与重试回退链。
*   处于锁定状态的 provider 会引导你登录，而不是创建无法使用的分配。

默认情况下，分配是全局的，保存在当前档案（profile）的 agent 配置中（通常是 `~/.omp/agent/config.yml`）。要允许按项目分配，请设置：

```
modelRoleStorage: project
```

此后，模型中心会询问是将分配保存为全局还是用于当前项目。项目分配会写入 `.omp/config.yml`；某个角色如果在那里缺失，则继续使用其全局分配。

## 在 YAML 中配置角色

最小且实用的手动配置，就是在 `~/.omp/agent/config.yml` 中提供一个 `modelRoles` 映射：

```
modelRoles:
  default: anthropic/claude-sonnet-4-6
  smol: anthropic/claude-haiku-4-5
  slow: openai-codex/gpt-5.3-codex:high
  plan: anthropic/claude-opus-4-6:high
```

使用 `omp models find <name>` 可查找你安装中可用的选择器。显式的 `provider/model-id` 是最可预测的值。思考后缀可以是 `off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max` 或 `auto`；不支持的级别会被限制为所选模型所支持的级别。

角色值也接受以下形式：

| 形式 | 含义 | 示例 |
| --- | --- | --- |
| 模型选择器或模式 | 选择匹配的模型。在长期配置中优先使用完整的 provider 限定选择器。 | `google/gemini-3-pro` |
| 有序选择器 | 从左到右依次尝试用逗号分隔的选择器，并使用第一个可用匹配。 | `anthropic/claude-sonnet-4-6,openai/gpt-5.4` |
| 角色别名 | 复用另一个已配置的角色。`@role` 是规范写法；`*` 表示 `@default`。 | `task: "@slow"` |
| 思考后缀 | 为该角色固定或自动选择推理投入度。 | `openai-codex/gpt-5.3-codex:xhigh` |

`pi/role` 作为旧式角色别名仍然可用，但新配置应使用 `@role`。

## 为单次启动覆盖角色

启动标志与环境变量适合实验或脚本场景。它们不会改写你已保存的角色分配。

| 目标 | Shell 标志 | 环境变量 | 优先级 |
| --- | --- | --- | --- |
| 当前主模型 | `--model <selector>` | — | 启动标志 |
| `smol` | `--smol <selector>` | `PI_SMOL_MODEL` | 标志优先，其次环境变量，最后配置/自动选择 |
| `slow` | `--slow <selector>` | `PI_SLOW_MODEL` | 标志优先，其次环境变量，最后配置/自动选择 |
| `plan` | `--plan <selector>` | `PI_PLAN_MODEL` | 标志优先，其次环境变量，最后配置/自动选择 |

例如：

```
omp --model @default --slow openai-codex/gpt-5.3-codex:xhigh
PI_SMOL_MODEL=anthropic/claude-haiku-4-5 omp
```

`--model` 为本次会话选择当前模型；它不是持久的 `modelRoles.default` 分配。

## 在运行中的会话中切换与验证

| 控制 | 结果 |
| --- | --- |
| `/model` 或 `/models` | 打开持久化的模型与角色中心。使用**角色**检查和编辑分配。 |
| Alt+M | 打开同一个持久化中心。 |
| `/switch` 或 Alt+P | 仅为当前会话选择模型。它不会更改角色配置。 |
| Ctrl+P | 在配置好的快速角色轮换中向前切换。 |
| Shift+Ctrl+P | 在配置好的快速角色轮换中向后切换。 |

默认轮换顺序是 `smol` → `default` → `slow`。omp 会跳过没有可用分配的角色；如果只有一个角色模型可用，它会提示没有可轮换的目标。轮换改变的是当前会话的当前模型，而不是已保存的角色映射。

在**角色**视图中或通过 `cycleOrder` 更改顺序：

```
cycleOrder:
  - default
  - slow
  - smol
```

完成分配后，重新打开 `/model` 并查看**角色**，以确认 omp 解析出的模型与思考级别。对于主会话，状态行也会在切换或轮换后显示当前模型。

## 所有内置角色

| 角色 | 路由到它的工作 |
| --- | --- |
| `default` | 普通的交互式工作与主会话默认。 |
| `smol` | 快速、低成本的工具性工作与快速交接路径。 |
| `slow` | 允许额外延迟的深入推理。 |
| `vision` | 需要具备视觉能力模型时的图像检查。 |
| `plan` | 计划模式的架构与审查。 |
| `designer` | designer 子代理。 |
| `commit` | 生成提交信息；当该角色未分配时，提交流程可回退到其他可用角色。 |
| `tiny` | 非常小的在线分类、标题、记忆支持与语音清理；未分配时遵循 `smol` 偏好。 |
| `task` | 当 agent 没有请求其他模型时的一般子代理工作。 |
| `advisor` | [Advisor](./advisor.md) 使用的独立推理模型。 |

扩展与编写的 agent 可以引入额外的角色名。当自定义角色出现在 `modelRoles`、`cycleOrder` 或 `modelTags` 中时，它就会在模型中心中显示；但扩展或 agent 必须真正引用该角色，工作才会路由到它。

## 添加重试回退模型

角色分配会选择首选模型。重试回退链则规定：当符合条件的请求失败或配额状况使该模型不可用时，omp 可以转向哪里。

最简单的配置在 `/model` → **角色** 中：在某个角色下方添加回退行，或选择**新建回退**来保护特定的模型或 provider。顺序很重要；omp 会从上到下依次尝试可用的条目。

最小化的 YAML 链如下：

```
retry:
  modelFallback: true
  fallbackChains:
    default:
      - openai/gpt-5.4
      - google/gemini-3-pro
  fallbackRevertPolicy: cooldown-expiry
```

`default` 链也会被那些没有自己的链的已配置角色使用。当某个角色需要不同的成本、能力或 provider 边界时，可以为它单独配置一份列表：

```
retry:
  fallbackChains:
    default:
      - openai/gpt-5.4
    vision:
      - google/gemini-3-pro
    "google-antigravity/*":
      - google/*
      - google-vertex/*
```

回退链的键与条目拥有比角色值更严格的语法：

| 语法 | 作为键 | 作为回退条目 |
| --- | --- | --- |
| 角色名，如 `default` 或 `vision` | 保护该角色选定的模型。 | 不作为条目使用；改为指定模型。 |
| `provider/model-id` | 保护那个确切的当前模型，无论由哪个角色选中。 | 切换到那个确切的模型。允许添加思考后缀。 |
| `provider/*` | 保护来自该 provider 的任何当前模型。 | 保留当前模型 id，并尝试通过指定的 provider 使用它。 |
| `provider/id-prefix/*` | 保护该 provider 侧前缀下匹配的 id。 | 为 OpenRouter 之类的路由 provider，重新为当前裸模型 id 添加前缀。 |

在回退数组中使用完整的 provider 限定选择器。每个回退还需要有效的凭据与目录条目；不可用的候选会被跳过。

## 角色与回退设置参考

### 路由设置

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `modelRoles` | `{}` | 将角色名映射到模型选择。空的内置角色会自动解析。 |
| `modelRoleStorage` | `global` | `global` 将角色更改保存到当前档案；`project` 启用全局/项目选择以及 `.omp/config.yml` 覆盖。 |
| `cycleOrder` | `[smol, default, slow]` | Ctrl+P 快速轮换使用的有序角色名。 |
| `modelTags` | `{}` | 内置或自定义角色的可选显示元数据：`name`、可选的 `color` 主题色，以及可选的 `hidden`。 |

### 重试回退设置

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `retry.modelFallback` | `true` | 允许重试恢复切换到已配置的回退模型。 |
| `retry.fallbackChains` | `{}` | 将角色、确切模型、provider 通配符或带前缀的 provider 通配符映射到有序的回退选择器数组。 |
| `retry.fallbackRevertPolicy` | `cooldown-expiry` | `cooldown-expiry` 会在主模型的抑制窗口结束后返回主模型；`never` 则一直停留在回退模型上，直到你手动切换。 |
| `retry.usageAwareFallback` | `false` | 使用可靠的编码套餐（coding-plan）配额报告，在达到硬限制之前先在账户之间切换，再切换已配置的模型。不会推断普通 API 密钥的配额。 |
| `retry.usageReservePct` | `10` | 启用用量感知回退时，被视为储备余量的剩余编码套餐百分比。 |
| `retry.usageReservePolicy` | `confirm` | `confirm` 会在交互式会话中询问（后台 agent 自动回退），`auto` 总是选择下一个符合条件的回退，`fail-closed` 则既不使用储备配额，也不使用回退。 |

配置优先级请参见[设置](./settings.md)，凭据与各 provider 的模型发现请参见[Provider](./providers.md)。

## 故障排查

### 某个角色解析到了与另一个角色相同的模型

这可能是自动行为，尤其是对未分配的 `smol`、`slow` 或 `designer` 而言。如果你需要将两者分开，请在 `/model` → **角色** 中显式分配该角色。

### Ctrl+P 提示只有一个角色模型可用

打开 `/model`，检查 `cycleOrder` 中列出的角色。至少把其中两个分配到可用且已认证的模型上。快速轮换会跳过缺失或不可用的分配；`--models` 只限定某次启动时可见的模型目录，并不会取代 `cycleOrder`。

### 某个更改在另一个项目中消失了——或出现在所有项目

检查 `modelRoleStorage`。使用 `global` 时，模型中心的更改会应用于所有项目。使用 `project` 时，请检查**角色**视图把分配保存到了**项目**还是**全局**；`.omp/config.yml` 只针对该项目覆盖全局值。

### omp 报告未知模型或缺少 API 密钥

运行 `omp models find <name>`，使用列表中的某个 `provider/model-id`，然后用 `/login` 登录或配置该 provider 的凭据。如果某个 provider 刚发布了新模型，请先运行 `omp models refresh`，再重新搜索。

### 回退从不触发

确认 `retry.modelFallback` 为 `true`、当前角色/模型有匹配的非空链，并且至少有一个回退拥有有效凭据。角色别名和模糊名称在 `modelRoles` 中很有用，但回退数组应使用具体的 `provider/model-id` 选择器或受支持的 provider 通配符。

### 回退触发了，但没有回到主模型

将 `retry.fallbackRevertPolicy` 设置为 `cooldown-expiry`，以便在主模型的抑制窗口结束后返回。使用 `never` 时，请用 `/switch`、`/model` 或模型相关快捷键手动切换。

### 图像检查提示未配置视觉模型

把 `modelRoles.vision` 分配给目录条目支持图像输入的模型。仅仅在 `vision` 槽位填上纯文本模型的名字，并不会赋予视觉能力。
