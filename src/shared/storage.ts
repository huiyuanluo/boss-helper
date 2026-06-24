import { DEFAULT_BOSS_ENVIRONMENT, getEnvironmentByHost } from "./domains"
import type { CookieSyncSettings, LoginCheckResult } from "./messages"

const STORAGE_PREFIX = "boss-helper"

export const STORAGE_KEYS = {
  cookieSyncSettings: `${STORAGE_PREFIX}:cookie-sync-settings`,
  cookieLastSyncedAt: `${STORAGE_PREFIX}:cookie-last-synced-at`,
  cookieLastError: `${STORAGE_PREFIX}:cookie-last-error`,
  cookieLoginCheck: `${STORAGE_PREFIX}:cookie-login-check`
} as const

export function launchpadEnabledKey(host: string) {
  return `${STORAGE_PREFIX}:launchpad-enabled:${host}`
}

export function antiDropEnabledKey(host: string) {
  return `${STORAGE_PREFIX}:anti-drop-enabled:${host}`
}

export function frameEnhancementEnabledKey(host: string) {
  return `${STORAGE_PREFIX}:frame-enhancement-enabled:${host}`
}

export function frameAutoCollapseEnabledKey(host: string) {
  return `${STORAGE_PREFIX}:frame-auto-collapse-enabled:${host}`
}

export function frameRecentModulesKey(host: string) {
  return `${STORAGE_PREFIX}:frame-recent-modules:${host}`
}

export function frameRecentPagesKey(host: string, moduleName: string) {
  return `${STORAGE_PREFIX}:frame-recent-pages:${host}:${encodeURIComponent(moduleName)}`
}

export function favoriteModulesKey(host: string) {
  return `${STORAGE_PREFIX}:favorite-modules:${host}`
}

export function visitHistoryKey(host: string) {
  return `${STORAGE_PREFIX}:visit-history:${host}`
}

function getLastError() {
  return chrome.runtime.lastError?.message
}

export function storageGet<T>(
  area: chrome.storage.StorageArea,
  key: string,
  fallback: T
): Promise<T> {
  return new Promise((resolve, reject) => {
    area.get(key, (result) => {
      const error = getLastError()
      if (error) {
        reject(new Error(error))
        return
      }

      resolve(result[key] === undefined ? fallback : (result[key] as T))
    })
  })
}

export function storageSet(
  area: chrome.storage.StorageArea,
  key: string,
  value: unknown
): Promise<void> {
  return new Promise((resolve, reject) => {
    area.set({ [key]: value }, () => {
      const error = getLastError()
      if (error) {
        reject(new Error(error))
        return
      }

      resolve()
    })
  })
}

export function storageRemove(
  area: chrome.storage.StorageArea,
  key: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    area.remove(key, () => {
      const error = getLastError()
      if (error) {
        reject(new Error(error))
        return
      }

      resolve()
    })
  })
}

export function getLaunchpadEnabled(host: string) {
  return storageGet(chrome.storage.sync, launchpadEnabledKey(host), true)
}

export function setLaunchpadEnabled(host: string, enabled: boolean) {
  return storageSet(chrome.storage.sync, launchpadEnabledKey(host), enabled)
}

export function getAntiDropEnabled(host: string) {
  const defaultEnabled = Boolean(getEnvironmentByHost(host)?.allowAntiDrop)
  return storageGet(chrome.storage.sync, antiDropEnabledKey(host), defaultEnabled)
}

export function setAntiDropEnabled(host: string, enabled: boolean) {
  return storageSet(chrome.storage.sync, antiDropEnabledKey(host), enabled)
}

export function getFrameEnhancementEnabled(host: string) {
  return storageGet(chrome.storage.sync, frameEnhancementEnabledKey(host), true)
}

export function setFrameEnhancementEnabled(host: string, enabled: boolean) {
  return storageSet(chrome.storage.sync, frameEnhancementEnabledKey(host), enabled)
}

export function getFrameAutoCollapseEnabled(host: string) {
  return storageGet(chrome.storage.sync, frameAutoCollapseEnabledKey(host), true)
}

export function setFrameAutoCollapseEnabled(host: string, enabled: boolean) {
  return storageSet(chrome.storage.sync, frameAutoCollapseEnabledKey(host), enabled)
}

export interface FrameRecentModule {
  id: string
  name: string
  openedAt: number
}

