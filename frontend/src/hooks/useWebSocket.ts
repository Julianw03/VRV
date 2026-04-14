import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import * as LocalLinkResolver from "@/lib/LocalLinkResolver.ts"

const RECONNECT_DELAY_MS = 3000

/**
 * Manages the WebSocket connection lifecycle.
 * On disconnect, automatically retries every 3 seconds.
 * Dispatches incoming events to the Zustand store's handleWSEvent action.
 *
 * Call this once at the top-level App component.
 */
export function useWebSocket() {
  const handleWSEvent = useAppStore((s) => s.handleWSEvent)
  const setWsConnected = useAppStore((s) => s.setWsConnected)

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let active = true

    function connect() {
      if (!active) return
      ws = new WebSocket(LocalLinkResolver.resolve("/", "ws"))

      ws.onopen = () => {
        if (active) setWsConnected(true)
      }

      ws.onclose = () => {
        if (active) {
          setWsConnected(false)
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
        }
      }

      ws.onerror = () => {
        ws?.close()
      }

      ws.onmessage = (e: MessageEvent<string>) => {
        if (!active) return
        try {
          const msg = JSON.parse(e.data)
          console.debug(msg.data)
          if (msg.type === 'event' && msg.data) {
            handleWSEvent(msg.data)
          }
        } catch {
          // ignore malformed messages
        }
      }
    }

    connect()

    return () => {
      active = false
      if (reconnectTimer) clearTimeout(reconnectTimer)
      ws?.close()
    }
    // zustand actions are stable references — no need to list them as deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
