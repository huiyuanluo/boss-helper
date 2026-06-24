# boss-helper 旧项目功能与实现分析

分析对象：

- `/Users/sain/Desktop/frontEnd/boss-helper-vue`
- `/Users/sain/Desktop/frontEnd/boss-helper-extensions`

结论：这两个项目共同组成一个 Chrome 扩展。`boss-helper-vue` 负责开发和构建 Vue UI，构建产物再复制到 `boss-helper-extensions`。`boss-helper-extensions` 是最终加载到 Chrome 的扩展包，负责 manifest、background、content script、popup HTML、图标和样式。

## 项目关系

### boss-helper-vue

技术栈：

- Vue 3
- Vite 4
- TypeScript
- Pinia
- Element Plus
- lodash debounce

主要模块：

- `src/launchpad/`：运营后台页面内注入的“启动台”全屏面板。
- `src/popup/`：扩展图标点击后显示的 popup 控制面板。

构建方式：

- `vite.config.ts` 通过 `MODULE_ENV` 决定构建入口。
- `MODULE_ENV=launchpad` 时入口是 `src/launchpad/index.html`，输出到 `dist/launchpad`。
- `MODULE_ENV=popup` 时入口是 `src/popup/index.html`，输出到 `dist/popup`。
- `build.all.sh` 先构建 launchpad，再构建 popup，然后把产物复制为扩展项目中的固定文件名：
  - launchpad JS -> `boss-helper-extensions/script/bundle.js`
  - launchpad CSS -> `boss-helper-extensions/style/launchpadVue.css`
  - popup JS -> `boss-helper-extensions/script/popup.js`
  - popup CSS -> `boss-helper-extensions/style/popup.css`

注意：当前 `build.all.sh` 和 `build.popup.sh` 中的目标路径写死为 `/Users/fanjiaqi/Desktop/前端项目/boss-helper/...`，已经不是当前机器上的项目路径。

### boss-helper-extensions

扩展形态：

- Manifest V3
- background 使用 service worker：`script/background.js`
- content scripts 注入到 Boss 后台页面：
  - `script/jQuery.js`
  - `script/bundle.js`
  - `script/launchpad.js`
  - `script/popup_content.js`
- content scripts 注入样式：
  - `style/launchpadPlugin.css`
  - `style/launchpadVue.css`
- popup 页面：
  - `html/popup.html`
  - `script/popup.js`
  - `style/popup.css`

匹配域名：

- `https://dev-boss.5upay.com/*`
- `https://qa-boss.5upay.com/*`
- `https://uat-boss.5upay.com/*`
- `https://qa-boss.geoswift.com/*`
- `https://boss.5upay.com/*`

权限：

- `storage`
- `tabs`
- `activeTab`
- `scripting`

其中 `storage`、`tabs` 是当前逻辑明确使用的权限；`activeTab`、`scripting` 在现有源码中没有看到直接使用。

## 整体运行链路

1. 用户访问匹配的 Boss 后台域名。
2. Chrome 根据 manifest 注入 content scripts 和样式。
3. `script/bundle.js` 是由 Vue launchpad 构建出的产物，它在 content script 环境中注册 `window.bossHelperVue`。
4. `script/launchpad.js` 等页面 ready 后创建 `#dd-boss-helper-panel` 容器，调用 `window.bossHelperVue.initLaunchpad()` 挂载启动台 Vue 应用。
5. `script/launchpad.js` 解析宿主页面导航 `#J_Nav li[data-index]`，把导航标题和序号传给 Vue store。
6. `script/launchpad.js` 从 `chrome.storage.sync` 读取当前环境的常用模块和启动台开关。
7. 如果启动台开关允许，就在宿主页面 `.header` 里追加启动台图标。
8. 用户点击启动台图标后，启动台面板从屏幕左侧滑入。
9. 用户点击扩展图标时，`script/background.js` 会为匹配域名的 tab 设置 popup 为 `/html/popup.html`。
10. popup Vue 应用通过 `chrome.tabs.sendMessage` 与 content scripts 通信，执行开关、页面识别、新标签打开、防掉线等功能。

## 环境识别

环境映射在 Vue popup 和 content scripts 中各维护一份：

