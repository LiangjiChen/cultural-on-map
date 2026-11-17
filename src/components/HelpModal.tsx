import { useEffect, useRef, type MouseEvent } from 'react'
import { BookOpen, MapPin, Search, X } from 'lucide-react'

interface HelpModalProps {
  onClose: () => void
}

const steps = [
  ['选择诗集', '页面上方可切换「唐诗 / 宋词」，地图与全部篇目会一并更换。'],
  ['点击地图圆点', '圆点代表一方行政区划，点开后可见该地热度最高的五首作品。'],
  ['阅读详情', '点击作品标题进入详情，可查看全文、诗意浅解与地理小笺；连续点击三下，或手机左右滑动，即可关闭。'],
  ['检索与全部篇目', '顶部搜索框可搜诗名、作者、诗句与地点；「全部诗作」支持按区域筛选，并可在 10 / 20 / 30 / 50 首间切换每页数量。'],
  ['地图切换与缩放', '「专题地图」为示意版山河；「对照地图」为真实疆域轮廓，以洛阳为中心显示大部分区域。放大后可上下左右滚动，底部与右侧的细条会随滚动移动，提示尚未看全的部分。'],
]

const changelog = [
  ['v1.8', '2026-11', '使用指南页沿用详情页关闭逻辑：连续点击三下，或手机左右滑动关闭。'],
  ['v1.7', '2026-11', '详情页顶部增加关闭提示；帮助入口上线，汇总使用说明与更新日志。'],
  ['v1.6', '2026-11', '地图放大后支持上下左右滚动；未完整显示时新增底部、右侧滚动标识，并随滚动移动。'],
  ['v1.5', '2026-11', '新增「专题地图 / 对照地图」切换，默认专题地图；对照地图以洛阳为中心显示大部分疆域。'],
  ['v1.4', '2026-11', '详情页支持连续点击三次关闭，并标注操作说明。'],
  ['v1.3', '2026-11', '移动端优化：详情左右滑动关闭且不回退页面，切换诗集不再跳动页面。'],
  ['v1.2', '2026-11', '新增宋词三百首与北宋二十四路地图，支持唐宋双地图。'],
  ['v1.1', '2026-11', '新增全量诗库、区域筛选与 10 / 20 / 30 / 50 分页。'],
  ['v1.0', '2026-11', '初版上线：唐诗三百首归入盛唐十五道，聚合点展示区域前五。'],
]

export function HelpModal({ onClose }: HelpModalProps) {
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
      <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" ref={panelRef} onClick={handlePanelClick}>
        <button className="round-icon modal-close" onClick={onClose} aria-label="关闭使用帮助"><X size={20} /></button>
        <p className="help-hint">连续点击三下关闭帮助页</p>
        <div className="eyebrow centered"><span /> GUIDE · 诗词山河 <span /></div>
        <h2 id="help-title">使用指南</h2>
        <p className="help-intro">
          诗词山河是一张可以阅读的诗词地图。唐诗三百首归入盛唐十五道，宋词三百首归入北宋二十四路，
          循着行政区划重访每一首作品里的山河与人间。
        </p>

        <div className="help-steps">
          {steps.map(([title, text], index) => (
            <div key={title} className="help-step">
              <span className="help-step-number">{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{title}</strong><p>{text}</p></div>
            </div>
          ))}
        </div>

        <div className="help-quick">
          <span><Search size={14} />搜索诗名、作者、诗句</span>
          <span><MapPin size={14} />点圆点看区域前五</span>
          <span><BookOpen size={14} />全部诗作可筛选分页</span>
        </div>

        <section className="help-changelog">
          <h3>更新日志</h3>
          <ol>
            {changelog.map(([version, month, text]) => (
              <li key={version}>
                <span className="help-version">{version}</span>
                <div><time>{month}</time><p>{text}</p></div>
              </li>
            ))}
          </ol>
        </section>
        <p className="help-close-note">手机可左右滑动关闭</p>
      </section>
    </div>
  )
}
