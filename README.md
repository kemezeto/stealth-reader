# Stealth Reader

Windows 桌面阅读与浏览工具。在办公场景下以低存在感的方式浏览网页、阅读本地电子书，并提供窗口透明、快速隐藏、截图保护等辅助能力。

> 自用项目，仅面向 **Windows x64**。无账号体系、无自动更新、无代码签名。

## 功能概览

### 网页浏览

- 内嵌 **Chromium**（Electron `BrowserView`），仅允许加载 `http` / `https` 页面
- 首页门户快捷入口（微信读书、知乎、B 站等），支持地址栏直接输入网址
- 默认搜索引擎：必应 / 百度 / Google
- 持久化会话分区（`persist:stealth`），Cookie 与登录状态可保留
- 前进 / 后退 / 刷新；Ctrl + 滚轮缩放（按域名或全局记忆）
- 书签、浏览历史（最多 100 条）、底部工具栏（可自动隐藏）
- 移动 UA + 触摸模拟，适配部分移动端页面
- 微信读书等站点有专门的透明背景注入逻辑

### 本地书架

- 导入 **TXT / EPUB / PDF**（PDF 单文件上限 60 MB）
- TXT 自动检测编码（jschardet + iconv-lite）
- 记录阅读进度，支持从上次位置继续
- EPUB：字体大小、颜色、行间距（1.5 / 2.0 / 2.5 / 3.0）
- PDF：分页阅读、缩放、拖拽平移
- 阅读翻页快捷键可自定义（默认 `A` / `D`）

### 隐蔽与窗口

| 能力 | 说明 |
|------|------|
| 窗口透明度 | 调节整个应用窗口的不透明度 |
| 内容透明度 | 仅影响网页 / 阅读区域内的文字与图片 |
| 透明模式 | 隐藏界面背景，仅保留文字与控件 |
| 幽灵模式 | 进一步弱化界面存在感 |
| 鼠标移出自动隐藏 | 指针离开窗口后 UI 自动收起，移回可恢复 |
| 老板键 | 全局快捷键一键隐藏 / 恢复窗口（默认 `Alt+Q`） |
| 系统截图保护 | Windows 下优先使用 `WDA_MONITOR`，截图时尽量显示桌面背景而非黑块 |
| 窗口置顶 | 始终保持在其他窗口之上 |
| 无边框窗口 | 支持拖拽移动、最大化工作区 |

### 安全与习惯

- **界面锁定**：本地密码（scrypt 哈希 + 常量时间校验），支持自动锁定、锁屏预览、快捷键锁定
- **默认窗口尺寸**：竖屏 / 横屏预设，或自定义宽高
- **开机自启**、**关闭行为**（最小化到托盘 / 直接退出）
- **全局快捷键**：阅读翻页、老板键、浏览器标签切换、界面锁定等均可配置
- **网页缓存管理**：查看占用、清除 HTTP 缓存（不影响 Cookie 与登录态）

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Electron 34 |
| 前端 | React 19 + TypeScript |
| 构建 | electron-vite + Vite 6 |
| 网页引擎 | Chromium（BrowserView + 独立 preload 透明注入） |
| EPUB | react-reader / epubjs |
| PDF | react-pdf / pdfjs-dist（`localbook://` 协议 + Range 分片） |
| TXT | jschardet + iconv-lite |
| 系统 API | koffi（Windows 截图保护） |
| 打包 | electron-builder（Windows dir / portable） |

## 架构简述

```
┌─────────────────────────────────────────┐
│  Renderer（React）                       │
│  首页门户 / 书架 / 设置 / 锁屏 overlay    │
└─────────────────┬───────────────────────┘
                  │ contextBridge（stealth API）
┌─────────────────▼───────────────────────┐
│  Preload（sandbox: true）                │
│  IPC 桥接 + browser-transparency 注入    │
└─────────────────┬───────────────────────┘
                  │ ipcMain / ipcRenderer
┌─────────────────▼───────────────────────┐
│  Main Process                            │
│  窗口 / 设置 / 快捷键 / 书架 / BrowserView │
└─────────────────────────────────────────┘
```

- 主窗口与内嵌浏览器均启用 `contextIsolation`、`sandbox`，关闭 `nodeIntegration`
- 浏览器 URL 在主进程白名单校验；书籍文件名禁止路径穿越
- 渲染进程通过 `window.stealth` 访问能力，不直接持有 Node 权限

## 环境要求

| 用途 | 要求 |
|------|------|
| 运行 | Windows 10 / 11（x64） |
| 开发 | Node.js 20+、npm |

## 快速开始

### 安装依赖

```powershell
npm install
```

### 开发模式

```powershell
npm run dev
```

修改**主进程**或 **preload** 代码后需重启开发进程；**渲染进程**支持热更新。

### 编译与本地运行

```powershell
npm run build
npm start
```

### 类型检查（可选）

```powershell
npx tsc -p tsconfig.node.json --noEmit
npx tsc -p tsconfig.web.json --noEmit
```