| Host | Env |
| --- | --- |
| `dev-boss.5upay.com` | `dev` |
| `qa-boss.5upay.com` | `qa` |
| `uat-boss.5upay.com` | `uat` |
| `boss.5upay.com` | `pro` |
| `qa-boss.geoswift.com` | `qa_geoswift` |

popup 打开后会发送 `getHostName` 给 content script，拿到当前页面 hostname，再映射为 `currentEnv`。

## 功能清单

### 1. 扩展只在指定 Boss 域名启用

用户价值：

- 只在运营后台相关环境中注入功能，避免影响普通页面。

实现途径：

- `manifest.json` 的 `content_scripts.matches` 限定 content script 注入域名。
- `script/background.js` 监听 `chrome.tabs.onUpdated` 和 `chrome.tabs.onActivated`。
- 当 tab URL 包含指定 Boss 域名时，调用 `chrome.action.setPopup({ tabId, popup: '/html/popup.html' })`。
- 页面加载完成时，background 还会向 content script 发送 `saveCurrentTabIndex`，把当前 tab index 交给页面侧缓存。

依赖点：

- `tab.url` 必须存在，并且通过字符串 `includes` 判断是否属于 Boss 环境。
- popup 是按 tab 动态设置，不是在 manifest 的 `action.default_popup` 中静态声明。

### 2. popup 显示当前环境

用户价值：

- 用户打开扩展 popup 后能看到当前操作的是 dev、qa、uat、pro 或 geoswift QA 环境。

实现途径：

- popup Vue 在 `src/popup/main.ts` 中启动。
- 非本地开发模式下，popup 发送 `{ cmd: 'getHostName' }` 给当前 tab 的 content script。
- `script/popup_content.js` 返回 `window.location.hostname`。
- popup 根据 `hostNameMap` 得到 env，再用 `envMap` 显示具体域名。

本地开发：

- `pnpm popup` 会设置 `POPUP_MODE_ENV=local`。
- 本地模式跳过真实 Chrome content script 通信。
- `src/popup/index.html` 使用 `localStorage` mock 开关值。

### 3. 启动台开关

用户价值：

- 用户可以按环境开启或关闭页面中的启动台入口。

实现途径：

- popup 中“启动台功能”使用 Element Plus `el-switch`。
- 切换前执行 `launchpadBeforeChange()`。
- 新状态写入 `chrome.storage.sync`：
  - key：`popup_launchpadVal_${env}`
  - 默认值：`true`
- 开启时发送 `{ cmd: 'showLaunchpad' }`。
- 关闭时发送 `{ cmd: 'removeLaunchpad' }`。
- `script/launchpad.js` 接收消息：
  - `showLaunchpad`：调用 `addLaunchpadIcon()` 添加入口图标。
  - `removeLaunchpad`：隐藏启动台面板，并移除 `.header` 下的 `img`。

注意：

- `showLaunchpad` 这个命令名实际只添加启动台入口图标，不直接打开启动台面板。
- 移除入口时使用 `$($('.header')[0]).find('img').remove()`，会删除 header 下所有图片，可能影响宿主页面自身图片。
- 多次触发 `showLaunchpad` 可能重复追加图标，当前没有去重逻辑。

### 4. 页面内启动台入口图标

用户价值：

- 在 Boss 后台 header 区域提供一个快捷入口，点击后打开全屏启动台。

实现途径：

- `script/launchpad.js` 通过 `chrome.runtime.getURL('images/launchpad.svg')` 获取扩展内图片地址。
- 创建 `<img>`，添加类名 `dd-boss-helper-launchpadIcon`。
- 追加到宿主页面第一个 `.header` 元素中。
- 图标点击时调用 `showLaunchpad()`。
- 样式来自 `style/launchpadPlugin.css`。

宿主页面依赖：

- 页面存在 `.header`。
- 扩展 manifest 把 `/images/*` 配置为 `web_accessible_resources`。

### 5. 启动台全屏面板

用户价值：

- 打开一个覆盖全页面的模块导航面板，集中展示全部模块、搜索结果和常用模块。

实现途径：