export function getFrameRecentModules(host: string) {
  return storageGet<FrameRecentModule[]>(
    chrome.storage.local,
    frameRecentModulesKey(host),
    []
  )
}

export function setFrameRecentModules(host: string, modules: FrameRecentModule[]) {
  return storageSet(
    chrome.storage.local,
    frameRecentModulesKey(host),
    modules.slice(0, 6)
  )
}

export async function upsertFrameRecentModule(
  host: string,
  module: Omit<FrameRecentModule, "openedAt"> & { openedAt?: number }
) {
  const current = await getFrameRecentModules(host)
  const openedAt = module.openedAt || Date.now()
  const next = [
    {
      id: module.id,
      name: module.name,
      openedAt
    },
    ...current.filter((item) => item.name !== module.name)
  ].slice(0, 6)

  await setFrameRecentModules(host, next)
  return next
}

export interface FrameRecentPage {
  text: string
  title: string
  href: string
  pageType: "frontend" | "jsp"
  openedAt: number
}

export function getFrameRecentPages(host: string, moduleName: string) {
  return storageGet<FrameRecentPage[]>(
    chrome.storage.local,
    frameRecentPagesKey(host, moduleName),
    []
  )
}

export function setFrameRecentPages(
  host: string,
  moduleName: string,
  pages: FrameRecentPage[]
) {
  return storageSet(
    chrome.storage.local,
    frameRecentPagesKey(host, moduleName),
    pages.slice(0, 10)
  )
}

export async function upsertFrameRecentPage(
  host: string,
  moduleName: string,
  page: Omit<FrameRecentPage, "openedAt"> & { openedAt?: number }
) {
  const current = await getFrameRecentPages(host, moduleName)
  const openedAt = page.openedAt || Date.now()
  const next = [
    {
      text: page.text,
      title: page.title,
      href: page.href,
      pageType: page.pageType,
      openedAt
    },
    ...current.filter((item) => item.href !== page.href)
  ].slice(0, 10)

  await setFrameRecentPages(host, moduleName, next)
  return next
}

export function getFavoriteModules(host: string) {
  return storageGet<string[]>(chrome.storage.sync, favoriteModulesKey(host), [])
}

export function setFavoriteModules(host: string, modules: string[]) {
  return storageSet(chrome.storage.sync, favoriteModulesKey(host), modules)
}

export function getVisitHistory(host: string) {
  return storageGet<string[]>(chrome.storage.local, visitHistoryKey(host), [])
}

export function setVisitHistory(host: string, modules: string[]) {
  return storageSet(chrome.storage.local, visitHistoryKey(host), modules.slice(0, 10))
}

export function getCookieSyncSettings() {
  return storageGet<CookieSyncSettings>(
    chrome.storage.sync,
    STORAGE_KEYS.cookieSyncSettings,
    {
      sourceHost: DEFAULT_BOSS_ENVIRONMENT.host,
      autoSync: false
    }
  )
}

export function setCookieSyncSettings(settings: CookieSyncSettings) {
  return storageSet(chrome.storage.sync, STORAGE_KEYS.cookieSyncSettings, settings)
}

export function getCookieLastSyncedAt() {
  return storageGet<number | undefined>(
    chrome.storage.local,
    STORAGE_KEYS.cookieLastSyncedAt,
    undefined
  )
}

export function setCookieLastSyncedAt(timestamp: number) {
  return storageSet(chrome.storage.local, STORAGE_KEYS.cookieLastSyncedAt, timestamp)
}

export function getCookieLastError() {
  return storageGet<string | undefined>(
    chrome.storage.local,
    STORAGE_KEYS.cookieLastError,
    undefined
  )
}

export function setCookieLastError(error?: string) {
  if (!error) return storageRemove(chrome.storage.local, STORAGE_KEYS.cookieLastError)
  return storageSet(chrome.storage.local, STORAGE_KEYS.cookieLastError, error)
}

export function getCookieLoginCheck() {
  return storageGet<LoginCheckResult | undefined>(
    chrome.storage.local,
    STORAGE_KEYS.cookieLoginCheck,
    undefined
  )
}

export function setCookieLoginCheck(result: LoginCheckResult) {
  return storageSet(chrome.storage.local, STORAGE_KEYS.cookieLoginCheck, result)
}
