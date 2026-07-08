export type TocItem = {
  id: string
  label: string
  href?: string
  dest?: string | Array<unknown> | null
  subitems?: TocItem[]
}

export type ReaderTocApi = {
  hasToc: boolean
  openToc: () => void
}