- `script/launchpad.js` 在 `document.body` 下创建 `#dd-boss-helper-panel`。
- `script/bundle.js` 注册的 `window.bossHelperVue.initLaunchpad()` 会把 Vue 应用挂载到这个容器。
- 面板初始 CSS：`left: -100vw`。
- 打开时 jQuery `animate({ left: 0 }, 300)`。
- 关闭时 jQuery `animate({ left: '-100vw' }, 300)`。
- Vue 源码入口：
  - `src/launchpad/main.ts`
  - `src/launchpad/launchpad.vue`
  - `src/launchpad/stores/launchpad.ts`
  - `src/launchpad/components/tableView.vue`

界面结构：

- 顶部搜索框。
- 关闭按钮。
- 左侧“全部模块”。
- 中间“搜索结果”。
- 右侧“常用模块”。

状态管理：

- `navData: Map<string, string>`：模块名 -> 宿主导航 `data-index`。
- `commonlyUsedData: string[]`：常用模块名列表。

### 6. 自动解析 Boss 后台模块导航

用户价值：

- 不需要手动维护模块列表，启动台直接读取 Boss 后台现有导航。

实现途径：

- `script/launchpad.js` 的 `analyseNav()` 查询 `$('#J_Nav').find('li')`。
- 如果第一个 `li` 有 `data-index`，则遍历所有导航项。
- 从每个 `li` 读取：
  - `data-index`：模块序号。
  - `.nav-item-inner` 文本：模块名。
- 数据写入 `navMap`，再调用 `window.bossHelperVue.setData(navMap)`。
- 如果导航还没加载出来，则每 1 秒重试一次。

宿主页面依赖：

- 页面存在 `#J_Nav`。
- 导航项是 `li`。
- 导航项上存在 `data-index`。
- 模块名在 `.nav-item-inner` 中。

注意：

- 找到导航后只解析一次，没有监听后续动态变化。
- `navMap` 是模块级变量，重新解析前没有清空。
- 代码同时写了 `navMap[title] = dataIndex` 和 `navMap.set(title, dataIndex)`，前者对 Map 来说不是标准数据写入方式，属于冗余或历史遗留。

### 7. 启动台搜索模块

用户价值：

- 用户输入模块名关键字后，快速找到目标模块并跳转。

实现途径：

- `src/launchpad/launchpad.vue` 中搜索框绑定 `input`。
- 输入变化后调用 `fuzzySearch`。
- `fuzzySearch` 使用 lodash `debounce`，延迟 500ms。
- 搜索逻辑把输入值直接构造为 `new RegExp(keyword, 'i')`。
- 只匹配模块名称，不匹配 `data-index` 或其他字段。
- 搜索结果附带 `isCommonlyUsed` 状态，用于显示“常用”标签。

注意：

- 用户输入正则特殊字符时可能抛异常，例如 `[`、`(` 等。
- 搜索是简单包含式正则匹配，不是拼音、首字母或分词搜索。

### 8. 点击启动台模块进行跳转

用户价值：

- 从启动台直接切换到 Boss 后台的指定模块。

实现途径：

- `tableView.vue` 中每个模块行点击后调用 `clickModule(key, value)`。
- `launchpad.vue` 调用 `window.bossHelperPlugin.gotoModule(value)`。
- `script/launchpad.js` 中的 `gotoModule(value)`：
  - 先隐藏启动台。
  - 再执行 `$('#J_Nav').find(\`[data-index=${value}]\`).click()`。

宿主页面依赖：

- Boss 后台点击对应 `data-index` 的导航元素即可完成模块切换。

### 9. 常用模块管理

用户价值：

- 用户可以把高频模块置顶到“常用模块”，减少搜索和滚动。

实现途径：

- 启动台有“全部模块”“搜索结果”“常用模块”三列。
- 非常用列表中的模块 hover 时显示添加按钮。
- 常用列表中的模块 hover 时显示取消按钮。
- 添加常用：
  - 新模块名插入数组头部。
  - 更新 Pinia store。
  - 调用 `window.bossHelperPlugin.setCommonlyUsedData(newData)`。
- 取消常用：
  - 从数组中移除模块名。
  - 更新 Pinia store。
  - 同步写入 storage。
- content script 写入 `chrome.storage.sync`：
  - key：`dd_bossHelper_commonlyUsed_${env}`
  - value：模块名字符串数组
  - 默认值：`[]`

注意：

- 添加常用没有显式去重保护，理论上重复调用可能写入重复模块名。
- 常用模块以模块名作为主键。如果宿主页面模块名变更，旧常用项会失效或显示 undefined。

