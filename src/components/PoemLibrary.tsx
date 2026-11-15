import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Search, SearchX, X } from 'lucide-react'
import { regionById, regions } from '../data/regions'
import type { Poem, Region } from '../types'

interface PoemLibraryProps {
  initialRegion: Region | null
  poems: Poem[]
  onClose: () => void
  onOpenPoem: (poem: Poem) => void
}

function paginationItems(current: number, total: number): (number | string)[] {
  const pages = Array.from({ length: total }, (_, index) => index + 1)
    .filter(page => page === 1 || page === total || Math.abs(page - current) <= 1)
  const items: (number | string)[] = []
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) items.push('…')
    items.push(page)
  })
  return items
}

export function PoemLibrary({ initialRegion, poems, onClose, onOpenPoem }: PoemLibraryProps) {
  const [query, setQuery] = useState('')
  const [filterRegionId, setFilterRegionId] = useState(initialRegion?.id ?? 'all')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const filteredPoems = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const result = poems.filter(poem => {
      const matchesRegion = filterRegionId === 'all' || poem.regionId === filterRegionId
      const matchesKeyword = !keyword || [poem.title, poem.author, poem.location, ...poem.content]
        .some(value => value.toLowerCase().includes(keyword))
      return matchesRegion && matchesKeyword
    })
    return result.sort((a, b) => filterRegionId === 'all' ? a.id - b.id : b.heat - a.heat)
  }, [filterRegionId, poems, query])

  const totalPages = Math.max(1, Math.ceil(filteredPoems.length / pageSize))
  const pagePoems = filteredPoems.slice((page - 1) * pageSize, page * pageSize)
  const firstResult = filteredPoems.length === 0 ? 0 : (page - 1) * pageSize + 1
  const lastResult = Math.min(page * pageSize, filteredPoems.length)

  useEffect(() => {
    setPage(value => Math.min(value, totalPages))
  }, [totalPages])

  return (
    <div className="modal-backdrop library-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="library-modal" role="dialog" aria-modal="true" aria-labelledby="library-title">
        <header className="library-header">
          <div>
            <div className="eyebrow"><span /> POETRY COLLECTION</div>
            <h2 id="library-title">{initialRegion ? `${initialRegion.name} · 全部诗作` : '唐诗三百首'}</h2>
            <p>{initialRegion ? initialRegion.capital : '三百首诗，六十九位诗人，十五道山河。'}</p>
          </div>
          <button className="round-icon modal-close" onClick={onClose} aria-label="关闭诗词列表"><X size={20} /></button>
        </header>

        <div className="library-toolbar">
          <label className="library-search">
            <Search size={17} />
            <input
              value={query}
              onChange={event => { setQuery(event.target.value); setPage(1) }}
              placeholder="在当前范围搜索诗名、作者或诗句"
            />
            {query && <button onClick={() => { setQuery(''); setPage(1) }} aria-label="清空搜索"><X size={14} /></button>}
          </label>
          <label className="library-region-select">
            <MapPin size={15} />
            <select value={filterRegionId} onChange={event => { setFilterRegionId(event.target.value); setPage(1) }}>
              <option value="all">全部十五道</option>
              {regions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
            </select>
          </label>
          <label className="page-size-select">
            每页
            <select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1) }}>
              {[10, 20, 30, 50].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
            首
          </label>
        </div>

        <div className="library-result-meta">
          <span>共找到 <strong>{filteredPoems.length}</strong> 首</span>
          {filterRegionId !== 'all' && <span className="sort-note">按诗意热度排序</span>}
        </div>

        <div className="library-list">
          {pagePoems.map((poem, index) => (
            <article className="library-poem-row" key={poem.id}>
              <div className="library-poem-number">{String((page - 1) * pageSize + index + 1).padStart(3, '0')}</div>
              <div className="library-poem-main">
                <div className="library-poem-title-line">
                  <button onClick={() => onOpenPoem(poem)}>{poem.title}</button>
                  <span>唐 · {poem.author}</span>
                  <i>{poem.type}</i>
                </div>
                <p>{poem.content.slice(0, 2).join(' ')}</p>
                <div className="library-poem-location"><MapPin size={12} />{regionById[poem.regionId].name} · {poem.location}</div>
              </div>
              <button className="library-open-poem" onClick={() => onOpenPoem(poem)} aria-label={`阅读${poem.title}`}><ArrowUpRight size={18} /></button>
            </article>
          ))}
          {filteredPoems.length === 0 && (
            <div className="empty-search">
              <SearchX size={36} />
              <h3>未寻得相关诗作</h3>
              <p>换一个诗名、作者或行政区划试试。</p>
              <button onClick={() => { setQuery(''); setFilterRegionId('all'); setPage(1) }}>查看全部诗作</button>
            </div>
          )}
        </div>

        <footer className="library-footer">
          <span>第 {firstResult}–{lastResult} 首 · 共 {filteredPoems.length} 首</span>
          <nav className="pagination" aria-label="诗词列表分页">
            <button onClick={() => setPage(1)} disabled={page === 1} className="page-first" aria-label="第一页"><ArrowLeft size={14} /></button>
            <button onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} aria-label="上一页"><ChevronLeft size={17} /></button>
            {paginationItems(page, totalPages).map((item, index) => typeof item === 'number' ? (
              <button key={item} className={page === item ? 'current' : ''} onClick={() => setPage(item)} aria-current={page === item ? 'page' : undefined}>{item}</button>
            ) : <span key={`ellipsis-${index}`} className="pagination-ellipsis">{item}</span>)}
            <button onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page === totalPages} aria-label="下一页"><ChevronRight size={17} /></button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="page-last" aria-label="最后一页"><ArrowRight size={14} /></button>
          </nav>
        </footer>
      </section>
    </div>
  )
}
