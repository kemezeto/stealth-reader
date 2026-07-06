# Stealth Reader

Windows 桌面阅读与浏览工具。支持在办公场景下以低存在感的方式浏览网页、阅读本地电子书，并提供窗口透明、快速隐藏、截图保护等辅助能力。

> 自用项目，仅面向 Windows x64，无账号体系、无自动更新、无代码签名。

## 功能概览

### 网页浏览

- 内嵌 **Chromium** 内核（Electron `<webview>`），可打开常见 HTTPS 网站
- 地址栏支持直接输入网址，或按默认搜索引擎（必应 / 百度 / Google）检索
- 持久化会话分区（`persist:stealth`），站点登录状态可保留
- 网页前进 / 后退、刷新；可选网页标签切换快捷键

### 本地书架

- 导入 **TXT / EPUB / PDF**，自动识别编码（TXT）
- 记录阅读进度，支持继续上次位置
- EPUB 可调字体颜色、行间距（1.5 / 2.0 / 2.5 / 3.0）
- 阅读翻页快捷键可自定义（默认 `A` / `D`）

### 隐蔽与窗口

| 能力 | 说明 |
|------|------|
| 窗口透明度 | 调节整个应用窗口的不透明度 |
| 内容透明度 | 仅影响网页 / 阅读区域内的文字与图片 |
| 透明模式 | 隐藏界面背景，仅保留文字与控件 |
| 鼠标移出自动隐藏 | 指针离开窗口后自动收起 |
| 老板键 | 全局快捷键一键隐藏 / 恢复窗口（默认 `Alt+Q`） |
| 系统截图保护 | 截图或录屏时尽量显示为透明区域，而非黑色遮挡 |
| 窗口置顶 | 始终保持在其他窗口之上 |

### 安全与习惯

- **界面锁定**：本地密码（scrypt 哈希存储），支持自动锁定、锁屏预览、快捷键解锁
- **默认窗口尺寸**：竖屏 / 横屏预设，或自定义宽高
- **开机自启**、**关闭行为**（最小化到托盘 / 直接退出）
- **全局快捷键**：阅读翻页、老板键、浏览器历史、界面锁定等均可配置

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Electron 34 |
| 前端 | React 19 + TypeScript |
| 构建 | electron-vite + Vite 6 |
| 网页引擎 | Chromium（Blink + V8） |
| EPUB | react-reader / epubjs |
| PDF | react-pdf / pdfjs-dist |
| TXT | jschardet + iconv-lite |
| 打包 | electron-builder（Windows dir / portable） |

## 环境要求

- **运行**：Windows 10 / 11（x64）
- **开发**：Node.js 20+、npm

## 快速开始

### 安装依赖

```powershell
npm install
```

### 开发模式

```powershell
npm run dev
```

修改主进程代码后需重启开发进程；渲染进程支持热更新。

### 编译

```powershell
npm run build
npm start
```

### 打包发布

目录版（推荐，解压即用）：

```powershell
npm run dist
```

产物位于 `release/win-unpacked/`，将整个文件夹复制到任意位置后运行 `StealthReader.exe` 即可。

单文件 portable（需稳定网络下载 NSIS 组件）：

```powershell
npm run dist:portable
```

更多打包说明见 [docs/PACKAGING.md](docs/PACKAGING.md)。

## 项目结构

```
stealth-reader/
├── src/
│   ├── main/           # Electron 主进程：窗口、设置、快捷键、书架存储、截图保护
│   ├── preload/        # IPC 桥接、网页透明注入脚本
│   ├── renderer/       # React 界面：首页浏览、书架、设置
│   └── shared/         # 主进程与渲染进程共享的类型与工具
├── build/              # 应用图标等打包资源
├── docs/               # 设计与打包文档
├── electron.vite.config.ts
└── electron-builder.yml
```

## 默认快捷键

| 功能 | 默认按键 |
|------|----------|
| 阅读上一页 | `A` |
| 阅读下一页 | `D` |
| 老板键（隐藏 / 显示） | `Alt+Q` |
| 老板键 2（退出应用） | `Alt+X` |
| 浏览器后退 | `Alt+A` |
| 浏览器前进 | `Alt+D` |
| 界面锁定 | `Ctrl+L` |

可在 **设置 → 快捷键** 中修改。

## 数据与配置

用户数据保存在 Electron `userData` 目录，典型路径：

```
%APPDATA%\stealth-reader\
├── settings.json       # 应用设置
├── books.json          # 书架元数据
├── books\              # 导入的图书文件
└── lock-secret.json    # 界面锁定密码哈希（启用锁定时）
```

## 常见问题

**Windows SmartScreen 提示无法识别发布者**

未做代码签名，属预期行为。自用可在提示中选择「仍要运行」，或将程序目录加入 Defender 排除项。

**网页显示空白或样式异常**

部分站点对嵌入式浏览器有限制。可尝试刷新，或在设置中调整透明 / 内容透明度。微信读书等站点有专门透明适配逻辑。

**打包后无法启动**

确认已先执行 `npm run build`，再运行 `npm run dist`。开发调试请使用 `npm run dev`。

## 设计文档

产品边界与技术路线见 [docs/DESIGN.md](docs/DESIGN.md)。

## 许可证

MIT（自用项目，按需修改与分发。）
