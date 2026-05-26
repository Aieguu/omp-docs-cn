# Web 与浏览器

## 选择哪个

| 工具 | 适用场景 |
| --- | --- |
| `web_search` | 你需要综合答案加来源 URL，且不知道哪个页面包含该事实。 |
| 对 URL 使用 `read` | 你已有 URL，需要无 JavaScript 的干净文本。 |
| `browser` | 页面需要 JS、认证、表单填写或交互式点击。标签页跨调用持久化。 |

## web_search

一个 `query`，通过已配置的提供者链中第一个可用的分发：Anthropic、Brave、Codex、Exa、Gemini、Jina、Kagi、Kimi、Parallel、Perplexity、SearXNG、Synthetic、Tavily、Z.AI。结果为统一的 `SearchResponse`；提供者顺序在配置中一次性设定，不是按调用设定。可选的 `recency`（`day`、`week`、`month`、`year`）由支持的提供者遵守。受 `web_search.enabled` 控制。

```
web_search query="bun workspaces hoisting behaviour" recency="month"
```

## 对 URL 使用 read

将任何 `http://` 或 `https://` URL 传给 `read`。默认为阅读器模式：文章、GitHub issue 和 PR、Stack Overflow、Wikipedia、NPM 页面、arXiv、RSS/Atom 订阅源、JSON 端点和 PDF 会返回干净的文本或 markdown。附加 `:raw` 获取未经处理的 HTML；附加行选择器（`:50-100`、`:50+150`）分页浏览缓存的输出。裸 `host:port` URL 与选择器语法冲突；在选择器前添加尾部斜杠。

```
# 阅读器模式 markdown
read https://example.com/docs/api

# 原始 HTML，然后对缓存抓取内容使用行范围
read https://example.com/page:raw
read https://example.com/page:200-400
```

当内容为静态时，优先使用 `read` 而非 `browser`。它更快、更便宜，且输出已经是模型可直接使用的散文形式。

## browser

通过 Puppeteer 驱动的真实 Chromium 标签页。三个操作：

**`open`**

获取（或复用）一个命名标签页。`name` 默认为 `"main"`。可选 `url` 在标签页就绪后导航；`viewport` 设置尺寸；`dialogs` 自动接受或关闭 `alert`/`confirm`/`beforeunload`。

**`run`**

对现有标签页执行异步 JS。`code` 是一个异步函数体，作用域内包含 `page`、`browser`、`tab`、`display`、`assert` 和 `wait`。返回值 JSON 序列化为工具结果。

**`close`**

按 `name` 释放标签页，或使用 `all: true` 释放所有标签页。对于已启动应用的浏览器，`kill: true` 终止进程树。

标签页跨 `run` 调用和跨进程内子 agent 存活。打开一次，多次复用。`tab` 辅助对象暴露 `observe()` 用于获取带稳定元素 id 的可访问性快照，以及 `click`、`fill`、`type`、`press`、`select`、`uploadFile`、`waitForUrl`、`waitForResponse`、`screenshot` 和 `extract`。

默认使用 `tab.observe()` 而非 `tab.screenshot()` 来了解页面状态——快照返回带元素 id 的结构化数据，你可以据此操作。仅在视觉外观重要时才截图。

```
browser open name=docs url=https://example.com/login
browser run  name=docs code=`
  const obs = await tab.observe();
  const link = obs.elements.find(e => e.role === "link" && e.name === "Sign in");
  await (await tab.id(link.id)).click();
  await tab.fill('input[name=email]', 'me@example.com');
  await tab.click('text/Continue');
`
browser close name=docs
```

除了启动无头浏览器，还可以通过 CDP 附加到运行中的 Chromium 应用，或生成 Electron 二进制文件：

```
browser open name=cursor app={path: "/Applications/Cursor.app/Contents/MacOS/Cursor"}
browser open name=devtools app={cdp_url: "http://127.0.0.1:9222"}
```

对于 PR 和 issue，优先使用 [GitHub](./github.md) 页面中记录的 URL 协议——它们自动缓存，读取起来像本地文件。
