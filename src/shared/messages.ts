import type { BossEnvironment } from "./domains"

export type LoginStatus = "logged-in" | "logged-out" | "unknown" | "error"

export interface LoginCheckResult {
  status: LoginStatus
  checkedAt: number
  sourceHost: string
  statusCode?: number
  finalUrl?: string
  reason?: string
}

export interface CookieSyncSettings {
  sourceHost: string
  autoSync: boolean
}

export interface CookieStatusSnapshot {
  settings: CookieSyncSettings
  sourceSidExists: boolean
  localSidExists: boolean
  lastSyncedAt?: number
  lastError?: string
  loginCheck?: LoginCheckResult
}

export type BackgroundMessage =
  | { cmd: "cookie:getStatus" }
  | { cmd: "cookie:updateSettings"; settings: CookieSyncSettings }
  | { cmd: "cookie:syncNow" }
  | { cmd: "cookie:setLocalSid"; sid: string }
  | { cmd: "cookie:removeLocalSid" }
  | { cmd: "cookie:checkLogin" }

export type BackgroundResponse =
  | { ok: true; data?: CookieStatusSnapshot | LoginCheckResult }
  | { ok: false; error: string; data?: CookieStatusSnapshot | LoginCheckResult }

export type ContentMessage =
  | { cmd: "content:getHostName" }
  | { cmd: "content:getPageType" }
  | { cmd: "content:setLaunchpadEnabled"; enabled: boolean }
  | { cmd: "content:setAntiDropEnabled"; enabled: boolean }
  | { cmd: "content:determinePageType" }
  | { cmd: "content:openCurrentPage" }
  | { cmd: "content:openCurrentPageWithLocal" }

export type ContentResponse =
  | string
  | {
      ok: true
      link?: string
      pageType?: "frontend" | "jsp" | "unknown"
      message?: string
      environment?: BossEnvironment
    }
  | { ok: false; message: string }