### 10. 防掉线功能

用户价值：

- 在非生产类环境中尽量保持 Boss 后台登录态，减少长时间停留后掉线。

实现途径：

- popup 中“防掉线功能”使用 `el-switch`。
- UI 上生产环境 `pro` 和 UAT 环境 `uat` 不展示该开关。
- 切换前执行 `antiDropBeforeChange()`。
- 新状态写入 `chrome.storage.sync`：
  - key：`popup_antiDrop_${env}`
  - 默认值：`false`
- 开启时发送 `{ cmd: 'openAntiDrop' }`。
- 关闭时发送 `{ cmd: 'closeAntiDrop' }`。
- `script/popup_content.js` 收到消息后启动或停止定时器。
- 定时器每 5 分钟执行一次 `fetch('/index')`。
- content script 页面 ready 后也会读取 storage，如果当前环境开启了防掉线，则自动启动。

环境限制：

- popup UI 限制 `pro` 和 `uat` 不展示开关。
- content script 的 `startAntiDrop()` 只判断 `env !== 'pro' && env !== null`，没有在逻辑层排除 `uat`。

注意：

- `startAntiDrop()` 没有判断已有 timer，多次调用可能创建多个定时器。
- `popup_content.js` 中 `env` 没有显式声明，`getCurrentEnv()` 直接赋值 `env = ...`，这是一个明确的代码质量问题。
- 防掉线依赖 `/index` 请求能刷新会话，这需要后端实际行为支持。

### 11. 判断当前 iframe 页面类型

用户价值：

- 用户可以判断当前打开的运营后台页面是前端页面还是后端 JSP 页面。

实现途径：

- popup 按钮发送 `{ cmd: 'determinePageType' }`。
- `script/popup_content.js` 调用 `getCurrentIFrameLink()` 获取当前显示 iframe 的地址。
- 如果 link 存在，先去掉 `window.location.origin`。
- 如果相对路径以 `/v1/` 开头，则 alert：当前页面是前端页面。
- 否则 alert：当前页面是后端 JSP 页面。

宿主页面依赖：

- 页面有 `.tab-content`。
- 当前显示 tab 的 `.tab-content` 不是 `display: none`。
- `.tab-content` 的父级 `.dl-tab-item` 没有 `ks-hidden` 类。
- `.tab-content` 内存在 iframe。

注意：

- 如果 `.tab-content` 存在但内部没有 iframe，`querySelector('iframe').src` 可能报错。
- 页面类型判断完全依赖路径前缀 `/v1/`。

### 12. 在新标签页打开当前页面

用户价值：

- 用户可以把 Boss 容器 iframe 中当前页面单独打开，便于调试或查看。

实现途径：

- popup 按钮发送 `{ cmd: 'openCurrentPageInNewTab' }`。
- content script 获取当前 iframe src。
- 返回：
  - `link`
  - `currentTabIndex`
- popup 调用 `chrome.tabs.create({ url: link, active: true, index: currentTabIndex + 1 })`。

tab index 来源：

- `script/background.js` 在 tab complete 时发送 `{ cmd: 'saveCurrentTabIndex', info: { index: tab.index } }`。
- `script/popup_content.js` 缓存到 `currentTabIndex`。

注意：

- 如果 background 消息没有成功送达，`currentTabIndex` 默认是 0。
- 如果 tab 后续被拖拽移动，缓存 index 可能不是最新值。

### 13. 以本地端口打开当前页面

用户价值：

- 开发者可以把当前 iframe 页面映射到本地前端 dev server，常用于前后端分离页面调试。

实现途径：

- popup 按钮发送 `{ cmd: 'openCurrentPageInNewtabWithLocal' }`。
- content script 获取当前 iframe src。
- 把 `window.location.origin` 替换为 `http://localhost:16000`。
- 返回新 link 和 `currentTabIndex`。
- popup 用 `chrome.tabs.create` 打开新标签页。

注意：

- 本地端口固定为 `16000`，没有配置入口。
- 如果 iframe src 不是当前 origin 下的 URL，替换可能无效。

## 消息协议汇总

### popup -> content script

