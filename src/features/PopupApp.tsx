import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  Loader2,
  MonitorCheck,
  Trash2
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { formatDateTime } from "@/lib/utils"
import {
  BOSS_ENVIRONMENTS,
  getEnvironmentByUrl,
  type BossEnvironment
} from "@/shared/domains"
import type {
  BackgroundMessage,
  BackgroundResponse,
  ContentMessage,
  ContentResponse,
  CookieStatusSnapshot,
  LoginCheckResult,
  LoginStatus
} from "@/shared/messages"
import {
  getAntiDropEnabled,
  getLaunchpadEnabled,
  setAntiDropEnabled,
  setLaunchpadEnabled
} from "@/shared/storage"

interface ActiveTabState {
  tab?: chrome.tabs.Tab
  environment?: BossEnvironment
}

type BusyAction =
  | "load"
  | "launchpad"
  | "anti-drop"
  | "sync"
  | "manual"
  | "remove-local"
  | "login"
  | "tool"

type PageTypeStatus = "frontend" | "jsp" | "unknown"

type PageTypeResponse =
  | { ok: true; pageType?: PageTypeStatus; message?: string }
  | { ok: false; message: string }

function sendBackgroundMessage(message: BackgroundMessage): Promise<BackgroundResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: BackgroundResponse) => {
      const error = chrome.runtime.lastError?.message
      if (error) {
        reject(new Error(error))
        return
      }

      resolve(response)
    })
  })
}

async function getActiveTab() {
  const tabs = await new Promise<chrome.tabs.Tab[]>((resolve, reject) => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true
      },
      (result) => {
        const error = chrome.runtime.lastError?.message
        if (error) {
          reject(new Error(error))
          return
        }

        resolve(result)
      }
    )
  })

  return tabs[0]
}

async function sendActiveTabMessage<T extends ContentResponse = ContentResponse>(
  message: ContentMessage
): Promise<T> {
  const tab = await getActiveTab()
  if (!tab?.id) throw new Error("未找到当前标签页")

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id!, message, (response: T) => {
      const error = chrome.runtime.lastError?.message
      if (error) {
        reject(new Error(error))
        return
      }

      resolve(response)
    })
  })
}

function createTab(createProperties: chrome.tabs.CreateProperties) {
  return new Promise<chrome.tabs.Tab>((resolve, reject) => {
    chrome.tabs.create(createProperties, (tab) => {
      const error = chrome.runtime.lastError?.message
      if (error) {
        reject(new Error(error))
        return
      }

      resolve(tab)
    })
  })
}

function loginStatusLabel(status?: LoginStatus) {
  if (status === "logged-in") return "已登录"
  if (status === "logged-out") return "未登录"
  if (status === "error") return "检测失败"
  return "未确认"
}

function loginStatusVariant(status?: LoginStatus) {
  if (status === "logged-in") return "success" as const
  if (status === "logged-out") return "destructive" as const
  if (status === "error") return "warning" as const
  return "secondary" as const
}

function pageTypeLabel(pageType?: PageTypeStatus) {
  if (pageType === "frontend") return "前后端分离页面"
  if (pageType === "jsp") return "JSP页面"
  if (pageType === "unknown") return "未识别"
  return "检测中"
}

function pageTypeVariant(pageType?: PageTypeStatus) {
  if (pageType === "frontend") return "success" as const
  if (pageType === "jsp") return "secondary" as const
  if (pageType === "unknown") return "warning" as const
  return "outline" as const
}

async function getCurrentPageType() {
  try {
    const response = await sendActiveTabMessage<PageTypeResponse>({
      cmd: "content:getPageType"
    })

    return response.ok ? response.pageType : undefined
  } catch {
    return undefined
  }
}

function boolBadge(value: boolean, trueText = "存在", falseText = "不存在") {
  return (
    <Badge variant={value ? "success" : "secondary"}>{value ? trueText : falseText}</Badge>
  )
}

function StatusLine({
  label,
  children
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center justify-end gap-2 text-right">{children}</div>
    </div>
  )
}

