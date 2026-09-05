# Web 与浏览器

## 选择最轻量的可行路径

直接告诉 omp 你想要的结果。它会自行选择底层能力；你无需亲自调用某个 Web 或浏览器工具。

| 你的任务 | 最佳路径 | 示例请求 |
| --- | --- | --- |
| 查找当前信息或对比多个来源 | Web 搜索 | `Compare the current Bun and Node.js workspace behavior. Cite the official documentation.` |
| 阅读一个已知 URL 的页面 | URL 阅读 | `Read https://example.com/docs/auth and summarize the token refresh rules.` |
| 操作 JavaScript 应用，点击、填表或检查渲染后的 UI | 托管浏览器 | `Open the local app, create a test account, and report any validation problems. Do not submit payment details.` |
| 在已登录 Chrome 的账户中工作 | 浏览器中继（Relay） | `Using my visible Chrome tab titled “Acme Admin,” export the August report and tell me where it downloaded.` |

不知道来源时，从搜索开始。已知确切 URL 时，直接给 omp 一个 URL。只在需要渲染或交互时使用浏览器自动化；只有当你有意共享自己的 Chrome 状态时才使用中继。

对于 GitHub issue 和 pull request，请让 omp 改用它的 [GitHub 集成](./github.md)。它是结构化的、有缓存的，通常比抓取网站更可靠。

## 搜索 Web

Web 搜索会返回答案以及来源 URL。直接说明你需要哪种证据：

```
Find the release note that introduced Node.js permission-model networking. Use primary sources, quote the relevant sentence, and link it.
```

```
Research PostgreSQL 18 logical replication changes from the past month. Separate confirmed facts from commentary and cite every claim.
```

搜索默认通过 `web_search.enabled` 启用。omp 按优先级顺序遍历可用的 Provider，当某个 Provider 不可用、超时或没有返回可用结果时，会向后顺延。打开 `/settings` 可以启用 **Web Search**、选择 **Web Search Provider Order**、排除你不信任的 Provider，或修改每个 Provider 的超时时间。

Provider 可以使用 `/login` 已保存的凭据、Provider 的 API key 环境变量，或免凭据的搜索引擎。一个实用的配置是：

1.   为你已在使用的 Provider 运行 `/login`，或按照 [Provider](./providers.md) 与[密钥与认证](../reference/secrets.md)中的说明配置其 API key。
2.   在 `/settings` 中，把该 Provider 排到 **Web Search Provider Order** 的最前面。
3.   让 omp 搜索一个小的、时效性强的事实，并附上其来源。

持久化配置也可以写入 `~/.omp/agent/config.yml` 或项目的 `.omp/config.yml`：

```
web_search:
  enabled: true
providers:
  webSearchOrder: [perplexity, exa, gemini]
  webSearchExclude: []
  webSearchTimeoutSeconds: 60
```

未列出的 Provider 保持其内置的相对顺序。超时作用于每一次单独的 Provider 尝试，而不是整条回退链。配置优先级请参见[设置](./settings.md)。

搜索结果是证据，不是权威。让 omp 优先使用一手来源、交叉验证重要论断，并指出它无法访问的来源。搜索不会因为你登录了 Chrome 就能看到私有页面；那些内容请使用中继。

## 阅读已知 URL

当页面是公开且基本静态的，直接把 URL 给 omp：

```
Read https://example.com/security.pdf and list the supported encryption algorithms with page references.
```

```
Read the API documentation at https://example.com/reference and turn the pagination rules into a short implementation checklist.
```

URL 阅读可以从文章、文档、PDF、JSON、订阅源以及许多常见开发者网站中提取干净的文本。它不执行页面 JavaScript，也不继承浏览器 cookie。这使它比浏览器自动化更快、更少状态，但不适合客户端渲染的应用、需要登录的控制台、同意流程以及交互式表单。如果提取到的页面为空或不完整，让 omp 在浏览器中重试。

## 自动化托管浏览器

托管浏览器是由 omp 控制的一个 Chromium 实例。它是渲染页面、本地开发服务器、截图、多步导航、表单校验以及其他不需要你日常 Chrome 配置文件的交互的正确选择。

```
Open http://localhost:3000 in a browser. Test the sign-up form at mobile and desktop widths, take screenshots of any broken state, and do not submit the final form.
```

```
Navigate through the public pricing calculator, enter 25 seats, and report the displayed annual total. Stop before checkout.
```