| cmd | 处理脚本 | 返回 | 作用 |
| --- | --- | --- | --- |
| `getHostName` | `popup_content.js` | hostname string | 获取当前页面域名 |
| `showLaunchpad` | `launchpad.js` | empty response | 添加启动台入口图标 |
| `removeLaunchpad` | `launchpad.js` | empty response | 隐藏启动台并移除入口图标 |
| `openAntiDrop` | `popup_content.js` | none | 启动防掉线定时请求 |
| `closeAntiDrop` | `popup_content.js` | none | 停止防掉线定时请求 |
| `determinePageType` | `popup_content.js` | none | alert 当前 iframe 页面类型 |
| `openCurrentPageInNewTab` | `popup_content.js` | `{ link, currentTabIndex }` | 打开当前 iframe 地址 |
| `openCurrentPageInNewtabWithLocal` | `popup_content.js` | `{ link, currentTabIndex }` | 用 localhost:16000 打开当前 iframe 地址 |

### background -> content script

| cmd | 处理脚本 | 作用 |
| --- | --- | --- |
| `saveCurrentTabIndex` | `popup_content.js` | 保存当前 tab index，供 popup 新建 tab 时决定插入位置 |

### Vue launchpad -> launchpad content script

通过 `window.bossHelperPlugin` 调用：

| API | 作用 |
| --- | --- |
| `hideLaunchpad()` | 隐藏启动台面板 |
| `gotoModule(value)` | 点击宿主导航并跳转模块 |
| `setCommonlyUsedData(data)` | 写入常用模块 |
| `clearCommonlyUsedData()` | 清空常用模块，当前 Vue UI 未直接使用 |

### launchpad content script -> Vue launchpad

通过 `window.bossHelperVue` 调用：

| API | 作用 |
| --- | --- |
| `initLaunchpad()` | 挂载启动台 Vue 应用 |
| `setData(data)` | 设置模块导航数据 |
| `setCommonlyUsedData(data)` | 设置常用模块数据 |

## 存储 key 汇总

| Key | 类型 | 默认值 | 读写位置 | 作用 |
| --- | --- | --- | --- | --- |
| `popup_launchpadVal_${env}` | boolean | `true` | popup Vue、`launchpad.js` | 当前环境是否启用启动台入口 |
| `popup_antiDrop_${env}` | boolean | `false` | popup Vue、`popup_content.js` | 当前环境是否启用防掉线 |
| `dd_bossHelper_commonlyUsed_${env}` | string[] | `[]` | `launchpad.js`、launchpad Vue | 当前环境常用模块列表 |

本地开发 mock 使用 `localStorage`，不属于扩展真实数据：

- `mockCommonlyUsed`
- `launchpadVal`
- `antiDropVal`

## 宿主页面 DOM 依赖汇总

| 选择器或结构 | 用途 | 缺失影响 |
| --- | --- | --- |
| `.header` | 插入启动台图标 | 启动台入口无法出现，或脚本报错 |
| `#J_Nav li[data-index]` | 解析模块导航 | 启动台无法展示模块列表 |
| `.nav-item-inner` | 读取模块名称 | 模块名为空或错误 |
| `[data-index=${value}]` | 点击模块跳转 | 点击启动台模块无法跳转 |
| `.tab-content` | 获取当前 iframe 所在容器 | 页面类型判断和新标签打开失败 |
| `.dl-tab-item.ks-hidden` | 判断 tab 是否隐藏 | 可能选错当前 iframe |
| `.tab-content iframe` | 获取当前页面 URL | 页面类型判断和新标签打开失败 |

## 现有实现的重构关注点

这些不是新需求，只是从现有功能实现中看到的风险，后续重构时建议优先处理。

