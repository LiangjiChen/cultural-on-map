import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { BookOpen, Check, Copy, Feather, MapPin, X } from 'lucide-react'
import type { Poem, Region } from '../types'

interface PoemModalProps {
  poem: Poem
  region: Region
  dynasty: string
  noun: string
  onClose: () => void
}

export function PoemModal({ poem, region, dynasty, noun, onClose }: PoemModalProps) {
  const [copied, setCopied] = useState(false)
  const panelRef = useRef<HTMLElement>(null)
  const clickRef = useRef({ count: 0, time: 0 })

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    let startX = 0
    let startY = 0
    let tracking = false

    const handleStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) { tracking = false; return }
      startX = event.touches[0].clientX
      startY = event.touches[0].clientY
      tracking = true
    }
    const handleMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return
      const dx = event.touches[0].clientX - startX
      const dy = event.touches[0].clientY - startY
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.15 && event.cancelable) {
        event.preventDefault()
      }
    }
    const handleEnd = (event: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const touch = event.changedTouches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) onClose()
    }
    const handleCancel = () => { tracking = false }

    panel.addEventListener('touchstart', handleStart, { passive: true })
    panel.addEventListener('touchmove', handleMove, { passive: false })
    panel.addEventListener('touchend', handleEnd)
    panel.addEventListener('touchcancel', handleCancel)
    return () => {
      panel.removeEventListener('touchstart', handleStart)
      panel.removeEventListener('touchmove', handleMove)
      panel.removeEventListener('touchend', handleEnd)
      panel.removeEventListener('touchcancel', handleCancel)
    }
  }, [onClose])

  const handlePanelClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('button, a, input, textarea, select, [role="button"]')) {
      clickRef.current = { count: 0, time: 0 }
      return
    }

    const now = Date.now()
    const count = now - clickRef.current.time <= 1000 ? clickRef.current.count + 1 : 1
    clickRef.current = { count, time: now }
    if (count === 3) {
      clickRef.current = { count: 0, time: 0 }
      onClose()
    }
  }

  const copyPoem = async () => {
    try {
      await navigator.clipboard.writeText(`《${poem.title}》\n${dynasty} · ${poem.author}\n\n${poem.content.join('\n')}`)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="modal-backdrop poem-detail-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="poem-detail-modal" role="dialog" aria-modal="true" aria-labelledby="poem-detail-title" ref={panelRef} onClick={handlePanelClick}>
        <button className="round-icon modal-close" onClick={onClose} aria-label="关闭诗词详情"><X size={20} /></button>
        <div className="poem-detail-seal">{dynasty}{noun}</div>
        <div className="poem-detail-scroll">
          <header className="poem-detail-header">
            <div className="eyebrow centered"><span /> 诗词山河 <span /></div>
            <h2 id="poem-detail-title">{poem.title}</h2>
            <p className="detail-author"><span>{dynasty}</span>{poem.author}</p>
            <div className="detail-tags">
              <span>{poem.type}</span>
              <span>{region.name}</span>
              <span><MapPin size={12} />{poem.location}</span>
            </div>
          </header>

          <div className="poem-full-text">
            {poem.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>

          <div className="ornament-divider"><span /><Feather size={16} /><span /></div>

          <section className="explanation-section">
            <h3><BookOpen size={17} />{noun}意浅解</h3>
            <p>{poem.explanation}</p>
          </section>
          <section className="geo-note-section">
            <h3><MapPin size={16} />地理小笺</h3>
            <p>{poem.geoNote}</p>
            <small>{region.modern} · {region.name}</small>
          </section>
        </div>
        <footer className="poem-detail-footer">
          <span>{noun}有其境，境有其{noun}。<small className="poem-detail-shortcut">连续点击三次关闭 · 手机可左右滑动关闭</small></span>
          <button className={copied ? 'copy-button copied' : 'copy-button'} onClick={copyPoem}>
            {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? '已复制' : `复制${noun}文`}
          </button>
        </footer>
      </section>
    </div>
  )
}
