import { BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import { resolveAppIconPath } from './app-paths'

let tray: Tray | null = null

function buildTrayIcon(): Electron.NativeImage {
  const iconPath = resolveAppIconPath()
  if (!iconPath) {
    return nativeImage.createEmpty()
  }

  const image = nativeImage.createFromPath(iconPath)
  return image.isEmpty() ? image : image.resize({ width: 16, height: 16 })
}

export function ensureTray(
  getWindow: () => BrowserWindow | null,
  onQuit: () => void,
  onShow?: () => void
): void {
  if (tray) return

  const icon = buildTrayIcon()
  if (icon.isEmpty()) return

  tray = new Tray(icon)
  tray.setToolTip('Stealth Reader')

  const showWindow = (): void => {
    const window = getWindow()
    if (!window) return
    window.show()
    window.focus()
    onShow?.()
  }

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '显示窗口', click: showWindow },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          onQuit()
          tray?.destroy()
          tray = null
        }
      }
    ])
  )

  tray.on('double-click', showWindow)
}

export function disposeTray(): void {
  tray?.destroy()
  tray = null
}

export function hasTray(): boolean {
  return tray !== null
}