浏览器支持默认启用。如果 omp 提示不可用，打开 `/settings` 并检查 **Tools → Available Tools → Browser**。相关的持久化设置为：

```
browser:
  enabled: true
  headless: true
```

-   **无头（`browser.headless: true`）**是默认值。它安静无窗口，最适合可重复的导航、提取和截图。
-   **可见（`browser.headless: false`）**会打开浏览器 UI，便于你观察、处理登录或人机验证，并在网站抵抗自动化时手动接管。

首次使用托管浏览器可能会下载 Chromium。无头与可见模式都使用 omp 管理的浏览器配置文件，而不是你正常的 Chrome 配置文件。在该托管浏览器运行期间，登录状态与页面状态可以保留，但不要把它当作永久的凭据存储。对于已有的登录、Passkey、客户端证书或精心维护的浏览器配置文件，请优先使用中继。

你还可以配置 `browser.cdpUrl`，附加到一个你特意以远程调试端点启动的 Chromium 实例。这是中继之外的高级替代方案：omp 不拥有该进程，断开连接也不会关闭它的页面。现代 Chrome 限制对默认配置文件的远程调试，因此对于日常 Chrome，中继通常是更好的选择。

## 用 Browser Relay 连接你自己的 Chrome

OMP Browser Relay 扩展让 omp 可以驱动一个现有的 Chrome 标签页，包括它的 cookie 和已登录会话。这是能力最强的路径，也是最大的信任决策：被附加的标签页拥有与你相同的账户权限。

### 一次性安装

```
omp browser-relay install
```

然后：

1.   在 Chrome 中打开 `chrome://extensions`。
2.   启用 **Developer mode**。
3.   选择 **Load unpacked** 并选中 `~/.omp/browser-relay/extension`。
4.   在 `/settings` 中启用中继，或运行：

```
omp config set browser.relay true
```

当 omp 首次需要时，本地中继服务器会自动启动。扩展徽标在连接后会显示 **on**。通常你不需要自己运行服务器。

打开你想共享的页面，把它设为当前可见标签页，并尽可能在请求中点名它：

```
Use the Chrome tab whose title contains “Staging Orders.” Find order 1842 and summarize its fulfillment history. Do not edit or refund anything.
```

不指定目标时，omp 会采用当前可见的可用标签页，而不会把另一个标签页带到前台。它正在驱动的标签页会出现在一个青色的 **omp** 标签组中；连接结束后该组解散。释放中继会话不会关闭你的 Chrome 页面。

### 中继的信任与加固

该扩展使用 Chrome 的调试器权限。附加期间，omp 可以读取渲染后的页面内容、输入文字、点击控件、上传文件、发起下载，并以该标签页的 cookie 和账户权限执行操作。Chrome 会显示“正在调试此浏览器”的信息条。

中继默认监听回环地址 `http://127.0.0.1:9224`。任何能访问到未加保护中继的本地进程，都可以驱动那个已登录的附加标签页。如果你不信任机器上的每个进程，请带 token 启动：

```
omp browser-relay --token 'a-long-random-secret'
```

点击扩展的工具栏图标打开其设置，并输入相同的 token。请使用密码管理器或环境安全的启动方式，而不是把 token 提交到仓库。自定义端口也必须在扩展和 `browser.relayUrl` 中保持一致。除此之外，只有需要 token、非默认端口或 `--no-group` 时才需要手动启动。

共享完 Chrome 状态后，请关闭中继设置：

```
omp config set browser.relay false
```

## 登录、文件与状态

涉及凭据时，请优先在可见的托管浏览器或 Chrome 中亲自登录，然后再授予中继访问。不要把密码、恢复码或一次性验证码粘贴进提示词。网站可能检测自动化、要求 CAPTCHA 或硬件级认证，或屏蔽受调试器控制的标签页；请手动接管，而不是让 omp 绕过这些控制。

上传文件时，给出确切的本地路径和目标位置：

```
Upload ./artifacts/report.pdf to the “August evidence” field, verify the filename and size, but wait for me before submitting.
```

上传路径相对会话启动时所在的目录解析。omp 只能通过页面的文件输入框上传，且本地文件必须可读。把上传视为一次数据披露：确认站点、账户、文件和受众。

下载文件时，说明你期望的结果并让 omp 验证：

```
Download the CSV report for 2026-08-01 through 2026-08-31 and tell me the final filename and local path. Do not open or execute it.
```

