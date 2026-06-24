import {
  BOSS_ENVIRONMENTS,
  DEFAULT_BOSS_ENVIRONMENT,
  getBossUrl,
  isCookieFromHost,
  LOCALHOST_URL,
  normalizeCookieDomain,
  SID_COOKIE_NAME
} from "@/shared/domains"
import type {
  BackgroundMessage,
  BackgroundResponse,
  CookieStatusSnapshot,
  LoginCheckResult
} from "@/shared/messages"
import {
  getCookieLastError,
  getCookieLastSyncedAt,
  getCookieLoginCheck,
  getCookieSyncSettings,
  setCookieLastError,
  setCookieLastSyncedAt,
  setCookieLoginCheck,
  setCookieSyncSettings
} from "@/shared/storage"

function chromeLastError() {
  return chrome.runtime.lastError?.message
}

function getCookie(details: chrome.cookies.CookieDetails): Promise<chrome.cookies.Cookie | null> {
  return new Promise((resolve, reject) => {
    chrome.cookies.get(details, (cookie) => {
      const error = chromeLastError()
      if (error) {
        reject(new Error(error))
        return
      }

      resolve(cookie || null)
    })
  })
}

function setCookie(details: chrome.cookies.SetDetails): Promise<chrome.cookies.Cookie | null> {
  return new Promise((resolve, reject) => {
    chrome.cookies.set(details, (cookie) => {
      const error = chromeLastError()
      if (error) {
        reject(new Error(error))
        return
      }

      resolve(cookie || null)
    })
  })
}

function removeCookie(
  details: chrome.cookies.CookieDetails
): Promise<chrome.cookies.CookieDetails | null> {
  return new Promise((resolve, reject) => {
    chrome.cookies.remove(details, (removedCookie) => {
      const error = chromeLastError()
      if (error) {
        reject(new Error(error))
        return
      }

      resolve(removedCookie || null)
    })
  })
}

async function getSourceSid(sourceHost: string) {
  return getCookie({
    url: getBossUrl(sourceHost),
    name: SID_COOKIE_NAME
  })
}

async function getLocalSid() {
  return getCookie({
    url: LOCALHOST_URL,
    name: SID_COOKIE_NAME
  })
}

async function writeLocalSid(value: string, sourceCookie?: chrome.cookies.Cookie | null) {
  const expirationDate =
    sourceCookie?.expirationDate && sourceCookie.expirationDate > Date.now() / 1000
      ? sourceCookie.expirationDate
      : undefined

  await setCookie({
    url: LOCALHOST_URL,
    name: SID_COOKIE_NAME,
    value,
    path: "/",
    secure: false,
    httpOnly: true,
    sameSite: "lax",
    expirationDate
  })

  await setCookieLastSyncedAt(Date.now())
  await setCookieLastError(undefined)
}

async function removeLocalSid() {
  await removeCookie({
    url: LOCALHOST_URL,
    name: SID_COOKIE_NAME
  })

  await setCookieLastSyncedAt(Date.now())
  await setCookieLastError(undefined)
}

async function syncSidFromSource() {
  const settings = await getCookieSyncSettings()
  const sourceCookie = await getSourceSid(settings.sourceHost)

  if (!sourceCookie?.value) {
    await removeLocalSid()
    return createCookieStatusSnapshot()
  }

  await writeLocalSid(sourceCookie.value, sourceCookie)
  return createCookieStatusSnapshot()
}

function parseLoginStatus(
  sourceHost: string,
  response: Response,
  responseText: string
): LoginCheckResult {
  const lowerText = responseText.toLowerCase()
  const lowerUrl = response.url.toLowerCase()
  const hasBossShell =
    responseText.includes("J_Nav") ||
    responseText.includes("dl-tab") ||
    responseText.includes("nav-item-inner")
  const looksLikeLogin =
    lowerUrl.includes("login") ||
    lowerText.includes('type="password"') ||
    lowerText.includes("password") ||
    lowerText.includes("用户名") ||
    lowerText.includes("用户登录")

  if (response.status === 401 || response.status === 403) {
    return {
      status: "logged-out",
      checkedAt: Date.now(),
      sourceHost,
      statusCode: response.status,
      finalUrl: response.url,
      reason: `HTTP ${response.status}`
    }
  }

  if (hasBossShell) {
    return {
      status: "logged-in",
      checkedAt: Date.now(),
      sourceHost,
      statusCode: response.status,
      finalUrl: response.url,
      reason: "检测到后台页面结构"
    }
  }

  if (looksLikeLogin) {
    return {
      status: "logged-out",
      checkedAt: Date.now(),
      sourceHost,
      statusCode: response.status,
      finalUrl: response.url,
      reason: "检测到登录页特征"
    }
  }

  return {
    status: "unknown",
    checkedAt: Date.now(),
    sourceHost,
    statusCode: response.status,
    finalUrl: response.url,
    reason: "返回内容无法确认登录态"
  }
}

