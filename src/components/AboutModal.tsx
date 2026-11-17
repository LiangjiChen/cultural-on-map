import { useEffect, useRef, type MouseEvent } from 'react'
import { X } from 'lucide-react'

interface AboutModalProps {
  text: string
  features: string[][]
  note: string
  onClose: () => void
}

const sourceUrl = 'https://github.com/chinese-poetry/chinese-poetry'

export function AboutModal({ text, features, note, onClose }: AboutModalProps) {
  const panelRef = useRef<HTMLElement>(null)
  const clickRef = useRef({ count: 0, time: 0 })

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

  return (
    <div className="modal-backdrop about-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title" ref={panelRef} onClick={handlePanelClick}>
        <button className="round-icon modal-close" onClick={onClose} aria-label="关闭项目介绍"><X size={20} /></button>
        <div className="help-hint">连续点击三下关闭项目介绍</div>
        <span className="about-seal">诗</span>
        <div className="eyebrow centered"><span /> ABOUT THE PROJECT <span /></div>
        <h2 id="about-title">让诗歌回到山河之间</h2>
        <p>{text}</p>
        <div className="about-features">
          {features.map(([title, detail]) => (
            <div key={title}><strong>{title}</strong><span>{detail}</span></div>
          ))}
        </div>
        <div className="about-note">{note}</div>
        <p className="about-source">开源诗词文本来源：{sourceUrl}</p>
        <div className="help-close-note">手机可左右滑动关闭</div>
      </section>
    </div>
  )
}