1. 两个项目强绑定但构建链路靠 shell 复制文件，且路径写死到旧机器目录。
2. Vue 源码和扩展最终产物分离，容易出现“源码已改但扩展包还是旧产物”的问题。
3. manifest 是 MV3，但 content script 和 popup 之间仍大量依赖全局 `window` 对象和字符串命令。
4. popup、launchpad、content script 各自重复维护环境映射和 storage key，容易不一致。
5. `popup_content.js` 的 `env` 未声明，是明确的隐式全局变量问题。
6. 防掉线 UI 层禁止 UAT，但 content script 逻辑层没有禁止 UAT。
7. 启动台图标没有去重，关闭时会删除 header 下所有图片。
8. 启动台搜索直接使用用户输入构造 RegExp，特殊字符可能导致异常。
9. 宿主 DOM 依赖强，缺少空值保护和结构变更兼容。
10. 当前 iframe 获取逻辑假设 `.tab-content` 内一定有 iframe。
11. popup 发送消息时对失败情况基本静默处理，用户看不到失败原因。
12. `activeTab`、`scripting` 权限暂未看到实际用途，重构时可重新评估最小权限。
13. `chrome.storage.sync.get(null)` 多处读取全部 storage，后续可改为按 key 读取。
14. `showLaunchpad` 命令名与实际行为不完全一致，容易误导维护者。
15. 常用模块以模块名作为唯一标识，模块改名后历史数据会失效。

## 源码入口速查

### Vue 源码

| 文件 | 作用 |
| --- | --- |
| `boss-helper-vue/vite.config.ts` | 多入口构建配置 |
| `boss-helper-vue/build.all.sh` | 构建并复制 launchpad、popup 产物 |
| `boss-helper-vue/build.popup.sh` | 只构建并复制 popup 产物 |
| `boss-helper-vue/src/launchpad/main.ts` | 注册 `window.bossHelperVue`，挂载启动台 |
| `boss-helper-vue/src/launchpad/launchpad.vue` | 启动台主界面和交互 |
| `boss-helper-vue/src/launchpad/stores/launchpad.ts` | 启动台 Pinia store |
| `boss-helper-vue/src/launchpad/components/tableView.vue` | 模块列表组件 |
| `boss-helper-vue/src/popup/main.ts` | popup 初始化、环境识别、storage 初始化 |
| `boss-helper-vue/src/popup/app.vue` | popup 主界面、开关和操作按钮 |
| `boss-helper-vue/src/popup/tools.ts` | popup 向 content script 发消息 |
| `boss-helper-vue/src/popup/const.ts` | popup storage key 和环境映射 |

补充：

- `tsconfig.json`、`tsconfig.app.json`、`tsconfig.node.json` 只承载 TypeScript 工程配置，没有业务逻辑。
- `env.d.ts` 只引用 Vite client 类型。
- 根目录和子模块下的 `components.d.ts`、`auto-imports.d.ts` 都是 `unplugin-vue-components` / `unplugin-auto-import` 生成文件，只声明 Element Plus 组件类型，没有业务逻辑。

### 扩展源码和产物

| 文件 | 作用 |
| --- | --- |
| `boss-helper-extensions/manifest.json` | Chrome 扩展配置 |
| `boss-helper-extensions/script/background.js` | 动态设置 popup，保存 tab index |
| `boss-helper-extensions/script/launchpad.js` | 启动台 content script glue code |
| `boss-helper-extensions/script/popup_content.js` | popup 操作对应的 content script |
| `boss-helper-extensions/script/bundle.js` | launchpad Vue 构建产物 |
| `boss-helper-extensions/script/popup.js` | popup Vue 构建产物 |
| `boss-helper-extensions/script/jQuery.js` | jQuery 3.7.0 |
| `boss-helper-extensions/html/popup.html` | 扩展 popup 页面 |
| `boss-helper-extensions/style/launchpadPlugin.css` | content script 手写样式 |
| `boss-helper-extensions/style/launchpadVue.css` | launchpad Vue 构建样式 |
| `boss-helper-extensions/style/popup.css` | popup Vue 构建样式 |

## 当前功能边界

当前扩展的现有功能可以概括为：

- 在指定 Boss 域名启用扩展 popup。
- 在页面 header 注入启动台入口。
- 从 Boss 页面 DOM 自动解析模块导航。
- 提供全屏启动台，支持模块搜索、跳转、常用模块管理。
- 按环境持久化启动台开关、常用模块、防掉线开关。
- 在 popup 中显示当前环境。
- 在 popup 中控制启动台和防掉线。
- 判断当前 iframe 页面是前端页面还是 JSP 页面。
- 把当前 iframe 页面在新标签页打开。
- 把当前 iframe 页面替换为 `http://localhost:16000` 后在新标签页打开。

这份文档只描述现有功能和实现方式，没有引入新的功能设计。后续重构可以以这里的功能边界作为第一版验收清单。
