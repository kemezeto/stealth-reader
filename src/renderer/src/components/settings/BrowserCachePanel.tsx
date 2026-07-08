import { useCallback, useEffect, useState } from 'react'

function formatCacheSize(bytes: number): string {
  if (bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  if (index === 0 || value >= 100) {
    return `${Math.round(value)} ${units[index]}`
  }

  return `${value.toFixed(1)} ${units[index]}`
}

export default function BrowserCachePanel(): JSX.Element {
  const [cacheSize, setCacheSize] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refreshCacheSize = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const size = await window.stealth.getBrowserCacheSize()
      setCacheSize(size)
    } catch {
      setCacheSize(null)
      setMessage('无法读取缓存大小')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCacheSize()
  }, [refreshCacheSize])

  const handleClearCache = async (): Promise<void> => {
    setClearing(true)
    setMessage(null)

    try {
      await window.stealth.clearBrowserCache()
      setCacheSize(0)
      setMessage('网页缓存已清除')
    } catch {
      setMessage('清除缓存失败，请稍后重试')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="browser-cache-panel">
      <section className="browser-cache-section">
        <header className="browser-cache-section__header">
          <span className="browser-cache-section__mark" aria-hidden="true" />
          <div>
            <h3 className="browser-cache-section__title">网页缓存</h3>
            <p className="browser-cache-section__desc">
              浏览器使用持久化分区，站点登录状态会保留；清除缓存不会删除 Cookie 与本地登录信息。
            </p>
          </div>
        </header>

        <div className="browser-cache-card">
          <div className="browser-cache-card__info">
            <strong>当前缓存占用</strong>
            <span>{loading ? '读取中…' : cacheSize === null ? '未知' : formatCacheSize(cacheSize)}</span>
          </div>
          <button
            type="button"
            className="settings-action browser-cache-card__action"
            disabled={loading || clearing}
            onClick={() => void handleClearCache()}
          >
            {clearing ? '清除中…' : '清除网页缓存'}
          </button>
          {message ? <p className="browser-cache-card__message">{message}</p> : null}
        </div>
      </section>
    </div>
  )
}
