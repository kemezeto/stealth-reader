import { app } from 'electron'

export function syncAutoLaunch(enabled: boolean): void {
  if (process.platform === 'linux' && !app.isPackaged) {
    return
  }

  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: false
  })
}

export function readAutoLaunchEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin
}
