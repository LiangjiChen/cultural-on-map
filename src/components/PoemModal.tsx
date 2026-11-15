import { useEffect, useState } from 'react'
import { BookOpen, Check, Copy, Feather, MapPin, X } from 'lucide-react'
import { regionById } from '../data/regions'
import type { Poem } from '../types'

interface PoemModalProps {
  poem: Poem
  onClose: () => void
}

export function PoemModal({ poem, onClose }: PoemModalProps) {
  const [copied, setCopied] = useState(false)
  const region = regionById[poem.regionId]

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copyPoem = async () => {
    try {
      await navigator.clipboard.writeText(`《${poem.title}》\n唐 · ${poem.author}\n\n${poem.content.join('\n')}`)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="modal-backdrop poem-detail-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="poem-detail-modal" role="dialog" aria-modal="true" aria-labelledby="poem-detail-title">
        <button className="round-icon modal-close" onClick={onClose} aria-label="关闭诗词详情"><X size={20} /></button>
        <div className="poem-detail-seal">唐诗</div>
        <div className="poem-detail-scroll">
          <header className="poem-detail-header">
            <div className="eyebrow centered"><span /> 诗行山河 <span /></div>
            <h2 id="poem-detail-title">{poem.title}</h2>
            <p className="detail-author"><span>唐</span>{poem.author}</p>
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
            <h3><BookOpen size={17} />诗意浅解</h3>
            <p>{poem.explanation}</p>
          </section>
          <section className="geo-note-section">
            <h3><MapPin size={16} />地理小笺</h3>
            <p>{poem.geoNote}</p>
            <small>{region.modern} · {region.name}</small>
          </section>
        </div>
        <footer className="poem-detail-footer">
          <span>诗有其境，境有其诗。</span>
          <button className={copied ? 'copy-button copied' : 'copy-button'} onClick={copyPoem}>
            {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? '已复制' : '复制诗文'}
          </button>
        </footer>
      </section>
    </div>
  )
}
