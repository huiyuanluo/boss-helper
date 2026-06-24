export type FramePageType = "frontend" | "jsp"

export interface FrameTab {
  id: string
  title: string
  href: string
  closeable: boolean
  active: boolean
}

export interface FrameMenuItem {
  id: string
  title: string
  text: string
  href: string
  closeable: boolean
  pageType: FramePageType
}

export interface FrameMenuGroup {
  text: string
  items: FrameMenuItem[]
}

export interface FrameModule {
  id: string
  index: number
  name: string
  homePageId?: string
  groups: FrameMenuGroup[]
  tabs: FrameTab[]
  activePageId?: string
  initialized: boolean
}

export interface FrameUserInfo {
  name: string
  logoutHref: string
}

export interface FrameSnapshot {
  ready: boolean
  currentModuleId?: string
  currentPageId?: string
  modules: FrameModule[]
  user: FrameUserInfo
  href: string
  error?: string
}

export interface OpenFramePagePayload {
  moduleId: string
  pageId: string
  title: string
  href: string
}

export interface SwitchFrameModulePayload {
  moduleId: string
}

export interface CloseFrameModulePayload {
  moduleId: string
  fallbackModuleId?: string
}

export type FrameBridgeAction =
  | "snapshot"
  | "openPage"
  | "switchModule"
  | "closeModule"

export type FrameBridgePayload =
  | OpenFramePagePayload
  | SwitchFrameModulePayload
  | CloseFrameModulePayload
  | undefined

export function normalizeFrameText(value?: string | null) {
  return (value || "").replace(/\s+/g, " ").trim()
}

export function getFramePageType(href: string): FramePageType {
  const normalizedHref = href.trim()

  if (normalizedHref.startsWith("/v1/") || normalizedHref.startsWith("v1/")) {
    return "frontend"
  }

  return "jsp"
}

export function getModuleOpenCount(module: FrameModule) {
  return module.tabs.length
}

export function getOpenModules(snapshot?: FrameSnapshot) {
  return (snapshot?.modules || []).filter((item) => getModuleOpenCount(item) > 0)
}
