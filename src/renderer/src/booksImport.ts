export async function importBooksFlow(): Promise<string> {
  const { imported, skipped, unsupported, duplicate } = await window.stealth.importBooks()

  if (imported.length > 0) {
    const parts: string[] = [`已导入 ${imported.length} 本`]
    if (duplicate > 0) parts.push(`${duplicate} 本重复`)
    if (unsupported > 0) parts.push(`${unsupported} 本格式不支持`)
    return parts.join('，')
  }

  if (skipped > 0) {
    if (unsupported > 0 && duplicate === 0) {
      return '仅支持 TXT / EPUB / PDF（PDF 最大 60MB）'
    }
    if (duplicate > 0 && unsupported === 0) {
      return `跳过 ${duplicate} 本重复文件`
    }
    return `未导入：${duplicate} 本重复，${unsupported} 本格式不支持`
  }

  return '未选择文件'
}
