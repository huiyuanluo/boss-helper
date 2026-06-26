import type { PlasmoCSConfig } from "plasmo"

import { isBossIndexUrl } from "@/shared/domains"

export const config: PlasmoCSConfig = {
  matches: [
    "https://dev-boss.5upay.com/*",
    "https://qa-boss.5upay.com/*",
    "https://uat-boss.5upay.com/*",
    "https://qa-boss.geoswift.com/*",
    "https://boss.5upay.com/*",
    "https://qa-boss.ajbridge.com/*",
    "https://uat-boss.ajbridge.com/*",
    "https://boss.ajbridge.com/*"
  ],
  run_at: "document_end",
  world: "MAIN"
}

const REQUEST_SOURCE = "boss-helper-frame-request"
const RESPONSE_SOURCE = "boss-helper-frame-response"

type BossFrameWindow = Window & {
  topManager?: any
  __bossHelperFrameBridge?: boolean
}

const win = window as BossFrameWindow

function normalizeText(value?: string | null) {
  return (value || "").replace(/\s+/g, " ").trim()
}

function pageTypeFromHref(href: string) {
  const value = (href || "").trim()
  return value.indexOf("/v1/") === 0 || value.indexOf("v1/") === 0
    ? "frontend"
    : "jsp"
}

function safeGet(model: any, key: string, fallback?: any) {
  if (!model || typeof model.get !== "function") return fallback

  try {
    const value = model.get(key)
    return value === undefined ? fallback : value
  } catch {
    return fallback
  }
}

function getModulesConfig() {
  const modulesConfig = safeGet(win.topManager, "modulesConfig", [])
  return Array.isArray(modulesConfig) ? modulesConfig : []
}

function getRuntimeModules() {
  const modules = safeGet(win.topManager, "modules", {})
  return modules && typeof modules === "object" ? modules : {}
}

function getModuleIndex(moduleId: string) {
  const modulesConfig = getModulesConfig()

  for (let index = 0; index < modulesConfig.length; index += 1) {
    const item = modulesConfig[index]
    if (String(item?.id || "") === String(moduleId)) return index
  }

  return -1
}

function getModuleTabs(moduleId: string) {
  const moduleInstance = getRuntimeModules()[moduleId]
  const tab = moduleInstance?.tab
  const children = safeGet(tab, "children", [])

  if (!Array.isArray(children)) return []

  const activeItem =
    typeof tab?.getActivedItem === "function" ? tab.getActivedItem() : undefined
  const activeId =
    activeItem && typeof activeItem.get === "function"
      ? String(activeItem.get("id") || "")
      : ""

  return children
    .map((item: any) => {
      const id = String(safeGet(item, "id", ""))
      if (!id) return undefined

      return {
        id,
        title: String(safeGet(item, "title", "")),
        href: String(safeGet(item, "href", "")),
        closeable: safeGet(item, "closeable", true) !== false,
        active: id === activeId
      }
    })
    .filter(Boolean)
}

function getActivePageId(moduleId: string) {
  const moduleInstance = getRuntimeModules()[moduleId]
  const activeItem =
    typeof moduleInstance?.tab?.getActivedItem === "function"
      ? moduleInstance.tab.getActivedItem()
      : undefined

  if (activeItem && typeof activeItem.get === "function") {
    return String(activeItem.get("id") || "")
  }

  return ""
}

function serializeGroups(groups: any[]) {
  if (!Array.isArray(groups)) return []

  return groups.map((group) => ({
    text: normalizeText(group?.text),
    items: (Array.isArray(group?.items) ? group.items : [])
      .map((item: any) => {
        const id = String(item?.id || "")
        const text = normalizeText(item?.text)
        const href = String(item?.href || "")
        const title = normalizeText(item?.title || text)

        if (!id || !text || !href) return undefined

        return {
          id,
          title,
          text,
          href,
          closeable: item?.closeable !== false,
          pageType: pageTypeFromHref(href)
        }
      })
      .filter(Boolean)
  }))
}

