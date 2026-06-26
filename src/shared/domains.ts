export type BossEnvironmentKey =
  | "dev_5upay"
  | "qa_5upay"
  | "uat_5upay"
  | "pro_5upay"
  | "qa_geoswift"
  | "qa_ajbridge"
  | "uat_ajbridge"
  | "pro_ajbridge"

export interface BossEnvironment {
  key: BossEnvironmentKey
  host: string
  label: string
  group: "5upay" | "geoswift" | "ajbridge"
  stage: "dev" | "qa" | "uat" | "pro"
  allowAntiDrop: boolean
}

export const LOCALHOST_ORIGIN = "http://localhost:16000"
export const LOCALHOST_URL = `${LOCALHOST_ORIGIN}/`
export const SID_COOKIE_NAME = "sid"

export const BOSS_ENVIRONMENTS: BossEnvironment[] = [
  {
    key: "dev_5upay",
    host: "dev-boss.5upay.com",
    label: "5upay Dev",
    group: "5upay",
    stage: "dev",
    allowAntiDrop: true
  },
  {
    key: "qa_5upay",
    host: "qa-boss.5upay.com",
    label: "5upay QA",
    group: "5upay",
    stage: "qa",
    allowAntiDrop: true
  },
  {
    key: "uat_5upay",
    host: "uat-boss.5upay.com",
    label: "5upay UAT",
    group: "5upay",
    stage: "uat",
    allowAntiDrop: false
  },
  {
    key: "pro_5upay",
    host: "boss.5upay.com",
    label: "5upay Pro",
    group: "5upay",
    stage: "pro",
    allowAntiDrop: false
  },
  {
    key: "qa_geoswift",
    host: "qa-boss.geoswift.com",
    label: "Geoswift QA",
    group: "geoswift",
    stage: "qa",
    allowAntiDrop: true
  },
  {
    key: "qa_ajbridge",
    host: "qa-boss.ajbridge.com",
    label: "AJBridge QA",
    group: "ajbridge",
    stage: "qa",
    allowAntiDrop: true
  },
  {
    key: "uat_ajbridge",
    host: "uat-boss.ajbridge.com",
    label: "AJBridge UAT",
    group: "ajbridge",
    stage: "uat",
    allowAntiDrop: false
  },
  {
    key: "pro_ajbridge",
    host: "boss.ajbridge.com",
    label: "AJBridge Pro",
    group: "ajbridge",
    stage: "pro",
    allowAntiDrop: false
  }
]

export const DEFAULT_BOSS_ENVIRONMENT = BOSS_ENVIRONMENTS[0]!

export const BOSS_HOSTS = BOSS_ENVIRONMENTS.map((item) => item.host)

export const BOSS_MATCH_PATTERNS = BOSS_HOSTS.map((host) => `https://${host}/*`)

export function getEnvironmentByHost(host?: string | null) {
  if (!host) return undefined

  return BOSS_ENVIRONMENTS.find((item) => item.host === host)
}

export function getEnvironmentByUrl(rawUrl?: string | null) {
  if (!rawUrl) return undefined

  try {
    return getEnvironmentByHost(new URL(rawUrl).hostname)
  } catch {
    return undefined
  }
}

export function isBossHost(host?: string | null) {
  return Boolean(getEnvironmentByHost(host))
}

export function isBossIndexUrl(rawUrl?: string | null) {
  if (!rawUrl) return false

  try {
    const url = new URL(rawUrl)
    return isBossHost(url.hostname) && url.pathname === "/index"
  } catch {
    return false
  }
}

export function getBossUrl(host: string, path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `https://${host}${normalizedPath}`
}

export function normalizeCookieDomain(domain?: string | null) {
  return (domain || "").replace(/^\./, "")
}

export function isCookieFromHost(cookie: chrome.cookies.Cookie, host: string) {
  const domain = normalizeCookieDomain(cookie.domain)
  return domain === host || host.endsWith(`.${domain}`)
}
