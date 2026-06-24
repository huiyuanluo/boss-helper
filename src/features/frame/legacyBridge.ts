import type {
  FrameBridgeAction,
  FrameBridgePayload,
  FrameSnapshot
} from "./menuModel"

const REQUEST_SOURCE = "boss-helper-frame-request"
const RESPONSE_SOURCE = "boss-helper-frame-response"
const DEFAULT_TIMEOUT = 8000
const SNAPSHOT_INITIAL_TIMEOUT = 3500
const SNAPSHOT_TIMEOUT = 9000
const SNAPSHOT_RETRY_DELAY = 220

interface FrameBridgeResponse<T> {
  source: typeof RESPONSE_SOURCE
  id: number
  ok: boolean
  data?: T
  error?: string
}

interface PendingRequest<T> {
  resolve: (value: T) => void
  reject: (error: Error) => void
  timer: number
}

const pendingRequests = new Map<number, PendingRequest<unknown>>()

let requestId = 0
let responseListenerReady = false

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function isFrameBridgeTimeoutError(error: unknown) {
  return error instanceof Error && error.message.includes("等待旧页面框架响应超时")
}

function ensureResponseListener() {
  if (responseListenerReady) return

  window.addEventListener("message", (event) => {
    if (event.source !== window) return

    const data = event.data as FrameBridgeResponse<unknown> | undefined
    if (!data || data.source !== RESPONSE_SOURCE) return

    const pending = pendingRequests.get(data.id)
    if (!pending) return

    window.clearTimeout(pending.timer)
    pendingRequests.delete(data.id)

    if (data.ok) {
      pending.resolve(data.data)
    } else {
      pending.reject(new Error(data.error || "页面框架操作失败"))
    }
  })

  responseListenerReady = true
}

export function requestFrameBridge<T = FrameSnapshot>(
  action: FrameBridgeAction,
  payload?: FrameBridgePayload,
  timeout = DEFAULT_TIMEOUT
): Promise<T> {
  ensureResponseListener()

  requestId += 1
  const id = requestId

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pendingRequests.delete(id)
      reject(new Error("等待旧页面框架响应超时"))
    }, timeout)

    pendingRequests.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timer
    })

    window.postMessage(
      {
        source: REQUEST_SOURCE,
        id,
        action,
        payload
      },
      location.origin
    )
  })
}

export function requestFrameSnapshot() {
  return requestFrameBridge<FrameSnapshot>(
    "snapshot",
    undefined,
    SNAPSHOT_INITIAL_TIMEOUT
  ).catch(async (error) => {
    if (!isFrameBridgeTimeoutError(error)) throw error

    await delay(SNAPSHOT_RETRY_DELAY)
    return requestFrameBridge<FrameSnapshot>("snapshot", undefined, SNAPSHOT_TIMEOUT)
  })
}
