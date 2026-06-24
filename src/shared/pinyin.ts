import { pinyin } from "pinyin-pro"

export interface SearchableModule {
  key: string
  value: string
  fullPinyin: string
  initials: string
}

function compact(value: string) {
  return value.toLowerCase().replace(/\s+/g, "")
}

export function createSearchableModule(key: string, value: string): SearchableModule {
  let fullPinyin = ""
  let initials = ""

  try {
    fullPinyin = compact(pinyin(key, { toneType: "none", type: "array" }).join(""))
    initials = compact(pinyin(key, { pattern: "first", type: "array" }).join(""))
  } catch {
    fullPinyin = ""
    initials = ""
  }

  return {
    key,
    value,
    fullPinyin,
    initials
  }
}

export function matchesKeyword(module: SearchableModule, rawKeyword: string) {
  const keyword = compact(rawKeyword)
  if (!keyword) return false

  const normalizedKey = compact(module.key)
  return (
    normalizedKey.includes(keyword) ||
    module.fullPinyin.includes(keyword) ||
    module.initials.includes(keyword)
  )
}
