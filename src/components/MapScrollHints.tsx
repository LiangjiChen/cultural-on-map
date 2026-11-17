import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

interface MapScrollHintsProps {
  targetRef: RefObject<HTMLDivElement | null>
  revision?: number | string
}

interface Metrics {
  left: number
  top: number
  width: number
  height: number
  scrollWidth: number
  scrollHeight: number
}

export function MapScrollHints({ targetRef, revision }: MapScrollHintsProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const frameRef = useRef(0)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const update = () => {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = window.requestAnimationFrame(() => {
        setMetrics({
          left: el.scrollLeft,
          top: el.scrollTop,
          width: el.clientWidth,
          height: el.clientHeight,
          scrollWidth: el.scrollWidth,
          scrollHeight: el.scrollHeight,
        })
      })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => {
      window.cancelAnimationFrame(frameRef.current)
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [targetRef, revision])

  if (!metrics) return null
  const overflowX = metrics.scrollWidth - metrics.width
  const overflowY = metrics.scrollHeight - metrics.height
  if (overflowX < 2 && overflowY < 2) return null

  return (
    <div className="map-scroll-hints" aria-hidden="true">
      {overflowY >= 2 && (
        <div className="map-scroll-rail is-vertical">
          <span
            style={{
              top: `${(metrics.top / metrics.scrollHeight) * 100}%`,
              height: `${(metrics.height / metrics.scrollHeight) * 100}%`,
            }}
          />
        </div>
      )}
      {overflowX >= 2 && (
        <div className="map-scroll-rail is-horizontal">
          <span
            style={{
              left: `${(metrics.left / metrics.scrollWidth) * 100}%`,
              width: `${(metrics.width / metrics.scrollWidth) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}
