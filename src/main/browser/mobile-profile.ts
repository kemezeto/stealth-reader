import type { WebContents } from 'electron'

export const MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'

const MOBILE_ACCEPT_LANGUAGE = 'zh-CN,zh;q=0.9,en;q=0.8'

const MOBILE_USER_AGENT_METADATA: Electron.UserAgentMetadata = {
  brands: [
    { brand: 'Chromium', version: '131' },
    { brand: 'Google Chrome', version: '131' },
    { brand: 'Not?A_Brand', version: '24' }
  ],
  fullVersionList: [
    { brand: 'Chromium', version: '131.0.6778.139' },
    { brand: 'Google Chrome', version: '131.0.6778.139' },
    { brand: 'Not?A_Brand', version: '24.0.0.0' }
  ],
  platform: 'Android',
  platformVersion: '14.0.0',
  architecture: '',
  model: 'Pixel 8',
  mobile: true,
  bitness: '',
  wow64: false
}

export function applyMobileWebProfile(webContents: WebContents): void {
  if (webContents.isDestroyed()) return

  webContents.setUserAgent(MOBILE_USER_AGENT, MOBILE_USER_AGENT_METADATA)
  webContents.session.setUserAgent(MOBILE_USER_AGENT, MOBILE_ACCEPT_LANGUAGE, MOBILE_USER_AGENT_METADATA)
  enableTouchEmulation(webContents)
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