async function checkSourceLogin() {
  const settings = await getCookieSyncSettings()

  try {
    const response = await fetch(getBossUrl(settings.sourceHost, "/index"), {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    })
    const responseText = await response.text()
    const result = parseLoginStatus(settings.sourceHost, response, responseText)

    await setCookieLoginCheck(result)
    return result
  } catch (error) {
    const result: LoginCheckResult = {
      status: "error",
      checkedAt: Date.now(),
      sourceHost: settings.sourceHost,
      reason: error instanceof Error ? error.message : "登录状态检测失败"
    }

    await setCookieLoginCheck(result)
    return result
  }
}

async function createCookieStatusSnapshot(): Promise<CookieStatusSnapshot> {
  const settings = await getCookieSyncSettings()
  const [sourceSid, localSid, lastSyncedAt, lastError, loginCheck] = await Promise.all([
    getSourceSid(settings.sourceHost),
    getLocalSid(),
    getCookieLastSyncedAt(),
    getCookieLastError(),
    getCookieLoginCheck()
  ])

  return {
    settings,
    sourceSidExists: Boolean(sourceSid?.value),
    localSidExists: Boolean(localSid?.value),
    lastSyncedAt,
    lastError,
    loginCheck
  }
}

async function handleCookieChange(changeInfo: chrome.cookies.CookieChangeInfo) {
  const { cookie, removed } = changeInfo

  if (cookie.name !== SID_COOKIE_NAME) return

  const settings = await getCookieSyncSettings()
  if (!settings.autoSync) return

  const sourceHost = settings.sourceHost
  const cookieDomain = normalizeCookieDomain(cookie.domain)
  if (!isCookieFromHost(cookie, sourceHost) && cookieDomain !== sourceHost) return

  try {
    if (removed) {
      await removeLocalSid()
      return
    }

    if (cookie.value) {
      await writeLocalSid(cookie.value, cookie)
    }
  } catch (error) {
    await setCookieLastError(error instanceof Error ? error.message : "自动同步失败")
  }
}

async function handleMessage(message: BackgroundMessage): Promise<BackgroundResponse> {
  try {
    if (message.cmd === "cookie:getStatus") {
      return { ok: true, data: await createCookieStatusSnapshot() }
    }

    if (message.cmd === "cookie:updateSettings") {
      await setCookieSyncSettings(message.settings)

      if (message.settings.autoSync) {
        await syncSidFromSource()
      }

      return { ok: true, data: await createCookieStatusSnapshot() }
    }

    if (message.cmd === "cookie:syncNow") {
      return { ok: true, data: await syncSidFromSource() }
    }

    if (message.cmd === "cookie:setLocalSid") {
      const sid = message.sid.trim()
      if (!sid) throw new Error("sid 不能为空")

      await writeLocalSid(sid)
      return { ok: true, data: await createCookieStatusSnapshot() }
    }

    if (message.cmd === "cookie:removeLocalSid") {
      await removeLocalSid()
      return { ok: true, data: await createCookieStatusSnapshot() }
    }

    if (message.cmd === "cookie:checkLogin") {
      const result = await checkSourceLogin()
      return {
        ok: true,
        data: {
          ...(await createCookieStatusSnapshot()),
          loginCheck: result
        }
      }
    }

    return { ok: false, error: "未知消息" }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "操作失败"
    await setCookieLastError(messageText)
    return {
      ok: false,
      error: messageText,
      data: await createCookieStatusSnapshot()
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  getCookieSyncSettings().then((settings) => {
    if (!BOSS_ENVIRONMENTS.some((item) => item.host === settings.sourceHost)) {
      return setCookieSyncSettings({
        sourceHost: DEFAULT_BOSS_ENVIRONMENT.host,
        autoSync: false
      })
    }

    return undefined
  })
})

chrome.cookies.onChanged.addListener((changeInfo) => {
  handleCookieChange(changeInfo).catch((error) => {
    setCookieLastError(error instanceof Error ? error.message : "自动同步失败")
  })
})

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse)
  return true
})
