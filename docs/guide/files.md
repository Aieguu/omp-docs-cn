# 文件操作

每个文件流程使用五个内置工具之一。`read` 读取字节（支持行范围、归档成员、URL 抓取），`write` 创建或覆盖整个文件，`edit` 应用行锚定补丁，`find` 解析路径通配符，`search` 执行正则内容查找。如需结构化重写和合并冲突，请参阅[结构化编辑](./editing.md)；如需符号感知重命名，请参阅[代码智能](./code-intelligence.md)。

## read

一个 `path` 参数即可处理磁盘文件、目录、归档文件、SQLite 数据库、PDF、Office 文档、Jupyter Notebook、图片和普通网页 URL。同一参数支持解析内部协议：`skill://`、`pr://`、`issue://`、`agent://`、`artifact://`、`memory://`、`mcp://`、`local://`、`conflict://`、`jobs://`。

使用 `:` 附加选择器来限定读取范围。`:50-200` 是行范围，`:50+150` 是计数形式，`:raw` 跳过摘要，`:conflicts` 索引合并冲突块。输出带锚定前缀（`41th|text`），以便 `edit` 后续精确引用特定行。对可解析的源文件使用裸路径会返回结构化摘要——保留签名，省略函数体。如需函数体，请使用范围或 `:raw` 重新读取。

```
# 行范围从 tarball 中的文件读取
read "build/bundle.tar.gz:src/app.ts:120-180"

# 原始逐字片段（无摘要、无锚点）
read "src/parser.ts:1-40:raw"

# 抓取并清理网页
read "https://example.com/docs/api"

# URL 协议与文件使用相同的选择器语法
read pr://1234/diff/2
read agent://AuthLoader/findings
read conflict://*
```

## write

`write` 创建新文件或整体替换现有文件。分发逻辑与 `read` 匹配：`archive.ext:inner/path` 写入归档文件，`db.sqlite:table` 插入一行，`db.sqlite:table:key` 更新或删除一行。生成的文件受到意外覆盖保护；格式化保存流程会在字节写入磁盘之前运行。

```
write path="src/routes/health.ts" content="export const ok = () => 'ok';\n"
```

当文件已存在且只需更改部分内容时，请使用 `edit` 代替。整文件重写会丢失锚定历史记录，在 diff 审查中也更加嘈杂。

## edit

`edit` 根据每个会话的读取缓存应用行锚定补丁。模型读取一段内容，复制要更改行的两个字符哈希，然后针对该精确锚点发出操作。如果文件在读取后被移动——被另一个 agent、格式化工具或手动保存——哈希将不再匹配，补丁会被拒绝而非覆盖错误的行。修复方法始终相同：重新 `read` 片段，然后根据新锚点发出新的补丁。

补丁语法（默认变体 `hashline`）是一个包含一个或多个文件片段的 `input` 字符串。每个片段以 `@@ PATH` 开头；操作引用锚点。载荷行以 `~` 开头。

| 操作 | 效果 |
| --- | --- |
| `+ ANCHOR` | 在锚定行之后（或 EOF）插入载荷行。 |
| `< ANCHOR` | 在锚定行之前（或 BOF）插入载荷行。 |
| `- A..B` | 删除闭合行范围。 |
| `= A..B` | 用载荷行替换该范围。 |

```
# 1. 先读取片段以获取锚点
read src/auth.ts:80-90
# →  87qa|  return loadUser(id);
#    88bf|}

# 2. 通过锚点打补丁
edit input="@@ src/auth.ts
= 87qa..87qa
~  return await loadUser(id);
:"
```

使用 `PI_EDIT_VARIANT` 环境变量可按会话覆盖语法；接受的值为 `hashline`（默认）、`patch`、`apply_patch`、`replace` 和 `vim`。`~/.omp/agent/config.yml` 中对应的 `edit.mode` 设置可实现持久化覆盖。

> 当变更涉及结构——重命名符号、交换 API 形状、重写每个调用点——请使用 [ast_edit](./editing.md) 或 [lsp rename](./code-intelligence.md)。两者都忽略空白，能承受会导致行锚定补丁失效的格式化变动。

## find

`find` 解析路径通配符。在 `paths` 中传入一个或多个模式；结果以换行分隔，相对于 cwd，按修改时间排序（最新优先）。默认遵守 `.gitignore`。用它来列举而不读取：与 `search` 的分工是有意为之，以防止模型意外将所有匹配文件加载到上下文中。

```
# 所有 TypeScript 路由文件，最新优先
find paths=["src/routes/**/*.tsx"]

# 一次调用多个根目录
find paths=["apps/**/package.json", "packages/**/package.json"]
```

## search

`search` 对文件、目录、通配符或内部 URL 的内容执行正则搜索。匹配结果以锚定前缀行返回（`*5th|content`）；上下文行使用前导空格。遵守 `.gitignore`。当正则包含字面 `\n` 时自动启用跨行模式。原生引擎支持分页——`skip` 跳过先前的匹配而无需重新扫描。

```
# 所有带作者标签的 TODO，不区分大小写
search pattern="TODO\\(\\w+\\)" paths=["src/"] i=true

# 跨行：函数签名后跟空函数体
search pattern="function \\w+\\([^)]*\\)\\s*\\{\\n\\s*\\}" paths=["src/"]
```

当只需要路径列表时使用 `find`，需要查看匹配内容时使用 `search`。如需忽略空白和注释的结构化匹配，请使用[结构化编辑](./editing.md)页面中的 `ast_grep`。

## 工作流程示例

四个最常见的文件操作步骤遵循同一模式：缩小范围、读取、打补丁、验证。

```
1. find paths=["src/**/*.ts"]                              # 枚举
2. search pattern="loadUser\\(" paths=["src/"]             # 定位调用点
3. read src/auth.ts:80-120                                 # 获取锚点
4. edit input="@@ src/auth.ts
   = 87qa..87qa
   ~  return await loadUser(id);
   "                                                      # 通过锚点打补丁
5. lsp action=diagnostics file=src/auth.ts                 # 验证
```

有关 `lsp` 工具请参阅[代码智能](./code-intelligence.md)，有关 `ast_edit` 和 `conflict://` URL 接口请参阅[结构化编辑](./editing.md)。
