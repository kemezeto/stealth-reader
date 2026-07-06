import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'

interface LockSecretFile {
  salt: string
  hash: string
}

export interface LockPublicState {
  locked: boolean
  preview: boolean
  hasPassword: boolean
}

let locked = false
let preview = false
let autoLockTimer: NodeJS.Timeout | null = null
let lastActivityAt = Date.now()
let previewTimer: NodeJS.Timeout | null = null

function secretPath(): string {
  return join(app.getPath('userData'), 'lock-secret.json')
}

function readSecret(): LockSecretFile | null {
  try {
    return JSON.parse(readFileSync(secretPath(), 'utf-8')) as LockSecretFile
  } catch {
    return null
  }
}

function writeSecret(secret: LockSecretFile): void {
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(secretPath(), JSON.stringify(secret, null, 2), 'utf-8')
}

function hashPassword(password: string, saltHex?: string): LockSecretFile {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : randomBytes(16)
  const hash = scryptSync(password, salt, 32)
  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex')
  }
}

function verifyPassword(password: string, secret: LockSecretFile): boolean {
  const derived = scryptSync(password, Buffer.from(secret.salt, 'hex'), 32)
  return timingSafeEqual(derived, Buffer.from(secret.hash, 'hex'))
}

function getWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null
}

function broadcastState(): void {
  getWindow()?.webContents.send('lock-state-changed', passwordLockManager.getPublicState())
}

export const passwordLockManager = {
  getPublicState(): LockPublicState {
    return {
      locked,
      preview,
      hasPassword: Boolean(readSecret())
    }
  },

  hasPassword(): boolean {
    return Boolean(readSecret())
  },

  setPassword(password: string): { ok: true } | { ok: false; message: string } {
    const trimmed = password.trim()
    if (trimmed.length < 4) {
      return { ok: false, message: '密码至少 4 位' }
    }

    writeSecret(hashPassword(trimmed))
    return { ok: true }
  },

  resetPassword(
    currentPassword: string,
    nextPassword: string
  ): { ok: true } | { ok: false; message: string } {
    const secret = readSecret()
    if (!secret) {
      return this.setPassword(nextPassword)
    }

    if (!verifyPassword(currentPassword, secret)) {
      return { ok: false, message: '当前密码不正确' }
    }

    return this.setPassword(nextPassword)
  },

  unlock(password: string): { ok: true } | { ok: false; message: string } {
    if (preview) {
      preview = false
      locked = false
      broadcastState()
      return { ok: true }
    }

    const secret = readSecret()
    if (!secret) {
      locked = false
      broadcastState()
      return { ok: true }
    }

    if (!verifyPassword(password, secret)) {
      return { ok: false, message: '密码错误' }
    }

    locked = false
    passwordLockManager.touchActivity()
    broadcastState()
    return { ok: true }
  },

  lock(): void {
    if (!readSecret()) return
    locked = true
    preview = false
    broadcastState()
  },

  previewEffect(): void {
    if (previewTimer) {
      clearTimeout(previewTimer)
      previewTimer = null
    }

    preview = true
    locked = true
    broadcastState()

    previewTimer = setTimeout(() => {
      preview = false
      locked = false
      previewTimer = null
      broadcastState()
    }, 2800)
  },

  touchActivity(): void {
    lastActivityAt = Date.now()
  },

  clearAutoLockTimer(): void {
    if (autoLockTimer) {
      clearInterval(autoLockTimer)
      autoLockTimer = null
    }
  },

  syncAutoLock(enabled: boolean, minutes: number, lockEnabled: boolean): void {
    passwordLockManager.clearAutoLockTimer()
    if (!enabled || !lockEnabled || !readSecret()) return

    autoLockTimer = setInterval(() => {
      if (locked || preview) return
      const elapsed = Date.now() - lastActivityAt
      if (elapsed >= minutes * 60_000) {
        passwordLockManager.lock()
      }
    }, 15_000)
  }
}