export function PopupApp() {
  const [activeTabState, setActiveTabState] = useState<ActiveTabState>({})
  const [cookieStatus, setCookieStatus] = useState<CookieStatusSnapshot>()
  const [launchpadEnabled, setLaunchpadEnabledState] = useState(true)
  const [antiDropEnabled, setAntiDropEnabledState] = useState(false)
  const [manualSid, setManualSid] = useState("")
  const [showSid, setShowSid] = useState(false)
  const [pageType, setPageType] = useState<PageTypeStatus>()
  const [busyAction, setBusyAction] = useState<BusyAction>()
  const [notice, setNotice] = useState<string>()

  const activeEnv = activeTabState.environment
  const isBossTab = Boolean(activeEnv)

  const sourceOptions = useMemo(
    () =>
      BOSS_ENVIRONMENTS.map((item) => ({
        value: item.host,
        label: `${item.label} (${item.host})`
      })),
    []
  )

  async function reloadState() {
    setBusyAction("load")
    setNotice(undefined)

    try {
      const tab = await getActiveTab()
      const environment = getEnvironmentByUrl(tab?.url)
      setActiveTabState({ tab, environment })
      setPageType(undefined)

      if (environment) {
        const [nextLaunchpadEnabled, nextAntiDropEnabled, nextPageType] = await Promise.all([
          getLaunchpadEnabled(environment.host),
          getAntiDropEnabled(environment.host),
          getCurrentPageType()
        ])

        setLaunchpadEnabledState(nextLaunchpadEnabled)
        setAntiDropEnabledState(nextAntiDropEnabled)
        setPageType(nextPageType)
      }

      const cookieResponse = await sendBackgroundMessage({ cmd: "cookie:getStatus" })
      if (cookieResponse.ok) {
        setCookieStatus(cookieResponse.data as CookieStatusSnapshot)
      } else {
        setNotice(cookieResponse.error)
        if (cookieResponse.data) setCookieStatus(cookieResponse.data as CookieStatusSnapshot)
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "初始化失败")
    } finally {
      setBusyAction(undefined)
    }
  }

  useEffect(() => {
    reloadState()
  }, [])

  async function withBusy(action: BusyAction, task: () => Promise<void>) {
    setBusyAction(action)
    setNotice(undefined)

    try {
      await task()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "操作失败")
    } finally {
      setBusyAction(undefined)
    }
  }

  async function updateLaunchpad(enabled: boolean) {
    if (!activeEnv) return

    await withBusy("launchpad", async () => {
      await setLaunchpadEnabled(activeEnv.host, enabled)
      setLaunchpadEnabledState(enabled)
      await sendActiveTabMessage({
        cmd: "content:setLaunchpadEnabled",
        enabled
      })
    })
  }

  async function updateAntiDrop(enabled: boolean) {
    if (!activeEnv) return

    await withBusy("anti-drop", async () => {
      await setAntiDropEnabled(activeEnv.host, enabled)
      setAntiDropEnabledState(enabled)
      await sendActiveTabMessage({
        cmd: "content:setAntiDropEnabled",
        enabled
      })
    })
  }

  async function updateCookieSettings(sourceHost: string, autoSync?: boolean) {
    if (!cookieStatus) return

    await withBusy("sync", async () => {
      const response = await sendBackgroundMessage({
        cmd: "cookie:updateSettings",
        settings: {
          sourceHost,
          autoSync: autoSync ?? cookieStatus.settings.autoSync
        }
      })

      if (!response.ok) throw new Error(response.error)
      setCookieStatus(response.data as CookieStatusSnapshot)
    })
  }

  async function syncNow() {
    await withBusy("sync", async () => {
      const response = await sendBackgroundMessage({ cmd: "cookie:syncNow" })
      if (!response.ok) throw new Error(response.error)
      setCookieStatus(response.data as CookieStatusSnapshot)
      setNotice("sid 已同步到 localhost")
    })
  }

  async function checkLogin() {
    await withBusy("login", async () => {
      const response = await sendBackgroundMessage({ cmd: "cookie:checkLogin" })
      if (!response.ok) throw new Error(response.error)

      setCookieStatus(response.data as CookieStatusSnapshot)
      const loginCheck = (response.data as CookieStatusSnapshot).loginCheck as
        | LoginCheckResult
        | undefined
      setNotice(loginCheck?.reason || "登录状态检测完成")
    })
  }

  async function setLocalSidManually() {
    await withBusy("manual", async () => {
      const response = await sendBackgroundMessage({
        cmd: "cookie:setLocalSid",
        sid: manualSid
      })
      if (!response.ok) throw new Error(response.error)
      setCookieStatus(response.data as CookieStatusSnapshot)
      setManualSid("")
      setNotice("sid 已写入 localhost")
    })
  }

  async function removeLocalSidManually() {
    await withBusy("remove-local", async () => {
      const response = await sendBackgroundMessage({
        cmd: "cookie:removeLocalSid"
      })
      if (!response.ok) throw new Error(response.error)
      setCookieStatus(response.data as CookieStatusSnapshot)
      setNotice("localhost sid 已删除")
    })
  }

  async function openCurrentPage(localhost = false) {
    await withBusy("tool", async () => {
      const tab = await getActiveTab()
      const response = await sendActiveTabMessage<
        | { ok: true; link?: string; message?: string }
        | { ok: false; message: string }
      >(
        {
          cmd: localhost ? "content:openCurrentPageWithLocal" : "content:openCurrentPage"
        }
      )

      if (!response.ok || !response.link) {
        throw new Error(response.message || "未获取到当前页面链接")
      }

      await createTab({
        url: response.link,
        active: true,
        index: typeof tab?.index === "number" ? tab.index + 1 : undefined
      })
    })
  }

  const loginCheck = cookieStatus?.loginCheck
  const selectedSourceHost = cookieStatus?.settings.sourceHost || BOSS_ENVIRONMENTS[0]!.host

  return (
    <main className="w-[430px] bg-background p-4 text-foreground">
      <div className="grid gap-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>快捷操作</CardTitle>
              {isBossTab && pageType ? (
                <Badge variant={pageTypeVariant(pageType)}>
                  {pageTypeLabel(pageType)}
                </Badge>
              ) : null}
            </div>
            <CardDescription>针对当前 Boss 页面中的 iframe 执行</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                disabled={!isBossTab || Boolean(busyAction)}
                variant="outline"
                onClick={() => openCurrentPage(false)}>
                <ExternalLink className="h-4 w-4" />
                打开当前页
              </Button>
              <Button
                disabled={!isBossTab || Boolean(busyAction)}
                variant="outline"
                onClick={() => openCurrentPage(true)}>
                <MonitorCheck className="h-4 w-4" />
                本地打开
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>sid 同步到 localhost</CardTitle>
            <CardDescription>固定写入 http://localhost:16000/</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>源域名</Label>
              <Select
                disabled={!cookieStatus || Boolean(busyAction)}
                options={sourceOptions}
                value={selectedSourceHost}
                onChange={(event) => updateCookieSettings(event.target.value)}
              />
            </div>

            <div className="rounded-md border bg-muted/50 p-3">
              <div className="grid gap-2">
                <StatusLine label="源 sid">
                  {boolBadge(Boolean(cookieStatus?.sourceSidExists))}
                </StatusLine>
                <StatusLine label="localhost sid">
                  {boolBadge(Boolean(cookieStatus?.localSidExists))}
                </StatusLine>
                <StatusLine label="源登录态">
                  <Badge variant={loginStatusVariant(loginCheck?.status)}>
                    {loginStatusLabel(loginCheck?.status)}
                  </Badge>
                </StatusLine>
                <StatusLine label="最近同步">
                  <span className="text-foreground">
                    {formatDateTime(cookieStatus?.lastSyncedAt)}
                  </span>
                </StatusLine>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">自动同步</p>
                <p className="text-xs text-muted-foreground">源 sid 删除时同步删除本地 sid</p>
              </div>
              <Switch
                checked={Boolean(cookieStatus?.settings.autoSync)}
                disabled={!cookieStatus || Boolean(busyAction)}
                onCheckedChange={(enabled) => updateCookieSettings(selectedSourceHost, enabled)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button disabled={!cookieStatus || Boolean(busyAction)} onClick={syncNow}>
                {busyAction === "sync" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                立即同步
              </Button>
              <Button
                disabled={!cookieStatus || Boolean(busyAction)}
                variant="outline"
                onClick={checkLogin}>
                {busyAction === "login" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                检测登录
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>手动设置 localhost sid</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="输入 sid value"
                    type={showSid ? "text" : "password"}
                    value={manualSid}
                    onChange={(event) => setManualSid(event.target.value)}
                  />
                  <button
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    type="button"
                    onClick={() => setShowSid((value) => !value)}>
                    {showSid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  disabled={!manualSid.trim() || Boolean(busyAction)}
                  variant="secondary"
                  onClick={setLocalSidManually}>
                  写入
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={!cookieStatus?.localSidExists || Boolean(busyAction)}
              variant="ghost"
              onClick={removeLocalSidManually}>
              <Trash2 className="h-4 w-4" />
              删除 localhost sid
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>页面功能</CardTitle>
            <CardDescription>开关按当前域名单独保存</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">启动台功能</p>
                <p className="text-xs text-muted-foreground">页面内模块搜索和跳转</p>
              </div>
              <Switch
                checked={launchpadEnabled}
                disabled={!isBossTab || Boolean(busyAction)}
                onCheckedChange={updateLaunchpad}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">防掉线功能</p>
                <p className="text-xs text-muted-foreground">
                  {activeEnv?.allowAntiDrop
                    ? "每 5 分钟静默请求 /index"
                    : "生产和 UAT 环境不提供"}
                </p>
              </div>
              <Switch
                checked={antiDropEnabled}
                disabled={!isBossTab || !activeEnv?.allowAntiDrop || Boolean(busyAction)}
                onCheckedChange={updateAntiDrop}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {(notice || cookieStatus?.lastError) && (
        <div className="mt-3 flex items-start gap-2 rounded-md border bg-card px-3 py-2 text-xs">
          {cookieStatus?.lastError ? (
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
          ) : (
            <History className="mt-0.5 h-4 w-4 flex-none text-primary" />
          )}
          <span className="leading-5 text-muted-foreground">
            {cookieStatus?.lastError || notice}
          </span>
        </div>
      )}
    </main>
  )
}
