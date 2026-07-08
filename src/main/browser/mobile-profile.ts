import type { WebContents } from 'electron'

export const MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'

const MOBILE_ACCEPT_LANGUAGE = 'zh-CN,zh;q=0.9,en;q=0.8'

export function applyMobileWebProfile(webContents: WebContents): void {
  if (webContents.isDestroyed()) return

  webContents.setUserAgent(MOBILE_USER_AGENT)
  webContents.session.setUserAgent(MOBILE_USER_AGENT, MOBILE_ACCEPT_LANGUAGE)
  enableTouchEmulation(webContents)
}

export function detachMobileWebProfile(webContents: WebContents): void {
  if (webContents.isDestroyed()) return

  const debugger_ = webContents.debugger
  if (!debugger_.isAttached()) return

  try {
    debugger_.detach()
  } catch {
    // ignore
  }
}

function enableTouchEmulation(webContents: WebContents): void {
  const debugger_ = webContents.debugger
  if (debugger_.isAttached()) return

  try {
    debugger_.attach('1.3')
    void debugger_.sendCommand('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5
    })
    void debugger_.sendCommand('Emulation.setEmitTouchEventsForMouse', {
      enabled: true,
      configuration: 'mobile'
    })
  } catch {
    try {
      debugger_.detach()
    } catch {
      // ignore
    }
  }
}
