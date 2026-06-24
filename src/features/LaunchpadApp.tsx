import { useCallback, useEffect, useMemo, useState } from "react"
import { CirclePlus, MinusCircle, X } from "lucide-react"

import {
  clickBossModule,
  type BossModule,
  waitForBossModules
} from "@/shared/nav"
import {
  getFavoriteModules,
  getVisitHistory,
  setFavoriteModules,
  setVisitHistory
} from "@/shared/storage"
import { createSearchableModule, matchesKeyword } from "@/shared/pinyin"

interface LaunchpadAppProps {
  host: string
}

interface ModuleRow extends BossModule {
  isFavorite?: boolean
}

const emptyDescriptionMap = {
  all: "未获取到业务模块，请刷新页面",
  search: "未搜索到相应模块",
  favorite: "暂无收藏模块",
  history: "暂无访问历史"
}

function ModuleColumn({
  title,
  dataSource,
  emptyMode,
  onClickModule,
  onAddFavorite,
  onRemoveFavorite,
  actionMode
}: {
  title: string
  dataSource: ModuleRow[]
  emptyMode: keyof typeof emptyDescriptionMap
  onClickModule: (module: ModuleRow) => void
  onAddFavorite?: (key: string) => void
  onRemoveFavorite?: (key: string) => void
  actionMode?: "add" | "remove"
}) {
  return (
    <section className="bh-column">
      <p className="bh-title">{title}</p>
      <div className="bh-column-body">
        {dataSource.length > 0 ? (
          dataSource.map((item) => (
            <div
              className="bh-row"
              key={`${title}-${item.key}`}
              onClick={() => onClickModule(item)}>
              <p className="bh-row-label" title={item.key}>
                {item.key}
                {item.isFavorite ? <span className="bh-tag">收藏</span> : null}
              </p>
              {actionMode === "add" && !item.isFavorite && onAddFavorite ? (
                <button
                  className="bh-row-action"
                  title="添加收藏"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onAddFavorite(item.key)
                  }}>
                  <CirclePlus size={22} />
                </button>
              ) : null}
              {actionMode === "remove" && onRemoveFavorite ? (
                <button
                  className="bh-row-action"
                  title="取消收藏"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveFavorite(item.key)
                  }}>
                  <MinusCircle size={22} />
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <div className="bh-empty">{emptyDescriptionMap[emptyMode]}</div>
        )}
      </div>
    </section>
  )
}

export function LaunchpadApp({ host }: LaunchpadAppProps) {
  const [visible, setVisible] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [modules, setModules] = useState<BossModule[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    let disposed = false

    waitForBossModules().then((nextModules) => {
      if (!disposed) setModules(nextModules)
    })

    Promise.all([getFavoriteModules(host), getVisitHistory(host)]).then(
      ([favoriteModules, visitHistory]) => {
        if (disposed) return
        setFavorites(favoriteModules)
        setHistory(visitHistory)
      }
    )

    const showHandler = () => setVisible(true)
    const hideHandler = () => setVisible(false)

    window.addEventListener("boss-helper:show-launchpad", showHandler)
    window.addEventListener("boss-helper:hide-launchpad", hideHandler)

    return () => {
      disposed = true
      window.removeEventListener("boss-helper:show-launchpad", showHandler)
      window.removeEventListener("boss-helper:hide-launchpad", hideHandler)
    }
  }, [host])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false)
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const searchableModules = useMemo(
    () => modules.map((item) => createSearchableModule(item.key, item.value)),
    [modules]
  )

  const moduleByKey = useMemo(
    () => new Map(modules.map((item) => [item.key, item])),
    [modules]
  )

  const toRows = (source: BossModule[]): ModuleRow[] =>
    source.map((item) => ({
      ...item,
      isFavorite: favorites.includes(item.key)
    }))

  const allRows = useMemo(() => toRows(modules), [modules, favorites])

  const searchRows = useMemo(() => {
    if (!keyword.trim()) return []

    return searchableModules
      .filter((item) => matchesKeyword(item, keyword))
      .map((item) => ({
        key: item.key,
        value: item.value,
        isFavorite: favorites.includes(item.key)
      }))
  }, [favorites, keyword, searchableModules])

  const favoriteRows = useMemo(
    () =>
      favorites
        .map((key) => moduleByKey.get(key))
        .filter((item): item is BossModule => Boolean(item))
        .map((item) => ({ ...item, isFavorite: true })),
    [favorites, moduleByKey]
  )

  const historyRows = useMemo(
    () =>
      history
        .map((key) => moduleByKey.get(key))
        .filter((item): item is BossModule => Boolean(item))
        .map((item) => ({ ...item, isFavorite: favorites.includes(item.key) })),
    [favorites, history, moduleByKey]
  )

  const persistFavorites = (nextFavorites: string[]) => {
    const deduped = Array.from(new Set(nextFavorites))
    setFavorites(deduped)
    setFavoriteModules(host, deduped)
  }

  const addFavorite = (key: string) => {
    persistFavorites([key, ...favorites])
  }

  const removeFavorite = (key: string) => {
    persistFavorites(favorites.filter((item) => item !== key))
  }

  const recordHistory = useCallback(
    (key: string) => {
      setHistory((currentHistory) => {
        const nextHistory = [
          key,
          ...currentHistory.filter((item) => item !== key)
        ].slice(0, 10)
        setVisitHistory(host, nextHistory)
        return nextHistory
      })
    },
    [host]
  )

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const moduleElement = target.closest("#J_Nav li[data-index]")
      if (!(moduleElement instanceof HTMLElement)) return

      const value = moduleElement.dataset.index
      const module = modules.find((item) => item.value === value)
      if (module) recordHistory(module.key)
    }

    document.addEventListener("click", handler, true)
    return () => document.removeEventListener("click", handler, true)
  }, [modules, recordHistory])

  const openModule = (module: ModuleRow) => {
    const clicked = clickBossModule(module.value)
    if (clicked) {
      recordHistory(module.key)
    }

    setVisible(false)
    setKeyword("")
  }

  return (
    <div className="bh-launchpad-shell" data-show={String(visible)}>
      <div className="bh-launchpad">
        <div className="bh-header">
          <input
            className="bh-search"
            placeholder="请输入要查找的模块，支持中文、拼音和首字母"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <div className="bh-spacer" />
          <button
            className="bh-close"
            title="关闭启动台"
            type="button"
            onClick={() => {
              setVisible(false)
              setKeyword("")
            }}>
            <X size={32} />
          </button>
        </div>
        <div className="bh-content">
          <div className="bh-column-all">
            <ModuleColumn
              actionMode="add"
              dataSource={allRows}
              emptyMode="all"
              title="全部模块"
              onAddFavorite={addFavorite}
              onClickModule={openModule}
            />
          </div>
          <div className="bh-column-search">
            <ModuleColumn
              actionMode="add"
              dataSource={searchRows}
              emptyMode="search"
              title="搜索结果"
              onAddFavorite={addFavorite}
              onClickModule={openModule}
            />
          </div>
          <div className="bh-column-side">
            <ModuleColumn
              actionMode="remove"
              dataSource={favoriteRows}
              emptyMode="favorite"
              title="收藏模块"
              onClickModule={openModule}
              onRemoveFavorite={removeFavorite}
            />
            <ModuleColumn
              dataSource={historyRows}
              emptyMode="history"
              title="访问历史"
              onClickModule={openModule}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
