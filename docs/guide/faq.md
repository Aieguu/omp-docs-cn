# 常见问题

## 这是官方中文文档吗？

不是。这是基于上游公开文档整理的非官方中文文档。权威信息仍以 `can1357/oh-my-pi` 和 `omp.sh` 为准。

## 为什么选择 VitePress？

原因：

- Markdown 原生，适合文档项目。
- 本地开发和构建速度快。
- 不需要复杂主题和数据库。
- GitHub Pages 部署简单。
- 侧边栏、全文搜索、编辑链接、last updated 都是内置能力。

## GitHub Pages 部署后路径为什么要配置 `base`？

当前仓库是 `Aieguu/omp-docs-cn`，项目页 URL 通常是：

```text
https://Aieguu.github.io/omp-docs-cn/
```

VitePress 需要：

```ts
base: "/omp-docs-cn/"
```

如果未来改成用户站点仓库 `Aieguu.github.io`，需要把 `base` 改成 `/`。

## 第一次 GitHub Actions 成功后仍打不开页面怎么办？

检查：

1. 仓库 Settings → Pages → Source 是否选择了 **GitHub Actions**。
2. Actions 中 `Deploy VitePress site to GitHub Pages` 是否成功。
3. Pages 给出的 URL 是否包含 `/omp-docs-cn/`。
4. 浏览器缓存或 CDN 生效延迟。

## 如何启用更多工具？

部分工具默认关闭。可以在全局或项目配置中启用相应工具。建议按项目开启，避免工具面过宽。

## `read` 和 `search` 什么时候用？

- 已知路径、需要读取结构化内容：用 `read`。
- 不知道位置、需要内容匹配：用 `search`。
- 只查文件名 / glob：用 `find`。

## Skill、Extension、MCP 怎么选？

| 需求 | 推荐 |
| --- | --- |
| 给模型一套流程说明 | Skill |
| 增加外部工具 server | MCP |
| 增加一个简单可调用工具 | Custom tool |
| 同时要事件、命令、工具、渲染、Provider | Extension |
| 旧项目已有 Hook | Hook；新项目建议迁移到 Extension |

## 如何避免会话上下文太长？

- 使用 `/tree` 回到关键节点继续。
- 让 agent 总结阶段性进展。
- 对大型探索使用 `checkpoint` / `rewind`。
- 使用模型 context promotion。
- 允许 auto-compaction，并在重要分支切换时生成 branch summary。