### 打包发布

**目录版（推荐，解压即用）：**

```powershell
npm run dist
```

产物位于 `release/win-unpacked/`，将整个文件夹复制到任意位置后运行 `StealthReader.exe` 即可。

**单文件 portable**（需稳定网络下载 NSIS 组件）：

```powershell
npm run dist:portable
```

更多打包细节见 [docs/PACKAGING.md](docs/PACKAGING.md)。

## 项目结构

```
stealth-reader/
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── index.ts          # 入口：窗口、设置、IPC
│   │   ├── browser/          # BrowserView 管理、缓存、移动 UA
│   │   ├── books/            # 书架存储、导入、localbook 协议
│   │   ├── pointer/          # 鼠标移出自动隐藏
│   │   ├── hotkeys.ts        # 全局快捷键
│   │   ├── password-lock.ts  # 界面锁定
│   │   ├── content-protection.ts
│   │   └── tray.ts           # 系统托盘
│   ├── preload/              # IPC 桥接
│   │   ├── index.ts          # window.stealth API
│   │   ├── browser-transparency.ts
│   │   └── transparency/     # 网页透明注入引擎
│   ├── renderer/             # React 界面
│   │   └── src/
│   │       ├── views/        # 首页、书架、设置
│   │       ├── components/   # 阅读器、浏览器、设置面板
│   │       └── hooks/        # useEmbeddedBrowser 等
│   └── shared/               # 主进程与渲染进程共享工具
│       ├── hotkeys.ts
│       ├── search-engine.ts
│       ├── browser-url.ts    # http(s) URL 校验
│       └── book-path.ts      # 书籍路径安全校验
├── build/                    # 应用图标等打包资源
├── docs/                     # 设计与打包文档
├── electron.vite.config.ts
└── electron-builder.yml
```

## 默认快捷键

| 功能 | 默认按键 | 作用域 |
|------|----------|--------|
| 阅读上一页 | `A` | 书架阅读中 |
| 阅读下一页 | `D` | 书架阅读中 |
| 老板键（隐藏 / 显示） | `Alt+Q` | 全局 |
| 老板键 2（退出应用） | `Alt+X` | 全局 |
| 浏览器后退 | `Alt+A` | 全局（需在设置中启用） |
| 浏览器前进 | `Alt+D` | 全局（需在设置中启用） |
| 界面锁定 | `Ctrl+L` | 全局（需已设置密码） |
| 浏览器缩放 | `Ctrl + 滚轮` | 浏览网页时 |

可在 **设置 → 快捷键** 中修改；全局快捷键若与系统或其他软件冲突，编辑器会提示。

## 数据与配置

用户数据保存在 Electron `userData` 目录：

```
%APPDATA%\stealth-reader\
├── settings.json       # 应用设置（含书签、历史、缩放、快捷键等）
├── books.json          # 书架元数据
├── books\              # 导入的图书文件（UUID 文件名）
└── lock-secret.json    # 界面锁定密码哈希（启用锁定时生成）
```

`settings.json` 主要字段包括：`lastUrl`、`browserBookmarks`、`browserHistory`、`browserZoomByDomain`、窗口尺寸、透明度、快捷键、锁定相关选项等。浏览历史写入有约 1.5 秒 debounce，正常退出时会刷盘。

## 常见问题

### Windows SmartScreen 提示无法识别发布者

未做代码签名，属预期行为。可在提示中选择「仍要运行」，或将程序目录加入 Defender 排除项。

### 网页显示空白或样式异常

部分站点对嵌入式浏览器有限制。可尝试刷新，或在设置中调整透明 / 内容透明度。微信读书建议在透明模式下使用，并确保网络正常。

### 网页无法打开某个地址

浏览器仅支持 `http://` 与 `https://` 协议。本地文件、`file://`、`javascript:` 等会被主进程拒绝。

### 打包后无法启动

确认已先执行 `npm run build`，再运行 `npm run dist`。开发调试请使用 `npm run dev`。

### 修改设置后浏览历史未及时落盘

历史与 `lastUrl` 采用延迟写入。关闭应用前等待约 2 秒，或切换到其他设置页触发立即保存。

### PDF 过大无法导入

单文件上限 60 MB，超出会在导入时被跳过。

## 已知限制

- 仅支持 Windows x64，未在 macOS / Linux 上测试
- 无多标签浏览器，同一时间仅一个 BrowserView
- 界面锁定「自动翻页时不锁定」选项暂未开放（功能待实现）
- EPUB 大文件通过 IPC 整本加载，超大文件可能占用较多内存
- 无自动化测试，回归依赖手动验证

## 相关文档

- [docs/DESIGN.md](docs/DESIGN.md) — 产品边界与技术路线（部分早期 webview 描述尚未同步，以代码为准）
- [docs/PACKAGING.md](docs/PACKAGING.md) — 打包与发布说明

## 许可证

MIT（自用项目，按需修改与分发。）
