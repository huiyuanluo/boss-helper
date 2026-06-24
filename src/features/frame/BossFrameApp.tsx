import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from "react"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Search,
  UserRound,
  X
} from "lucide-react"

import { createSearchableModule, matchesKeyword } from "@/shared/pinyin"
import {
  getFrameAutoCollapseEnabled,
  getFrameRecentModules,
  getFrameRecentPages,
  setFrameRecentPages,
  setFrameRecentModules,
  upsertFrameRecentPage,
  upsertFrameRecentModule,
  type FrameRecentPage,
  type FrameRecentModule
} from "@/shared/storage"

import {
  isFrameBridgeTimeoutError,
  requestFrameBridge,
  requestFrameSnapshot
} from "./legacyBridge"
import type {
  FrameMenuGroup,
  FrameMenuItem,
  FrameModule,
  FrameSnapshot
} from "./menuModel"
import { getOpenModules } from "./menuModel"

const EXPANDED_MODULE_WIDTH = 156
const COLLAPSED_MODULE_WIDTH = 44
const PAGE_WIDTH = 168

type VisibleFrameMenuGroup = FrameMenuGroup & {
  groupKey: string
}

interface FrameToast {
  id: number
  message: string
  type: "success" | "error"
}

function getModulePageCount(module?: FrameModule) {
  return (module?.groups || []).reduce((count, group) => count + group.items.length, 0)
}

function keywordMatches(text: string, keyword: string) {
  return matchesKeyword(createSearchableModule(text, text), keyword)
}

function filterModules(modules: FrameModule[], keyword: string) {
  if (!keyword.trim()) return modules

  return modules.filter((module) => keywordMatches(module.name, keyword))
}

function withGroupKey(module: FrameModule, group: FrameMenuGroup, groupIndex: number) {
  return {
    ...group,
    groupKey: `${module.id}:${groupIndex}:${group.text}`
  }
}

function filterGroups(
  module: FrameModule | undefined,
  keyword: string
): VisibleFrameMenuGroup[] {
  if (!module) return []
  if (!keyword.trim()) {
    return module.groups.map((group, groupIndex) =>
      withGroupKey(module, group, groupIndex)
    )
  }

  return module.groups
    .map((group, groupIndex) => {
      const groupMatched = keywordMatches(group.text, keyword)

      if (groupMatched) return withGroupKey(module, group, groupIndex)

      const items = group.items.filter((item) =>
        keywordMatches(`${item.text} ${item.title} ${item.href}`, keyword)
      )

      return {
        ...withGroupKey(module, group, groupIndex),
        items
      }
    })
    .filter((group) => group.items.length > 0)
}

function findFallbackModuleId(openModules: FrameModule[], closingModuleId: string) {
  const fallback = [...openModules].reverse().find((module) => module.id !== closingModuleId)
  return fallback?.id
}

function getPageAccessLink(href: string) {
  try {
    return new URL(href, window.location.origin).href
  } catch {
    return href
  }
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const input = document.createElement("textarea")
  input.value = text
  input.setAttribute("readonly", "true")
  Object.assign(input.style, {
    position: "fixed",
    left: "-9999px",
    top: "0"
  })
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand("copy")
  input.remove()

  if (!copied) throw new Error("copy failed")
}

function findRecentPageItem(module: FrameModule | undefined, page: FrameRecentPage) {
  if (!module) return undefined

  const items = module.groups.flatMap((group) => group.items)

  return (
    items.find((item) => item.href === page.href) ||
    items.find((item) => item.text === page.text && item.title === page.title)
  )
}

function useFrameLayoutVars(collapsed: boolean) {
  useEffect(() => {
    const moduleWidth = collapsed ? COLLAPSED_MODULE_WIDTH : EXPANDED_MODULE_WIDTH
    const root = document.documentElement

    root.style.setProperty("--boss-helper-frame-top", "0px")
    root.style.setProperty("--boss-helper-frame-left", `${moduleWidth + PAGE_WIDTH}px`)

    return () => {
      root.style.removeProperty("--boss-helper-frame-top")
      root.style.removeProperty("--boss-helper-frame-left")
    }
  }, [collapsed])
}