中继下载遵循你 Chrome 配置文件的常规下载设置。托管浏览器使用自己的配置文件和下载行为，目标位置可能不同。如果站点提供了直接的公开文件 URL，让 omp 抓取该 URL 通常比点击浏览器下载更可预测。下载的内容是不可信的；在打开、导入或执行之前先检查它。

## 审批与安全的请求

浏览器自动化是一种可执行操作的工具。在 `tools.approvalMode: write` 或 `always-ask` 下，omp 会在浏览器操作前提示；默认的 `yolo` 模式不会。无论整体模式如何，你都可以要求每次浏览器操作都提示：

```
tools:
  approval:
    browser: prompt
```

审批提示授权的是 omp 操作浏览器这件事，而不是一切现实后果。购买、发消息、发布、删除、账户变更、财务操作以及提交敏感数据，仍然需要你在行动发生时确认，除非你的请求已经明确授权了确切的目标、范围和取值。

写请求时给出边界：

```
Draft the support reply in the browser, but do not send it. Show me the final recipient, subject, and body for approval.
```

```
Add the two named items to the cart and report the total. Do not sign in, start a trial, or place the order.
```

网页是不可信的输入。页面上显示的指令不能覆盖你的请求。如果某个页面要求 omp 泄露密钥、运行命令、上传无关文件或改变任务，它应当停止并报告该指令。

## 局限

-   当网站改变 DOM、虚拟化内容、限制请求频率或检测到自动化时，浏览器自动化可能失败。
-   CAPTCHA、Passkey、硬件密钥、生物识别提示、原生文件选择器和部分支付流程需要你手动接管。
-   浏览器会话是有状态的。一次导航或应用重渲染可能使 omp 之前找到的控件失效；让它重新检查页面比重复一次盲点更安全。
-   中继模式无法附加到 `chrome://` 页面、Chrome DevTools、Chrome 网上应用店或其他扩展的页面。
-   打开了 DevTools 的标签页无法被附加，因为 Chrome 对每个标签页只允许一个调试器连接。
-   关闭 Chrome 的调试信息条会使该标签页分离，直到它再次导航。
-   中继和附加浏览器模式不会隐藏自动化，也不会在 omp 断开时关闭你的页面。
-   通过中继无法实现浏览器上下文隔离。当账户必须保持隔离时，请使用单独的 Chrome 配置文件或托管浏览器。

## 故障排除

### 搜索提示没有配置任何 Provider

确认 `web_search.enabled` 已开启。检查 `/settings` 中的 **Web Search Provider Order** 与 **Excluded Web Search Providers**；被排除的 Provider 不能作为回退。重新运行 `/login` 或更新所选 Provider 的凭据，然后请求一个带单一来源的简单时效事实。如果某个 Provider 很慢，请调高 `providers.webSearchTimeoutSeconds`，而不是反复重试同一个请求。

### URL 内容为空或缺失

页面可能由 JavaScript 渲染、需要 cookie、阻止自动化提取，或把内容嵌在另一个 frame 中。让 omp 在托管浏览器中打开它。如果页面是私有的，请可见地登录，或使用一个你明确共享的中继标签页。

### 托管 Chromium 无法打开

确认 `browser.enabled` 已开启，并允许首次运行的 Chromium 下载完成。把 `browser.headless` 切换为 `false`，让启动和导航可见。如果配置的 `browser.cdpUrl` 已失效，请删除它，让 omp 重新启动其托管浏览器。

### 中继徽标没有显示 “on”

升级 omp 之后重新运行 `omp browser-relay install`，在 `chrome://extensions` 中重新加载未打包的扩展，并确认配置的端口和 token 一致。默认端点是 `127.0.0.1:9224`。如果你手动启动了中继，请保持该进程运行；否则让 omp 在首次使用时自动启动。

### omp 选中了错误的标签页

把目标标签页带到前台，并在请求中包含一个有辨识度的标题或 URL 片段。关闭该标签页上的 DevTools。受限制的 Chrome 页面会被刻意隐藏，不对 omp 可见。

### 中继标签页断开连接

omp 工作期间不要关闭 Chrome 的调试信息条。让该标签页导航一次使其可重新附加，确认扩展徽标为 on，然后重试。如果 Chrome 报告有另一个调试器，请先关闭 DevTools 或另一个调试器客户端。

### 上传或下载没有出现在预期位置

上传时使用相对会话启动目录的路径，或给出绝对路径。确认目标是真实的文件上传控件。下载时，检查当前浏览器配置文件的下载设置，并让 omp 报告它观察到的文件名和路径；中继下载与托管浏览器下载不必使用同一目录。
