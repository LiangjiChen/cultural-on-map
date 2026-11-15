import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Compass, Info, Library, Map, MapPin, Search, X } from 'lucide-react'
import { TangMap } from './components/TangMap'
import { RegionPanel } from './components/RegionPanel'
import { PoemModal } from './components/PoemModal'
import { PoemLibrary } from './components/PoemLibrary'
import { poems } from './data/poems'
import { regionById, regions } from './data/regions'
import type { Poem } from './types'

export default function App() {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>('jingji')
  const [detailPoemId, setDetailPoemId] = useState<number | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [libraryRegionId, setLibraryRegionId] = useState<string | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [globalQuery, setGlobalQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const counts = useMemo(() => Object.fromEntries(regions.map(region => [
    region.id,
    poems.filter(poem => poem.regionId === region.id).length,
  ])), [])
  const sortedRegions = useMemo(() => [...regions].sort((a, b) => counts[b.id] - counts[a.id]), [counts])
  const selectedRegion = selectedRegionId ? regionById[selectedRegionId] : null
  const selectedPoems = selectedRegionId ? poems.filter(poem => poem.regionId === selectedRegionId) : []
  const detailPoem = detailPoemId ? poems.find(poem => poem.id === detailPoemId) ?? null : null
  const authorCount = useMemo(() => new Set(poems.map(poem => poem.author)).size, [])
  const maxCount = Math.max(...Object.values(counts))

  const globalResults = useMemo(() => {
    const keyword = globalQuery.trim().toLowerCase()
    if (!keyword) return []
    return poems.filter(poem => [poem.title, poem.author, poem.location, regionById[poem.regionId].name, ...poem.content]
      .some(value => value.toLowerCase().includes(keyword)))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 6)
  }, [globalQuery])

  const openPoem = (poem: Poem) => setDetailPoemId(poem.id)
  const openLibrary = (regionId: string | null = null) => {
    setLibraryRegionId(regionId)
    setLibraryOpen(true)
    setGlobalQuery('')
  }

  const anyModalOpen = libraryOpen || Boolean(detailPoem) || aboutOpen
  useEffect(() => {
    if (!anyModalOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [anyModalOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (detailPoem) setDetailPoemId(null)
      else if (aboutOpen) setAboutOpen(false)
      else if (libraryOpen) setLibraryOpen(false)
      else if (globalQuery) { setGlobalQuery(''); setSearchFocused(false) }
      else if (selectedRegionId) setSelectedRegionId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [aboutOpen, detailPoem, globalQuery, libraryOpen, selectedRegionId])

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="诗行山河首页">
          <span className="brand-seal">诗</span>
          <span className="brand-name"><strong>诗行山河</strong><small>地图上的唐诗</small></span>
        </a>
        <nav className="main-nav" aria-label="主导航">
          <button className="active" onClick={() => { setLibraryOpen(false); setAboutOpen(false); document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' }) }}><Map size={16} />诗地图</button>
          <button onClick={() => openLibrary()}><Library size={16} />唐诗三百</button>
          <button onClick={() => setAboutOpen(true)}><Info size={16} />关于项目</button>
        </nav>
        <div className="global-search">
          <Search size={17} />
          <input
            value={globalQuery}
            onChange={event => setGlobalQuery(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="寻一首诗、一位诗人"
            aria-label="搜索诗名、作者、诗句或地点"
          />
          {globalQuery && <button className="search-clear" onClick={() => setGlobalQuery('')} aria-label="清空搜索"><X size={14} /></button>}
          {searchFocused && globalQuery && (
            <div className="search-results" onMouseDown={event => event.preventDefault()}>
              <div className="search-results-title">寻诗结果 <span>{globalResults.length ? `前 ${globalResults.length} 首` : '0 首'}</span></div>
              {globalResults.map(poem => (
                <button key={poem.id} className="search-result-item" onClick={() => { openPoem(poem); setGlobalQuery(''); setSearchFocused(false) }}>
                  <span><strong>{poem.title}</strong><small>唐 · {poem.author}</small></span>
                  <i>{regionById[poem.regionId].name}</i>
                </button>
              ))}
              {globalResults.length === 0 && <p className="no-search-result">未寻得相关诗作，试试“李白”或“长安”。</p>}
              <button className="search-all-button" onClick={() => openLibrary()}>进入诗集检索 <ArrowRight size={13} /></button>
            </div>
          )}
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-kicker"><span /> TANG DYNASTY · 618—907 <span /></div>
            <h1>把唐诗，读回<span>山河之间</span></h1>
            <p>盛唐十五道，三百首诗意坐标。循着地图，重逢长安的月、江南的雨与塞外的风。</p>
          </div>
          <div className="hero-stats" aria-label="诗集统计">
            <div><strong>300</strong><span>首唐诗</span></div>
            <i />
            <div><strong>15</strong><span>道山河</span></div>
            <i />
            <div><strong>{authorCount}</strong><span>位诗人</span></div>
          </div>
        </section>

        <section className="explore-layout" id="map-section">
          <aside className="region-index">
            <div className="region-index-head">
              <div><Compass size={18} /><h2>十五道索引</h2></div>
              <span>按诗数</span>
            </div>
            <p className="region-index-intro">择一道山水，读一方诗意。</p>
            <div className="region-index-list">
              {sortedRegions.map((region, index) => (
                <button
                  key={region.id}
                  className={selectedRegionId === region.id ? 'region-index-item selected' : 'region-index-item'}
                  onClick={() => setSelectedRegionId(region.id)}
                >
                  <span className="index-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="index-region-info">
                    <strong>{region.name}</strong>
                    <small>{region.capital.split(' · ')[0]}</small>
                    <i><b style={{ width: `${Math.max(8, counts[region.id] / maxCount * 100)}%` }} /></i>
                  </span>
                  <span className="index-count">{counts[region.id]}<small>首</small></span>
                </button>
              ))}
            </div>
            <div className="index-footnote"><span>注</span>无明确地点者，依诗人活动地或籍贯索引。</div>
          </aside>

          <div className="map-card">
            <header className="map-card-header">
              <div className="map-title">
                <span className="map-title-icon"><Map size={20} /></span>
                <div><h2>盛唐疆域图</h2><p>开元二十九年（741）· 十五道行政区划示意</p></div>
              </div>
              <div className="map-header-actions">
                <span className="live-badge"><i />诗意地图</span>
                <button onClick={() => openLibrary()}><BookOpen size={15} />全部诗作</button>
              </div>
            </header>
            <div className="map-stage">
              <TangMap counts={counts} selectedRegionId={selectedRegionId} onSelect={setSelectedRegionId} />
              <RegionPanel
                region={selectedRegion}
                poems={selectedPoems}
                onClose={() => setSelectedRegionId(null)}
                onOpenPoem={openPoem}
                onMore={() => openLibrary(selectedRegionId)}
              />
              {!selectedRegion && (
                <div className="map-selection-hint"><MapPin size={15} />点击朱砂圆点，寻访一方诗意</div>
              )}
            </div>
            <footer className="map-card-footer">
              <span><i className="vermilion-dot" />聚合圆点按行政区划收录诗作</span>
              <span>地图为文化阅读示意，不作为历史疆界考据</span>
            </footer>
          </div>
        </section>

        <section className="poetry-quote-strip">
          <div className="quote-seal">月</div>
          <div className="quote-content"><span>诗中一景</span><blockquote>“长安一片月，万户捣衣声。”</blockquote></div>
          <div className="quote-meta"><strong>李白 · 子夜吴歌</strong><span>京畿道 · 长安</span></div>
          <button onClick={() => openPoem(poems.find(poem => poem.title === '子夜吴歌·秋歌') ?? poems[0])}>读这首诗 <ArrowRight size={15} /></button>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><span className="brand-seal small">诗</span><span>诗行山河 · 让每一首诗回到它的山水之间</span></div>
        <p>诗文据开源《唐诗三百首》整理 · 地理归类仅供阅读参考</p>
      </footer>

      {libraryOpen && (
        <PoemLibrary
          key={libraryRegionId ?? 'all-poems'}
          initialRegion={libraryRegionId ? regionById[libraryRegionId] : null}
          poems={poems}
          onClose={() => setLibraryOpen(false)}
          onOpenPoem={openPoem}
        />
      )}
      {detailPoem && <PoemModal key={detailPoem.id} poem={detailPoem} onClose={() => setDetailPoemId(null)} />}

      {aboutOpen && (
        <div className="modal-backdrop about-backdrop" onMouseDown={event => event.target === event.currentTarget && setAboutOpen(false)}>
          <section className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
            <button className="round-icon modal-close" onClick={() => setAboutOpen(false)} aria-label="关闭项目介绍"><X size={20} /></button>
            <span className="about-seal">诗</span>
            <div className="eyebrow centered"><span /> ABOUT THE PROJECT <span /></div>
            <h2 id="about-title">让诗歌回到山河之间</h2>
            <p>“诗行山河”以唐玄宗开元年间十五道为地理框架，将三百首唐诗放回长安、洛阳、巴蜀、江南与塞北，让阅读不止于字句，也成为一次山川行旅。</p>
            <div className="about-features">
              <div><strong>十五道</strong><span>点击地图或行政区索引，查看地域诗选。</span></div>
              <div><strong>三百首</strong><span>诗名、作者、全文与浅解均可检索阅读。</span></div>
              <div><strong>地理索引</strong><span>优先依诗中地名与行旅归类，其余依诗人活动地或籍贯。</span></div>
            </div>
            <div className="about-note">本地图为文化阅读示意，行政区划边界经过概括；无明确创作地的归属不代表学术定论。</div>
            <a href="https://github.com/chinese-poetry/chinese-poetry" target="_blank" rel="noreferrer">查看开源诗词文本来源 <ArrowRight size={14} /></a>
          </section>
        </div>
      )}
    </div>
  )
}