interface BossFrameAppProps {
  host: string
}

export function BossFrameApp({ host }: BossFrameAppProps) {
  const [snapshot, setSnapshot] = useState<FrameSnapshot>()
  const [selectedModuleId, setSelectedModuleId] = useState<string>()
  const [moduleKeyword, setModuleKeyword] = useState("")
  const [pageKeyword, setPageKeyword] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [autoCollapseEnabled, setAutoCollapseEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [busyKey, setBusyKey] = useState<string>()
  const [toast, setToast] = useState<FrameToast>()
  const [recentModules, setRecentModules] = useState<FrameRecentModule[]>([])
  const [recentCollapsed, setRecentCollapsed] = useState(false)
  const [recentPages, setRecentPages] = useState<FrameRecentPage[]>([])
  const [recentPagesCollapsed, setRecentPagesCollapsed] = useState(false)
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string>>(
    () => new Set()
  )
  const hasSnapshotRef = useRef(false)
  const refreshInFlightRef = useRef(false)
  const refreshQueuedRef = useRef(false)
  const refreshQueuedTimerRef = useRef<number>()

  useFrameLayoutVars(collapsed)

  useEffect(() => {
    let mounted = true

    Promise.all([
      getFrameAutoCollapseEnabled(host),
      getFrameRecentModules(host)
    ]).then(([enabled, nextRecentModules]) => {
      if (!mounted) return
      setAutoCollapseEnabled(enabled)
      setRecentModules(nextRecentModules)
    })

    const handleAutoCollapseChange = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail
      setAutoCollapseEnabled(Boolean(detail?.enabled))
    }

    window.addEventListener(
      "boss-helper:set-frame-auto-collapse",
      handleAutoCollapseChange
    )

    return () => {
      mounted = false
      window.removeEventListener(
        "boss-helper:set-frame-auto-collapse",
        handleAutoCollapseChange
      )
    }
  }, [host])

  const refreshSnapshot = useCallback(async (showLoading = false) => {
    if (refreshInFlightRef.current) {
      refreshQueuedRef.current = true
      return
    }

    refreshInFlightRef.current = true
    if (showLoading) setLoading(true)

    try {
      const nextSnapshot = await requestFrameSnapshot()
      hasSnapshotRef.current = true
      setSnapshot(nextSnapshot)
      setError(nextSnapshot.error)
      setSelectedModuleId((current) => {
        if (current && nextSnapshot.modules.some((module) => module.id === current)) {
          return current
        }

        return nextSnapshot.currentModuleId || nextSnapshot.modules[0]?.id
      })
    } catch (refreshError) {
      if (!hasSnapshotRef.current || !isFrameBridgeTimeoutError(refreshError)) {
        setError(
          refreshError instanceof Error ? refreshError.message : "页面框架初始化失败"
        )
      }
    } finally {
      refreshInFlightRef.current = false
      if (showLoading) setLoading(false)

      if (refreshQueuedRef.current) {
        refreshQueuedRef.current = false
        if (refreshQueuedTimerRef.current) {
          window.clearTimeout(refreshQueuedTimerRef.current)
        }
        refreshQueuedTimerRef.current = window.setTimeout(() => refreshSnapshot(), 80)
      }
    }
  }, [])

  useEffect(() => {
    refreshSnapshot(true)

    const interval = window.setInterval(() => refreshSnapshot(), 2500)
    const hashHandler = () => refreshSnapshot()

    window.addEventListener("hashchange", hashHandler)

    const target = document.querySelector("#J_NavContent") || document.body
    let mutationTimer: number | undefined
    const scheduleMutationRefresh = () => {
      if (mutationTimer) window.clearTimeout(mutationTimer)
      mutationTimer = window.setTimeout(() => refreshSnapshot(), 300)
    }
    const observer = new MutationObserver(scheduleMutationRefresh)
    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "src"]
    })

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("hashchange", hashHandler)
      if (mutationTimer) window.clearTimeout(mutationTimer)
      if (refreshQueuedTimerRef.current) {
        window.clearTimeout(refreshQueuedTimerRef.current)
      }
      observer.disconnect()
    }
  }, [refreshSnapshot])

  useEffect(() => {
    if (!toast) return

    const timer = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? undefined : current))
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [toast])

  const modules = snapshot?.modules || []
  const modulesById = useMemo(
    () => new Map(modules.map((module) => [module.id, module])),
    [modules]
  )
  const currentModule = snapshot?.currentModuleId
    ? modulesById.get(snapshot.currentModuleId)
    : undefined
  const selectedModule =
    (selectedModuleId ? modulesById.get(selectedModuleId) : undefined) ||
    currentModule ||
    modules[0]

  useEffect(() => {
    let mounted = true

    if (!selectedModule?.name) {
      setRecentPages([])
      return () => {
        mounted = false
      }
    }

    getFrameRecentPages(host, selectedModule.name)
      .then((nextRecentPages) => {
        if (mounted) setRecentPages(nextRecentPages)
      })
      .catch(() => {
        if (mounted) setRecentPages([])
      })

    return () => {
      mounted = false
    }
  }, [host, selectedModule?.name])

  const openModules = useMemo(() => getOpenModules(snapshot), [snapshot])
  const filteredModules = useMemo(
    () => filterModules(modules, moduleKeyword),
    [moduleKeyword, modules]
  )
  const filteredGroups = useMemo(
    () => filterGroups(selectedModule, pageKeyword),
    [pageKeyword, selectedModule]
  )
  const pageSearching = pageKeyword.trim().length > 0
  const recentModuleItems = useMemo(
    () =>
      recentModules.map((recentModule) => {
        const module = modules.find((item) => item.name === recentModule.name)

        return {
          recentModule,
          module
        }
      }),
    [modules, recentModules]
  )
  const recentPageItems = useMemo(
    () =>
      recentPages.map((recentPage) => ({
        recentPage,
        item: findRecentPageItem(selectedModule, recentPage)
      })),
    [recentPages, selectedModule]
  )

  async function runFrameAction(
    key: string,
    task: () => Promise<FrameSnapshot>,
    onSuccess?: (nextSnapshot: FrameSnapshot) => void | Promise<void>
  ) {
    setBusyKey(key)
    setError(undefined)

    try {
      const nextSnapshot = await task()
      setSnapshot(nextSnapshot)
      setSelectedModuleId(nextSnapshot.currentModuleId || selectedModuleId)
      await onSuccess?.(nextSnapshot)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "页面框架操作失败")
    } finally {
      setBusyKey(undefined)
    }
  }

  function selectModule(module: FrameModule) {
    setSelectedModuleId(module.id)
    setPageKeyword("")
  }

  function selectRecentModule(module?: FrameModule) {
    if (!module || busyKey) return
    selectModule(module)
  }

  function selectRecentPage(item?: FrameMenuItem) {
    if (!selectedModule || !item || busyKey) return
    openPage(selectedModule, item)
  }

  async function removeRecentModule(recentModule: FrameRecentModule) {
    const previousRecentModules = recentModules
    const nextRecentModules = recentModules.filter(
      (item) => item.name !== recentModule.name
    )

    setRecentModules(nextRecentModules)

    try {
      await setFrameRecentModules(host, nextRecentModules)
    } catch {
      setRecentModules(previousRecentModules)
      setToast({
        id: Date.now(),
        message: "删除最近打开记录失败",
        type: "error"
      })
    }
  }

  async function removeRecentPage(recentPage: FrameRecentPage) {
    if (!selectedModule?.name) return

    const previousRecentPages = recentPages
    const nextRecentPages = recentPages.filter((item) => item.href !== recentPage.href)

    setRecentPages(nextRecentPages)

    try {
      await setFrameRecentPages(host, selectedModule.name, nextRecentPages)
    } catch {
      setRecentPages(previousRecentPages)
      setToast({
        id: Date.now(),
        message: "删除最近打开页面失败",
        type: "error"
      })
    }
  }

  function toggleGroup(groupKey: string) {
    setExpandedGroupKeys((current) => {
      const next = new Set(current)

      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }

      return next
    })
  }

  function openPage(module: FrameModule, item: FrameMenuItem) {
    if (autoCollapseEnabled) setCollapsed(true)

    runFrameAction(
      `page:${module.id}:${item.id}`,
      () =>
        requestFrameBridge("openPage", {
          moduleId: module.id,
          pageId: item.id,
          title: item.title,
          href: item.href
        }),
      async () => {
        try {
          const nextRecentModules = await upsertFrameRecentModule(host, {
            id: module.id,
            name: module.name
          })
          setRecentModules(nextRecentModules)
        } catch {
          // Recent modules are a convenience feature; storage failures should not block page opening.
        }

        try {
          const nextRecentPages = await upsertFrameRecentPage(host, module.name, {
            text: item.text,
            title: item.title,
            href: item.href,
            pageType: item.pageType
          })
          if (selectedModule?.name === module.name) {
            setRecentPages(nextRecentPages)
          }
        } catch {
          // Recent pages are a convenience feature; storage failures should not block page opening.
        }
      }
    )
  }

  async function copyPageLink(link: string) {
    try {
      await copyText(link)
      setToast({
        id: Date.now(),
        message: "页面链接已复制",
        type: "success"
      })
    } catch {
      setToast({
        id: Date.now(),
        message: "复制失败，请重试",
        type: "error"
      })
    }
  }

  function switchOpenModule(module: FrameModule) {
    setSelectedModuleId(module.id)
    runFrameAction(`module:${module.id}`, () =>
      requestFrameBridge("switchModule", {
        moduleId: module.id
      })
    )
  }

  function closeOpenModule(module: FrameModule) {
    runFrameAction(`close:${module.id}`, () =>
      requestFrameBridge("closeModule", {
        moduleId: module.id,
        fallbackModuleId: findFallbackModuleId(openModules, module.id)
      }, 5000)
    )
  }

  const moduleWidth = collapsed ? COLLAPSED_MODULE_WIDTH : EXPANDED_MODULE_WIDTH

  return (
    <div
      className="bh-frame-shell"
      style={
        {
          "--bh-module-width": `${moduleWidth}px`,
          "--bh-page-width": `${PAGE_WIDTH}px`,
          "--bh-left-width": `${moduleWidth + PAGE_WIDTH}px`
        } as CSSProperties
      }>
      {toast ? (
        <div className="bh-toast" data-type={toast.type} role="status">
          {toast.message}
        </div>
      ) : null}
      <aside className="bh-left-shell">
        <div className="bh-user">
          <span className="bh-avatar">
            <UserRound size={16} />
          </span>
          <p className="bh-user-name" title={snapshot?.user.name || ""}>
            {snapshot?.user.name || "未获取用户"}
          </p>
          <a className="bh-logout" href={snapshot?.user.logoutHref || "/logout"}>
            退出
          </a>
        </div>

        <div className="bh-left-body">
          <section className="bh-module-column" data-collapsed={String(collapsed)}>
            {collapsed ? (
              <button
                className="bh-restore"
                title="展开一级菜单"
                type="button"
                onClick={() => setCollapsed(false)}>
                <ChevronRight size={17} />
              </button>
            ) : (
              <>
                <div className="bh-panel-head bh-module-head">
                  <div className="bh-heading-row">
                    <p className="bh-heading">一级菜单</p>
                    <button
                      className="bh-icon-button"
                      title="收起一级菜单"
                      type="button"
                      onClick={() => setCollapsed(true)}>
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>

                <div className="bh-open-section">
                  <p className="bh-section-title">已打开</p>
                  <div className="bh-open-list">
                    {openModules.length > 0 ? (
                      openModules.map((module) => {
                        const active = currentModule?.id === module.id
                        const busy =
                          busyKey === `module:${module.id}` ||
                          busyKey === `close:${module.id}`

                        return (
                          <div
                            className="bh-open-module"
                            data-active={String(active)}
                            key={module.id}
                            role="button"
                            tabIndex={busyKey ? -1 : 0}
                            title={module.name}
                            onClick={() => {
                              if (!busyKey) switchOpenModule(module)
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") return
                              event.preventDefault()
                              if (!busyKey) switchOpenModule(module)
                            }}>
                            <span className="bh-open-name">{module.name}</span>
                            <button
                              className="bh-open-close"
                              disabled={Boolean(busyKey)}
                              title="关闭模块"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                closeOpenModule(module)
                              }}>
                              {busy ? (
                                <Loader2 className="bh-spin" size={15} />
                              ) : (
                                <X size={15} />
                              )}
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div className="bh-open-empty">暂无</div>
                    )}
                  </div>
                </div>

                {recentModules.length > 0 ? (
                  <div
                    className="bh-recent-section"
                    data-collapsed={String(recentCollapsed)}>
                    <button
                      className="bh-recent-head"
                      type="button"
                      onClick={() => setRecentCollapsed((value) => !value)}>
                      <span className="bh-recent-chevron">
                        <ChevronRight size={13} />
                      </span>
                      <span className="bh-section-title">最近打开</span>
                    </button>
                    <div className="bh-recent-list">
                      <div className="bh-recent-list-inner">
                        {recentModuleItems.map(({ recentModule, module }) => {
                          const active = Boolean(module && selectedModule?.id === module.id)

                          return (
                            <div
                              className="bh-recent-module"
                              data-active={String(active)}
                              data-disabled={String(!module || Boolean(busyKey))}
                              key={`${recentModule.id}:${recentModule.name}`}
                              role="button"
                              tabIndex={!module || busyKey ? -1 : 0}
                              title={recentModule.name}
                              onClick={() => selectRecentModule(module)}
                              onKeyDown={(event) => {
                                if (event.key !== "Enter" && event.key !== " ") return
                                event.preventDefault()
                                selectRecentModule(module)
                              }}>
                              <span className="bh-recent-name">{recentModule.name}</span>
                              <button
                                aria-label={`删除${recentModule.name}最近打开记录`}
                                className="bh-recent-delete"
                                title="删除记录"
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  removeRecentModule(recentModule)
                                }}>
                                <X size={13} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="bh-module-search-section">
                  <div className="bh-search-wrap">
                    <Search className="bh-search-icon" size={13} />
                    <input
                      className="bh-search"
                      placeholder="搜索"
                      value={moduleKeyword}
                      onChange={(event) => setModuleKeyword(event.target.value)}
                    />
                    {moduleKeyword ? (
                      <button
                        aria-label="清空一级菜单搜索"
                        className="bh-search-clear"
                        title="清空"
                        type="button"
                        onClick={() => setModuleKeyword("")}>
                        <X size={13} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="bh-scroll">
                  <div className="bh-module-list">
                    {loading ? (
                      <div className="bh-loading">
                        <Loader2 className="bh-spin" size={16} />
                      </div>
                    ) : filteredModules.length > 0 ? (
                      filteredModules.map((module) => (
                        <button
                          className="bh-module-row"
                          data-current={String(currentModule?.id === module.id)}
                          data-selected={String(selectedModule?.id === module.id)}
                          key={module.id}
                          title={module.name}
                          type="button"
                          onClick={() => selectModule(module)}>
                          <span className="bh-module-name">{module.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="bh-empty">{error || "无匹配菜单"}</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="bh-page-column">
            <div className="bh-panel-head bh-page-head">
              <div className="bh-heading-row">
                <p className="bh-heading" title={selectedModule?.name || ""}>
                  {selectedModule?.name || "二级菜单"}
                </p>
                <span className="bh-heading-count">{getModulePageCount(selectedModule)}</span>
              </div>
            </div>

            {recentPages.length > 0 ? (
              <div
                className="bh-page-recent-section"
                data-collapsed={String(recentPagesCollapsed)}>
                <button
                  className="bh-page-recent-head"
                  type="button"
                  onClick={() => setRecentPagesCollapsed((value) => !value)}>
                  <span className="bh-page-recent-chevron">
                    <ChevronRight size={13} />
                  </span>
                  <span className="bh-section-title">最近打开</span>
                </button>
                <div className="bh-page-recent-list">
                  <div className="bh-page-recent-list-inner">
                    {recentPageItems.map(({ recentPage, item }) => {
                      const active = Boolean(
                        item &&
                          currentModule?.id === selectedModule?.id &&
                          currentModule?.activePageId === item.id
                      )

                      return (
                        <div
                          className="bh-page-recent-item"
                          data-active={String(active)}
                          data-disabled={String(!item || Boolean(busyKey))}
                          key={recentPage.href}
                          role="button"
                          tabIndex={!item || busyKey ? -1 : 0}
                          title={recentPage.title || recentPage.text}
                          onClick={() => selectRecentPage(item)}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return
                            event.preventDefault()
                            selectRecentPage(item)
                          }}>
                          <span className="bh-page-recent-name">
                            {recentPage.text}
                            {recentPage.pageType === "jsp" ? (
                              <span className="bh-page-tag">JSP</span>
                            ) : null}
                          </span>
                          <button
                            aria-label={`删除${recentPage.text}最近打开记录`}
                            className="bh-page-recent-delete"
                            title="删除记录"
                            type="button"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              removeRecentPage(recentPage)
                            }}>
                            <X size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="bh-page-search-section">
              <div className="bh-search-wrap">
                <Search className="bh-search-icon" size={13} />
                <input
                  className="bh-search"
                  placeholder="搜索页面"
                  value={pageKeyword}
                  onChange={(event) => setPageKeyword(event.target.value)}
                />
                {pageKeyword ? (
                  <button
                    aria-label="清空二级菜单搜索"
                    className="bh-search-clear"
                    title="清空"
                    type="button"
                    onClick={() => setPageKeyword("")}>
                    <X size={13} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="bh-scroll">
              <div className="bh-group-list">
                {error && modules.length === 0 ? <div className="bh-empty">{error}</div> : null}
                {(!error || modules.length > 0) && filteredGroups.length > 0
                  ? filteredGroups.map((group) => {
                      const expanded =
                        pageSearching || expandedGroupKeys.has(group.groupKey)

                      return (
                        <section
                          className="bh-group"
                          data-expanded={String(expanded)}
                          key={group.groupKey}>
                          <button
                            aria-expanded={expanded}
                            className="bh-group-title"
                            title={group.text}
                            type="button"
                            onClick={() => toggleGroup(group.groupKey)}>
                            <span className="bh-group-chevron">
                              <ChevronRight size={13} />
                            </span>
                            <span className="bh-group-name">{group.text}</span>
                            <span className="bh-group-count">{group.items.length}</span>
                          </button>
                          <div
                            aria-hidden={!expanded}
                            className="bh-group-items">
                            <div className="bh-group-items-inner">
                              {group.items.map((item) => {
                                const active =
                                  currentModule?.id === selectedModule?.id &&
                                  currentModule?.activePageId === item.id
                                const busy = busyKey === `page:${selectedModule?.id}:${item.id}`
                                const pageAccessLink = getPageAccessLink(item.href)

                                return (
                                  <div
                                    className="bh-page-row"
                                    data-active={String(active)}
                                    data-disabled={String(!selectedModule || Boolean(busyKey))}
                                    key={`${selectedModule?.id}-${item.id}`}
                                    role="button"
                                    tabIndex={expanded ? 0 : -1}
                                    onClick={() =>
                                      selectedModule &&
                                      !busyKey &&
                                      openPage(selectedModule, item)
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key !== "Enter" && event.key !== " ") return
                                      event.preventDefault()
                                      if (selectedModule && !busyKey) {
                                        openPage(selectedModule, item)
                                      }
                                    }}>
                                    <span className="bh-page-body">
                                      <span className="bh-page-title">
                                        {item.text}
                                        {item.pageType === "jsp" ? (
                                          <span className="bh-page-tag">JSP</span>
                                        ) : null}
                                      </span>
                                    </span>
                                    {busy ? (
                                      <Loader2
                                        className="bh-row-spinner bh-spin"
                                        size={13}
                                      />
                                    ) : null}
                                    <button
                                      aria-label={`复制${item.text}访问链接`}
                                      className="bh-page-copy"
                                      disabled={Boolean(busyKey)}
                                      tabIndex={expanded ? 0 : -1}
                                      title={pageAccessLink}
                                      type="button"
                                      onClick={(event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        copyPageLink(pageAccessLink)
                                      }}>
                                      <Copy size={13} />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </section>
                      )
                    })
                  : null}
                {!error && !loading && filteredGroups.length === 0 ? (
                  <div className="bh-empty">无匹配页面</div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
