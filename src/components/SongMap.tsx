import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw, Tags } from 'lucide-react'
import { songRegions as regions } from '../data/songRegions'
import { songLabels, songMountains, songOuterRegions, songRiverLabels, songRivers, songSeaLabels } from '../data/mapGeometry'
import { layoutMapLabels, markerRadius } from './mapLabels'

interface SongMapProps {
  counts: Record<string, number>
  selectedRegionId: string | null
  onSelect: (regionId: string) => void
}

export function SongMap({ counts, selectedRegionId, onSelect }: SongMapProps) {
  const [zoom, setZoom] = useState(1)
  const [showLabels, setShowLabels] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const maxCount = useMemo(() => Math.max(1, ...Object.values(counts)), [counts])
  const markerLabels = useMemo(() => layoutMapLabels(regions, counts, maxCount), [counts, maxCount])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const center = () => {
      if (el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    }
    const frame = window.requestAnimationFrame(center)
    const timer = window.setTimeout(center, 180)
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer) }
  }, [])

  const changeZoom = (amount: number) => {
    setZoom(value => Math.min(1.75, Math.max(0.8, Number((value + amount).toFixed(2)))))
  }

  const resetMap = () => {
    setZoom(1)
    setShowLabels(true)
  }

  return (
    <div className="tang-map song-map">
      <div className="map-tools">
        <button className={showLabels ? 'map-tool active' : 'map-tool'} onClick={() => setShowLabels(value => !value)} aria-pressed={showLabels}>
          <Tags size={15} />
          路名
        </button>
        <span className="map-tool-divider" />
        <button className="map-tool icon-only" onClick={() => changeZoom(0.15)} aria-label="放大地图"><Plus size={17} /></button>
        <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        <button className="map-tool icon-only" onClick={() => changeZoom(-0.15)} aria-label="缩小地图"><Minus size={17} /></button>
        <button className="map-tool icon-only" onClick={resetMap} aria-label="重置地图"><RotateCcw size={15} /></button>
      </div>

      <div className="map-scroll" ref={scrollRef}>
        <svg viewBox="0 0 1100 780" className="map-svg" role="img" aria-label="北宋元丰年间二十四路行政区划示意地图">
        <defs>
          <linearGradient id="land-wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e8ddc4" />
            <stop offset="1" stopColor="#dfd2b6" />
          </linearGradient>
          <filter id="song-paper-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="11" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="gray" />
            <feComponentTransfer in="gray" result="softNoise">
              <feFuncA type="table" tableValues="0 0.055" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="softNoise" mode="multiply" />
          </filter>
          <filter id="song-marker-shadow" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#633427" floodOpacity="0.24" />
          </filter>
          <pattern id="song-sea-lines" width="46" height="30" patternUnits="userSpaceOnUse">
            <path d="M4 16 C12 10 19 10 27 16 C33 20 39 20 44 16" fill="none" stroke="#aab7ae" strokeWidth="0.7" opacity="0.22" />
          </pattern>
        </defs>

        <rect width="1100" height="780" fill="url(#song-sea-lines)" opacity="0.7" />
        <g className="map-coordinate-lines" aria-hidden="true">
          <path d="M90 110 H1010 M70 270 H1030 M60 430 H1030 M80 590 H1010 M110 720 H980" />
          <path d="M180 65 V735 M390 45 V750 M600 40 V755 M810 60 V740 M980 110 V690" />
        </g>

        <g transform={`translate(550 390) scale(${zoom}) translate(-550 -390)`} className="zoom-layer">
          <g className="outer-territory" filter="url(#song-paper-grain)">
            {songOuterRegions.map((territory) => <path key={territory.id} d={territory.path} />)}
          </g>
          <g className="outer-territory-labels" aria-hidden="true">
            {songLabels.map((label) => (
              <text key={label.text} x={label.position[0]} y={label.position[1]} className={label.sub ? 'outer-territory-sub' : undefined}>{label.text}</text>
            ))}
          </g>

          <g className="region-layer" filter="url(#song-paper-grain)">
            {regions.map(region => {
              const isSelected = selectedRegionId === region.id
              const isHovered = hoveredId === region.id
              return (
                <path
                  key={region.id}
                  d={region.path}
                  className={`region-shape${isSelected ? ' selected' : ''}${isHovered ? ' hovered' : ''}`}
                  onClick={() => onSelect(region.id)}
                  onMouseEnter={() => setHoveredId(region.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <title>{region.name}，收录 {counts[region.id] ?? 0} 首词</title>
                </path>
              )
            })}
          </g>

          <g className="admin-boundary-layer" aria-hidden="true">
            {regions.map(region => (
              <path
                key={region.id}
                d={region.path}
                className={selectedRegionId === region.id ? 'selected' : undefined}
              />
            ))}
          </g>

          <g className="river-layer" aria-hidden="true">
            <path className="yellow-river" d={songRivers.yellow} />
            <path className="yangtze-river" d={songRivers.yangtze} />
            {songRiverLabels.map(label => <text key={label.text} x={label.position[0]} y={label.position[1]} className="river-label">{label.text}</text>)}
          </g>

          <g className="mountain-layer" aria-hidden="true">
            {songMountains.map((mountain) => (
              <g key={mountain.text} transform={`translate(${mountain.position[0]} ${mountain.position[1]})`}>
                <path d="M-18 6 L-10 -9 L-3 6 M-7 6 L4 -14 L16 6 M0 6 L8 -7 L20 6" />
                <text x="0" y="21" textAnchor="middle">{mountain.text}</text>
              </g>
            ))}
          </g>

          <g className="sea-labels" aria-hidden="true">
            {songSeaLabels.map((label) => <text key={label.text} x={label.position[0]} y={label.position[1]}>{label.text}</text>)}
          </g>

          {showLabels && (
            <g className="marker-label-layer" aria-hidden="true">
              {markerLabels.filter(label => label.id !== hoveredId).map(label => (
                <g key={label.id} className={selectedRegionId === label.id ? 'marker-label selected' : 'marker-label'}>
                  {label.leader && <line className="marker-label-leader" {...label.leader} />}
                  <text className="marker-region-name" x={label.x} y={label.y}>{label.name}</text>
                </g>
              ))}
            </g>
          )}

          <g className="marker-layer">
            {regions.map(region => {
              const count = counts[region.id] ?? 0
              if (count === 0) return null
              const radius = markerRadius(count, maxCount)
              const [x, y] = region.center
              const isSelected = selectedRegionId === region.id
              return (
                <g
                  key={region.id}
                  transform={`translate(${x} ${y})`}
                  className={`region-marker${isSelected ? ' selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${region.name}，${count}首词，点击查看热度词选`}
                  onClick={() => onSelect(region.id)}
                  onFocus={() => setHoveredId(region.id)}
                  onBlur={() => setHoveredId(null)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(region.id)
                    }
                  }}
                >
                  <circle className="marker-hit" r={Math.max(radius + 16, 36)} />
                  <circle className="marker-ripple" r={radius + 7} />
                  <circle className="marker-core" r={radius} filter="url(#song-marker-shadow)" />
                  <circle className="marker-inner-ring" r={radius - 4} />
                  <text className="marker-count" y="1">{count}</text>
                  <text className="marker-unit" y="13">首</text>
                  {hoveredId === region.id && (
                    <g className="marker-tip" transform={`translate(0 ${-radius - 24})`} pointerEvents="none">
                      <rect x="-70" y="-46" width="140" height="40" rx="4" />
                      <path d="M-5 -6 L0 0 L5 -6 Z" />
                      <text className="tip-title" y="-29">{region.name} · {count}首</text>
                      <text className="tip-sub" y="-15">点击查看热度前五</text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        </g>

        <g className="map-compass" transform="translate(1000 92)" aria-hidden="true">
          <text y="-25">北</text>
          <path d="M0 -18 L7 8 L0 4 L-7 8 Z" />
          <circle cy="4" r="15" />
        </g>
      </svg>
      </div>

      <div className="map-legend">
        <span><i className="legend-boundary" />二十四路边界</span>
        <span><i className="legend-dot large" />词作较多</span>
        <span><i className="legend-dot small" />词作较少</span>
        <span className="legend-note">圆点大小表示收录数量</span>
      </div>
      <div className="map-era-mark">北宋 · 元丰二十四路</div>
    </div>
  )
}
