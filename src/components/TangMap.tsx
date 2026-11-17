import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Minus, Plus, RotateCcw, Tags } from 'lucide-react'
import { classicRegions, regions as realisticRegions } from '../data/regions'
import { tangLabels, tangMountains, tangOuterRegions, tangRiverLabels, tangRivers, tangSeaLabels } from '../data/mapGeometry'
import { layoutMapLabels, markerRadius } from './mapLabels'
import { MapScrollHints } from './MapScrollHints'

interface TangMapProps {
  mapStyle: 'classic' | 'realistic'
  counts: Record<string, number>
  selectedRegionId: string | null
  onSelect: (regionId: string) => void
}

const REALISTIC_VIEWBOX = { x: 380, y: 45, width: 700, height: 490 }

export function TangMap({ mapStyle, counts, selectedRegionId, onSelect }: TangMapProps) {
  const [zoom, setZoom] = useState(1)
  const [showLabels, setShowLabels] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const zoomFocusRef = useRef<{ x: number; y: number } | null>(null)
  const isClassic = mapStyle === 'classic'
  const regions = isClassic ? classicRegions : realisticRegions
  const viewBox = isClassic
    ? '0 0 1100 780'
    : `${REALISTIC_VIEWBOX.x} ${REALISTIC_VIEWBOX.y} ${REALISTIC_VIEWBOX.width} ${REALISTIC_VIEWBOX.height}`
  const compass = isClassic
    ? { x: 1000, y: 92 }
    : { x: REALISTIC_VIEWBOX.x + REALISTIC_VIEWBOX.width - 72, y: REALISTIC_VIEWBOX.y + 47 }
  const maxCount = useMemo(() => Math.max(1, ...Object.values(counts)), [counts])
  const markerLabels = useMemo(
    () => isClassic ? [] : layoutMapLabels(regions, counts, maxCount),
    [counts, isClassic, maxCount, regions],
  )

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

  useLayoutEffect(() => {
    const el = scrollRef.current
    const focus = zoomFocusRef.current
    if (!el || !focus) return
    zoomFocusRef.current = null
    el.scrollLeft = focus.x * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = focus.y * el.scrollHeight - el.clientHeight / 2
  }, [zoom])

  const changeZoom = (amount: number) => {
    const el = scrollRef.current
    if (el) {
      zoomFocusRef.current = {
        x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      }
    }
    setZoom(value => Math.min(1.75, Math.max(0.8, Number((value + amount).toFixed(2)))))
  }

  const resetMap = () => {
    zoomFocusRef.current = { x: 0.5, y: 0 }
    setZoom(1)
    setShowLabels(true)
  }

  return (
    <div className="tang-map">
      <div className="map-tools">
        <button className={showLabels ? 'map-tool active' : 'map-tool'} onClick={() => setShowLabels(value => !value)} aria-pressed={showLabels}>
          <Tags size={15} />
          道名
        </button>
        <span className="map-tool-divider" />
        <button className="map-tool icon-only" onClick={() => changeZoom(0.15)} aria-label="放大地图"><Plus size={17} /></button>
        <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        <button className="map-tool icon-only" onClick={() => changeZoom(-0.15)} aria-label="缩小地图"><Minus size={17} /></button>
        <button className="map-tool icon-only" onClick={resetMap} aria-label="重置地图"><RotateCcw size={15} /></button>
      </div>

      <div className="map-scroll" ref={scrollRef}>
        <svg
          viewBox={viewBox}
          className="map-svg"
          style={{ '--map-zoom': zoom } as CSSProperties}
          role="img"
          aria-label="唐朝开元年间十五道行政区划示意地图"
        >
        <defs>
          <filter id="paper-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="8" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="gray" />
            <feComponentTransfer in="gray" result="softNoise">
              <feFuncA type="table" tableValues="0 0.055" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="softNoise" mode="multiply" />
          </filter>
          <filter id="marker-shadow" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#633427" floodOpacity="0.24" />
          </filter>
          <radialGradient id="land-wash" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#eee5d1" />
            <stop offset="100%" stopColor="#dfd2b6" />
          </radialGradient>
          <pattern id="sea-lines" width="46" height="30" patternUnits="userSpaceOnUse">
            <path d="M4 16 C12 10 19 10 27 16 C33 20 39 20 44 16" fill="none" stroke="#aab7ae" strokeWidth="0.7" opacity="0.22" />
          </pattern>
        </defs>

        <rect width="1100" height="780" fill="url(#sea-lines)" opacity="0.7" />
        <g className="map-coordinate-lines" aria-hidden="true">
          <path d="M90 110 H1010 M70 270 H1030 M60 430 H1030 M80 590 H1010 M110 720 H980" />
          <path d="M180 65 V735 M390 45 V750 M600 40 V755 M810 60 V740 M980 110 V690" />
        </g>

        <g className="zoom-layer">
          {isClassic ? (
            <>
              <g className="outer-territory" filter="url(#paper-grain)">
                <path d="M34 184 L106 142 L183 148 L222 111 L327 88 L410 118 L415 285 L335 378 L190 307 L82 251 L42 240 Z" />
                <path d="M222 111 L270 51 L370 38 L452 65 L520 93 L410 118 L327 177 L255 222 L175 213 L106 142 L183 148 Z" />
              </g>
              <g className="outer-territory-labels" aria-hidden="true">
                <text x="128" y="192">安西都护府</text>
                <text x="280" y="102">北庭都护府</text>
                <text x="115" y="222" className="outer-territory-sub">西域</text>
              </g>
            </>
          ) : (
            <>
              <g className="outer-territory" filter="url(#paper-grain)">
                {tangOuterRegions.map((territory) => <path key={territory.id} d={territory.path} />)}
              </g>
              <g className="outer-territory-labels" aria-hidden="true">
                {tangLabels.map((label) => (
                  <text key={label.text} x={label.position[0]} y={label.position[1]} className={label.sub ? 'outer-territory-sub' : undefined}>{label.text}</text>
                ))}
              </g>
            </>
          )}

          <g className="region-layer" filter="url(#paper-grain)">
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
                  <title>{region.name}，收录 {counts[region.id] ?? 0} 首诗</title>
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

          {isClassic ? (
            <>
              <g className="river-layer" aria-hidden="true">
                <path className="yellow-river" d="M165 285 C260 275 302 325 380 315 C454 305 466 270 525 285 C578 299 573 354 630 363 C690 373 741 330 807 350 C846 361 858 381 879 376" />
                <path className="yangtze-river" d="M305 515 C370 487 411 500 466 487 C520 474 540 501 594 493 C647 486 672 474 718 492 C761 508 806 521 856 549" />
                <path className="river-tributary" d="M489 434 C500 463 487 475 466 487 M618 393 C628 432 652 454 681 479 M742 479 C756 500 760 508 761 508" />
                <text x="714" y="344" className="river-label">大 河</text>
                <text x="686" y="483" className="river-label">长 江</text>
              </g>
              <g className="mountain-layer" aria-hidden="true">
                <path d="M366 394 l10 -17 l8 12 l9 -19 l13 24 M576 353 l9 -15 l8 11 l7 -14 l12 20 M699 304 l10 -17 l9 13 l8 -14 l12 19 M393 561 l10 -16 l8 11 l8 -16 l12 21 M692 582 l9 -14 l8 10 l8 -15 l11 19" />
                <text x="361" y="386">终南</text>
                <text x="576" y="343">太行</text>
                <text x="690" y="295">燕山</text>
                <text x="384" y="551">蜀山</text>
                <text x="684" y="574">南岭</text>
              </g>
              <g className="sea-labels" aria-hidden="true">
                <text x="958" y="350">渤 海</text>
                <text x="942" y="510">东 海</text>
                <text x="800" y="718">南 海</text>
                <text x="513" y="72">漠 北</text>
              </g>
            </>
          ) : (
            <>
              <g className="river-layer" aria-hidden="true">
                <path className="yellow-river" d={tangRivers.yellow} />
                <path className="yangtze-river" d={tangRivers.yangtze} />
                {tangRiverLabels.map(label => <text key={label.text} x={label.position[0]} y={label.position[1]} className="river-label">{label.text}</text>)}
              </g>
              <g className="mountain-layer" aria-hidden="true">
                {tangMountains.map((mountain) => (
                  <g key={mountain.text} transform={`translate(${mountain.position[0]} ${mountain.position[1]})`}>
                    <path d="M-18 6 L-10 -9 L-3 6 M-7 6 L4 -14 L16 6 M0 6 L8 -7 L20 6" />
                    <text x="0" y="21" textAnchor="middle">{mountain.text}</text>
                  </g>
                ))}
              </g>
              <g className="sea-labels" aria-hidden="true">
                {tangSeaLabels.map((label) => <text key={label.text} x={label.position[0]} y={label.position[1]}>{label.text}</text>)}
              </g>
            </>
          )}

          {!isClassic && showLabels && (
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
              const radius = isClassic ? 15 + Math.sqrt(count / maxCount) * 15 : markerRadius(count, maxCount)
              const [x, y] = region.center
              const isSelected = selectedRegionId === region.id
              return (
                <g
                  key={region.id}
                  transform={`translate(${x} ${y})`}
                  className={`region-marker${isSelected ? ' selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${region.name}，${count}首诗，点击查看热度诗选`}
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
                  {isClassic && showLabels && hoveredId !== region.id && <text className="marker-region-name" y={-radius - 15}>{region.name}</text>}
                  <circle className="marker-core" r={radius} filter="url(#marker-shadow)" />
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

        <g className="map-compass" transform={`translate(${compass.x} ${compass.y})`} aria-hidden="true">
          <text y="-25">北</text>
          <path d="M0 -18 L7 8 L0 4 L-7 8 Z" />
          <circle cy="4" r="15" />
        </g>
      </svg>
      </div>

      <MapScrollHints targetRef={scrollRef} revision={zoom} />

      <div className="map-legend">
        <span><i className="legend-boundary" />十五道边界</span>
        <span><i className="legend-dot large" />诗作较多</span>
        <span><i className="legend-dot small" />诗作较少</span>
        <span className="legend-note">圆点大小表示收录数量</span>
      </div>
      <div className="map-era-mark">唐 · 开元十五道</div>
    </div>
  )
}
