import React from "react"
import launchpadIconUrl from "data-base64:../../assets/launchpad.svg"
import type { PlasmoCSConfig } from "plasmo"
import { createRoot, type Root } from "react-dom/client"

import { BossFrameApp } from "@/features/frame/BossFrameApp"
import {
  frameAppStyles,
  frameGlobalStyles
} from "@/features/frame/frameStyles"
import { LaunchpadApp } from "@/features/LaunchpadApp"
import { launchpadStyles } from "@/features/launchpadStyles"
import {
  getEnvironmentByHost,
  isBossHost,
  isBossIndexUrl
} from "@/shared/domains"
import type { ContentMessage, ContentResponse } from "@/shared/messages"
import {
  createLocalhostLink,
  determinePageTypeFromLink,
  getCurrentIFrameLink
} from "@/shared/nav"
import {
  getAntiDropEnabled,
  getFrameAutoCollapseEnabled,
  getFrameEnhancementEnabled,
  getLaunchpadEnabled,
  setAntiDropEnabled,
  setFrameAutoCollapseEnabled,
  setFrameEnhancementEnabled,
  setLaunchpadEnabled
} from "@/shared/storage"

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
  run_at: "document_end"
}

let antiDropTimer: number | undefined
let launchpadIconHost: HTMLElement | undefined
let launchpadRoot: Root | undefined
let frameRoot: Root | undefined
let frameHost: HTMLElement | undefined
let frameGlobalStyle: HTMLStyleElement | undefined
let frameEnhancementActive = false

function dispatchLaunchpadEvent(name: "show" | "hide") {
  window.dispatchEvent(new CustomEvent(`boss-helper:${name}-launchpad`))
}

function dispatchFrameAutoCollapseEvent(enabled: boolean) {
  window.dispatchEvent(
    new CustomEvent("boss-helper:set-frame-auto-collapse", {
      detail: { enabled }
    })
  )
}

function createIconButton() {
  const button = document.createElement("button")
  button.type = "button"
  button.title = "打开启动台"
  button.setAttribute("aria-label", "打开启动台")
  button.innerHTML = `
    <img alt="" src="${launchpadIconUrl}" />
  `
  Object.assign(button.style, {
    width: "28px",
    height: "28px",
    marginLeft: "10px",
    marginTop: "2px",
    border: "1px solid #409eff",
    borderRadius: "999px",
    background: "#409eff",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 2px rgba(64, 158, 255, 0.28)",
    padding: "0"
  })
  Object.assign(button.querySelector("img")!.style, {
    width: "21px",
    height: "21px",
    display: "block"
  })
  button.addEventListener("click", () => dispatchLaunchpadEvent("show"))

  return button
}

function mountLaunchpadIcon() {
  if (launchpadIconHost) return

  const host = document.createElement("span")
  host.id = "boss-helper-launchpad-entry"

  const shadow = host.attachShadow({ mode: "open" })
  shadow.appendChild(createIconButton())

  const header = document.querySelector(".header")
  if (header) {
    header.appendChild(host)
  } else {
    Object.assign(host.style, {
      position: "fixed",
      right: "18px",
      top: "18px",
      zIndex: "100001"
    })
    document.body.appendChild(host)
  }

  launchpadIconHost = host
}

function unmountLaunchpadIcon() {
  launchpadIconHost?.remove()
  launchpadIconHost = undefined
}

function mountLaunchpadPanel(host: string) {
  if (launchpadRoot) return

  const panelHost = document.createElement("div")
  panelHost.id = "boss-helper-launchpad-panel"
  document.body.appendChild(panelHost)

  const shadow = panelHost.attachShadow({ mode: "open" })
  const style = document.createElement("style")
  style.textContent = launchpadStyles

  const appRoot = document.createElement("div")
  shadow.append(style, appRoot)

  launchpadRoot = createRoot(appRoot)
  launchpadRoot.render(React.createElement(LaunchpadApp, { host }))
}

function ensureFrameGlobalStyle() {
  if (frameGlobalStyle) return

  const style = document.createElement("style")
  style.id = "boss-helper-frame-global-style"
  style.textContent = frameGlobalStyles
  ;(document.head || document.documentElement).appendChild(style)
  frameGlobalStyle = style
}

function removeFrameGlobalStyle() {
  frameGlobalStyle?.remove()
  frameGlobalStyle = undefined
}

function isLoginPage() {
  const pathname = window.location.pathname.toLowerCase()
  if (pathname.includes("login")) return true

  const hasPasswordInput = Boolean(document.querySelector('input[type="password"]'))
  const hasLegacyFrameShell = Boolean(
    document.querySelector("#J_NavContent") ||
      document.querySelector("#J_Nav") ||
      document.querySelector(".dl-main-nav")
  )

  return hasPasswordInput && !hasLegacyFrameShell
}

function canMountFrameEnhancement() {
  return isBossIndexUrl(window.location.href) && !isLoginPage()
}

function canShowLaunchpadEntry() {
  return canMountFrameEnhancement()
}

