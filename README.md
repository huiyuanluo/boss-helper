# Boss Helper

Boss Helper 是一个基于 Plasmo、React 和 TypeScript 开发的 Chrome 扩展，用于优化旧版 Boss 运营后台的日常开发和使用体验。

当前版本：`0.3.0`

## 核心功能

### 新版页面框架

扩展可以在支持的旧版 Boss `/index` 页面中接管原有外层框架，并保留业务页面 iframe 的加载逻辑。

- 重构一级菜单、二级菜单、页面入口和 iframe 页签区域。
- 一级菜单和二级页面菜单支持中文、拼音和首字母搜索。
- 二级菜单默认折叠，搜索时自动展开命中的菜单组，清空搜索后保留用户手动展开状态。
- 一级菜单支持收起，并可配置为打开页面后自动收起。
- 已打开模块、最近打开模块和最近打开页面可快速切换。
- 最近打开模块按域名保存，最多 6 条，按模块名称匹配。
- 最近打开页面按域名和一级模块隔离保存，最多 10 条。
- 页面菜单项支持复制访问链接，并通过顶部 Toast 反馈。
- JSP 页面会在菜单项标题后展示 `JSP` 标识。
- 原 BUI 页签样式已现代化，并支持页签过多时横向滑动且隐藏滚动条。
- 直接打开原本加载在 iframe 中的业务页面时，不会启用新版页面框架。
- 登录页不会启用新版页面框架。

新版页面框架默认开启，可在 popup 面板中关闭。

### 启动台

Boss `/index` 旧页面框架下会展示启动台入口，用于快速查找和访问一级模块。

- 支持中文、拼音和首字母搜索。
- 支持收藏模块。
- 支持最近访问模块，最多记录 10 条。
- 新版页面框架开启时，启动台入口会隐藏，避免与新版导航重复。
- 直接打开原本加载在 iframe 中的业务页面时，不会展示启动台入口。

### sid 同步到 localhost

用于解决本地开发环境 `http://localhost:16000/` 无法直接登录的问题。

- 可选择源环境，将源域名下的 HttpOnly `sid` cookie 同步到 localhost。
- 打开 popup 时会优先根据当前页面域名选择源域名，匹配不到时使用默认环境。
- 支持自动同步，源域名 `sid` 删除时会同步删除 localhost 的 `sid`。
- 支持手动设置 localhost 的 `sid`。
- 支持静默请求源环境 `/index` 检测登录状态。

### 页面快捷操作

popup 面板提供针对当前 Boss 页面的快捷能力：

- 自动判断当前页面类型，展示 `JSP页面` 或 `前后端分离页面`。
- 打开当前 iframe 页面。
- 使用 localhost 地址打开当前页面。

### 防掉线

Dev 和 QA 环境默认开启防掉线能力，每 5 分钟静默请求 `/index`。

生产和 UAT 环境不提供防掉线功能。电脑睡眠或网页被浏览器冻结时，无法保持登录状态。

## 支持环境

| 环境 | 域名 | 防掉线 |
| --- | --- | --- |
| 5upay Dev | `dev-boss.5upay.com` | 支持 |
| 5upay QA | `qa-boss.5upay.com` | 支持 |
| 5upay UAT | `uat-boss.5upay.com` | 不支持 |
| 5upay Pro | `boss.5upay.com` | 不支持 |
| Geoswift QA | `qa-boss.geoswift.com` | 支持 |
| AJBridge QA | `qa-boss.ajbridge.com` | 支持 |
| AJBridge UAT | `uat-boss.ajbridge.com` | 不支持 |
| AJBridge Pro | `boss.ajbridge.com` | 不支持 |
| 本地开发 | `http://localhost:16000/` | 不适用 |

## 开发

### 环境要求

- Node.js
- pnpm
- Chrome

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
pnpm dev
```

启动后在 Chrome 扩展管理页加载 Plasmo 生成的开发目录。

### 类型检查

```bash
pnpm type-check
```

### 构建

```bash
pnpm build
```

构建产物由 Plasmo 生成，可在 Chrome 扩展管理页通过加载未打包扩展进行安装。

### 打包

```bash
pnpm package
```

## 项目结构

```text
assets/                      扩展图标和启动台图标资源
docs/                        历史功能分析文档
src/background.ts            cookie 同步、登录检测和后台消息处理
src/contents/                Boss 页面 content script 和旧页面桥接脚本
src/features/LaunchpadApp.tsx 启动台 UI
src/features/PopupApp.tsx    popup 面板
src/features/frame/          新版页面框架、菜单模型、旧框架桥接和样式
src/shared/                  域名配置、消息类型、导航工具、拼音搜索、存储工具
```

## 技术栈

- Plasmo
- React
- TypeScript
- Tailwind CSS
- Radix UI
- lucide-react
- pinyin-pro

## 注意事项

- 扩展只在已配置的 Boss 域名和 `http://localhost:16000/` 下工作。
- sid 同步依赖 Chrome `cookies` 权限，只同步名为 `sid` 的 cookie。
- 新版页面框架只在 Boss `/index` 页面生效，会隐藏旧页面的外层导航，但不会改造 iframe 内部业务页面。
- 旧页面框架的菜单和页签由目标网站动态生成，扩展通过桥接脚本读取和调用原页面能力。
