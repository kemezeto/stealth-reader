import { app } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'

export function resolveAppIconPath(): string | undefined {
  const candidates = app.isPackaged
    ? [
        join(process.resourcesPath, 'icon.png'),
        join(process.resourcesPath, 'build', 'icon.png')
      ]
    : [
        join(__dirname, '../../build/icon.png'),
        join(process.cwd(), 'build/icon.png')
      ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return undefined
}