function buildSnapshot() {
  const manager = win.topManager
  const modulesConfig = getModulesConfig()
  const runtimeModules = getRuntimeModules()
  const navItems = Array.from(
    document.querySelectorAll<HTMLElement>("#J_Nav > li.nav-item")
  )
  const currentModelIndex = safeGet(manager, "currentModelIndex", undefined)
  const currentModuleConfig = modulesConfig[currentModelIndex]
  const currentModuleId = currentModuleConfig?.id
    ? String(currentModuleConfig.id)
    : undefined
  const userName = normalizeText(
    document.querySelector<HTMLElement>(".dl-log-user")?.innerText
  )
  const logoutHref =
    document.querySelector<HTMLAnchorElement>(".dl-log-quit")?.getAttribute("href") ||
    "/logout"

  return {
    ready: Boolean(manager && modulesConfig.length),
    currentModuleId,
    currentPageId: currentModuleId ? getActivePageId(currentModuleId) : undefined,
    modules: modulesConfig.map((item: any, index: number) => {
      const id = String(item?.id || "")
      const navName = normalizeText(
        navItems[index]?.querySelector<HTMLElement>(".nav-item-inner")?.innerText ||
          navItems[index]?.innerText
      )

      return {
        id,
        index,
        name: navName || normalizeText(item?.text) || id,
        homePageId: item?.homePage ? String(item.homePage) : undefined,
        groups: serializeGroups(item?.menu),
        tabs: getModuleTabs(id),
        activePageId: getActivePageId(id),
        initialized: Boolean(runtimeModules[id])
      }
    }),
    user: {
      name: userName,
      logoutHref
    },
    href: location.href,
    error: manager && modulesConfig.length ? undefined : "旧页面框架尚未初始化"
  }
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function assertManager() {
  if (!win.topManager) throw new Error("旧页面框架尚未初始化")
  return win.topManager
}

async function switchModule(payload: { moduleId: string }) {
  const manager = assertManager()
  const index = getModuleIndex(payload.moduleId)
  if (index < 0) throw new Error("未找到一级模块")

  if (typeof manager._setModuleSelected === "function") {
    manager._setModuleSelected(index)
  } else {
    const target = document.querySelector<HTMLElement>(
      `#J_Nav > li.nav-item[data-index="${index}"]`
    )
    target?.click()
  }

  await delay(120)
  return buildSnapshot()
}

async function openPage(payload: {
  moduleId: string
  pageId: string
  title: string
  href: string
}) {
  const manager = assertManager()

  if (typeof manager.openPage !== "function") {
    throw new Error("旧页面框架不支持打开页面")
  }

  manager.openPage({
    moduleId: payload.moduleId,
    id: payload.pageId,
    title: payload.title,
    href: payload.href,
    closeable: true
  })

  await delay(160)
  return buildSnapshot()
}

function findFallbackModuleId(closedModuleId: string, requestedFallbackId?: string) {
  const modulesConfig = getModulesConfig()
  const modulesWithTabs = modulesConfig
    .map((item: any) => String(item?.id || ""))
    .filter((id) => id && id !== closedModuleId && getModuleTabs(id).length > 0)

  if (
    requestedFallbackId &&
    requestedFallbackId !== closedModuleId &&
    getModuleTabs(requestedFallbackId).length > 0
  ) {
    return requestedFallbackId
  }

  return modulesWithTabs[modulesWithTabs.length - 1] || "home"
}

async function closeModule(payload: {
  moduleId: string
  fallbackModuleId?: string
}) {
  const manager = assertManager()
  const runtimeModule = getRuntimeModules()[payload.moduleId]

  if (runtimeModule?.tab && typeof runtimeModule.tab.closeAll === "function") {
    runtimeModule.tab.closeAll()
  }

  await delay(720)

  const snapshotAfterClose = buildSnapshot()
  const currentModuleId = snapshotAfterClose.currentModuleId
  const currentModule =
    currentModuleId &&
    snapshotAfterClose.modules.find((item: any) => item.id === currentModuleId)

  if (
    currentModuleId === payload.moduleId ||
    (currentModule && currentModule.tabs.length === 0)
  ) {
    const fallbackModuleId = findFallbackModuleId(
      payload.moduleId,
      payload.fallbackModuleId
    )
    const fallbackIndex = getModuleIndex(fallbackModuleId)

    if (fallbackIndex >= 0 && typeof manager._setModuleSelected === "function") {
      manager._setModuleSelected(fallbackIndex)
    }
  }

  await delay(160)
  return buildSnapshot()
}

async function handleAction(action: string, payload: any) {
  if (action === "snapshot") return buildSnapshot()
  if (action === "openPage") return openPage(payload)
  if (action === "switchModule") return switchModule(payload)
  if (action === "closeModule") return closeModule(payload)

  throw new Error("未知页面框架操作")
}

function installBridge() {
  if (win.__bossHelperFrameBridge) return
  win.__bossHelperFrameBridge = true

  window.addEventListener("message", async (event) => {
    if (event.source !== window) return

    const data = event.data
    if (!data || data.source !== REQUEST_SOURCE || !data.id) return

    try {
      const result = await handleAction(data.action, data.payload)
      window.postMessage(
        {
          source: RESPONSE_SOURCE,
          id: data.id,
          ok: true,
          data: result
        },
        location.origin
      )
    } catch (error) {
      window.postMessage(
        {
          source: RESPONSE_SOURCE,
          id: data.id,
          ok: false,
          error: error instanceof Error ? error.message : "页面框架操作失败"
        },
        location.origin
      )
    }
  })
}

if (isBossIndexUrl(location.href)) {
  installBridge()
}
