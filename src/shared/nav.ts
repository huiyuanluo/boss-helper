import { LOCALHOST_ORIGIN } from "./domains"

export interface BossModule {
  key: string
  value: string
}

export type PageType = "frontend" | "jsp" | "unknown"

function normalizeModuleTitle(title: string) {
  return title.replace(/\s+/g, " ").trim()
}

export function parseBossModules(documentRef: Document = document): BossModule[] {
  const navItems = Array.from(documentRef.querySelectorAll("#J_Nav li[data-index]"))

  return navItems
    .map((item) => {
      const value = item.getAttribute("data-index") || ""
      const key = normalizeModuleTitle(
        item.querySelector(".nav-item-inner")?.textContent || ""
      )

      return { key, value }
    })
    .filter((item) => item.key && item.value)
}

export async function waitForBossModules(maxAttempts = 30, interval = 1000) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const modules = parseBossModules()
    if (modules.length > 0) return modules

    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  return []
}

export function clickBossModule(value: string) {
  const target = document.querySelector(`#J_Nav [data-index="${CSS.escape(value)}"]`)
  if (target instanceof HTMLElement) {
    target.click()
    return true
  }

  return false
}

export function getCurrentIFrameLink(documentRef: Document = document) {
  const tabContents = Array.from(documentRef.querySelectorAll<HTMLElement>(".tab-content"))

  const currentContent = tabContents
    .filter((tabContent) => {
      const showing = tabContent.style.display !== "none"
      const parentTab = tabContent.closest(".dl-tab-item")
      const navHiding = parentTab?.classList.contains("ks-hidden")
      return showing && !navHiding
    })
    .pop()

  const iframe = currentContent?.querySelector<HTMLIFrameElement>("iframe")
  return iframe?.src || ""
}

export function determinePageTypeFromLink(link: string, origin: string): PageType {
  if (!link) return "unknown"

  const relativeLink = link.replace(origin, "")
  if (relativeLink.startsWith("/v1/")) return "frontend"

  return "jsp"
}

export function createLocalhostLink(link: string, origin: string) {
  if (!link) return ""
  return link.replace(origin, LOCALHOST_ORIGIN)
}