function mountFrameEnhancement(host: string) {
  if (!canMountFrameEnhancement()) {
    if (frameRoot) unmountFrameEnhancement()
    return false
  }

  if (frameRoot) return true

  ensureFrameGlobalStyle()
  document.documentElement.classList.add("boss-helper-frame-enhanced")
  frameEnhancementActive = true
  dispatchLaunchpadEvent("hide")
  unmountLaunchpadIcon()

  const hostElement = document.createElement("div")
  hostElement.id = "boss-helper-frame-root"
  document.body.appendChild(hostElement)

  const shadow = hostElement.attachShadow({ mode: "open" })
  const style = document.createElement("style")
  style.textContent = frameAppStyles

  const appRoot = document.createElement("div")
  shadow.append(style, appRoot)

  frameRoot = createRoot(appRoot)
  frameRoot.render(React.createElement(BossFrameApp, { host }))
  frameHost = hostElement

  return true
}

function unmountFrameEnhancement() {
  frameRoot?.unmount()
  frameRoot = undefined
  frameHost?.remove()
  frameHost = undefined
  frameEnhancementActive = false
  document.documentElement.classList.remove("boss-helper-frame-enhanced")
  removeFrameGlobalStyle()
}

function cycleRequest() {
  fetch("/index", { credentials: "include" }).catch(() => undefined)
}

function startAntiDrop() {
  const env = getEnvironmentByHost(window.location.hostname)
  if (!env?.allowAntiDrop || antiDropTimer) return

  antiDropTimer = window.setInterval(cycleRequest, 1000 * 60 * 5)
}

function stopAntiDrop() {
  if (!antiDropTimer) return
  window.clearInterval(antiDropTimer)
  antiDropTimer = undefined
}

function showPageTypeAlert() {
  const link = getCurrentIFrameLink()
  const pageType = determinePageTypeFromLink(link, window.location.origin)

  if (pageType === "frontend") {
    alert(`当前页面是前端页面，页面地址为${link.replace(window.location.origin, "")}`)
    return pageType
  }

  if (pageType === "jsp") {
    alert(`当前页面是后端JSP页面，页面地址为${link.replace(window.location.origin, "")}`)
    return pageType
  }

  alert("未获取到当前页面链接，请在页面初始化完成后重试或刷新页面")
  return pageType
}

function getPageTypeResponse(): ContentResponse {
  const link = getCurrentIFrameLink()

  return {
    ok: true,
    pageType: determinePageTypeFromLink(link, window.location.origin)
  }
}

function getOpenPageResponse(localhost = false): ContentResponse {
  const link = getCurrentIFrameLink()

  if (!link) {
    alert("未获取到当前页面链接，请在页面初始化完成后重试或刷新页面")
    return { ok: false, message: "未获取到当前页面链接" }
  }

  return {
    ok: true,
    link: localhost ? createLocalhostLink(link, window.location.origin) : link
  }
}

async function handleMessage(message: ContentMessage): Promise<ContentResponse> {
  if (message.cmd === "content:getHostName") {
    return window.location.hostname
  }

  if (message.cmd === "content:getPageType") {
    return getPageTypeResponse()
  }

  if (message.cmd === "content:setLaunchpadEnabled") {
    await setLaunchpadEnabled(window.location.hostname, message.enabled)

    if (message.enabled && !frameEnhancementActive && canShowLaunchpadEntry()) {
      mountLaunchpadIcon()
    } else {
      dispatchLaunchpadEvent("hide")
      unmountLaunchpadIcon()
    }

    return { ok: true, message: "ok" }
  }

  if (message.cmd === "content:setFrameEnhancementEnabled") {
    await setFrameEnhancementEnabled(window.location.hostname, message.enabled)

    if (message.enabled) {
      mountFrameEnhancement(window.location.hostname)
    } else {
      unmountFrameEnhancement()

      if (
        canShowLaunchpadEntry() &&
        (await getLaunchpadEnabled(window.location.hostname))
      ) {
        mountLaunchpadIcon()
      }
    }

    return { ok: true, message: "ok" }
  }

  if (message.cmd === "content:setFrameAutoCollapseEnabled") {
    await setFrameAutoCollapseEnabled(window.location.hostname, message.enabled)
    dispatchFrameAutoCollapseEvent(message.enabled)

    return { ok: true, message: "ok" }
  }

  if (message.cmd === "content:setAntiDropEnabled") {
    await setAntiDropEnabled(window.location.hostname, message.enabled)

    if (message.enabled) {
      startAntiDrop()
    } else {
      stopAntiDrop()
    }

    return { ok: true, message: "ok" }
  }

  if (message.cmd === "content:determinePageType") {
    return {
      ok: true,
      pageType: showPageTypeAlert()
    }
  }

  if (message.cmd === "content:openCurrentPage") {
    return getOpenPageResponse(false)
  }

  if (message.cmd === "content:openCurrentPageWithLocal") {
    return getOpenPageResponse(true)
  }

  return { ok: false, message: "未知消息" }
}

async function init() {
  const host = window.location.hostname
  if (!isBossHost(host)) return

  mountLaunchpadPanel(host)

  const [launchpadEnabled, antiDropEnabled] = await Promise.all([
    getLaunchpadEnabled(host),
    getAntiDropEnabled(host)
  ])
  const [frameEnhancementEnabled, frameAutoCollapseEnabled] = await Promise.all([
    getFrameEnhancementEnabled(host),
    getFrameAutoCollapseEnabled(host)
  ])
  dispatchFrameAutoCollapseEvent(frameAutoCollapseEnabled)

  if (frameEnhancementEnabled) {
    mountFrameEnhancement(host)
  }

  if (launchpadEnabled && !frameEnhancementActive && canShowLaunchpadEntry()) {
    mountLaunchpadIcon()
  }

  if (antiDropEnabled) {
    startAntiDrop()
  }
}

chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse)
  return true
})

init()
