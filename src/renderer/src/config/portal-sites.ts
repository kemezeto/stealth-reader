export interface PortalSite {
  label: string
  url: string
}

export interface PortalCategory {
  id: string
  label: string
  sites: PortalSite[]
}

export const PORTAL_CATEGORIES: PortalCategory[] = [
  {
    id: 'recommend',
    label: '推荐',
    sites: [
      { label: '微信读书', url: 'https://weread.qq.com/web' },
      { label: '知乎', url: 'https://www.zhihu.com' },
      { label: 'B站', url: 'https://www.bilibili.com' },
      { label: '豆瓣', url: 'https://www.douban.com' }
    ]
  },
  {
    id: 'novel',
    label: '小说',
    sites: [
      { label: '起点中文', url: 'https://www.qidian.com' },
      { label: '番茄小说', url: 'https://fanqienovel.com' },
      { label: '七猫小说', url: 'https://www.qimao.com' }
    ]
  },
  {
    id: 'video',
    label: '视频',
    sites: [
      { label: 'B站', url: 'https://www.bilibili.com' },
      { label: 'YouTube', url: 'https://www.youtube.com' }
    ]
  }
]

export function formatSiteHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
