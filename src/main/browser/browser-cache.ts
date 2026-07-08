import { ipcMain, session } from 'electron'

export const BROWSER_SESSION_PARTITION = 'persist:stealth'

function getBrowserSession(): Electron.Session {
  return session.fromPartition(BROWSER_SESSION_PARTITION)
}

export async function getBrowserCacheSize(): Promise<number> {
  return getBrowserSession().getCacheSize()
}

export async function clearBrowserCache(): Promise<void> {
  await getBrowserSession().clearCache()
}

export function registerBrowserCacheIpc(onCleared?: () => void): void {
  ipcMain.handle('browser-cache-size', () => getBrowserCacheSize())

  ipcMain.handle('browser-clear-cache', async () => {
    await clearBrowserCache()
    onCleared?.()
  })
}
