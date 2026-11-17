import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, CircleHelp, Compass, Info, Library, Map, MapPin, Search, X } from 'lucide-react'
import { TangMap } from './components/TangMap'
import { SongMap } from './components/SongMap'
import { RegionPanel } from './components/RegionPanel'
import { PoemModal } from './components/PoemModal'
import { PoemLibrary } from './components/PoemLibrary'
import { HelpModal } from './components/HelpModal'
import { AboutModal } from './components/AboutModal'
import { collections, type CollectionId } from './data/datasets'
import type { Poem } from './types'

const topRegionId = (id: CollectionId) => {
  const collection = collections[id]
  const counts = collection.regions.map(region => [
    region.id,
    collection.poems.filter(poem => poem.regionId === region.id).length,
  ] as const)
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? collection.defaultRegionId
}

export default function App() {
  const [collectionId, setCollectionId] = useState<CollectionId>('tang')
  const [mapStyle, setMapStyle] = useState<'classic' | 'realistic'>('classic')
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>('jingji')
  const [detailPoemId, setDetailPoemId] = useState<number | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [libraryRegionId, setLibraryRegionId] = useState<string | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [globalQuery, setGlobalQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [scrollSignal, setScrollSignal] = useState(0)

  const collection = collections[collectionId]
  const { poems, regions, regionById, dynasty, noun, unit } = collection

  const counts = useMemo(() => Object.fromEntries(regions.map(region => [
    region.id,
    poems.filter(poem => poem.regionId === region.id).length,
  ])), [poems, regions])
  const sortedRegions = useMemo(() => [...regions].sort((a, b) => counts[b.id] - counts[a.id]), [counts, regions])
  const selectedRegion = selectedRegionId ? regionById[selectedRegionId] ?? null : null
  const selectedPoems = selectedRegionId ? poems.filter(poem => poem.regionId === selectedRegionId) : []
  const detailPoem = detailPoemId ? poems.find(poem => poem.id === detailPoemId) ?? null : null
  const authorCount = useMemo(() => new Set(poems.map(poem => poem.author)).size, [poems])
  const maxCount = Math.max(1, ...Object.values(counts))

  const globalResults = useMemo(() => {
    const keyword = globalQuery.trim().toLowerCase()
    if (!keyword) return []
    return poems.filter(poem => [poem.title, poem.author, poem.location, regionById[poem.regionId].name, ...poem.content]
      .some(value => value.toLowerCase().includes(keyword)))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 6)
  }, [globalQuery, poems, regionById])

  const quotePoem = poems.find(poem => poem.id === collection.quote.poemId) ?? poems[0]
  const openPoem = (poem: Poem) => setDetailPoemId(poem.id)
  const selectRegion = (regionId: string) => {
    setSelectedRegionId(regionId)
    setScrollSignal(value => value + 1)
  }
  const openLibrary = (regionId: string | null = null) => {
    setLibraryRegionId(regionId)
    setLibraryOpen(true)
    setGlobalQuery('')
  }

  const switchCollection = (id: CollectionId) => {
    if (id === collectionId) return
    setCollectionId(id)
    setSelectedRegionId(topRegionId(id))
    setDetailPoemId(null)
    setLibraryOpen(false)
    setLibraryRegionId(null)
    setAboutOpen(false)
    setHelpOpen(false)
    setGlobalQuery('')
    setSearchFocused(false)
  }

  const anyModalOpen = libraryOpen || Boolean(detailPoem) || aboutOpen || helpOpen
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
      else if (helpOpen) setHelpOpen(false)
      else if (libraryOpen) setLibraryOpen(false)
      else if (globalQuery) { setGlobalQuery(''); setSearchFocused(false) }
      else if (selectedRegionId) setSelectedRegionId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [aboutOpen, detailPoem, globalQuery, helpOpen, libraryOpen, selectedRegionId])

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="诗词山河首页">
          <span className="brand-seal">诗</span>
          <span className="brand-name"><strong>诗词山河</strong><small>地图上的诗词</small></span>
        </a>
        <nav className="main-nav" aria-label="主导航">
          <button className="active" onClick={() => { setLibraryOpen(false); setAboutOpen(false); document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' }) }}><Map size={16} />{collection.navMap}</button>
          <button onClick={() => openLibrary()}><Library size={16} />{collection.libraryName}</button>
          <button onClick={() => setAboutOpen(true)}><Info size={16} />关于项目</button>
        </nav>
        <div className="header-tools">
          <div className="global-search">
            <Search size={17} />
            <input
              value={globalQuery}
              onChange={event => setGlobalQuery(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={collection.searchPlaceholder}
              aria-label={collection.searchAria}
            />
            {globalQuery && <button className="search-clear" onClick={() => setGlobalQuery('')} aria-label="清空搜索"><X size={14} /></button>}
            {searchFocused && globalQuery && (
              <div className="search-results" onMouseDown={event => event.preventDefault()}>
                <div className="search-results-title">检索结果 <span>{globalResults.length ? `前 ${globalResults.length} 首` : '0 首'}</span></div>
                {globalResults.map(poem => (
                  <button key={poem.id} className="search-result-item" onClick={() => { openPoem(poem); setGlobalQuery(''); setSearchFocused(false) }}>
                    <span><strong>{poem.title}</strong><small>{dynasty} · {poem.author}</small></span>
                    <i>{regionById[poem.regionId].name}</i>
                  </button>
                ))}
                {globalResults.length === 0 && <p className="no-search-result">未寻得相关{noun}作，试试“苏轼”或“江南”。</p>}
                <button className="search-all-button" onClick={() => openLibrary()}>进入{noun}集检索 <ArrowRight size={13} /></button>
              </div>
            )}
          </div>
          <button className="help-button" onClick={() => setHelpOpen(true)} aria-label="使用帮助">
            <CircleHelp size={17} /><span>帮助</span>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="collection-switch" role="tablist" aria-label="选择诗集">
              <button role="tab" aria-selected={collectionId === 'tang'} className={collectionId === 'tang' ? 'active' : ''} onClick={() => switchCollection('tang')}>唐诗</button>
              <button role="tab" aria-selected={collectionId === 'song'} className={collectionId === 'song' ? 'active' : ''} onClick={() => switchCollection('song')}>宋词</button>
            </div>
            <div className="hero-kicker"><span /> {collection.heroKicker} <span /></div>
            <h1>{collection.heroTitle}<span>{collection.heroEmphasis}</span></h1>
            <p>{collection.heroIntro}</p>
          </div>
          <div className="hero-stats" aria-label="诗集统计">
            <div><strong>300</strong><span>{collection.statLabel}</span></div>
            <i />
            <div><strong>{regions.length}</strong><span>{collection.regionStatLabel}</span></div>
            <i />
            <div><strong>{authorCount}</strong><span>{collection.authorLabel}</span></div>
          </div>
        </section>

        <section className="explore-layout" id="map-section">
          <aside className="region-index">
            <div className="region-index-head">
              <div><Compass size={18} /><h2>{collection.indexTitle}</h2></div>
              <span>按数量</span>
            </div>
            <p className="region-index-intro">{collection.indexIntro}</p>
            <div className="region-index-list">
              {sortedRegions.map((region, index) => (
                <button
                  key={region.id}
                  className={selectedRegionId === region.id ? 'region-index-item selected' : 'region-index-item'}
                  onClick={() => selectRegion(region.id)}
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
            <div className="index-footnote"><span>注</span>{collection.indexFootnote}</div>
          </aside>

          <div className="map-card">
            <header className="map-card-header">
              <div className="map-title">
                <span className="map-title-icon"><Map size={20} /></span>
                <div><h2>{collection.mapTitle}</h2><p>{collection.mapSubtitle}</p></div>
              </div>
              <div className="map-header-actions">
                <div className="map-style-switch" role="group" aria-label="切换地图版本">
                  <button className={mapStyle === 'classic' ? 'active' : ''} aria-pressed={mapStyle === 'classic'} onClick={() => setMapStyle('classic')}>专题地图</button>
                  <button className={mapStyle === 'realistic' ? 'active' : ''} aria-pressed={mapStyle === 'realistic'} onClick={() => setMapStyle('realistic')}>对照地图</button>
                </div>
                <span className="live-badge"><i />{collection.mapBadge}</span>
                <button className="map-library-button" onClick={() => openLibrary()}><BookOpen size={15} />{collection.mapAllButton}</button>
              </div>
            </header>
            <div className="map-stage">
              {collectionId === 'tang' ? (
                <TangMap mapStyle={mapStyle} counts={counts} selectedRegionId={selectedRegionId} onSelect={selectRegion} />
              ) : (
                <SongMap mapStyle={mapStyle} counts={counts} selectedRegionId={selectedRegionId} onSelect={selectRegion} />
              )}
              <RegionPanel
                region={selectedRegion}
                poems={selectedPoems}
                unit={unit}
                noun={noun}
                scrollSignal={scrollSignal}
                onClose={() => setSelectedRegionId(null)}
                onOpenPoem={openPoem}
                onMore={() => openLibrary(selectedRegionId)}
              />
              {!selectedRegion && (
                <div className="map-selection-hint"><MapPin size={15} />点击朱砂圆点，寻访一方{noun}意<em>左右滑动</em></div>
              )}
            </div>
            <footer className="map-card-footer">
              <span><i className="vermilion-dot" />{collection.mapFooter}</span>
              <span>地图为文化阅读示意，不作为历史疆界考据</span>
            </footer>
          </div>
        </section>

        <section className="poetry-quote-strip">
          <div className="quote-seal">{collection.quote.seal}</div>
          <div className="quote-content"><span>{collection.quote.label}</span><blockquote>{collection.quote.text}</blockquote></div>
          <div className="quote-meta"><strong>{collection.quote.author}</strong><span>{collection.quote.place}</span></div>
          <button onClick={() => openPoem(quotePoem)}>读这首{noun} <ArrowRight size={15} /></button>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><span className="brand-seal small">诗</span><span>诗词山河 · 让每一首{noun}回到它的山水之间</span></div>
        <p>{collection.footerSource}</p>
      </footer>

      {libraryOpen && (
        <PoemLibrary
          key={`${collectionId}-${libraryRegionId ?? 'all'}`}
          initialRegion={libraryRegionId ? regionById[libraryRegionId] : null}
          poems={poems}
          regions={regions}
          regionById={regionById}
          dynasty={dynasty}
          noun={noun}
          libraryName={`${collection.label}三百首`}
          subtitle={collection.librarySubtitle}
          searchPlaceholder={collection.libraryPlaceholder}
          allRegions={collection.libraryAllRegions}
          onClose={() => setLibraryOpen(false)}
          onOpenPoem={openPoem}
        />
      )}
      {detailPoem && (
        <PoemModal
          key={`${collectionId}-${detailPoem.id}`}
          poem={detailPoem}
          region={regionById[detailPoem.regionId]}
          dynasty={dynasty}
          noun={noun}
          onClose={() => setDetailPoemId(null)}
        />
      )}

      {aboutOpen && (
        <AboutModal
          text={collection.aboutText}
          features={collection.aboutFeatures}
          note={collection.aboutNote}
          onClose={() => setAboutOpen(false)}
        />
      )}

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  )
}
