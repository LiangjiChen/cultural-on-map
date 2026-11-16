import { useEffect, useRef } from 'react'
import { ArrowRight, ArrowUpRight, BookOpen, Flame, MapPin, X } from 'lucide-react'
import type { Poem, Region } from '../types'

interface RegionPanelProps {
  region: Region | null
  poems: Poem[]
  unit: string
  noun: string
  scrollSignal: number
  onClose: () => void
  onOpenPoem: (poem: Poem) => void
  onMore: () => void
}

export function RegionPanel({ region, poems, unit, noun, scrollSignal, onClose, onOpenPoem, onMore }: RegionPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const handledScroll = useRef(scrollSignal)

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
    if (!region || scrollSignal === handledScroll.current) return
    handledScroll.current = scrollSignal
    if (window.matchMedia('(max-width: 780px)').matches) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [region, scrollSignal])

  if (!region) return null
  const topPoems = [...poems].sort((a, b) => b.heat - a.heat).slice(0, 5)

  return (
    <aside className="region-panel" aria-label={`${region.name}热度${noun}选`} ref={panelRef}>
      <div className="region-panel-head">
        <button className="round-icon panel-close" onClick={onClose} aria-label={`关闭区域${noun}选`}><X size={18} /></button>
        <div className="eyebrow"><span /> 地域{noun}选</div>
        <div className="region-title-row">
          <div>
            <h2>{region.name}</h2>
            <p><MapPin size={13} />{region.capital}</p>
          </div>
          <div className="region-total"><strong>{poems.length}</strong><span>首收录</span></div>
        </div>
        <p className="region-description">{region.description}</p>
      </div>

      <div className="top-poems-heading">
        <span><Flame size={15} /> 本{unit}热度前五</span>
        <small>TOP {Math.min(5, poems.length)}</small>
      </div>

      <div className="region-poem-list" ref={listRef}>
        {topPoems.map((poem, index) => (
          <article className="region-poem-card" key={poem.id}>
            <div className={`poem-rank${index === 0 ? ' first' : ''}`}>{String(index + 1).padStart(2, '0')}</div>
            <div className="region-poem-content">
              <div className="poem-card-title-row">
                <button className="poem-title-link" onClick={() => onOpenPoem(poem)}>{poem.title}<ArrowUpRight size={14} /></button>
                <span className="poem-author">{poem.author}</span>
              </div>
              <p className="poem-summary">{poem.summary}</p>
              <button className="read-poem-link" onClick={() => onOpenPoem(poem)}>读全{noun} <ArrowRight size={12} /></button>
            </div>
          </article>
        ))}
      </div>

      <div className="region-panel-footer">
        {poems.length > 5 ? (
          <button className="more-poems-button" onClick={onMore}>
            <BookOpen size={16} /> 查看全部 {poems.length} 首 <ArrowRight size={15} />
          </button>
        ) : poems.length > 0 ? (
          <p>本{unit}收录 {poems.length} 首，已全部展示</p>
        ) : (
          <p>本{unit}暂无收录，可切换其他行政区浏览。</p>
        )}
      </div>
    </aside>
  )
}
