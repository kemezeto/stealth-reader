# 打包说明

## 一键打包（推荐，Windows 目录结构 portable）

```powershell
npm run dist
```

产物目录：

```
release/win-unpacked/
├── StealthReader.exe      ← 主程序
├── resources/
│   └── app.asar           ← 业务代码
├── ffmpeg.dll
├── chrome_*.pak
└── locales/
```

把整个 `win-unpacked` 文件夹复制到任意位置即可运行，无需安装。

## 单文件 portable（可选）

需要稳定访问 GitHub 下载 NSIS 组件：

```powershell
npm run dist:portable
```

产物：`release/Stealth Reader-2.0.0-portable.exe`

## 开发调试

```powershell
npm run dev      # 开发模式
npm run build    # 仅编译到 out/
npm start        # 运行编译结果
```

## 自定义图标

将 `icon.ico` 放到 `build/` 目录，重新 `npm run dist`。

## 常见问题

| 问题 | 处理 |
|------|------|
| SmartScreen 拦截 | 自用：右键 → 仍要运行，或加 Defender 排除项 |
| `signAndEditExecutable` / 符号链接错误 | 已在配置中关闭签名 |
| `dist:portable` 下载 NSIS 超时 | 用 `npm run dist`（dir 结构）即可 |
| Phase 2 加 better-sqlite3 后运行报错 | `electron-builder.yml` 已预留 `asarUnpack` |
