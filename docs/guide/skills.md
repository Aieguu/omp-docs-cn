# Skills

## 什么是 Skill

Skill 是一个命名目录下的 Markdown 操作手册。只有其 frontmatter 中的 `description` 会留在系统提示中。当模型将当前任务与该描述匹配时，或者当你通过 `/skill:<name>` 调用时，正文才会加载。长篇操作手册在不需要时不会消耗任何资源。

## 布局

```
~/.omp/agent/skills/<name>/SKILL.md     # 全局
.omp/skills/<name>/SKILL.md             # 项目
~/.claude/skills/, .claude/skills/      # 同样被发现
~/.codex/skills/,  .codex/skills/       # 同样被发现
```

发现是非递归的——每个目录一个 Skill，直接位于 `skills/` 下。Skill 目录内的同级文件可以通过 `skill://<name>/path/to/file.md` 从模型中引用。

## Frontmatter

| 字段 | 必填 | 作用 |
| --- | --- | --- |
| `name` | 是 | Skill 标识符。用于 `/skill:<name>` 和 `skill://<name>` URL。 |
| `description` | 是 | Skill 加载前模型唯一能看到的部分。需要具体的动词 + 名词 + 范围。 |
| `condition` | 否 | 可选的额外触发提示——当描述本身过于宽泛时使用。自由文本。 |

## 完整的 SKILL.md 示例

```
---
name: postgres
description: Writing, reviewing, or optimizing Postgres queries, schemas, or configs.
condition: User mentions EXPLAIN, indexes, slow query, or migration.
---

# Postgres playbook

## When to use this skill
- Reviewing a migration before it lands
- Diagnosing slow queries with EXPLAIN
- Picking an index type

## Procedure
1. Capture the current plan: `EXPLAIN (ANALYZE, BUFFERS) <query>`.
2. Check stats freshness: `SELECT last_analyze FROM pg_stat_user_tables`.
3. Inspect indexes: `\d+ <table>` in psql, or `pg_indexes`.

## Reference
- `skill://postgres/references/indexes.md` — index decision matrix
- `skill://postgres/references/explain.md` — reading EXPLAIN output
```

## 编写能触发的描述

模型选择 Skill 的方式与选择工具相同：将任务与描述文本进行匹配。模糊的描述会被跳过；具体的描述会被引入。明确指出动词（编写、审查、调试）、名词（Postgres 查询、Lambda 错误、快照测试），以及在有用时标明范围（`src/parser/`、`*.test.ts`）。

**糟糕："帮助处理数据库相关的东西。"**

好的："编写、审查或优化 Postgres 查询、Schema 或配置。"

**糟糕："测试。"**

好的："为导入器模块添加或扩展 Vitest 测试；涵盖 fixtures、快照测试和集成测试设置。"

对于应该 _始终_ 加载的 Skill（项目约定、强制检查），描述仍然要保持具体，然后在第一条提示中通过 `/skill:<name>` 显式调用，而不是寄希望于匹配。

## 作用域控制与禁用

| 标志 / 设置 | 效果 |
| --- | --- |
| `--skills <p1,p2,…>` | 逗号分隔的 glob 模式；仅保留匹配的 Skill。 |
| `--no-skills` | 完全禁用本次运行的 Skill 发现。 |
| `skills.enabled: false` | 同上，持久化到 `~/.omp/agent/config.yml`。 |
| `ignoredSkills: [name, …]` | 按名称阻止特定 Skill。 |
| `includeSkills: [name, …]` | 白名单——仅加载这些 Skill。 |
| `skills.enableSkillCommands: false` | 禁用 `/skill:<name>` 调用，同时保持发现功能开启。 |

运行 `omp -p '/extensions'` 可查看当前会话加载了哪些 Skill 以及来源。当你需要固定提示来调用 Skill 时，将本页与 [Prompt 模板](./prompt-templates.md) 配合使用；对于需要无条件出现在系统提示中的项目笔记，请参见 [上下文文件](./context-files.md)。
